// Phase 5: VPPA/PPA Financial Modeling

export interface VPPAContract {
  duration: number // years
  volume: number // MWh/year
  strikePrice: number // $/MWh
  escalationRate: number // % per year
  counterpartyRating: string // AAA, AA, A, BBB, etc.
}

export interface VPPAAnalysis {
  npv: number // Net Present Value (USD)
  irr: number // Internal Rate of Return (%)
  paybackPeriod: number // years
  priceStability: number // % of revenue locked in
  costAvoidance: number // USD over contract period
  riskScore: number // 0-100, higher = more risk
}

export function analyzeVPPA(
  contract: VPPAContract,
  baselineGridPrice: number, // $/MWh
  discountRate = 0.08, // 8% WACC
): VPPAAnalysis {
  let npv = 0
  let totalCostAvoidance = 0
  let irr = 0

  // Calculate NPV and cost avoidance over contract period
  for (let year = 1; year <= contract.duration; year++) {
    const vppaPrice = contract.strikePrice * Math.pow(1 + contract.escalationRate / 100, year - 1)
    const gridPrice = baselineGridPrice * Math.pow(1.02, year - 1) // Assume 2% grid price escalation

    // Annual savings from VPPA
    const annualSavings = (gridPrice - vppaPrice) * contract.volume
    totalCostAvoidance += annualSavings

    // Discount to present value
    const pv = annualSavings / Math.pow(1 + discountRate, year)
    npv += pv
  }

  // Estimate IRR (simplified: use NPV to approximate)
  irr = (npv / (contract.volume * contract.duration) / baselineGridPrice) * 100

  // Payback period (simplified)
  const paybackPeriod = contract.duration * 0.5 // Assume 50% of contract duration

  // Price stability: percentage of revenue locked in
  const priceStability = (contract.volume / (contract.volume + 1000)) * 100 // Simplified

  // Risk score based on counterparty rating
  const riskScores: Record<string, number> = {
    AAA: 10,
    AA: 15,
    A: 25,
    BBB: 40,
    BB: 60,
    B: 80,
  }
  const riskScore = riskScores[contract.counterpartyRating] || 50

  return {
    npv,
    irr,
    paybackPeriod,
    priceStability,
    costAvoidance: totalCostAvoidance,
    riskScore,
  }
}

// Compare VPPA vs traditional grid purchase
export function compareVPPAvsGrid(
  contract: VPPAContract,
  baselineGridPrice: number,
  discountRate = 0.08,
): { vppaAnalysis: VPPAAnalysis; gridCost: number; savings: number } {
  const vppaAnalysis = analyzeVPPA(contract, baselineGridPrice, discountRate)

  // Calculate grid-only cost
  let gridCost = 0
  for (let year = 1; year <= contract.duration; year++) {
    const yearlyGridPrice = baselineGridPrice * Math.pow(1.02, year - 1)
    const yearlyGridCost = yearlyGridPrice * contract.volume
    gridCost += yearlyGridCost / Math.pow(1 + discountRate, year)
  }

  const savings = gridCost - vppaAnalysis.costAvoidance

  return {
    vppaAnalysis,
    gridCost,
    savings,
  }
}
