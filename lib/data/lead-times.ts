import type { LeadTimeRow } from "@/types"

export const LEAD_TIMES: LeadTimeRow[] = [
  { regionId: "us-west", tech: "solar", months: 6 },
  { regionId: "us-west", tech: "wind", months: 10 },
  { regionId: "us-west", tech: "hydro", months: 18 },
  { regionId: "us-west", tech: "storage", months: 5 },
  { regionId: "us-west", tech: "efficiency", months: 3 },

  { regionId: "us-east", tech: "solar", months: 7 },
  { regionId: "us-east", tech: "wind", months: 11 },
  { regionId: "us-east", tech: "hydro", months: 20 },
  { regionId: "us-east", tech: "storage", months: 6 },
  { regionId: "us-east", tech: "efficiency", months: 3 },

  { regionId: "eu-central", tech: "solar", months: 8 },
  { regionId: "eu-central", tech: "wind", months: 12 },
  { regionId: "eu-central", tech: "hydro", months: 24 },
  { regionId: "eu-central", tech: "storage", months: 6 },
  { regionId: "eu-central", tech: "efficiency", months: 4 },
]
