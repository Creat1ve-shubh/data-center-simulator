import type { RegionResource, Region, LCOEData } from "@/types"

export const REGION_RESOURCES: RegionResource[] = [
  { regionId: "us-west", solarCF: 0.24, windCF: 0.35, hydroCF: 0.45 },
  { regionId: "us-east", solarCF: 0.19, windCF: 0.32, hydroCF: 0.3 },
  { regionId: "eu-central", solarCF: 0.16, windCF: 0.33, hydroCF: 0.4 },
]

export const REGIONS: Region[] = [
  {
    name: "California",
    latitude: 36.7783,
    longitude: -119.4179,
    capacityFactors: { solar: 0.24, wind: 0.35, hydro: 0.45 },
    timezone: "America/Los_Angeles",
  },
  {
    name: "New York",
    latitude: 40.7128,
    longitude: -74.006,
    capacityFactors: { solar: 0.19, wind: 0.32, hydro: 0.3 },
    timezone: "America/New_York",
  },
  {
    name: "Hamburg",
    latitude: 53.5511,
    longitude: 9.9937,
    capacityFactors: { solar: 0.16, wind: 0.33, hydro: 0.4 },
    timezone: "Europe/Berlin",
  },
  {
    name: "Jaipur",
    latitude: 26.9124,
    longitude: 75.7873,
    capacityFactors: { solar: 0.28, wind: 0.25, hydro: 0.2 },
    timezone: "Asia/Kolkata",
  },
  {
    name: "Oslo",
    latitude: 59.9139,
    longitude: 10.7522,
    capacityFactors: { solar: 0.12, wind: 0.4, hydro: 0.55 },
    timezone: "Europe/Oslo",
  },
]

export const LCOE_DATA: LCOEData = {
  solar: 1200, // $/kW
  wind: 1500, // $/kW
  hydro: 2000, // $/kW
  battery: 300, // $/kWh
}
