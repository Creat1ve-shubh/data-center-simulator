/**
 * Virtual Power Purchase Agreement (VPPA) Financial Modeling
 * Models financial impact of renewable energy PPAs
 */

export interface VPPAInput {
  contractCapacity: number; // kW
  strikePrice: number; // USD per MWh
  contractDuration: number; // years
  energyType: 'solar' | 'wind' | 'hybrid';
  location: string;
  annualEnergyConsumption: number; // kWh
}

export interface VPPAResult {
  totalContractValue: number; // USD
  annualCashFlows: {
    year: number;
    expectedGeneration: number; // kWh
    marketPrice: number; // USD per MWh
    settlementAmount: number; // USD (negative = payment to generator)
    recValue: number; // Renewable Energy Certificate value
    netCost: number; // USD
    cumulativeSavings: number; // USD
  }[];
  financialMetrics: {
    npv: number; // Net Present Value
    irr: number; // Internal Rate of Return
    lcoe: number; // Levelized Cost of Energy (USD per MWh)
    hedgeEffectiveness: number; // %
  };
  riskAnalysis: {
    volumeRisk: string;
    priceRisk: string;
    basisRisk: string;
    recommendation: string;
  };
}

// Market price projections (USD per MWh)
const MARKET_PRICES: Record<string, number[]> = {
  Jaipur: [65, 68, 71, 75, 78, 82, 86, 90, 95, 100],
  Bangalore: [70, 73, 77, 81, 85, 89, 94, 99, 104, 110],
  California: [80, 85, 90, 95, 100, 105, 110, 116, 122, 128],
  Texas: [55, 58, 61, 64, 67, 71, 75, 79, 83, 88],
  Frankfurt: [120, 126, 132, 139, 146, 153, 161, 169, 178, 187],
  Singapore: [95, 100, 105, 110, 116, 122, 128, 135, 142, 149],
};

// Capacity factors by energy type and location
const CAPACITY_FACTORS: Record<
  string,
  { solar: number; wind: number; hybrid: number }
> = {
  Jaipur: { solar: 0.21, wind: 0.15, hybrid: 0.18 },
  Bangalore: { solar: 0.18, wind: 0.12, hybrid: 0.15 },
  California: { solar: 0.25, wind: 0.30, hybrid: 0.275 },
  Texas: { solar: 0.22, wind: 0.35, hybrid: 0.285 },
  Frankfurt: { solar: 0.12, wind: 0.28, hybrid: 0.20 },
  Singapore: { solar: 0.15, wind: 0.10, hybrid: 0.125 },
};

// REC (Renewable Energy Certificate) values (USD per MWh)
const REC_VALUES: Record<string, number> = {
  Jaipur: 5,
  Bangalore: 6,
  California: 15,
  Texas: 10,
  Frankfurt: 20,
  Singapore: 12,
};

