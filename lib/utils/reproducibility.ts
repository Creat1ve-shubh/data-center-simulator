import type { TelemetryPoint, OptimizationResult, Region } from "@/types"

/**
 * Reproducibility package for research results
 */
export interface ReproducibilityPackage {
  version: string
  timestamp: string
  region: Region
  input_data: TelemetryPoint[]
  optimization_results: OptimizationResult[]
  baseline_results: OptimizationResult[]
  sensitivity_analysis: Record<string, OptimizationResult[]>
  metadata: {
    algorithm_version: string
    data_source: string
    assumptions: string[]
  }
}

/**
 * Create a reproducibility package for research results
 */
export function createReproducibilityPackage(
  region: Region,
  inputData: TelemetryPoint[],
  optimizationResults: OptimizationResult[],
  baselineResults: OptimizationResult[],
  sensitivityAnalysis: Record<string, OptimizationResult[]>,
): ReproducibilityPackage {
  return {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    region,
    input_data: inputData,
    optimization_results: optimizationResults,
    baseline_results: baselineResults,
    sensitivity_analysis: sensitivityAnalysis,
    metadata: {
      algorithm_version: "2.0.0",
      data_source: "NREL NSRDB + Google Cluster Trace",
      assumptions: [
        "Dynamic PUE based on outdoor temperature and IT load",
        "Economizer cooling efficiency: 0.3 kW per kW IT load",
        "Solar capacity factor: 0.25 (global average)",
        "Wind capacity factor: 0.35 (global average)",
        "Battery round-trip efficiency: 0.85",
        "Grid carbon intensity: region-specific",
      ],
    },
  }
}

/**
 * Export reproducibility package as JSON
 */
export function exportReproducibilityPackage(pkg: ReproducibilityPackage): string {
  return JSON.stringify(pkg, null, 2)
}

/**
 * Export reproducibility package as CSV for analysis
 */
export function exportAsCSV(data: TelemetryPoint[]): string {
  const headers = [
    "timestamp",
    "it_load_kW",
    "facility_energy_kWh",
    "water_liters",
    "emissions_kgCO2",
    "renewable_percentage",
    "pue",
    "outdoor_temp_celsius",
    "solar_irradiance_W_m2",
    "wind_speed_m_s",
    "grid_carbon_intensity_gCO2_kWh",
  ]

  const rows = data.map((point) =>
    [
      point.timestamp.toISOString(),
      point.it_load_kW,
      point.facility_energy_kWh,
      point.water_liters,
      point.emissions_kgCO2,
      point.renewable_percentage,
      point.pue,
      point.outdoor_temp_celsius,
      point.solar_irradiance_W_m2,
      point.wind_speed_m_s,
      point.grid_carbon_intensity_gCO2_kWh,
    ].join(","),
  )

  return [headers.join(","), ...rows].join("\n")
}
