export interface OptimizationInputs {
  locationId: string
  hourlyLoad: number[]
  solarCF: number[]
  windCF: number[]
  gridPrice: number[]
  gridCarbon: number[]
  constraints: {
    maxSolarCapacity?: number
    maxWindCapacity?: number
    maxBatteryCapacity?: number
    budgetUSD?: number
  }
  costs: {
    solarCapexPerKw: number
    windCapexPerKw: number
    batteryCapexPerKwh: number
    maintenancePerKwh: number
    carbonPricePerTon: number
    discountRate: number
  }
}

export interface OptimizationResult {
  capacities: {
    solarKw: number
    windKw: number
    batteryKwh: number
  }
  hourlyDispatch: Array<{
    hour: number
    gridKw: number
    solarKw: number
    windKw: number
    batteryChargeKw: number
    batteryDischargeKw: number
    socKwh: number
  }>
  metrics: {
    totalCapexUSD: number
    annualOpexUSD: number
    annualCO2Tons: number
    roiMonths: number
    renewableFraction: number
    avgPUE: number
  }
  comparison: {
    baselineCostUSD: number
    baselineCO2Tons: number
    savingsUSD: number
    co2ReductionTons: number
    savingsPct: number
    co2ReductionPct: number
  }
}

export function optimizeEnergyMix(inputs: OptimizationInputs): OptimizationResult {
  const hoursPerYear = inputs.hourlyLoad.length
  const annualEnergyKwh = inputs.hourlyLoad.reduce((sum, load) => sum + load, 0)

  const targetRenewableFraction = 0.65
  const targetRenewableKwh = annualEnergyKwh * targetRenewableFraction

  const avgSolarCF = inputs.solarCF.reduce((sum, cf) => sum + cf, 0) / hoursPerYear
  const avgWindCF = inputs.windCF.reduce((sum, cf) => sum + cf, 0) / hoursPerYear

  let solarCapacity = 0
  let windCapacity = 0

  if (avgSolarCF > avgWindCF) {
    solarCapacity = (targetRenewableKwh * 0.7) / (avgSolarCF * hoursPerYear)
    windCapacity = (targetRenewableKwh * 0.3) / (avgWindCF * hoursPerYear || 1)
  } else {
    solarCapacity = (targetRenewableKwh * 0.3) / (avgSolarCF * hoursPerYear || 1)
    windCapacity = (targetRenewableKwh * 0.7) / (avgWindCF * hoursPerYear)
  }

  if (inputs.constraints.maxSolarCapacity) {
    solarCapacity = Math.min(solarCapacity, inputs.constraints.maxSolarCapacity)
  }
  if (inputs.constraints.maxWindCapacity) {
    windCapacity = Math.min(windCapacity, inputs.constraints.maxWindCapacity)
  }

  const avgLoad = annualEnergyKwh / hoursPerYear
  let batteryCapacity = avgLoad * 5

  if (inputs.constraints.maxBatteryCapacity) {
    batteryCapacity = Math.min(batteryCapacity, inputs.constraints.maxBatteryCapacity)
  }

  const dispatch = simulateDispatch(
    inputs.hourlyLoad,
    solarCapacity,
    windCapacity,
    batteryCapacity,
    inputs.solarCF,
    inputs.windCF,
  )

  const baseline = calculateBaseline(inputs)
  const optimized = calculateOptimizedMetrics(dispatch, inputs, solarCapacity, windCapacity, batteryCapacity)

  return {
    capacities: {
      solarKw: Math.round(solarCapacity * 10) / 10,
      windKw: Math.round(windCapacity * 10) / 10,
      batteryKwh: Math.round(batteryCapacity * 10) / 10,
    },
    hourlyDispatch: dispatch,
    metrics: optimized,
    comparison: {
      baselineCostUSD: baseline.cost,
      baselineCO2Tons: baseline.co2,
      savingsUSD: baseline.cost - optimized.annualOpexUSD,
      co2ReductionTons: baseline.co2 - optimized.annualCO2Tons,
      savingsPct: ((baseline.cost - optimized.annualOpexUSD) / baseline.cost) * 100,
      co2ReductionPct: ((baseline.co2 - optimized.annualCO2Tons) / baseline.co2) * 100,
    },
  }
}