export function analyzeVPPA(input: VPPAInput): VPPAResult {
  const location = input.location || 'Jaipur';
  const marketPrices = MARKET_PRICES[location] || MARKET_PRICES.Jaipur;
  const capacityFactors =
    CAPACITY_FACTORS[location] || CAPACITY_FACTORS.Jaipur;
  const recValue = REC_VALUES[location] || 5;

  const capacityFactor = capacityFactors[input.energyType];
  const annualGeneration = input.contractCapacity * 8760 * capacityFactor;

  // Generate annual cash flows
  const annualCashFlows = [];
  let cumulativeSavings = 0;

  for (let year = 1; year <= input.contractDuration; year++) {
    // Market price for this year (with escalation)
    const marketPrice =
      marketPrices[Math.min(year - 1, marketPrices.length - 1)];

    // Settlement amount (difference payment)
    // If market price > strike price, we receive payment
    // If market price < strike price, we pay generator
    const settlementAmount =
      ((marketPrice - input.strikePrice) * annualGeneration) / 1000;

    // REC value
    const recValueTotal = (recValue * annualGeneration) / 1000;

    // Net cost (negative settlement = we pay, but we get RECs)
    const netCost = -settlementAmount + recValueTotal;

    // Compare to buying at market price
    const marketCost = (marketPrice * annualGeneration) / 1000;
    const vppaCost = (input.strikePrice * annualGeneration) / 1000;
    const savings = marketCost - vppaCost + recValueTotal;
    cumulativeSavings += savings;

    annualCashFlows.push({
      year,
      expectedGeneration: Math.round(annualGeneration),
      marketPrice: Math.round(marketPrice),
      settlementAmount: Math.round(settlementAmount),
      recValue: Math.round(recValueTotal),
      netCost: Math.round(netCost),
      cumulativeSavings: Math.round(cumulativeSavings),
    });
  }

  // Calculate financial metrics
  const discountRate = 0.08; // 8% discount rate
  const npv = calculateNPV(
    annualCashFlows.map((cf) => cf.netCost),
    discountRate
  );
  const irr = calculateIRR(annualCashFlows.map((cf) => cf.netCost));
  const totalGeneration = annualGeneration * input.contractDuration;
  const totalCost = annualCashFlows.reduce((sum, cf) => sum + cf.netCost, 0);
  const lcoe = (totalCost / totalGeneration) * 1000; // USD per MWh

  // Hedge effectiveness (how well does strike price track market price)
  const marketVolatility = calculateVolatility(
    marketPrices.slice(0, input.contractDuration)
  );
  const hedgeEffectiveness = Math.max(0, Math.min(100, 100 - marketVolatility));

  // Risk analysis
  const riskAnalysis = {
    volumeRisk:
      capacityFactor > 0.2
        ? 'Low - High capacity factor ensures consistent generation'
        : 'Medium - Weather variability may impact generation volumes',
    priceRisk:
      input.strikePrice < marketPrices[0]
        ? 'Low - Strike price below current market, favorable position'
        : 'Medium - Strike price above market, exposed to downside risk',
    basisRisk:
      location === 'Jaipur' || location === 'Bangalore'
        ? 'Low - Good correlation between local and wholesale prices'
        : 'Medium - Market basis spread may vary by region',
    recommendation: generateRecommendation(
      input,
      npv,
      lcoe,
      hedgeEffectiveness
    ),
  };

  return {
    totalContractValue: Math.round(
      (input.strikePrice * totalGeneration) / 1000
    ),
    annualCashFlows,
    financialMetrics: {
      npv: Math.round(npv),
      irr: Math.round(irr * 100) / 100,
      lcoe: Math.round(lcoe * 100) / 100,
      hedgeEffectiveness: Math.round(hedgeEffectiveness),
    },
    riskAnalysis,
  };
}

function calculateNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce((npv, cf, year) => {
    return npv + cf / Math.pow(1 + discountRate, year + 1);
  }, 0);
}

function calculateIRR(cashFlows: number[]): number {
  // Simple approximation using Newton's method
  let irr = 0.1; // Initial guess
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;

    cashFlows.forEach((cf, year) => {
      const t = year + 1;
      npv += cf / Math.pow(1 + irr, t);
      derivative += (-t * cf) / Math.pow(1 + irr, t + 1);
    });

    if (Math.abs(npv) < tolerance) break;
    irr = irr - npv / derivative;
  }

  return irr * 100; // Return as percentage
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;

  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance =
    prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) /
    prices.length;
  const stdDev = Math.sqrt(variance);

  return (stdDev / mean) * 100; // Coefficient of variation as percentage
}

function generateRecommendation(
  input: VPPAInput,
  npv: number,
  lcoe: number,
  hedgeEffectiveness: number
): string {
  if (npv > 0 && hedgeEffectiveness > 70) {
    return `✅ RECOMMENDED: Strong financial case with NPV of $${Math.round(npv / 1000)}K and effective price hedge (${Math.round(hedgeEffectiveness)}%)`;
  } else if (npv > 0) {
    return `⚠️ CONDITIONAL: Positive NPV but moderate hedge effectiveness. Consider adding volume guarantees or collar structures.`;
  } else if (lcoe < 80) {
    return `⚠️ CONDITIONAL: Negative NPV in base case, but attractive LCOE of $${Math.round(lcoe)}/MWh. Consider shorter contract duration.`;
  } else {
    return `❌ NOT RECOMMENDED: Negative NPV and high LCOE. Consider alternative procurement strategies or renegotiate strike price.`;
  }
}

export function compareVPPAScenarios(
  baseInput: VPPAInput,
  scenarios: Array<{ name: string; changes: Partial<VPPAInput> }>
): Array<{ name: string; result: VPPAResult }> {
  return scenarios.map((scenario) => ({
    name: scenario.name,
    result: analyzeVPPA({ ...baseInput, ...scenario.changes }),
  }));
}
