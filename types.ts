export type TelemetryPoint = {
  time: Date
  it_load_kW: number
  facility_energy_kWh: number
  water_liters?: number
  emissions_kgCO2?: number
}

export type MetricSummaries = {
  pueAvg: number
  cueAvg: number
  wueAvg: number
}

export type RoadmapPhase = {
  name: string
  months: number
  capexUSD: number
  expectedSavingsUSDyr: number
  targetPUE: number
  targetCUE: number
  targetWUE: number
  progress: number // 0..100
}

export type RegionId = "us-west" | "us-east" | "eu-central"

export type RegionResource = {
  regionId: RegionId
  solarCF: number // 0..1 capacity factor
  windCF: number
  hydroCF: number
}

export type LcoeRow = {
  regionId: RegionId
  tech: "solar" | "wind" | "hydro" | "storage" | "efficiency"
  capexPerKW: number // USD/kW (storage uses USD/kWh nominal for simplicity via capexPerKW)
  lcoePerKWh: number // USD/kWh
}

export type LeadTimeRow = {
  regionId: RegionId
  tech: "solar" | "wind" | "hydro" | "storage" | "efficiency"
  months: number
}

export type PlanInput = {
  regionId: RegionId
  targetPct: number // 0..100 energy coverage by renewables
  targetYear: number
  budgetCapUSD: number
  maxPhases: number
  maxMonthsPerPhase: number
  allowSolar: boolean
  allowWind: boolean
  allowHydro: boolean
  allowStorage: boolean
  startDate: Date
  tariffUSDkWh: number
}

export type TechAllocation = {
  tech: "solar" | "wind" | "hydro" | "storage" | "efficiency"
  capacityKW: number
  capexUSD: number
  expectedKWhYr: number
}

export type PhaseStatus = "planned" | "in-progress" | "at-risk" | "done"

export type PhaseActuals = {
  startActual?: string | Date
  endActual?: string | Date
  capexActual?: number
  opexActual?: number
  realizedKWh?: number
  realizedCO2DeltaKg?: number
  realizedPUEdelta?: number
}

export type PlanPhase = {
  id: string
  name: string
  start: Date
  end: Date
  allocations: TechAllocation[]
  capexUSD: number
  expectedSavingsUSDyr: number
  projDeltaCO2_kgYr: number
  projDeltaEnergy_kWhYr: number
  rationale: string
  status?: PhaseStatus
  actuals?: PhaseActuals
}

export type PlanResult = {
  phases: PlanPhase[]
  expectedSeries: { time: Date; cumulativeEnergy_kWh: number; cumulativeCO2_kg: number }[]
  totals: {
    capexUSD: number
    expectedSavingsUSDyr: number
    coveragePct: number
  }
  rationale: string
}
