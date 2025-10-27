import type { TelemetryPoint, OptimizationResult } from "@/types"

/**
 * Test helper to generate mock telemetry data
 */
export function generateMockTelemetry(count = 100): TelemetryPoint[] {
  const data: TelemetryPoint[] = []
  for (let i = 0; i < count; i++) {
    data.push({
      timestamp: new Date(Date.now() - (count - i) * 3600000),
      it_load_kW: 500 + Math.random() * 200,
      facility_energy_kWh: 700 + Math.random() * 300,
      water_liters: 50000 + Math.random() * 20000,
      emissions_kgCO2: 300 + Math.random() * 150,
      renewable_percentage: 20 + Math.random() * 30,
      pue: 1.5 + Math.random() * 0.5,
      outdoor_temp_celsius: 15 + Math.random() * 20,
      solar_irradiance_W_m2: 500 + Math.random() * 300,
      wind_speed_m_s: 5 + Math.random() * 5,
      grid_carbon_intensity_gCO2_kWh: 200 + Math.random() * 200,
    })
  }
  return data
}

/**
 * Test helper to validate optimization results
 */
export function validateOptimizationResult(result: OptimizationResult): boolean {
  if (!result.solar_capacity_MW || result.solar_capacity_MW < 0) return false
  if (!result.wind_capacity_MW || result.wind_capacity_MW < 0) return false
  if (!result.hydro_capacity_MW || result.hydro_capacity_MW < 0) return false
  if (!result.battery_capacity_MWh || result.battery_capacity_MWh < 0) return false
  if (!result.total_cost_USD || result.total_cost_USD < 0) return false
  if (!result.annual_savings_USD || result.annual_savings_USD < 0) return false
  return true
}

/**
 * Test helper to compare two optimization results
 */
export function compareResults(result1: OptimizationResult, result2: OptimizationResult) {
  return {
    cost_difference: result2.total_cost_USD - result1.total_cost_USD,
    savings_difference: result2.annual_savings_USD - result1.annual_savings_USD,
    payback_difference: result2.payback_period_years - result1.payback_period_years,
    roi_difference: result2.roi_percentage - result1.roi_percentage,
  }
}
