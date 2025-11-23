/**
 * Renewable Energy API Service
 * Fetches real-time renewable energy data from multiple sources
 * - NREL NSRDB for solar data
 * - Open-Meteo for wind and hydro data
 * - NASA POWER for temperature/cooling data
 */

import type {
  LocationCoordinates,
  NRELSolarResponse,
  OpenMeteoWindResponse,
  OpenMeteoHydroResponse,
  NASAPowerResponse,
  HourlyEnergyData,
  DataQuality,
} from "../../types";
import { cacheGet, cacheSet } from "../cache/redis";
import {
  normalizedSolarOutput,
  normalizedWindOutput,
  hydroToPower,
  calculatePUE,
  gridCarbonIntensity,
  electricityPrice,
  fillDataGaps,
} from "../../utils/energy-conversions";
import { RenewableAPIError } from "../../types";

// ============================================
// Configuration
// ============================================

const CONFIG = {
  NREL_API_KEY: process.env.NREL_API_KEY || "",
  NREL_BASE_URL: "https://developer.nrel.gov/api",
  OPEN_METEO_BASE_URL: "https://api.open-meteo.com/v1",
  NASA_POWER_BASE_URL: "https://power.larc.nasa.gov/api/temporal",
  REQUEST_TIMEOUT: 30000, // 30 seconds
};

// ============================================
// NREL NSRDB API - Solar Data
// ============================================

/**
 * Fetch solar irradiance data from NREL NSRDB
 * Provides hourly solar radiation data
 */
