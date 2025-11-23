/**
 * Backend Types for Production Renewable Energy Optimization
 * Defines all interfaces for API responses, optimization inputs/outputs
 */

// ============================================
// API Request/Response Types
// ============================================

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface OptimizationRequest {
  coordinates: LocationCoordinates;
  currentLoad: {
    averageKW: number;
    peakKW: number;
    annualKWh: number;
  };
  constraints: {
    budget: number; // USD
    maxRenewableFraction?: number; // 0-1, default 1.0
    minRenewableFraction?: number; // 0-1, default 0
    gridCarbonIntensity?: number; // gCO2/kWh
    gridPrice?: number; // USD/kWh
  };
  preferences?: {
    solarWeight?: number; // 0-1, preference for solar
    windWeight?: number; // 0-1, preference for wind
    batteryWeight?: number; // 0-1, preference for battery
  };
}

export interface OptimizationResponse {
  optimal_plan: {
    solar_kw: number;
    wind_kw: number;
    battery_kwh: number;
  };
  renewable_fraction: number; // 0-1
  roi_months: number;
  co2_reduction: number; // kg CO2/year
  cost_savings: number; // USD/year
  hourly_dispatch: HourlyDispatch[];
  metadata: {
    location: LocationCoordinates;
    timestamp: string;
    dataQuality: DataQuality;
  };
}

export interface HourlyDispatch {
  hour: number; // 0-8759
  timestamp: string;
  load_kw: number;
  solar_kw: number;
  wind_kw: number;
  battery_discharge_kw: number;
  battery_charge_kw: number;
  grid_import_kw: number;
  battery_soc_kwh: number; // State of charge
  renewable_fraction: number; // For this hour
}

// ============================================
// External API Response Types
// ============================================

export interface NRELSolarResponse {
  outputs: {
    dni?: number[]; // Direct Normal Irradiance (W/m²)
    ghi?: number[]; // Global Horizontal Irradiance (W/m²)
    dhi?: number[]; // Diffuse Horizontal Irradiance (W/m²)
    temp_air?: number[]; // Air temperature (°C)
    wind_speed?: number[]; // Wind speed (m/s)
    timestamps?: string[];
  };
}

export interface OpenMeteoWindResponse {
  hourly: {
    time: string[];
    wind_speed_10m?: number[]; // m/s at 10m
    wind_speed_80m?: number[]; // m/s at 80m (turbine height)
    wind_speed_100m?: number[]; // m/s at 100m
    wind_direction_10m?: number[];
    temperature_2m?: number[];
  };
}

export interface OpenMeteoHydroResponse {
  hourly: {
    time: string[];
    river_discharge?: number[]; // m³/s
    precipitation?: number[]; // mm
    soil_moisture?: number[];
  };
}

export interface NASAPowerResponse {
  properties: {
    parameter: {
      T2M?: { [key: string]: number }; // 2m temperature
      WS10M?: { [key: string]: number }; // 10m wind speed
      ALLSKY_SFC_SW_DWN?: { [key: string]: number }; // Surface solar irradiance
      RH2M?: { [key: string]: number }; // 2m relative humidity
    };
  };
}

// ============================================
// Normalized Energy Data
// ============================================

export interface HourlyEnergyData {
  hour: number;
  timestamp: string;
  solar: {
    irradiance_w_m2: number;
    pv_output_kw_per_kw: number; // Normalized per kW installed
    temperature_c: number;
  };
  wind: {
    speed_m_s: number;
    power_output_kw_per_kw: number; // Normalized per kW installed
    direction_deg?: number;
  };
  hydro: {
    discharge_m3_s: number;
    power_output_kw?: number;
  };
  cooling: {
    outdoor_temp_c: number;
    pue_factor: number; // Cooling efficiency factor
  };
  grid: {
    carbon_intensity_g_co2_kwh: number;
    price_usd_kwh: number;
  };
  load: {
    demand_kw: number;
  };
}

// ============================================
// Optimization Solver Types
// ============================================

export interface MILPInput {
  hourlyData: HourlyEnergyData[];
  costs: {
    solar_capex_per_kw: number;
    wind_capex_per_kw: number;
    battery_capex_per_kwh: number;
    solar_opex_per_kw_year: number;
    wind_opex_per_kw_year: number;
    battery_opex_per_kwh_year: number;
    carbon_cost_per_kg_co2: number;
  };
  constraints: {
    max_budget: number;
    max_solar_kw?: number;
    max_wind_kw?: number;
    max_battery_kwh?: number;
    min_renewable_fraction?: number;
    battery_efficiency?: number; // Round-trip efficiency (0-1)
  };
  optimization_params: {
    discount_rate: number; // For NPV calculation
    project_lifetime_years: number;
    solve_timeout_seconds?: number;
  };
}

export interface MILPOutput {
  status: 'optimal' | 'feasible' | 'infeasible' | 'error';
  objective_value: number; // Total cost
  decision_variables: {
    solar_capacity_kw: number;
    wind_capacity_kw: number;
    battery_capacity_kwh: number;
  };
  hourly_dispatch: {
    hour: number;
    solar_generation_kw: number;
    wind_generation_kw: number;
    battery_charge_kw: number;
    battery_discharge_kw: number;
    battery_soc_kwh: number;
    grid_import_kw: number;
    curtailment_kw: number;
  }[];
  metrics: {
    total_capex: number;
    total_opex_annual: number;
    total_carbon_cost_annual: number;
    renewable_fraction: number;
    cost_savings_vs_grid_annual: number;
    co2_reduction_annual_kg: number;
    payback_period_months: number;
    npv: number;
    irr: number;
  };
  solver_info?: {
    solve_time_seconds: number;
    iterations?: number;
    gap?: number;
  };
}

// ============================================
// Data Quality & Validation
// ============================================

export interface DataQuality {
  solar: {
    available: boolean;
    source: string;
    hoursAvailable: number;
    dataGaps: number;
  };
  wind: {
    available: boolean;
    source: string;
    hoursAvailable: number;
    dataGaps: number;
  };
  hydro: {
    available: boolean;
    source: string;
    hoursAvailable: number;
    dataGaps: number;
  };
  cooling: {
    available: boolean;
    source: string;
    hoursAvailable: number;
    dataGaps: number;
  };
}

// ============================================
// Error Types
// ============================================

export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export class RenewableAPIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RenewableAPIError';
  }
}

// ============================================
// Configuration Types
// ============================================

export interface APIConfiguration {
  nrel: {
    apiKey: string;
    baseUrl: string;
    timeout: number;
  };
  openMeteo: {
    baseUrl: string;
    timeout: number;
  };
  nasa: {
    baseUrl: string;
    timeout: number;
  };
}

// ============================================
// Utility Types
// ============================================

export interface TimeRange {
  start: Date;
  end: Date;
  timezone: string;
}

export interface GeographicBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}
