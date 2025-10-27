/**
 * Baseline Comparison Module
 * Compares GreenCloud auto-plan against industry baselines
 */

import type { EnhancedTelemetryPoint } from "@/types"

export interface BaselineResult {
  name: string
  total_cost_usd: number
  total_carbon_kg: number
  avg_pue: number
  renewable_pct: number
  grid_peak_load_kw: number
  annual_savings_vs_baseline_usd: number
  annual_carbon_reduction_vs_baseline_kg: number
}

/**
 * Baseline 1: Grid-Only (No Renewables)
 * Represents current state without any renewable transition
 */
export function simulateGridOnly(telemetry: EnhancedTelemetryPoint[]): BaselineResult {
  let total_cost = 0
  let total_carbon = 0
  let pue_sum = 0
  let max_load = 0

  for (const point of telemetry) {
    const facility_power = point.facility_energy_kWh
    const grid_carbon = point.grid_carbon_intensity_g_co2_kwh || 400
    const electricity_price = point.electricity_price_usd_kwh || 0.12

    total_cost += facility_power * electricity_price
    total_carbon += (facility_power * grid_carbon) / 1000 // Convert to kg
    pue_sum += point.pue_dynamic || 1.45
    max_load = Math.max(max_load, facility_power)
  }

  return {
    name: "Grid-Only (Baseline)",
    total_cost_usd: total_cost,
    total_carbon_kg: total_carbon,
    avg_pue: pue_sum / telemetry.length,
    renewable_pct: 0,
    grid_peak_load_kw: max_load,
    annual_savings_vs_baseline_usd: 0,
    annual_carbon_reduction_vs_baseline_kg: 0,
  }
}

/**
 * Baseline 2: Manual Static Planning
 * Represents current industry practice: size renewables based on average load
 */
export function simulateManualPlanning(
  telemetry: EnhancedTelemetryPoint[],
  renewable_target_pct = 0.45,
): BaselineResult {
  let total_cost = 0
  let total_carbon = 0
  let pue_sum = 0
  let max_load = 0
  let renewable_used = 0

  const avg_load = telemetry.reduce((sum, p) => sum + p.facility_energy_kWh, 0) / telemetry.length
  const renewable_capacity = avg_load * renewable_target_pct

  for (const point of telemetry) {
    const facility_power = point.facility_energy_kWh
    const available_renewable = renewable_capacity * (point.renewable_pct || 0.3)
    const grid_power = Math.max(0, facility_power - available_renewable)

    const grid_carbon = point.grid_carbon_intensity_g_co2_kwh || 400
    const electricity_price = point.electricity_price_usd_kwh || 0.12

    total_cost += grid_power * electricity_price
    total_carbon += (grid_power * grid_carbon) / 1000
    renewable_used += available_renewable
    pue_sum += point.pue_dynamic || 1.38
    max_load = Math.max(max_load, grid_power)
  }

  const renewable_pct = renewable_used / (renewable_used + total_cost / 0.12)

  return {
    name: "Manual Planning",
    total_cost_usd: total_cost,
    total_carbon_kg: total_carbon,
    avg_pue: pue_sum / telemetry.length,
    renewable_pct: Math.min(1, renewable_pct),
    grid_peak_load_kw: max_load,
    annual_savings_vs_baseline_usd: 0,
    annual_carbon_reduction_vs_baseline_kg: 0,
  }
}

/**
 * Baseline 3: Greedy Real-Time Dispatch
 * Use renewable if available, else grid (no optimization)
 */
export function simulateGreedyDispatch(telemetry: EnhancedTelemetryPoint[]): BaselineResult {
  let total_cost = 0
  let total_carbon = 0
  let pue_sum = 0
  let max_load = 0
  let renewable_used = 0

  for (const point of telemetry) {
    const facility_power = point.facility_energy_kWh
    const renewable_available = facility_power * (point.renewable_pct || 0.3)
    const grid_power = facility_power - renewable_available

    const grid_carbon = point.grid_carbon_intensity_g_co2_kwh || 400
    const electricity_price = point.electricity_price_usd_kwh || 0.12

    total_cost += grid_power * electricity_price
    total_carbon += (grid_power * grid_carbon) / 1000
    renewable_used += renewable_available
    pue_sum += point.pue_dynamic || 1.35
    max_load = Math.max(max_load, grid_power)
  }

  const renewable_pct = renewable_used / (renewable_used + total_cost / 0.12)

  return {
    name: "Greedy Dispatch",
    total_cost_usd: total_cost,
    total_carbon_kg: total_carbon,
    avg_pue: pue_sum / telemetry.length,
    renewable_pct: Math.min(1, renewable_pct),
    grid_peak_load_kw: max_load,
    annual_savings_vs_baseline_usd: 0,
    annual_carbon_reduction_vs_baseline_kg: 0,
  }
}

/**
 * Compare all baselines and calculate improvements
 */
export function compareAllBaselines(telemetry: EnhancedTelemetryPoint[]): BaselineResult[] {
  const gridOnly = simulateGridOnly(telemetry)
  const manual = simulateManualPlanning(telemetry)
  const greedy = simulateGreedyDispatch(telemetry)

  // Calculate improvements vs grid-only baseline
  manual.annual_savings_vs_baseline_usd = gridOnly.total_cost_usd - manual.total_cost_usd
  manual.annual_carbon_reduction_vs_baseline_kg = gridOnly.total_carbon_kg - manual.total_carbon_kg

  greedy.annual_savings_vs_baseline_usd = gridOnly.total_cost_usd - greedy.total_cost_usd
  greedy.annual_carbon_reduction_vs_baseline_kg = gridOnly.total_carbon_kg - greedy.total_carbon_kg

  return [gridOnly, manual, greedy]
}
