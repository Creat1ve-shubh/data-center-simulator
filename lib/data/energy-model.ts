/**
 * Dynamic Energy Model
 * Calculates realistic PUE, cooling power, and facility overhead
 * based on outdoor temperature, IT load, and time of day
 */

export interface CoolingModel {
  cop: number // Coefficient of Performance
  cooling_power_kw: number
}

export interface EnergyModelResult {
  pue: number
  dcue: number // Data Center Infrastructure Efficiency
  cooling_power_kw: number
  facility_overhead_kw: number
  total_facility_power_kw: number
}

/**
 * Calculate cooling power based on outdoor temperature and IT load
 * Uses thermodynamic model with economizer logic for free cooling
 */
export function calculateCoolingPower(
  it_load_kw: number,
  outdoor_temp_c: number,
  indoor_setpoint_c = 24,
): CoolingModel {
  // Free cooling (economizer) when outdoor temp is cool
  if (outdoor_temp_c < 15) {
    // Very efficient free cooling
    return {
      cop: 15,
      cooling_power_kw: (it_load_kw * 1.1) / 15, // 10% extra for facility heat
    }
  }

  // Typical chiller COP degrades with outdoor temperature
  // Base COP of 6.0 at 25°C, decreases by 0.15 per degree above 25°C
  const cop = Math.max(2.5, 6.0 - 0.15 * (outdoor_temp_c - 25))

  // Heat to remove = IT load (all becomes heat) + 10% facility overhead
  const cooling_load_kw = it_load_kw * 1.1
  const cooling_power_kw = cooling_load_kw / cop

  return { cop, cooling_power_kw }
}

/**
 * Calculate facility overhead (UPS, lighting, PDU losses)
 * Varies with time of day and IT load
 */
export function calculateFacilityOverhead(it_load_kw: number, hour_of_day: number): number {
  // UPS losses: 3-5% depending on load
  const ups_efficiency = 0.97 - (1 - it_load_kw / 2000) * 0.02 // 3-5% loss
  const ups_loss_kw = it_load_kw * (1 - ups_efficiency)

  // Lighting: higher during day (6am-6pm), lower at night
  const is_daytime = hour_of_day >= 6 && hour_of_day < 18
  const lighting_pct = is_daytime ? 0.01 : 0.003 // 1% day, 0.3% night
  const lighting_loss_kw = it_load_kw * lighting_pct

  // PDU losses: 2-3%
  const pdu_loss_kw = it_load_kw * 0.025

  return ups_loss_kw + lighting_loss_kw + pdu_loss_kw
}

/**
 * Calculate dynamic PUE based on outdoor temperature and IT load
 */
export function calculateDynamicPUE(
  it_load_kw: number,
  outdoor_temp_c: number,
  hour_of_day: number,
): EnergyModelResult {
  const cooling = calculateCoolingPower(it_load_kw, outdoor_temp_c)
  const facility_overhead = calculateFacilityOverhead(it_load_kw, hour_of_day)

  const total_facility_power_kw = it_load_kw + cooling.cooling_power_kw + facility_overhead
  const pue = total_facility_power_kw / it_load_kw

  // DCUE: Data Center Infrastructure Efficiency (inverse of PUE)
  const dcue = 1 / pue

  return {
    pue,
    dcue,
    cooling_power_kw: cooling.cooling_power_kw,
    facility_overhead_kw: facility_overhead,
    total_facility_power_kw,
  }
}

/**
 * Validate energy model results
 */
export function validateEnergyModel(result: EnergyModelResult): boolean {
  // PUE should be between 1.1 and 2.5 for realistic data centers
  if (result.pue < 1.1 || result.pue > 2.5) return false
  // DCUE should be between 0.4 and 0.9
  if (result.dcue < 0.4 || result.dcue > 0.9) return false
  // Cooling power should be positive
  if (result.cooling_power_kw < 0) return false
  return true
}
