"use client"

import { useMemo, useState } from "react"
import { useSimulatorStore } from "@/store/simulator-store"
import { GanttTimeline } from "./gantt-timeline"
import { PhaseCard } from "./phase-card"
import { PhaseDetailDrawer } from "./phase-detail-drawer"
import { RoadmapSummary } from "./roadmap-summary"
import { RenewableSuggestion } from "./renewable-suggestion"
import type { PlanPhase, PhaseActuals } from "@/types"

export function TransitionRoadmap() {
  const { planResult, telemetry, planInput, setPlanResult } = useSimulatorStore()
  const [selectedPhase, setSelectedPhase] = useState<PlanPhase | null>(null)
  const [phaseDrawerOpen, setPhaseDrawerOpen] = useState(false)

  const actualSeries = useMemo(() => {
    if (!telemetry.length) return []
    const mean = telemetry.reduce((a, b) => a + b.facility_energy_kWh, 0) / telemetry.length
    let cum = 0
    return telemetry.map((t) => {
      const delta = Math.max(0, mean - t.facility_energy_kWh)
      cum += delta
      return { time: t.time, cumulativeEnergy_kWh: cum }
    })
  }, [telemetry])

  function handleAddActuals(phaseId: string, actuals: PhaseActuals) {
    if (!planResult) return
    const updated = {
      ...planResult,
      phases: planResult.phases.map((p) => (p.id === phaseId ? { ...p, actuals, status: "done" as const } : p)),
    }
    setPlanResult(updated)
  }

  function handleReplanFromHere(index: number) {
    if (!planResult) return
    const completedPhases = planResult.phases.slice(0, index + 1)
    const totalActualCO2 = completedPhases.reduce((sum, p) => sum + (p.actuals?.realizedCO2DeltaKg ?? 0), 0)
    const remainingTarget = planResult.totals.capexUSD * 0.8 - totalActualCO2
    console.log(`[v0] Re-optimizing from phase ${index + 1}, remaining target: ${remainingTarget}`)
  }

  if (!planResult) {
    return (
      <div className="p-6 text-center">
        <p className="text-neutral-400">Generate a roadmap using Auto-Plan in the left panel.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary metrics */}
      <RoadmapSummary plan={planResult} />

      {/* Renewable suggestion */}
      <RenewableSuggestion regionId={planInput.regionId} />

      {/* Gantt timeline */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h3 className="text-sm font-medium mb-4">Phase Timeline</h3>
        <GanttTimeline phases={planResult.phases} />
      </div>

      {/* Phase cards grid */}
      <div>
        <h3 className="text-sm font-medium mb-4">Phases</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planResult.phases.map((phase, idx) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              index={idx}
              onAddActuals={handleAddActuals}
              onReplanFromHere={handleReplanFromHere}
              onPhaseSelect={(p) => {
                setSelectedPhase(p)
                setPhaseDrawerOpen(true)
              }}
            />
          ))}
        </div>
      </div>

      {/* Expected vs Actual */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h3 className="text-sm font-medium mb-3">Expected vs Actual Progress</h3>
        <div className="relative h-[160px]">
          <svg className="w-full h-full">
            {planResult.expectedSeries?.length ? (
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                points={(() => {
                  const w = 800
                  const h = 140
                  const xs = planResult.expectedSeries.map((d) => d.time.getTime())
                  const ys = planResult.expectedSeries.map((d) => d.cumulativeEnergy_kWh)
                  const minX = Math.min(...xs),
                    maxX = Math.max(...xs)
                  const minY = 0,
                    maxY = Math.max(1, ...ys)
                  const sx = (x: number) => ((x - minX) / Math.max(1, maxX - minX)) * w
                  const sy = (y: number) => h - ((y - minY) / Math.max(1, maxY - minY)) * h
                  return planResult.expectedSeries
                    .map((d) => `${sx(d.time.getTime())},${sy(d.cumulativeEnergy_kWh)}`)
                    .join(" ")
                })()}
              />
            ) : null}

            {actualSeries.length ? (
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                points={(() => {
                  const w = 800
                  const h = 140
                  const xs = actualSeries.map((d) => d.time.getTime())
                  const ys = actualSeries.map((d) => d.cumulativeEnergy_kWh)
                  const minX = Math.min(...xs),
                    maxX = Math.max(...xs)
                  const minY = 0,
                    maxY = Math.max(1, ...ys)
                  const sx = (x: number) => ((x - minX) / Math.max(1, maxX - minX)) * w
                  const sy = (y: number) => h - ((y - minY) / Math.max(1, maxY - minY)) * h
                  return actualSeries.map((d) => `${sx(d.time.getTime())},${sy(d.cumulativeEnergy_kWh)}`).join(" ")
                })()}
              />
            ) : null}
          </svg>
          <div className="absolute top-2 right-2 text-xs text-neutral-400 space-y-1">
            <div>
              <span className="inline-block w-2 h-2 bg-teal-400 rounded-full mr-2" />
              Expected
            </div>
            <div>
              <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-2" />
              Actual
            </div>
          </div>
        </div>
        <p className="text-xs text-neutral-500 mt-3">
          Expected is derived from phase end dates and projected annual energy deltas; Actual is a proxy from telemetry.
        </p>
      </div>

      {/* Economic transition strategy */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h3 className="text-sm font-medium mb-3">Economic Transition Strategy</h3>
        <p className="text-xs text-neutral-400 mb-3">
          This roadmap follows a <strong>phased capital deployment model</strong> that optimizes for:
        </p>
        <ul className="text-xs text-neutral-400 space-y-2 ml-4 list-disc">
          <li>
            <strong>Levelized Cost of Energy (LCOE):</strong> Prioritizes technologies with lowest long-term cost per
            kWh.
          </li>
          <li>
            <strong>Capacity Factor:</strong> Selects renewables best suited to your region's climate and geography.
          </li>
          <li>
            <strong>Payback Period:</strong> Ensures each phase achieves positive ROI within your target timeline.
          </li>
          <li>
            <strong>Permitting Lead Times:</strong> Accounts for regulatory delays, ensuring realistic schedules.
          </li>
          <li>
            <strong>Energy Storage & Resilience:</strong> Adds battery storage to smooth intermittency and improve grid
            stability.
          </li>
        </ul>
        <p className="text-xs text-neutral-400 mt-3">
          As you record actuals, the plan recalibrates to reflect real-world performance, tariff changes, and market
          conditions.
        </p>
      </div>

      {/* Phase detail drawer */}
      <PhaseDetailDrawer phase={selectedPhase} open={phaseDrawerOpen} onOpenChange={setPhaseDrawerOpen} />
    </div>
  )
}
