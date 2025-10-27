/**
 * Real Data Integration Module
 * Generates realistic telemetry data based on location profiles
 * and real-world patterns (solar, wind, temperature, grid carbon)
 */

import type { EnhancedTelemetryPoint, LocationProfile, WeatherData, GridData, WorkloadTrace, Region } from "@/types"
import { calculateDynamicPUE } from "./energy-model"

// Location profiles for 5 case study regions
export const LOCATION_PROFILES: Record<string, LocationProfile> = {
  jaipur: {
    name: "Jaipur, India",
    latitude: 26.9,
    longitude: 75.8,
    region: "us-west", // Placeholder region
    timezone: "IST",
    typical_outdoor_temp_c: 28,
    solar_cf_annual: 0.22,
    wind_cf_annual: 0.15,
  },
  hamburg: {
    name: "Hamburg, Germany",
    latitude: 53.5,
    longitude: 10.0,
    region: "eu-central",
    timezone: "CET",
    typical_outdoor_temp_c: 9,
    solar_cf_annual: 0.11,
    wind_cf_annual: 0.28,
  },
  oslo: {
    name: "Oslo, Norway",
    latitude: 59.9,
    longitude: 10.8,
    region: "eu-central",
    timezone: "CET",
    typical_outdoor_temp_c: 6,
    solar_cf_annual: 0.09,
    wind_cf_annual: 0.32,
  },
  california: {
    name: "California, USA",
    latitude: 37.5,
    longitude: -120.5,
    region: "us-west",
    timezone: "PST",
    typical_outdoor_temp_c: 18,
    solar_cf_annual: 0.25,
    wind_cf_annual: 0.22,
  },
  newyork: {
    name: "New York, USA",
    latitude: 40.7,
    longitude: -74.0,
    region: "us-east",
    timezone: "EST",
    typical_outdoor_temp_c: 12,
    solar_cf_annual: 0.15,
    wind_cf_annual: 0.18,
  },
}

/**
 * Generate realistic weather data for a location
 * Uses sinusoidal patterns to simulate seasonal and daily variations
 */
export function generateWeatherData(location: LocationProfile, timestamp: Date, days_offset = 0): WeatherData {
  const day_of_year =
    Math.floor((timestamp.getTime() + days_offset * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000)) % 365
  const hour_of_day = timestamp.getHours()

  // Seasonal temperature variation
  const seasonal_temp = location.typical_outdoor_temp_c + 15 * Math.sin((day_of_year / 365) * 2 * Math.PI - Math.PI / 2)

  // Daily temperature variation (cooler at night, warmer during day)
  const daily_temp_variation = 8 * Math.sin((hour_of_day / 24) * 2 * Math.PI - Math.PI / 2)
  const temperature_c = seasonal_temp + daily_temp_variation

  // Solar irradiance: peaks at noon, zero at night
  const solar_irradiance_w_m2 = Math.max(
    0,
    800 * Math.sin((hour_of_day / 24) * Math.PI) * (1 + 0.3 * Math.sin((day_of_year / 365) * 2 * Math.PI)),
  )

  // Wind speed: varies throughout day, higher at certain hours
  const wind_speed_m_s = 5 + 3 * Math.sin((hour_of_day / 24) * 2 * Math.PI) + 2 * Math.random()

  // Cloud cover: random variation
  const cloud_cover_pct = Math.max(
    0,
    Math.min(100, 40 + 30 * Math.sin((day_of_year / 365) * 2 * Math.PI) + 20 * Math.random()),
  )

  return {
    timestamp,
    temperature_c,
    solar_irradiance_w_m2,
    wind_speed_m_s,
    cloud_cover_pct,
  }
}

/**
 * Generate realistic grid carbon intensity data
 * Varies by region and time of day
 */
export function generateGridData(location: LocationProfile, timestamp: Date): GridData {
  const hour_of_day = timestamp.getHours()

  // Regional baseline carbon intensity
  const regional_baseline: Record<string, number> = {
    "us-west": 250, // California: cleaner grid
    "us-east": 350, // New York: moderate
    "eu-central": 300, // Europe: moderate
  }

  const baseline = regional_baseline[location.region] || 300

  // Peak hours (8am-6pm) have higher carbon intensity due to demand
  const peak_factor = hour_of_day >= 8 && hour_of_day < 18 ? 1.3 : 0.8
  const carbon_intensity = baseline * peak_factor

  // Electricity price: higher during peak hours
  const base_price = 0.12
  const peak_price_factor = hour_of_day >= 8 && hour_of_day < 18 ? 1.5 : 0.7
  const electricity_price_usd_kwh = base_price * peak_price_factor

  return {
    timestamp,
    carbon_intensity_g_co2_kwh: carbon_intensity,
    electricity_price_usd_kwh,
  }
}

/**
 * Generate realistic workload trace
 * Simulates typical data center workload patterns
 */
