"use client"

import type { MetricSummaries } from "@/types"

export function SustainabilityScore({ summaries }: { summaries: MetricSummaries | null }) {
  // Simple equal-weight normalization to [0..100] where lower PUE/CUE/WUE are better
  const pue = summaries?.pueAvg ?? Number.NaN
  const cue = summaries?.cueAvg ?? Number.NaN
  const wue = summaries?.wueAvg ?? Number.NaN

  const norm = (v: number, min: number, max: number) => {
    if (!Number.isFinite(v)) return 0
    const clamped = Math.max(min, Math.min(max, v))
    // invert so lower is better => higher score
    const s = 1 - (clamped - min) / (max - min)
    return Math.round(s * 100)
  }

  const pueScore = norm(pue, 1.1, 2.0)
  const cueScore = norm(cue, 0.1, 0.8)
  const wueScore = norm(wue, 0.2, 2.0)
  const finalScore = Math.round((pueScore + cueScore + wueScore) / 3)

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-sm text-neutral-400">Sustainability Score</p>
      <p className="text-3xl font-semibold">{Number.isFinite(finalScore) ? finalScore : "--"}</p>
      <div className="text-xs text-neutral-400 mt-1">
        PUE {pueScore} • CUE {cueScore} • WUE {wueScore}
      </div>
    </div>
  )
}
