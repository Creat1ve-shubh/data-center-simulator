"use client"

import type { TelemetryPoint } from "@/types"

export function SankeyEnergy({ data }: { data: TelemetryPoint[] }) {
  // Simple proportions based on average: IT vs Cooling vs Other
  const avgFacility = data.length ? data.reduce((a, b) => a + b.facility_energy_kWh, 0) / data.length : 0
  const avgIT = data.length ? data.reduce((a, b) => a + b.it_load_kW, 0) / data.length : 0
  const cooling = Math.max(0, avgFacility - avgIT) * 0.7
  const other = Math.max(0, avgFacility - avgIT) * 0.3

  const total = Math.max(1, avgFacility)
  const pct = (x: number) => Math.round((x / total) * 100)

  return (
    <div className="p-4">
      <p className="text-sm mb-2 text-neutral-300">Energy flow (avg)</p>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <div className="bg-teal-500 h-6 rounded" style={{ width: "100%" }} />
          <p className="text-xs text-neutral-400 mt-1">Facility (100%)</p>
        </div>
        <div className="flex-1">
          <div className="bg-green-500 h-6 rounded" style={{ width: `${(avgIT / total) * 100}%` }} />
          <p className="text-xs text-neutral-400 mt-1">IT ({pct(avgIT)}%)</p>
        </div>
        <div className="flex-1">
          <div className="bg-orange-500 h-6 rounded" style={{ width: `${(cooling / total) * 100}%` }} />
          <p className="text-xs text-neutral-400 mt-1">Cooling ({pct(cooling)}%)</p>
        </div>
        <div className="flex-1">
          <div className="bg-cyan-400 h-6 rounded" style={{ width: `${(other / total) * 100}%` }} />
          <p className="text-xs text-neutral-400 mt-1">Other ({pct(other)}%)</p>
        </div>
      </div>
    </div>
  )
}
