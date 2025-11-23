/**
 * PUE (Power Usage Effectiveness) Prediction Model
 * Adjusts facility load based on weather-dependent cooling
 */

export interface PUEInput {
  hourlyWeather: {
    hour: number;
    outdoor_temp_c: number;
  }[];
  itLoad: {
    average_kw: number;
    peak_kw: number;
  };
  baseline_pue: number;
  renewable_config: {
    solar_kw: number;
    wind_kw: number;
  };
}

export interface PUEOutput {
  adjustedLoad: {
    baseline_pue: number;
    adjusted_pue: number;
    pue_improvement_percent: number;
    annual_energy_savings_kwh: number;
  };
  hourlyPUE: {
    hour: number;
    outdoor_temp_c: number;
    pue_factor: number;
    it_load_kw: number;
    total_facility_load_kw: number;
  }[];
  coolingImpact: {
    average_cooling_load_kw: number;
    cooling_cost_savings_usd_year: number;
  };
}

/**
 * Dynamic PUE Model
 * PUE varies with outdoor temperature:
 * - Cold weather (<10°C): PUE = 1.2 (free cooling)
 * - Moderate (10-25°C): PUE = 1.4
 * - Hot (25-35°C): PUE = 1.6
 * - Very hot (>35°C): PUE = 1.8
 */
export async function computePUEAdjusted(input: PUEInput): Promise<PUEOutput> {
  const { hourlyWeather, itLoad, baseline_pue, renewable_config } = input;

  console.log("[PUE] Computing dynamic PUE based on weather...");

  // Calculate hourly PUE
  const hourlyPUE = hourlyWeather.map((h) => {
    const temp = h.outdoor_temp_c;

    // Temperature-dependent PUE formula
    let pue_factor: number;
    if (temp < 10) {
      pue_factor = 1.2; // Free cooling
    } else if (temp < 25) {
      pue_factor = 1.2 + ((temp - 10) / 15) * 0.2; // Linear interpolation 1.2 → 1.4
    } else if (temp < 35) {
      pue_factor = 1.4 + ((temp - 25) / 10) * 0.2; // Linear interpolation 1.4 → 1.6
    } else {
      pue_factor = 1.6 + Math.min((temp - 35) / 10, 0.2); // Max 1.8
    }

    // Renewable energy can improve cooling efficiency (assumption: 5% better with onsite renewables)
    const renewable_bonus =
      renewable_config.solar_kw + renewable_config.wind_kw > 0 ? 0.95 : 1.0;
    pue_factor *= renewable_bonus;

    const it_load_kw = itLoad.average_kw;
    const total_facility_load_kw = it_load_kw * pue_factor;

    return {
      hour: h.hour,
      outdoor_temp_c: temp,
      pue_factor,
      it_load_kw,
      total_facility_load_kw,
    };
  });

  // Calculate average adjusted PUE
  const adjusted_pue =
    hourlyPUE.reduce((sum, h) => sum + h.pue_factor, 0) / hourlyPUE.length;

  // PUE improvement percentage
  const pue_improvement_percent =
    ((baseline_pue - adjusted_pue) / baseline_pue) * 100;

  // Annual energy savings
  const baseline_annual_energy = itLoad.average_kw * baseline_pue * 8760;
  const adjusted_annual_energy = itLoad.average_kw * adjusted_pue * 8760;
  const annual_energy_savings_kwh =
    baseline_annual_energy - adjusted_annual_energy;

  // Cooling load impact
  const average_cooling_load_kw =
    hourlyPUE.reduce(
      (sum, h) => sum + (h.total_facility_load_kw - h.it_load_kw),
      0
    ) / hourlyPUE.length;

  // Assume electricity cost of $0.12/kWh (will be overridden by actual pricing)
  const cooling_cost_savings_usd_year = annual_energy_savings_kwh * 0.12;

  console.log(
    `[PUE] Baseline: ${baseline_pue.toFixed(2)}, Adjusted: ${adjusted_pue.toFixed(2)} (${pue_improvement_percent.toFixed(1)}% improvement)`
  );
  console.log(
    `[PUE] Annual energy savings: ${annual_energy_savings_kwh.toFixed(0)} kWh`
  );

  return {
    adjustedLoad: {
      baseline_pue,
      adjusted_pue,
      pue_improvement_percent,
      annual_energy_savings_kwh,
    },
    hourlyPUE,
    coolingImpact: {
      average_cooling_load_kw,
      cooling_cost_savings_usd_year,
    },
  };
}
