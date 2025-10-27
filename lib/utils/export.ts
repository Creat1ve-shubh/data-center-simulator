export function exportResultsToCSV(results: any, location: string) {
  const rows = [
    ["Metric", "Value", "Unit"],
    ["Location", location, ""],
    ["Solar Capacity", results.capacities.solarKw, "kW"],
    ["Wind Capacity", results.capacities.windKw, "kW"],
    ["Battery Capacity", results.capacities.batteryKwh, "kWh"],
    ["Total CAPEX", results.metrics.totalCapexUSD, "USD"],
    ["Annual OPEX", results.metrics.annualOpexUSD, "USD"],
    ["Annual CO₂", results.metrics.annualCO2Tons, "tons"],
    ["ROI Period", results.metrics.roiMonths, "months"],
    ["Renewable Fraction", (results.metrics.renewableFraction * 100).toFixed(1), "%"],
    ["Cost Savings", results.comparison.savingsPct.toFixed(1), "%"],
    ["CO₂ Reduction", results.comparison.co2ReductionPct.toFixed(1), "%"],
    [""],
    ["Hour", "Grid (kW)", "Solar (kW)", "Wind (kW)", "Battery (kW)"],
  ]

  results.hourlyDispatch.slice(0, 168).forEach((d: any) => {
    rows.push([
      d.hour.toString(),
      d.gridKw.toFixed(2),
      d.solarKw.toFixed(2),
      d.windKw.toFixed(2),
      (d.batteryDischargeKw - d.batteryChargeKw).toFixed(2),
    ])
  })

  const csvContent = rows.map((row) => row.join(",")).join("\n")
  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `greencloud-results-${location}-${Date.now()}.csv`
  a.click()
}

export function generatePDFReport(results: any, location: string) {
  return `
GreenCloud Optimization Report
Location: ${location}
Generated: ${new Date().toLocaleString()}

RECOMMENDED INFRASTRUCTURE
- Solar Capacity: ${results.capacities.solarKw} kW
- Wind Capacity: ${results.capacities.windKw} kW
- Battery Storage: ${results.capacities.batteryKwh} kWh

FINANCIAL ANALYSIS
- Initial Investment: $${results.metrics.totalCapexUSD.toLocaleString()}
- Annual Operating Cost: $${results.metrics.annualOpexUSD.toLocaleString()}
- Annual Savings: $${results.comparison.savingsUSD.toLocaleString()} (${results.comparison.savingsPct.toFixed(1)}%)
- ROI Period: ${results.metrics.roiMonths} months

ENVIRONMENTAL IMPACT
- Annual CO₂ Emissions: ${results.metrics.annualCO2Tons} tons
- CO₂ Reduction: ${results.comparison.co2ReductionTons.toFixed(1)} tons (${results.comparison.co2ReductionPct.toFixed(1)}%)
- Renewable Fraction: ${(results.metrics.renewableFraction * 100).toFixed(1)}%

RECOMMENDATIONS
1. Deploy ${results.capacities.solarKw}kW of solar panels
2. Install ${results.capacities.batteryKwh}kWh battery storage
3. Expected payback in ${results.metrics.roiMonths} months
4. Achieve ${results.comparison.co2ReductionPct.toFixed(0)}% emission reduction
  `
}
