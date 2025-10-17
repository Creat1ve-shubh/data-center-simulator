"use client"

import { REGION_RESOURCES } from "@/lib/data/regions"
import type { RegionId } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  regionId: RegionId
}

// Environmental data for each region (simplified)
const ENVIRONMENTAL_DATA: Record<RegionId, { sunlight: number; water: number; wind: number; description: string }> = {
  "us-west": {
    sunlight: 85,
    water: 60,
    wind: 70,
    description: "High solar potential with moderate wind and water resources",
  },
  "us-east": {
    sunlight: 65,
    water: 75,
    wind: 65,
    description: "Balanced renewable resources with good water availability",
  },
  "eu-central": {
    sunlight: 55,
    water: 70,
    wind: 80,
    description: "Strong wind potential with moderate solar and hydro resources",
  },
}

export function RenewableSuggestion({ regionId }: Props) {
  const region = REGION_RESOURCES.find((r) => r.regionId === regionId)
  const envData = ENVIRONMENTAL_DATA[regionId]

  if (!region || !envData) return null

  const resources = [
    {
      name: "Solar",
      cf: region.solarCF,
      color: "bg-yellow-500",
      icon: "☀️",
      envFactor: envData.sunlight,
      description: "Photovoltaic panels convert sunlight to electricity",
    },
    {
      name: "Wind",
      cf: region.windCF,
      color: "bg-blue-500",
      icon: "💨",
      envFactor: envData.wind,
      description: "Wind turbines harness kinetic energy from wind",
    },
    {
      name: "Hydro",
      cf: region.hydroCF,
      color: "bg-cyan-500",
      icon: "💧",
      envFactor: envData.water,
      description: "Hydroelectric systems use water flow for power",
    },
  ]

  const sorted = [...resources].sort((a, b) => b.cf - a.cf)
  const recommendation = sorted
    .slice(0, 2)
    .map((r) => r.name)
    .join(" + ")

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-sm">Renewable Mix Recommendation</CardTitle>
        <p className="text-xs text-neutral-400 mt-1">{envData.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {sorted.map((resource) => (
            <div key={resource.name} className="rounded-lg bg-neutral-800 p-3 border border-neutral-700">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{resource.icon}</span>
                  <div>
                    <p className="text-xs font-medium">{resource.name}</p>
                    <p className="text-xs text-neutral-500">{resource.description}</p>
                  </div>
                </div>
              </div>

              {/* Capacity Factor */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-neutral-400">Capacity Factor</span>
                  <span className="text-xs font-medium text-teal-400">{(resource.cf * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                  <div className={`h-full ${resource.color}`} style={{ width: `${resource.cf * 100}%` }} />
                </div>
              </div>

              {/* Environmental Factor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-neutral-400">Local Availability</span>
                  <span className="text-xs font-medium text-green-400">{resource.envFactor}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${resource.envFactor}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendation Box */}
        <div className="rounded-lg bg-gradient-to-r from-teal-900 to-neutral-800 p-3 border border-teal-700">
          <p className="text-xs text-neutral-300 mb-1">Recommended Primary Mix:</p>
          <p className="text-sm font-bold text-teal-300">{recommendation}</p>
          <p className="text-xs text-neutral-400 mt-2">
            This combination maximizes energy generation based on your region's natural resources and capacity factors.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
