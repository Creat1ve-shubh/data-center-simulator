import type { LcoeRow } from "@/types"

export const LCOE: LcoeRow[] = [
  { regionId: "us-west", tech: "solar", capexPerKW: 900, lcoePerKWh: 0.045 },
  { regionId: "us-west", tech: "wind", capexPerKW: 1400, lcoePerKWh: 0.038 },
  { regionId: "us-west", tech: "hydro", capexPerKW: 3000, lcoePerKWh: 0.06 },
  { regionId: "us-west", tech: "storage", capexPerKW: 500, lcoePerKWh: 0.12 },
  { regionId: "us-west", tech: "efficiency", capexPerKW: 800, lcoePerKWh: 0.0 },

  { regionId: "us-east", tech: "solar", capexPerKW: 1000, lcoePerKWh: 0.055 },
  { regionId: "us-east", tech: "wind", capexPerKW: 1500, lcoePerKWh: 0.04 },
  { regionId: "us-east", tech: "hydro", capexPerKW: 3200, lcoePerKWh: 0.065 },
  { regionId: "us-east", tech: "storage", capexPerKW: 520, lcoePerKWh: 0.13 },
  { regionId: "us-east", tech: "efficiency", capexPerKW: 900, lcoePerKWh: 0.0 },

  { regionId: "eu-central", tech: "solar", capexPerKW: 1100, lcoePerKWh: 0.06 },
  { regionId: "eu-central", tech: "wind", capexPerKW: 1600, lcoePerKWh: 0.042 },
  { regionId: "eu-central", tech: "hydro", capexPerKW: 3500, lcoePerKWh: 0.07 },
  { regionId: "eu-central", tech: "storage", capexPerKW: 540, lcoePerKWh: 0.14 },
  { regionId: "eu-central", tech: "efficiency", capexPerKW: 950, lcoePerKWh: 0.0 },
]
