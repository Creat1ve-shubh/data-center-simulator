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

export type WeatherData = {
  timestamp: Date
  temperature_c: number
  solar_irradiance_w_m2: number
  wind_speed_m_s: number
  cloud_cover_pct: number
}

export type GridData = {
  timestamp: Date
  carbon_intensity_g_co2_kwh: number
  electricity_price_usd_kwh: number
}

export type WorkloadTrace = {
  timestamp: Date
  cpu_utilization_pct: number
  memory_utilization_pct: number
  storage_utilization_pct: number
}

export type EnhancedTelemetryPoint = TelemetryPoint & {
  temperature_c?: number
  solar_irradiance_w_m2?: number
  wind_speed_m_s?: number
  grid_carbon_intensity_g_co2_kwh?: number
  electricity_price_usd_kwh?: number
  pue_dynamic?: number
  dcue?: number
  renewable_pct?: number
  solar_pct?: number
  wind_pct?: number
  hydro_pct?: number
}

export type LocationProfile = {
  name: string
  latitude: number
  longitude: number
  region: RegionId
  timezone: string
  typical_outdoor_temp_c: number
  solar_cf_annual: number
  wind_cf_annual: number
}

export type Region = {
  name: string
  latitude: number
  longitude: number
  capacityFactors: {
    solar: number
    wind: number
    hydro: number
  }
  timezone: string
}

export type LCOEData = {
  solar: number // $/kW
  wind: number // $/kW
  hydro: number // $/kW
  battery: number // $/kWh
}
