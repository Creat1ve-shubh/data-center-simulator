export interface VPPAContract {
  capacityMw: number
  strikePriceUsdMwh: number
  durationYears: number
  location: string
}

export function calculateVPPAFinancials(
  contract: VPPAContract,
  marketPriceHourly: number[],
  generationHourly: number[],
) {
  const costs = []
  let totalPayment = 0
  let totalRevenue = 0

  for (let h = 0; h < generationHourly.length; h++) {
    const gen = Math.min(generationHourly[h], contract.capacityMw * 1000)
    const payment = (contract.strikePriceUsdMwh / 1000) * gen
    const revenue = marketPriceHourly[h] * gen
    const netCost = payment - revenue

    costs.push(netCost)
    totalPayment += payment
    totalRevenue += revenue
  }

  const totalRenewableMwh = generationHourly.reduce((sum, g) => sum + g, 0) / 1000

  return {
    totalPaymentUSD: totalPayment,
    totalRevenueUSD: totalRevenue,
    netCostUSD: totalPayment - totalRevenue,
    recsMwh: totalRenewableMwh,
    avgNetCostPerMwh: (totalPayment - totalRevenue) / totalRenewableMwh,
    hourlyCosts: costs,
  }
}

export function compareOnSiteVsVPPA(
  onSiteCapex: number,
  onSiteOpex: number,
  onSiteGeneration: number,
  vppaContract: VPPAContract,
  vppaGeneration: number,
  marketPrices: number[],
  yearsToCompare = 10,
) {
  const onSiteTotalCost = onSiteCapex + onSiteOpex * yearsToCompare
  const onSiteEnergyMwh = (onSiteGeneration * 8760 * yearsToCompare) / 1000
  const onSiteLCOE = onSiteTotalCost / onSiteEnergyMwh

  const vppaYearlyGeneration = vppaGeneration * 8760
  const vppaFinancials = calculateVPPAFinancials(
    vppaContract,
    marketPrices,
    Array(8760).fill(vppaYearlyGeneration / 8760),
  )
  const vppaTotalCost = vppaFinancials.netCostUSD * yearsToCompare
  const vppaEnergyMwh = vppaFinancials.recsMwh * yearsToCompare
  const vppaLCOE = vppaTotalCost / vppaEnergyMwh

  return {
    onSite: {
      totalCostUSD: onSiteTotalCost,
      energyMwh: onSiteEnergyMwh,
      lcoe: onSiteLCOE,
      capexRequired: onSiteCapex,
    },
    vppa: {
      totalCostUSD: vppaTotalCost,
      energyMwh: vppaEnergyMwh,
      lcoe: vppaLCOE,
      capexRequired: 0,
    },
    recommendation: vppaLCOE < onSiteLCOE ? "VPPA" : "On-Site",
    savingsUSD: Math.abs(vppaTotalCost - onSiteTotalCost),
  }
}
