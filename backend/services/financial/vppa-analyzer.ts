/**
 * VPPA (Virtual Power Purchase Agreement) Financial Analyzer
 * Evaluates economics of renewable energy PPAs
 */

import type { LocationCoordinates } from "@/backend/types";

export interface VPPAAnalysisInput {
  contractCapacity: number; // kW
  strikePrice: number; // USD per MWh
  contractDuration: number; // years
  annualEnergyConsumption: number; // kWh
  location: LocationCoordinates;
  forwardCurve?: number[]; // Optional override for market price projections (USD/MWh per year)
}

export interface VPPAAnalysisOutput {
  contract_value: number;
  strike_price_per_mwh: number;
  annual_cash_flows: {
    year: number;
    market_price: number; // USD/MWh
    settlement_amount: number;
    rec_value: number;
    net_cost: number;
    cumulative_savings: number;
  }[];
  hedge_effectiveness_percent: number;
  lcoe_per_mwh: number;
}

// Market price projections by region (USD per MWh)
const MARKET_PRICE_PROJECTIONS: Record<string, number[]> = {
  "us-west": [
    80, 85, 90, 95, 100, 105, 110, 116, 122, 128, 135, 142, 149, 157, 165,
  ],
  "us-east": [
    70, 74, 78, 82, 86, 91, 96, 101, 106, 112, 118, 124, 130, 137, 144,
  ],
  "us-central": [55, 58, 61, 64, 67, 71, 75, 79, 83, 88, 93, 98, 103, 108, 114],
  eu: [
    120, 126, 132, 139, 146, 153, 161, 169, 178, 187, 196, 206, 217, 228, 240,
  ],
  "asia-pacific": [
    95, 100, 105, 110, 116, 122, 128, 135, 142, 149, 157, 165, 173, 182, 191,
  ],
  india: [65, 68, 71, 75, 78, 82, 86, 90, 95, 100, 105, 110, 116, 122, 128],
};

// REC values by region (USD per MWh)
const REC_VALUES: Record<string, number> = {
  "us-west": 15,
  "us-east": 12,
  "us-central": 10,
  eu: 20,
  "asia-pacific": 12,
  india: 5,
};

function getRegionFromCoordinates(coords: LocationCoordinates): string {
  const lat = coords.latitude;
  const lon = coords.longitude;

  // Simple region mapping
  if (lat >= 25 && lat <= 50 && lon >= -125 && lon <= -110) return "us-west";
  if (lat >= 25 && lat <= 50 && lon >= -100 && lon <= -67) return "us-east";
  if (lat >= 25 && lat <= 50 && lon >= -110 && lon <= -95) return "us-central";
  if (lat >= 35 && lat <= 70 && lon >= -10 && lon <= 40) return "eu";
  if (lat >= 8 && lat <= 35 && lon >= 68 && lon <= 98) return "india";
  return "asia-pacific";
}

export async function analyzeVPPAFinancials(
  input: VPPAAnalysisInput
): Promise<VPPAAnalysisOutput> {
  console.log("[VPPA] Analyzing VPPA financial structure...");

  const region = getRegionFromCoordinates(input.location);
  const defaultCurve =
    MARKET_PRICE_PROJECTIONS[region] || MARKET_PRICE_PROJECTIONS["us-central"];
  const marketPrices =
    input.forwardCurve && input.forwardCurve.length > 0
      ? input.forwardCurve
      : defaultCurve;
  const recValue = REC_VALUES[region] || 10;

  // Assume capacity factor of 25% (conservative for solar+wind hybrid)
  const annualGeneration = input.contractCapacity * 8760 * 0.25;

  // Generate annual cash flows
  const annual_cash_flows: VPPAAnalysisOutput["annual_cash_flows"] = [];
  let cumulativeSavings = 0;

  for (let year = 1; year <= input.contractDuration; year++) {
    const marketPrice =
      marketPrices[Math.min(year - 1, marketPrices.length - 1)];

    // Settlement: If market > strike, we receive payment. If market < strike, we pay.
    const settlementAmount =
      ((marketPrice - input.strikePrice) * annualGeneration) / 1000;

    // REC value
    const recValueTotal = (recValue * annualGeneration) / 1000;

    // Net cost (positive = savings, negative = cost)
    const netCost = settlementAmount + recValueTotal;

    // Compare to market purchase
    const marketCost = (marketPrice * input.annualEnergyConsumption) / 1000;
    const vppaCost = (input.strikePrice * annualGeneration) / 1000;
    const savings = marketCost - vppaCost;
    cumulativeSavings += savings;

    annual_cash_flows.push({
      year,
      market_price: Math.round(marketPrice),
      settlement_amount: Math.round(settlementAmount),
      rec_value: Math.round(recValueTotal),
      net_cost: Math.round(netCost),
      cumulative_savings: Math.round(cumulativeSavings),
    });
  }

  // Calculate hedge effectiveness (based on market volatility)
  const marketVolatility = calculateVolatility(
    marketPrices.slice(0, input.contractDuration)
  );
  const hedge_effectiveness_percent = Math.max(
    0,
    Math.min(100, 100 - marketVolatility * 2)
  );

  // Calculate LCOE
  const totalCost = annual_cash_flows.reduce((sum, cf) => sum - cf.net_cost, 0);
  const totalGeneration = annualGeneration * input.contractDuration;
  const lcoe_per_mwh = (totalCost / totalGeneration) * 1000;

  console.log(
    `[VPPA] Strike price: $${input.strikePrice}/MWh, Market avg: $${(marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length).toFixed(0)}/MWh`
  );
  console.log(
    `[VPPA] Hedge effectiveness: ${hedge_effectiveness_percent.toFixed(0)}%`
  );

  return {
    contract_value: Math.round(
      (input.strikePrice * annualGeneration * input.contractDuration) / 1000
    ),
    strike_price_per_mwh: input.strikePrice,
    annual_cash_flows,
    hedge_effectiveness_percent,
    lcoe_per_mwh,
  };
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;

  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance =
    prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
    prices.length;
  const stdDev = Math.sqrt(variance);

  return (stdDev / mean) * 100; // Coefficient of variation as percentage
}