export async function fetchNRELSolarData(
  coordinates: LocationCoordinates,
  startDate: Date,
  endDate: Date
): Promise<NRELSolarResponse> {
  if (!CONFIG.NREL_API_KEY) {
    throw new RenewableAPIError(
      "NREL_API_KEY_MISSING",
      "NREL API key is required. Set NREL_API_KEY environment variable."
    );
  }

  const { latitude, longitude } = coordinates;

  // Format dates for NREL API (YYYYMMDD)
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0].replace(/-/g, "");
  };

  const url = new URL(`${CONFIG.NREL_BASE_URL}/solar/nsrdb_psm3_download.json`);
  url.searchParams.append("api_key", CONFIG.NREL_API_KEY);
  url.searchParams.append("wkt", `POINT(${longitude} ${latitude})`);
  url.searchParams.append("names", formatDate(startDate));
  url.searchParams.append("interval", "60"); // Hourly data
  url.searchParams.append(
    "attributes",
    "ghi,dni,dhi,wind_speed,air_temperature"
  );

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CONFIG.REQUEST_TIMEOUT
    );

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new RenewableAPIError(
        "NREL_API_ERROR",
        `NREL API returned status ${response.status}`,
        { status: response.status, statusText: response.statusText }
      );
    }

    const data = await response.json();

    // NREL returns CSV-like data, parse it
    return parseNRELResponse(data);
  } catch (error) {
    if (error instanceof RenewableAPIError) throw error;

    throw new RenewableAPIError(
      "NREL_FETCH_ERROR",
      "Failed to fetch NREL solar data",
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

function parseNRELResponse(data: any): NRELSolarResponse {
  // NREL NSRDB returns data in a specific format
  // This is a simplified parser - adjust based on actual API response
  const outputs = data.outputs || {};

  return {
    outputs: {
      ghi: outputs.ghi || [],
      dni: outputs.dni || [],
      dhi: outputs.dhi || [],
      temp_air: outputs.air_temperature || [],
      wind_speed: outputs.wind_speed || [],
      timestamps: outputs.timestamps || [],
    },
  };
}

// ============================================
// Open-Meteo API - Wind Data
// ============================================

/**
 * Fetch wind speed data from Open-Meteo
 * Provides hourly wind forecasts and historical data
 */
export async function fetchOpenMeteoWindData(
  coordinates: LocationCoordinates,
  startDate: Date,
  endDate: Date
): Promise<OpenMeteoWindResponse> {
  const { latitude, longitude } = coordinates;

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const url = new URL(`${CONFIG.OPEN_METEO_BASE_URL}/forecast`);
  url.searchParams.append("latitude", latitude.toString());
  url.searchParams.append("longitude", longitude.toString());
  url.searchParams.append("start_date", formatDate(startDate));
  url.searchParams.append("end_date", formatDate(endDate));
  url.searchParams.append(
    "hourly",
    "wind_speed_10m,wind_speed_80m,wind_speed_100m,wind_direction_10m,temperature_2m"
  );
  url.searchParams.append("timezone", "auto");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CONFIG.REQUEST_TIMEOUT
    );

    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new RenewableAPIError(
        "OPEN_METEO_API_ERROR",
        `Open-Meteo API returned status ${response.status}`,
        { status: response.status }
      );
    }

    const data = await response.json();

    return {
      hourly: {
        time: data.hourly?.time || [],
        wind_speed_10m: data.hourly?.wind_speed_10m || [],
        wind_speed_80m: data.hourly?.wind_speed_80m || [],
        wind_speed_100m: data.hourly?.wind_speed_100m || [],
        wind_direction_10m: data.hourly?.wind_direction_10m || [],
        temperature_2m: data.hourly?.temperature_2m || [],
      },
    };
  } catch (error) {
    if (error instanceof RenewableAPIError) throw error;

    throw new RenewableAPIError(
      "OPEN_METEO_FETCH_ERROR",
      "Failed to fetch Open-Meteo wind data",
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

// ============================================
// Open-Meteo Hydrology API - Hydro Data
// ============================================

/**
 * Fetch river discharge data from Open-Meteo Hydrology API
 */
export async function fetchOpenMeteoHydroData(
  coordinates: LocationCoordinates,
  startDate: Date,
  endDate: Date
): Promise<OpenMeteoHydroResponse> {
  const { latitude, longitude } = coordinates;

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // Note: Open-Meteo may not have hydro data for all locations
  const url = new URL(`${CONFIG.OPEN_METEO_BASE_URL}/flood`);
  url.searchParams.append("latitude", latitude.toString());
  url.searchParams.append("longitude", longitude.toString());
  url.searchParams.append("start_date", formatDate(startDate));
  url.searchParams.append("end_date", formatDate(endDate));
  url.searchParams.append("hourly", "river_discharge");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CONFIG.REQUEST_TIMEOUT
    );

    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Hydro data might not be available for all locations
      console.warn(`Open-Meteo Hydro API returned status ${response.status}`);
      return { hourly: { time: [], river_discharge: [] } };
    }

    const data = await response.json();

    return {
      hourly: {
        time: data.hourly?.time || [],
        river_discharge: data.hourly?.river_discharge || [],
        precipitation: data.hourly?.precipitation || [],
        soil_moisture: data.hourly?.soil_moisture || [],
      },
    };
  } catch (error) {
    console.warn("Failed to fetch hydro data:", error);
    // Return empty data instead of throwing - hydro is optional
    return { hourly: { time: [], river_discharge: [] } };
  }
}

// ============================================
// NASA POWER API - Temperature/Cooling Data
// ============================================

/**
 * Fetch temperature and meteorological data from NASA POWER
 * Used for PUE cooling calculations
 */
