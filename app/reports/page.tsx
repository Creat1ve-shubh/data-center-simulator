"use client"

import { useSimulatorStore } from "@/store/simulator-store"
import { SustainabilityScore } from "@/components/sustainability-score"
import { AlertsRecommendations } from "@/components/efficiency/alerts-recommendations"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ReportsPage() {
  const { telemetry, summaries, planResult, leftOpen, setLeftOpen } = useSimulatorStore()

  // Calculate ROI and payback
  const totalCapex = planResult?.phases?.reduce((sum, p) => sum + (p.capexUSD || 0), 0) || 0
  const totalSavings = planResult?.phases?.reduce((sum, p) => sum + (p.projSavingsUSD || 0), 0) || 0
  const paybackYears = totalCapex > 0 ? totalCapex / (totalSavings / 20) : 0 // Assume 20-year horizon
  const roi = totalCapex > 0 ? ((totalSavings * 20 - totalCapex) / totalCapex) * 100 : 0

  return (
    <>
      <header className="border-b border-neutral-800 bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-neutral-300 hover:text-white"
            onClick={() => setLeftOpen(!leftOpen)}
            aria-expanded={leftOpen}
            title="Toggle panel (Ctrl+B)"
          >
            {leftOpen ? "Hide panel" : "Show panel"}
          </Button>
          <h1 className="text-lg font-semibold">Reports & Summary</h1>
          <div className="w-[96px]" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 pb-8 flex-1 flex flex-col gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SustainabilityScore summaries={summaries} />
          <Card className="border-neutral-800 bg-neutral-900 p-4">
            <p className="text-sm text-neutral-400">Total CapEx</p>
            <p className="text-2xl font-semibold">${(totalCapex / 1e6).toFixed(1)}M</p>
          </Card>
          <Card className="border-neutral-800 bg-neutral-900 p-4">
            <p className="text-sm text-neutral-400">20-Year Savings</p>
            <p className="text-2xl font-semibold">${((totalSavings * 20) / 1e6).toFixed(1)}M</p>
          </Card>
          <Card className="border-neutral-800 bg-neutral-900 p-4">
            <p className="text-sm text-neutral-400">ROI</p>
            <p className="text-2xl font-semibold">{roi.toFixed(0)}%</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-neutral-800 bg-neutral-900 p-4">
            <p className="text-sm font-medium mb-2">Payback Period</p>
            <p className="text-3xl font-bold text-teal-400">{paybackYears.toFixed(1)} years</p>
            <p className="text-xs text-neutral-400 mt-2">Based on 20-year horizon</p>
          </Card>
          <Card className="border-neutral-800 bg-neutral-900 p-4">
            <p className="text-sm font-medium mb-2">Total CO₂ Reduction</p>
            <p className="text-3xl font-bold text-green-400">
              {(planResult?.phases?.reduce((sum, p) => sum + (p.projDeltaCO2_kgYr || 0), 0) || 0 / 1000).toFixed(0)}{" "}
              tons/yr
            </p>
          </Card>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h3 className="text-sm font-medium mb-3">Alerts & Recommendations</h3>
          <AlertsRecommendations telemetry={telemetry} />
        </div>
      </div>
    </>
  )
}
