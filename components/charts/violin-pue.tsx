"use client"

import type { TelemetryPoint } from "@/types"

export function ViolinPUE({ data }: { data: TelemetryPoint[] }) {
  const buckets = new Map<number, number[]>()
  for (const d of data) {
    const pue = d.facility_energy_kWh > 0 && d.it_load_kW > 0 ? d.facility_energy_kWh / d.it_load_kW : Number.NaN
    if (!Number.isFinite(pue)) continue
    const h = d.time.getHours()
    const arr = buckets.get(h) ?? []
    arr.push(pue)
    buckets.set(h, arr)
  }
  const stats = Array.from(buckets.entries()).map(([hour, arr]) => {
    arr.sort((a, b) => a - b)
    const q1 = arr[Math.floor(arr.length * 0.25)] ?? Number.NaN
    const q2 = arr[Math.floor(arr.length * 0.5)] ?? Number.NaN
    const q3 = arr[Math.floor(arr.length * 0.75)] ?? Number.NaN
    return { hour, q1, q2, q3 }
  })

  return (
    <div className="p-3">
      <p className="text-sm mb-2 text-neutral-300">PUE distribution by hour</p>
      <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
        {stats.map((s) => (
          <div key={s.hour} className="rounded border border-neutral-800 bg-neutral-900 p-2">
            <p className="text-xs text-neutral-400">h{s.hour}</p>
            <div className="h-16 relative">
              <div
                className="absolute left-1/2 -translate-x-1/2 w-[2px] bg-teal-400"
                style={{ top: "10%", height: "80%" }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 bg-orange-500 w-2 h-2 rounded-full"
                style={{ top: `${50 - (s.q2 || 0) * 2}%` }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 bg-green-500 w-[6px] h-3 rounded"
                style={{ top: `${50 - (s.q1 || 0) * 2}%` }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 bg-green-500 w-[6px] h-3 rounded"
                style={{ top: `${50 - (s.q3 || 0) * 2}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