export async function fetchNASAPowerData(
  coordinates: LocationCoordinates,
  startDate: Date,
  endDate: Date
): Promise<NASAPowerResponse> {
  const { latitude, longitude } = coordinates;

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  const url = new URL(`${CONFIG.NASA_POWER_BASE_URL}/hourly/point`);
  url.searchParams.append("parameters", "T2M,WS10M,ALLSKY_SFC_SW_DWN,RH2M");
  url.searchParams.append("community", "RE");
  url.searchParams.append("longitude", longitude.toString());
  url.searchParams.append("latitude", latitude.toString());
  url.searchParams.append("start", formatDate(startDate));
  url.searchParams.append("end", formatDate(endDate));
  url.searchParams.append("format", "JSON");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CONFIG.REQUEST_TIMEOUT
    );

    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new RenewableAPIError(
        "NASA_POWER_API_ERROR",
        `NASA POWER API returned status ${response.status}`,
        { status: response.status }
      );
    }

    const data = await response.json();
    return data as NASAPowerResponse;
  } catch (error) {
    if (error instanceof RenewableAPIError) throw error;

    throw new RenewableAPIError(
      "NASA_POWER_FETCH_ERROR",
      "Failed to fetch NASA POWER data",
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

// ============================================
// Data Normalization and Integration
// ============================================

/**
 * Fetch and normalize all renewable energy data
 * Combines data from all APIs into a unified hourly dataset
 */
export async function fetchAllRenewableData(
  coordinates: LocationCoordinates,
  startDate: Date = new Date(new Date().getFullYear(), 0, 1), // Default: start of current year
  endDate: Date = new Date() // Default: now
): Promise<{ data: HourlyEnergyData[]; quality: DataQuality }> {
  console.log(
    `Fetching renewable data for coordinates: ${coordinates.latitude}, ${coordinates.longitude}`
  );

  // Caching layer
  const cacheKey = `renewables:${coordinates.latitude.toFixed(4)}:${coordinates.longitude.toFixed(4)}:${startDate.toISOString().slice(0, 10)}:${endDate.toISOString().slice(0, 10)}`;
  const cached = await cacheGet<{
    data: HourlyEnergyData[];
    quality: DataQuality;
  }>(cacheKey);
  if (cached) {
    console.log("[Renewables] Cache hit", cacheKey);
    return cached;
  }
  console.log("[Renewables] Cache miss", cacheKey);

  // Fetch data from all sources in parallel
  const [solarData, windData, hydroData, nasaData] = await Promise.allSettled([
    fetchNRELSolarData(coordinates, startDate, endDate),
    fetchOpenMeteoWindData(coordinates, startDate, endDate),
    fetchOpenMeteoHydroData(coordinates, startDate, endDate),
    fetchNASAPowerData(coordinates, startDate, endDate),
  ]);

  // Track data quality
  const quality: DataQuality = {
    solar: {
      available: solarData.status === "fulfilled",
      source: "NREL NSRDB",
      hoursAvailable:
        solarData.status === "fulfilled"
          ? solarData.value.outputs.ghi?.length || 0
          : 0,
      dataGaps: 0,
    },
    wind: {
      available: windData.status === "fulfilled",
      source: "Open-Meteo",
      hoursAvailable:
        windData.status === "fulfilled"
          ? windData.value.hourly.wind_speed_80m?.length || 0
          : 0,
      dataGaps: 0,
    },
    hydro: {
      available:
        hydroData.status === "fulfilled" &&
        (hydroData.value.hourly.river_discharge?.length || 0) > 0,
      source: "Open-Meteo Hydrology",
      hoursAvailable:
        hydroData.status === "fulfilled"
          ? hydroData.value.hourly.river_discharge?.length || 0
          : 0,
      dataGaps: 0,
    },
    cooling: {
      available: nasaData.status === "fulfilled",
      source: "NASA POWER",
      hoursAvailable:
        nasaData.status === "fulfilled"
          ? Object.keys(nasaData.value.properties.parameter.T2M || {}).length
          : 0,
      dataGaps: 0,
    },
  };

  // Normalize and combine data
  let normalizedData = normalizeAndCombineData(
    solarData.status === "fulfilled" ? solarData.value : null,
    windData.status === "fulfilled" ? windData.value : null,
    hydroData.status === "fulfilled" ? hydroData.value : null,
    nasaData.status === "fulfilled" ? nasaData.value : null,
    coordinates
  );

  // Synthetic fallback: if both solar and wind are unavailable or all-zero, generate heuristic dataset
  const hasSolar =
    quality.solar.available && (quality.solar.hoursAvailable || 0) > 0;
  const hasWind =
    quality.wind.available && (quality.wind.hoursAvailable || 0) > 0;

  const energySum = normalizedData.reduce(
    (sum, h) =>
      sum +
      (h.solar.pv_output_kw_per_kw || 0) +
      (h.wind.power_output_kw_per_kw || 0),
    0
  );

  if ((!hasSolar && !hasWind) || energySum === 0) {
    console.warn(
      "[Renewables] No usable solar/wind data from APIs. Generating synthetic fallback dataset."
    );
    normalizedData = generateSyntheticEnergyData(
      coordinates,
      startDate,
      endDate
    );
    // Update quality flags to indicate synthetic
    quality.solar.available = true;
    quality.solar.source = "synthetic";
    quality.solar.hoursAvailable = normalizedData.length;
    quality.wind.available = true;
    quality.wind.source = "synthetic";
    quality.wind.hoursAvailable = normalizedData.length;
    quality.cooling.available = true;
    quality.cooling.source = quality.cooling.source || "synthetic";
    quality.cooling.hoursAvailable = normalizedData.length;
  }

  // Store in cache (non-blocking)
  cacheSet(cacheKey, { data: normalizedData, quality }).catch((e) =>
    console.warn("[Renewables] Cache set failed:", (e as any).message)
  );
  return { data: normalizedData, quality };
}

/**
 * Normalize and combine data from all sources into hourly format
 */
function normalizeAndCombineData(
  solar: NRELSolarResponse | null,
  wind: OpenMeteoWindResponse | null,
  hydro: OpenMeteoHydroResponse | null,
  nasa: NASAPowerResponse | null,
  coordinates: LocationCoordinates
): HourlyEnergyData[] {
  const hourlyData: HourlyEnergyData[] = [];

  // Determine the number of hours (use wind data as primary since it's most likely to have data)
  const numHours = wind?.hourly.time.length || 8760; // Default to 1 year

  // Default values for missing data
  const defaultGridCarbonIntensity = 400; // gCO2/kWh (global average)
  const defaultGridPrice = 0.12; // USD/kWh (US average)
  const defaultLoad = 1000; // kW (typical data center)

  for (let hour = 0; hour < numHours; hour++) {
    const timestamp = wind?.hourly.time[hour] || new Date().toISOString();
    const hourOfDay = new Date(timestamp).getHours();

    // Extract solar data
    const solarIrradiance = solar?.outputs.ghi?.[hour] || 0;
    const solarTemp =
      solar?.outputs.temp_air?.[hour] ||
      nasa?.properties.parameter.T2M?.[timestamp] ||
      25;
    const pvOutput = normalizedSolarOutput(solarIrradiance, solarTemp);

    // Extract wind data (prefer 80m height for turbines)
    const windSpeed =
      wind?.hourly.wind_speed_80m?.[hour] ||
      wind?.hourly.wind_speed_10m?.[hour] ||
      0;
    const windDirection = wind?.hourly.wind_direction_10m?.[hour];
    const windOutput = normalizedWindOutput(windSpeed);

    // Extract hydro data
    const discharge = hydro?.hourly.river_discharge?.[hour] || 0;
    const hydroOutput = hydroToPower(discharge);

    // Extract temperature for cooling
    const outdoorTemp = wind?.hourly.temperature_2m?.[hour] || solarTemp;
    const pue = calculatePUE(outdoorTemp, defaultLoad);

    // Calculate grid data
    const carbonIntensity = gridCarbonIntensity(
      defaultGridCarbonIntensity,
      hourOfDay
    );
    const price = electricityPrice(defaultGridPrice, hourOfDay);

    hourlyData.push({
      hour,
      timestamp,
      solar: {
        irradiance_w_m2: solarIrradiance,
        pv_output_kw_per_kw: pvOutput,
        temperature_c: solarTemp,
      },
      wind: {
        speed_m_s: windSpeed,
        power_output_kw_per_kw: windOutput,
        direction_deg: windDirection,
      },
      hydro: {
        discharge_m3_s: discharge,
        power_output_kw: hydroOutput,
      },
      cooling: {
        outdoor_temp_c: outdoorTemp,
        pue_factor: pue,
      },
      grid: {
        carbon_intensity_g_co2_kwh: carbonIntensity,
        price_usd_kwh: price,
      },
      load: {
        demand_kw: defaultLoad,
      },
    });
  }

  return hourlyData;
}

/**
 * Generate a synthetic hourly dataset when external APIs are unavailable.
 * Uses simple diurnal/seasonal heuristics based on latitude.
 */
function generateSyntheticEnergyData(
  coordinates: LocationCoordinates,
  startDate: Date,
  endDate: Date
): HourlyEnergyData[] {
  const hours =
    Math.max(
      1,
      Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))
    ) || 8760;
  const lat = coordinates.latitude;
  const defaultLoad = 1000;

  const data: HourlyEnergyData[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < hours; i++) {
    const t = new Date(start.getTime() + i * 3600_000);
    const hour = i;
    const hourOfDay = t.getHours();
    const dayOfYear = Math.floor(
      (Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) -
        Date.UTC(t.getUTCFullYear(), 0, 0)) /
        86400000
    );

    // Seasonal factor (hemisphere-aware)
    const seasonal =
      0.7 + 0.3 * Math.cos(((dayOfYear - 172) / 365) * 2 * Math.PI);

    // Solar irradiance: simple bell curve between 6am-18pm
    const daylight = hourOfDay >= 6 && hourOfDay <= 18;
    const solarAngle = daylight ? (Math.PI * (hourOfDay - 6)) / 12 : 0; // 0..π across daylight window
    const ghi = daylight
      ? 900 * Math.sin(Math.max(0, solarAngle)) * seasonal
      : 0; // W/m^2

    // Temperature model: base 18C +/- seasonal 8C +/- diurnal 5C (lat adjustment)
    const baseTemp = 18 - Math.abs(lat) * 0.05; // cooler for higher latitudes
    const tempSeasonal = 8 * Math.cos(((dayOfYear - 172) / 365) * 2 * Math.PI);
    const tempDiurnal = 5 * Math.sin(((hourOfDay - 14) / 24) * 2 * Math.PI);
    const tempC = baseTemp + tempSeasonal + tempDiurnal;

    // Wind speed: base 6 m/s with diurnal and random variations
    const windBase =
      6 +
      1.5 * Math.sin(((hourOfDay - 16) / 24) * 2 * Math.PI) +
      0.5 * Math.cos((dayOfYear / 365) * 2 * Math.PI);
    const windSpeed = Math.max(0, windBase + Math.sin(i * 0.1) * 0.8);

    // Use existing converters
    const pv_per_kw = normalizedSolarOutput(ghi, tempC); // kW per kW
    const wind_per_kw = normalizedWindOutput(windSpeed); // kW per kW
    const pue = calculatePUE(tempC, defaultLoad);

    // Grid parameters
    const carbon = gridCarbonIntensity(400, hourOfDay);
    const price = electricityPrice(0.12, hourOfDay);

    data.push({
      hour,
      timestamp: t.toISOString(),
      solar: {
        irradiance_w_m2: ghi,
        pv_output_kw_per_kw: pv_per_kw,
        temperature_c: tempC,
      },
      wind: {
        speed_m_s: windSpeed,
        power_output_kw_per_kw: wind_per_kw,
        direction_deg: undefined,
      },
      hydro: {
        discharge_m3_s: 0,
        power_output_kw: 0,
      },
      cooling: {
        outdoor_temp_c: tempC,
        pue_factor: pue,
      },
      grid: {
        carbon_intensity_g_co2_kwh: carbon,
        price_usd_kwh: price,
      },
      load: {
        demand_kw: defaultLoad,
      },
    });
  }

  return data;
}

// Export configuration for testing
export { CONFIG };
