"use client"

import { useMemo } from "react"
import type { TelemetryPoint } from "@/types"
import { TrendingUp, TrendingDown } from "lucide-react"

type Props = {
  label: string
  value: number
  unit: string
  telemetry: TelemetryPoint[]
  metricFn: (t: TelemetryPoint) => number | null
}

export function MetricCardWithTrend({ label, value, unit, telemetry, metricFn }: Props) {
  const trend = useMemo(() => {
    if (telemetry.length < 2) return null
    const mid = Math.floor(telemetry.length / 2)
    const first = telemetry
      .slice(0, mid)
      .map(metricFn)
      .filter((v) => v !== null) as number[]
    const last = telemetry
      .slice(mid)
      .map(metricFn)
      .filter((v) => v !== null) as number[]
    if (!first.length || !last.length) return null
    const avgFirst = first.reduce((a, b) => a + b) / first.length
    const avgLast = last.reduce((a, b) => a + b) / last.length
    const pctChange = ((avgLast - avgFirst) / avgFirst) * 100
    return { pctChange, isImproving: pctChange < 0 }
  }, [telemetry, metricFn])

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-sm text-neutral-400">{label}</p>
      <div className="flex items-end justify-between mt-2">
        <p className="text-2xl font-semibold">
          {value.toFixed(2)}
          <span className="text-sm text-neutral-400 ml-1">{unit}</span>
        </p>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs ${trend.isImproving ? "text-green-400" : "text-orange-400"}`}
          >
            {trend.isImproving ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            <span>{Math.abs(trend.pctChange).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
