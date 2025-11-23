/**
 * Energy Conversion Utilities
 * Functions to convert raw API data into usable energy metrics
 */

/**
 * Convert solar irradiance to PV power output
 * @param irradiance_w_m2 - Solar irradiance in W/m²
 * @param capacity_kw - Installed PV capacity in kW
 * @param temperature_c - Panel temperature in °C
 * @param efficiency - System efficiency (default 0.18 = 18%)
 * @returns Power output in kW
 */
export function solarToPower(
  irradiance_w_m2: number,
  capacity_kw: number,
  temperature_c: number = 25,
  efficiency: number = 0.18
): number {
  // Standard Test Conditions: 1000 W/m², 25°C
  const stc_irradiance = 1000;

  // Temperature coefficient (typically -0.004/°C for silicon)
  const temp_coefficient = -0.004;
  const temp_factor = 1 + temp_coefficient * (temperature_c - 25);

  // Power output calculation
  const power_kw =
    capacity_kw * (irradiance_w_m2 / stc_irradiance) * temp_factor * efficiency;

  return Math.max(0, power_kw);
}

/**
 * Calculate normalized PV output per kW installed
 * @param irradiance_w_m2 - Solar irradiance in W/m²
 * @param temperature_c - Panel temperature in °C
 * @returns Normalized power output (0-1 range typically)
 */
export function normalizedSolarOutput(
  irradiance_w_m2: number,
  temperature_c: number = 25
): number {
  return solarToPower(irradiance_w_m2, 1, temperature_c);
}

/**
 * Convert wind speed to turbine power output using power curve
 * Uses a generic IEC Class II turbine curve
 * @param wind_speed_m_s - Wind speed in m/s
 * @param rated_power_kw - Turbine rated power in kW
 * @returns Power output in kW
 */
export function windToPower(
  wind_speed_m_s: number,
  rated_power_kw: number = 1000
): number {
  // Typical turbine parameters
  const cut_in_speed = 3; // m/s
  const rated_speed = 12; // m/s
  const cut_out_speed = 25; // m/s

  if (wind_speed_m_s < cut_in_speed || wind_speed_m_s > cut_out_speed) {
    return 0;
  }

  if (wind_speed_m_s >= rated_speed) {
    return rated_power_kw;
  }

  // Cubic power curve between cut-in and rated speed
  const power_coefficient = 0.4; // Betz limit adjusted for losses
  const air_density = 1.225; // kg/m³
  const rotor_area =
    (rated_power_kw * 1000) /
    (0.5 * air_density * Math.pow(rated_speed, 3) * power_coefficient);

  const power_w =
    0.5 *
    air_density *
    rotor_area *
    Math.pow(wind_speed_m_s, 3) *
    power_coefficient;
  const power_kw = power_w / 1000;

  return Math.min(power_kw, rated_power_kw);
}

/**
 * Calculate normalized wind output per kW installed
 * @param wind_speed_m_s - Wind speed in m/s
 * @returns Normalized power output (0-1 range)
 */
export function normalizedWindOutput(wind_speed_m_s: number): number {
  return windToPower(wind_speed_m_s, 1);
}

/**
 * Convert river discharge to hydro power output
 * @param discharge_m3_s - River discharge in m³/s
 * @param head_m - Hydraulic head in meters (default 50m)
 * @param efficiency - Turbine efficiency (default 0.85)
 * @returns Power output in kW
 */
export function hydroToPower(
  discharge_m3_s: number,
  head_m: number = 50,
  efficiency: number = 0.85
): number {
  // P = ρ * g * h * Q * η
  // where ρ = water density (1000 kg/m³), g = 9.81 m/s²
  const water_density = 1000; // kg/m³
  const gravity = 9.81; // m/s²

  const power_w =
    water_density * gravity * head_m * discharge_m3_s * efficiency;
  const power_kw = power_w / 1000;

  return Math.max(0, power_kw);
}

/**
 * Calculate dynamic PUE based on outdoor temperature
 * Lower temperatures improve cooling efficiency
 * @param outdoor_temp_c - Outdoor temperature in °C
 * @param it_load_kw - IT load in kW
 * @param design_temp_c - Design temperature (default 20°C)
 * @returns PUE factor (typically 1.1 - 1.8)
 */
export function calculatePUE(
  outdoor_temp_c: number,
  it_load_kw: number,
  design_temp_c: number = 20
): number {
  // Base PUE for ideal conditions
  const base_pue = 1.2;

  // Temperature impact: +0.02 PUE per °C above design temp
  const temp_impact = Math.max(0, outdoor_temp_c - design_temp_c) * 0.02;

  // Load factor impact: partial load is less efficient
  const load_factor = it_load_kw / (it_load_kw || 1); // Avoid division by zero
  const load_impact = load_factor < 0.5 ? 0.1 : 0;

  // Free cooling benefit: outdoor temp < 15°C reduces PUE
  const free_cooling_benefit = outdoor_temp_c < 15 ? -0.1 : 0;

  const pue = base_pue + temp_impact + load_impact + free_cooling_benefit;

  // Clamp PUE to realistic range
  return Math.max(1.05, Math.min(2.5, pue));
}

/**
 * Calculate battery state of charge over time
 * @param initial_soc_kwh - Initial state of charge
 * @param charge_kw - Charging power (positive)
 * @param discharge_kw - Discharging power (positive)
 * @param capacity_kwh - Battery capacity
 * @param efficiency - Round-trip efficiency (default 0.85)
 * @returns New state of charge in kWh
 */