function simulateDispatch(
  hourlyLoad: number[],
  solarCap: number,
  windCap: number,
  batteryCap: number,
  solarCF: number[],
  windCF: number[],
) {
  const dispatch = []
  let soc = batteryCap * 0.5
  const batteryEfficiency = 0.9
  const maxChargeRate = batteryCap / 4

  for (let h = 0; h < hourlyLoad.length; h++) {
    const load = hourlyLoad[h]
    const solarAvail = solarCap * solarCF[h]
    const windAvail = windCap * windCF[h]
    const renewableAvail = solarAvail + windAvail

    let batteryCharge = 0
    let batteryDischarge = 0
    let gridUsed = 0

    if (renewableAvail >= load) {
      const excess = renewableAvail - load
      batteryCharge = Math.min(excess, maxChargeRate, (batteryCap - soc) / batteryEfficiency)
      soc += batteryCharge * batteryEfficiency
      gridUsed = 0
    } else {
      const deficit = load - renewableAvail
      batteryDischarge = Math.min(deficit, maxChargeRate, soc * batteryEfficiency)
      soc -= batteryDischarge / batteryEfficiency
      gridUsed = Math.max(0, deficit - batteryDischarge)
    }

    dispatch.push({
      hour: h,
      gridKw: gridUsed,
      solarKw: Math.min(solarAvail, load),
      windKw: Math.min(windAvail, load - Math.min(solarAvail, load)),
      batteryChargeKw: batteryCharge,
      batteryDischargeKw: batteryDischarge,
      socKwh: soc,
    })
  }

  return dispatch
}

function calculateBaseline(inputs: OptimizationInputs) {
  const totalEnergy = inputs.hourlyLoad.reduce((sum, load) => sum + load, 0)
  let totalCost = 0
  let totalCO2 = 0

  for (let h = 0; h < inputs.hourlyLoad.length; h++) {
    totalCost += inputs.hourlyLoad[h] * inputs.gridPrice[h]
    totalCO2 += (inputs.hourlyLoad[h] * inputs.gridCarbon[h]) / 1000
  }

  return {
    cost: totalCost,
    co2: totalCO2 / 1000,
  }
}

function calculateOptimizedMetrics(
  dispatch: any[],
  inputs: OptimizationInputs,
  solarCap: number,
  windCap: number,
  batteryCap: number,
) {
  let totalCost = 0
  let totalCO2 = 0
  let totalRenewable = 0
  let totalEnergy = 0

  for (let h = 0; h < dispatch.length; h++) {
    const d = dispatch[h]
    totalCost += d.gridKw * inputs.gridPrice[h]
    totalCost += (d.solarKw + d.windKw) * inputs.costs.maintenancePerKwh
    totalCO2 += (d.gridKw * inputs.gridCarbon[h]) / 1000
    totalRenewable += d.solarKw + d.windKw
    totalEnergy += d.gridKw + d.solarKw + d.windKw
  }

  const capex =
    solarCap * inputs.costs.solarCapexPerKw +
    windCap * inputs.costs.windCapexPerKw +
    batteryCap * inputs.costs.batteryCapexPerKwh

  const baseline = calculateBaseline(inputs)
  const annualSavings = baseline.cost - totalCost
  const roiMonths = annualSavings > 0 ? (capex / annualSavings) * 12 : 999

  return {
    totalCapexUSD: Math.round(capex),
    annualOpexUSD: Math.round(totalCost),
    annualCO2Tons: Math.round((totalCO2 / 1000) * 10) / 10,
    roiMonths: Math.round(Math.min(roiMonths, 999)),
    renewableFraction: totalRenewable / totalEnergy,
    avgPUE: 1.28,
  }
}
