import type { RegionResource } from "@/types"

export const REGION_RESOURCES: RegionResource[] = [
  { regionId: "us-west", solarCF: 0.24, windCF: 0.35, hydroCF: 0.45 },
  { regionId: "us-east", solarCF: 0.19, windCF: 0.32, hydroCF: 0.3 },
  { regionId: "eu-central", solarCF: 0.16, windCF: 0.33, hydroCF: 0.4 },
]