export function batteryStateOfCharge(
  initial_soc_kwh: number,
  charge_kw: number,
  discharge_kw: number,
  capacity_kwh: number,
  efficiency: number = 0.85
): number {
  // Charge increases SOC (with efficiency loss)
  // Discharge decreases SOC (with efficiency loss)
  const charge_efficiency = Math.sqrt(efficiency); // Each direction gets sqrt(efficiency)
  const discharge_efficiency = Math.sqrt(efficiency);

  const soc =
    initial_soc_kwh +
    charge_kw * charge_efficiency -
    discharge_kw / discharge_efficiency;

  // Clamp to capacity limits
  return Math.max(0, Math.min(capacity_kwh, soc));
}

/**
 * Calculate grid carbon intensity with time-of-day variation
 * @param base_intensity - Base carbon intensity (gCO2/kWh)
 * @param hour - Hour of day (0-23)
 * @returns Carbon intensity in gCO2/kWh
 */
export function gridCarbonIntensity(
  base_intensity: number,
  hour: number
): number {
  // Peak hours (8am-6pm) typically have higher intensity
  const is_peak = hour >= 8 && hour < 18;
  const peak_factor = is_peak ? 1.2 : 0.85;

  return base_intensity * peak_factor;
}

/**
 * Calculate electricity price with time-of-day variation
 * @param base_price - Base electricity price (USD/kWh)
 * @param hour - Hour of day (0-23)
 * @returns Price in USD/kWh
 */
export function electricityPrice(base_price: number, hour: number): number {
  // Time-of-use pricing
  if (hour >= 14 && hour < 21) {
    return base_price * 2.0; // Peak hours
  } else if (hour >= 21 || hour < 7) {
    return base_price * 0.6; // Off-peak hours
  } else {
    return base_price * 1.2; // Mid-peak hours
  }
}

/**
 * Calculate LCOE (Levelized Cost of Energy)
 * @param capex - Capital expenditure (USD)
 * @param annual_opex - Annual operating expenditure (USD)
 * @param annual_energy_kwh - Annual energy production (kWh)
 * @param lifetime_years - Project lifetime (years)
 * @param discount_rate - Discount rate (decimal, e.g., 0.05 for 5%)
 * @returns LCOE in USD/kWh
 */
export function calculateLCOE(
  capex: number,
  annual_opex: number,
  annual_energy_kwh: number,
  lifetime_years: number = 25,
  discount_rate: number = 0.05
): number {
  // Present value of costs
  let pv_costs = capex;
  for (let year = 1; year <= lifetime_years; year++) {
    pv_costs += annual_opex / Math.pow(1 + discount_rate, year);
  }

  // Present value of energy
  let pv_energy = 0;
  for (let year = 1; year <= lifetime_years; year++) {
    pv_energy += annual_energy_kwh / Math.pow(1 + discount_rate, year);
  }

  return pv_costs / pv_energy;
}

/**
 * Calculate payback period
 * @param capex - Capital expenditure (USD)
 * @param annual_savings - Annual cost savings (USD)
 * @returns Payback period in months
 */
export function paybackPeriod(capex: number, annual_savings: number): number {
  if (annual_savings <= 0) return Infinity;
  return (capex / annual_savings) * 12;
}

/**
 * Calculate NPV (Net Present Value)
 * @param initial_investment - Initial investment (USD)
 * @param annual_cash_flows - Annual cash flows (USD)
 * @param discount_rate - Discount rate (decimal)
 * @param years - Number of years
 * @returns NPV in USD
 */
export function calculateNPV(
  initial_investment: number,
  annual_cash_flows: number[],
  discount_rate: number,
  years: number
): number {
  let npv = -initial_investment;

  for (let year = 0; year < years; year++) {
    const cash_flow =
      annual_cash_flows[year] ||
      annual_cash_flows[annual_cash_flows.length - 1];
    npv += cash_flow / Math.pow(1 + discount_rate, year + 1);
  }

  return npv;
}

/**
 * Validate coordinates
 * @param latitude - Latitude (-90 to 90)
 * @param longitude - Longitude (-180 to 180)
 * @returns true if valid
 */
export function validateCoordinates(
  latitude: number,
  longitude: number
): boolean {
  return (
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
  );
}

/**
 * Fill data gaps with interpolation
 * @param data - Array of numbers with potential gaps (NaN or undefined)
 * @returns Array with gaps filled
 */
export function fillDataGaps(data: (number | undefined | null)[]): number[] {
  const result: number[] = [];
  let lastValid: number | null = null;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];

    if (value !== undefined && value !== null && !isNaN(value)) {
      result[i] = value;
      lastValid = value;
    } else {
      // Find next valid value
      let nextValid: number | null = null;
      for (let j = i + 1; j < data.length; j++) {
        if (data[j] !== undefined && data[j] !== null && !isNaN(data[j]!)) {
          nextValid = data[j]!;
          break;
        }
      }

      // Interpolate or use last/next valid value
      if (lastValid !== null && nextValid !== null) {
        result[i] = (lastValid + nextValid) / 2;
      } else if (lastValid !== null) {
        result[i] = lastValid;
      } else if (nextValid !== null) {
        result[i] = nextValid;
      } else {
        result[i] = 0; // Default to 0 if no valid data
      }
    }
  }

  return result;
}
