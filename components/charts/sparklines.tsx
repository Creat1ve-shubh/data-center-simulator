"use client"

import type { TelemetryPoint } from "@/types"

function BaseSpark({
  values,
  color,
  width = 160,
  height = 40,
}: { values: number[]; color: string; width?: number; height?: number }) {
  const max = Math.max(1, ...values)
  const min = Math.min(0, ...values)
  const w = width
  const h = height
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * w
      const y = h - ((v - min) / Math.max(1, max - min)) * h
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg width={w} height={h}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} />
    </svg>
  )
}

export function Sparkline({
  values,
  accent = "#06b6d4",
  bg = "#1a1f24",
  width = 160,
  height = 40,
}: {
  values: number[]
  accent?: string
  bg?: string
  width?: number
  height?: number
}) {
  return (
    <div className="rounded-md" style={{ backgroundColor: bg }}>
      <BaseSpark values={values} color={accent} width={width} height={height} />
    </div>
  )
}

export function Sparklines({ data }: { data: TelemetryPoint[] }) {
  const pue = data.map((d) =>
    d.facility_energy_kWh > 0 && d.it_load_kW > 0 ? d.facility_energy_kWh / d.it_load_kW : 0,
  )
  const it = data.map((d) => d.it_load_kW)
  const water = data.map((d) => d.water_liters ?? 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
        <p className="text-xs text-neutral-400 mb-1">PUE trend</p>
        <Sparkline values={pue} accent="#06b6d4" />
      </div>
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
        <p className="text-xs text-neutral-400 mb-1">IT Load</p>
        <Sparkline values={it} accent="#22c55e" />
      </div>
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
        <p className="text-xs text-neutral-400 mb-1">Water usage</p>
        <Sparkline values={water} accent="#f59e0b" />
      </div>
    </div>
  )
}
