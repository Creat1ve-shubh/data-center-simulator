"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Activity, Leaf, Zap } from "lucide-react"

interface EfficiencyGaugesProps {
  pue: number
  cue: number
  wue: number
  renewablePct: number
}

export function EfficiencyGauges({ pue, cue, wue, renewablePct }: EfficiencyGaugesProps) {
  // Calculate efficiency score (0-100)
  const efficiencyScore = Math.max(0, Math.min(100, (2 - pue) * 50)) // PUE of 1.0 = 100, 2.0 = 0

  // Calculate sustainability index (0-100)
  const sustainabilityIndex = renewablePct * 100

  // Calculate energy efficiency index (0-100)
  const energyEfficiencyIndex = Math.max(0, Math.min(100, 100 - (pue - 1) * 50))

  const renderGauge = (value: number, label: string, icon: React.ReactNode, color: string) => (
    <Card className="p-4 bg-neutral-900 border-neutral-800">
      <div className="flex items-center gap-2 mb-3">
        <div className={`${color}`}>{icon}</div>
        <span className="text-xs text-neutral-400">{label}</span>
      </div>
      <div className="mb-2">
        <p className="text-2xl font-bold text-white">{Math.round(value)}</p>
      </div>
      <div className="w-full bg-neutral-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color.replace("text-", "bg-")}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </Card>
  )

  return (
    <div className="grid grid-cols-3 gap-3">
      {renderGauge(efficiencyScore, "Energy Efficiency", <Zap className="w-4 h-4" />, "text-teal-500")}
      {renderGauge(sustainabilityIndex, "Sustainability Index", <Leaf className="w-4 h-4" />, "text-green-500")}
      {renderGauge(energyEfficiencyIndex, "PUE Index", <Activity className="w-4 h-4" />, "text-blue-500")}
    </div>
  )
}
