"use client"

import type { PlanResult } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  plan: PlanResult | null
}

export function RoadmapSummary({ plan }: Props) {
  if (!plan) return null

  const totalCapex = plan.totals.capexUSD
  const totalSavingsYr = plan.totals.expectedSavingsUSDyr
  const paybackMonths = totalCapex > 0 ? Math.round((totalCapex / totalSavingsYr) * 12) : 0
  const roi = totalCapex > 0 ? ((totalSavingsYr * 10 - totalCapex) / totalCapex) * 100 : 0
  const totalCO2 = plan.phases.reduce((sum, p) => sum + (p.projDeltaCO2_kgYr || 0), 0)
  const completedPhases = plan.phases.filter((p) => p.status === "done").length
  const progressPct = Math.round((completedPhases / plan.phases.length) * 100)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-neutral-400">Total CapEx</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-white">${(totalCapex / 1_000_000).toFixed(1)}M</p>
          <p className="text-xs text-neutral-500 mt-1">{plan.phases.length} phases</p>
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-neutral-400">Annual Savings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-400">${(totalSavingsYr / 1000).toFixed(0)}k</p>
          <p className="text-xs text-neutral-500 mt-1">per year</p>
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-neutral-400">CO₂ Reduction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-cyan-400">{(totalCO2 / 1_000_000).toFixed(1)}M kg</p>
          <p className="text-xs text-neutral-500 mt-1">per year</p>
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-neutral-400">Payback Period</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-orange-400">{paybackMonths} mo</p>
          <p className="text-xs text-neutral-500 mt-1">~{(paybackMonths / 12).toFixed(1)} years</p>
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-neutral-400">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-teal-400">{progressPct}%</p>
          <p className="text-xs text-neutral-500 mt-1">
            {completedPhases}/{plan.phases.length} phases
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
