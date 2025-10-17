"use client"

import type { TelemetryPoint } from "@/types"

export function ParetoInefficiency({ data }: { data: TelemetryPoint[] }) {
  const byHour = new Map<number, number>()
  for (const d of data) {
    const overhead = Math.max(0, d.facility_energy_kWh - d.it_load_kW)
    byHour.set(d.time.getHours(), (byHour.get(d.time.getHours()) ?? 0) + overhead)
  }
  const rows = Array.from(byHour.entries())
    .map(([h, val]) => ({ label: `h${h}`, val }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 6)

  const max = Math.max(1, ...rows.map((r) => r.val))
  return (
    <div className="p-3">
      <p className="text-sm mb-2 text-neutral-300">Pareto: hours with highest overhead</p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <div className="w-10 text-xs text-neutral-400">{r.label}</div>
            <div className="flex-1 h-3 bg-neutral-800 rounded">
              <div className="h-3 bg-orange-500 rounded" style={{ width: `${(r.val / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
