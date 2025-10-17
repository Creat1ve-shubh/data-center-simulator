"use client"

import { REGION_RESOURCES } from "@/lib/data/regions"
import type { RegionId } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  regionId: RegionId
}

export function RenewableSuggestion({ regionId }: Props) {
  const region = REGION_RESOURCES.find((r) => r.regionId === regionId)
  if (!region) return null

  const resources = [
    { name: "Solar", cf: region.solarCF, color: "bg-yellow-500" },
    { name: "Wind", cf: region.windCF, color: "bg-blue-500" },
    { name: "Hydro", cf: region.hydroCF, color: "bg-cyan-500" },
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
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-neutral-300">
          Based on <strong>{regionId}</strong> capacity factors:
        </p>
        <div className="space-y-3">
          {sorted.map((resource) => (
            <div key={resource.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{resource.name}</span>
                <span className="text-xs text-neutral-400">{(resource.cf * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className={`h-full ${resource.color}`} style={{ width: `${resource.cf * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-neutral-800 p-3 border border-neutral-700">
          <p className="text-xs text-neutral-400">Recommended mix:</p>
          <p className="text-sm font-medium text-teal-400 mt-1">{recommendation}</p>
        </div>
      </CardContent>
    </Card>
  )
}