export function generateWorkloadTrace(timestamp: Date, base_load_kw = 1200): WorkloadTrace {
  const hour_of_day = timestamp.getHours()
  const day_of_week = timestamp.getDay()

  // Higher load during business hours (9am-5pm)
  const business_hours_factor = hour_of_day >= 9 && hour_of_day < 17 ? 1.2 : 0.8

  // Lower load on weekends
  const weekend_factor = day_of_week === 0 || day_of_week === 6 ? 0.7 : 1.0

  // Random variation
  const random_variation = 0.9 + 0.2 * Math.random()

  const cpu_utilization_pct = Math.max(20, Math.min(95, 50 * business_hours_factor * weekend_factor * random_variation))
  const memory_utilization_pct = Math.max(
    30,
    Math.min(90, 60 * business_hours_factor * weekend_factor * random_variation),
  )
  const storage_utilization_pct = 70 + 10 * Math.random()

  return {
    timestamp,
    cpu_utilization_pct,
    memory_utilization_pct,
    storage_utilization_pct,
  }
}

/**
 * Generate enhanced telemetry with real data patterns
 */
export function generateEnhancedTelemetry(
  location: LocationProfile,
  base_it_load_kw = 1200,
  num_hours = 24,
): EnhancedTelemetryPoint[] {
  const points: EnhancedTelemetryPoint[] = []
  const now = new Date()

  for (let i = 0; i < num_hours; i++) {
    const timestamp = new Date(now.getTime() - (num_hours - i) * 60 * 60 * 1000)
    const hour_of_day = timestamp.getHours()

    // Get real data patterns
    const weather = generateWeatherData(location, timestamp)
    const grid = generateGridData(location, timestamp)
    const workload = generateWorkloadTrace(timestamp, base_it_load_kw)

    // Calculate IT load from workload utilization
    const it_load_kw = base_it_load_kw * (workload.cpu_utilization_pct / 100)

    // Calculate dynamic PUE based on temperature
    const energy_model = calculateDynamicPUE(it_load_kw, weather.temperature_c, hour_of_day)

    // Calculate facility energy from PUE
    const facility_energy_kWh = energy_model.total_facility_power_kw

    // Calculate emissions
    const emissions_kgCO2 = (facility_energy_kWh * grid.carbon_intensity_g_co2_kwh) / 1000

    // Calculate renewable percentage based on solar and wind availability
    const solar_cf = Math.max(0, weather.solar_irradiance_w_m2 / 1000) * location.solar_cf_annual
    const wind_cf = Math.max(0, weather.wind_speed_m_s / 12) * location.wind_cf_annual
    const renewable_pct = Math.min(1, solar_cf + wind_cf)

    // Water usage (typical: 1.8 liters per kWh)
    const water_liters = facility_energy_kWh * 1.8

    points.push({
      time: timestamp,
      it_load_kW: it_load_kw,
      facility_energy_kWh,
      water_liters,
      emissions_kgCO2,
      temperature_c: weather.temperature_c,
      solar_irradiance_w_m2: weather.solar_irradiance_w_m2,
      wind_speed_m_s: weather.wind_speed_m_s,
      grid_carbon_intensity_g_co2_kwh: grid.carbon_intensity_g_co2_kwh,
      electricity_price_usd_kwh: grid.electricity_price_usd_kwh,
      pue_dynamic: energy_model.pue,
      dcue: energy_model.dcue,
      renewable_pct,
      solar_pct: solar_cf,
      wind_pct: wind_cf,
      hydro_pct: 0, // Not modeled in this version
    })
  }

  return points
}

export function generateRealDataset(location: LocationProfile | Region, days: number): EnhancedTelemetryPoint[] {
  // Handle both LocationProfile and Region types
  let profile: LocationProfile

  if ("latitude" in location) {
    profile = location as LocationProfile
  } else {
    // Convert Region to LocationProfile
    const regionName = (location as Region).name.toLowerCase()
    profile = LOCATION_PROFILES[regionName] || LOCATION_PROFILES.california
  }

  const hours = days * 24
  return generateEnhancedTelemetry(profile, 1200, hours)
}

export interface LocationDataset {
  itLoadKw: number
  solarIrradianceWm2: number
  windSpeedMs: number
  gridPriceUsdKwh: number
  gridCarbonGco2Kwh: number
}

export function generateLocationDataset(location: string, hours: number): LocationDataset[] {
  const profile = LOCATION_PROFILES[location as keyof typeof LOCATION_PROFILES] || LOCATION_PROFILES.california
  const telemetry = generateEnhancedTelemetry(profile, 1200, hours)

  return telemetry.map((point) => ({
    itLoadKw: point.it_load_kW,
    solarIrradianceWm2: point.solar_irradiance_w_m2,
    windSpeedMs: point.wind_speed_m_s,
    gridPriceUsdKwh: point.electricity_price_usd_kwh,
    gridCarbonGco2Kwh: point.grid_carbon_intensity_g_co2_kwh,
  }))
}
