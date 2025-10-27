export interface SensitivityParameter {
  name: string
  baseValue: number
  range: number[]
  unit: string
}

export function runSensitivityAnalysis(
  baselineInputs: any,
  optimizeFunction: (inputs: any) => any,
  parameters: SensitivityParameter[],
) {
  const results = []

  for (const param of parameters) {
    const paramResults = []

    for (const value of param.range) {
      const modifiedInputs = { ...baselineInputs }

      if (param.name === "carbonPrice") {
        modifiedInputs.costs.carbonPricePerTon = value
      } else if (param.name === "solarCapex") {
        modifiedInputs.costs.solarCapexPerKw = value
      } else if (param.name === "batteryCapex") {
        modifiedInputs.costs.batteryCapexPerKwh = value
      } else if (param.name === "gridPrice") {
        modifiedInputs.gridPrice = modifiedInputs.gridPrice.map((p: number) => p * (value / param.baseValue))
      }

      const result = optimizeFunction(modifiedInputs)

      paramResults.push({
        paramValue: value,
        renewableFraction: result.metrics.renewableFraction * 100,
        costSavingsPct: result.comparison.savingsPct,
        co2ReductionPct: result.comparison.co2ReductionPct,
        roiMonths: result.metrics.roiMonths,
      })
    }

    results.push({
      parameter: param.name,
      unit: param.unit,
      data: paramResults,
    })
  }

  return results
}

export const DEFAULT_SENSITIVITY_PARAMS: SensitivityParameter[] = [
  {
    name: "carbonPrice",
    baseValue: 50,
    range: [0, 25, 50, 75, 100, 150, 200],
    unit: "$/ton CO₂",
  },
  {
    name: "solarCapex",
    baseValue: 1200,
    range: [800, 1000, 1200, 1400, 1600],
    unit: "$/kW",
  },
  {
    name: "batteryCapex",
    baseValue: 400,
    range: [250, 300, 400, 500, 600],
    unit: "$/kWh",
  },
  {
    name: "gridPrice",
    baseValue: 0.12,
    range: [0.08, 0.1, 0.12, 0.14, 0.16],
    unit: "$/kWh",
  },
]
