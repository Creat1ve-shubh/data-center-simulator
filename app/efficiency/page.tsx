"use client"

import { useSimulatorStore } from "@/store/simulator-store"
import { EfficiencyLineChart } from "@/components/charts/efficiency-line"
import { HeatmapCalendar } from "@/components/charts/heatmap-calendar"
import { SankeyEnergy } from "@/components/charts/sankey-energy"
import { ViolinPUE } from "@/components/charts/violin-pue"
import { ParetoInefficiency } from "@/components/charts/pareto-inefficiency"
import { Sparklines } from "@/components/charts/sparklines"
import { RadarBenchmark } from "@/components/charts/radar-benchmark"
import { ITLoadSimulator } from "@/components/efficiency/it-load-simulator"
import { AlertsRecommendations } from "@/components/efficiency/alerts-recommendations"
import { MetricsExplainer } from "@/components/info-panels/metrics-explainer"
import { TelemetryTable } from "@/components/telemetry-table"
import { SustainabilityScore } from "@/components/sustainability-score"
import { Button } from "@/components/ui/button"

export default function EfficiencyPage() {
  const { telemetry, summaries, leftOpen, setLeftOpen } = useSimulatorStore()

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
          <h1 className="text-lg font-semibold">Efficiency Analysis</h1>
          <div className="w-[96px]" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <SustainabilityScore summaries={summaries} />
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">PUE (avg)</p>
          <p className="text-2xl font-semibold">{summaries?.pueAvg?.toFixed(2) ?? "--"}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">CUE (avg)</p>
          <p className="text-2xl font-semibold">{summaries?.cueAvg?.toFixed(3) ?? "--"}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">WUE (avg)</p>
          <p className="text-2xl font-semibold">{summaries?.wueAvg?.toFixed(3) ?? "--"}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-8 flex-1 flex flex-col gap-6">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
          <Sparklines data={telemetry} />
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
          <EfficiencyLineChart data={telemetry} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <h3 className="text-sm font-medium mb-4">Benchmark Comparison</h3>
            <RadarBenchmark summaries={summaries} />
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
            <ITLoadSimulator telemetry={telemetry} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
            <HeatmapCalendar data={telemetry} />
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
            <SankeyEnergy data={telemetry} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
            <ViolinPUE data={telemetry} />
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
            <ParetoInefficiency data={telemetry} />
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h3 className="text-sm font-medium mb-3">Alerts & Recommendations</h3>
          <AlertsRecommendations telemetry={telemetry} />
        </div>
        <MetricsExplainer />
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
          <TelemetryTable data={telemetry} />
        </div>
      </div>
    </>
  )
}
