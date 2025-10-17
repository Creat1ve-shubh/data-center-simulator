"use client"

import { useMemo } from "react"
import type { MetricSummaries } from "@/types"

type Props = {
  summaries: MetricSummaries | null
}

export function RadarBenchmark({ summaries }: Props) {
  // Industry benchmarks (typical values)
  const benchmarks = {
    pue: 1.5,
    cue: 0.4,
    wue: 1.5,
  }

  const normalized = useMemo(() => {
    if (!summaries) return null
    return {
      pue: Math.min(100, (benchmarks.pue / (summaries.pueAvg || 1)) * 100),
      cue: Math.min(100, (benchmarks.cue / (summaries.cueAvg || 1)) * 100),
      wue: Math.min(100, (benchmarks.wue / (summaries.wueAvg || 1)) * 100),
    }
  }, [summaries])

  if (!normalized) return <p className="text-neutral-400 text-sm">No data</p>

  const size = 200
  const center = size / 2
  const radius = 70
  const angles = [0, 120, 240].map((a) => (a * Math.PI) / 180)

  const points = [
    { label: "PUE", value: normalized.pue, angle: angles[0] },
    { label: "CUE", value: normalized.cue, angle: angles[1] },
    { label: "WUE", value: normalized.wue, angle: angles[2] },
  ]

  const getCoords = (value: number, angle: number) => {
    const r = (value / 100) * radius
    return {
      x: center + r * Math.cos(angle - Math.PI / 2),
      y: center + r * Math.sin(angle - Math.PI / 2),
    }
  }

  const polygonPoints = points
    .map((p) => {
      const coords = getCoords(p.value, p.angle)
      return `${coords.x},${coords.y}`
    })
    .join(" ")

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid circles */}
        {[25, 50, 75, 100].map((pct) => (
          <circle
            key={pct}
            cx={center}
            cy={center}
            r={(pct / 100) * radius}
            fill="none"
            stroke="#353b42"
            strokeWidth="1"
            opacity="0.5"
          />
        ))}

        {/* Axes */}
        {points.map((p) => {
          const end = getCoords(100, p.angle)
          return (
            <line
              key={`axis-${p.label}`}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#353b42"
              strokeWidth="1"
            />
          )
        })}

        {/* Data polygon */}
        <polygon points={polygonPoints} fill="#06b6d4" fillOpacity="0.2" stroke="#06b6d4" strokeWidth="2" />

        {/* Labels */}
        {points.map((p) => {
          const labelCoords = getCoords(120, p.angle)
          return (
            <text
              key={`label-${p.label}`}
              x={labelCoords.x}
              y={labelCoords.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-neutral-300"
            >
              {p.label}
            </text>
          )
        })}
      </svg>

      <div className="text-xs text-neutral-400 space-y-1">
        <p>
          <span className="text-neutral-300">PUE:</span> {summaries?.pueAvg?.toFixed(2)} vs benchmark {benchmarks.pue}
        </p>
        <p>
          <span className="text-neutral-300">CUE:</span> {summaries?.cueAvg?.toFixed(3)} vs benchmark {benchmarks.cue}
        </p>
        <p>
          <span className="text-neutral-300">WUE:</span> {summaries?.wueAvg?.toFixed(3)} vs benchmark {benchmarks.wue}
        </p>
      </div>
    </div>
  )
}
