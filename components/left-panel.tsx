"use client"

import type React from "react"

import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import Papa from "papaparse"
import { useSimulatorStore } from "@/store/simulator-store"
import { computeMetricSummaries } from "@/lib/compute-metrics"
import { generateSampleTelemetry } from "@/lib/sample-data"
import { generatePlan } from "@/lib/planner"
import { AutoPlanWizard } from "@/components/auto-plan-wizard"
import { CostEstimationPanel } from "@/components/cost-estimation-panel"
import { RenewableSuggestion } from "@/components/roadmap/renewable-suggestion"

export function LeftPanel() {
  const { setTelemetry, setSummaries, setParams, params, planInput, setPlanInput, setPlanResult, telemetry } =
    useSimulatorStore()
  const [csvError, setCsvError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  function loadSample() {
    const sample = generateSampleTelemetry()
    setTelemetry(sample)
    setSummaries(computeMetricSummaries(sample))
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    setCsvError(null)
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        try {
          // Expect columns: time, it_load_kW, facility_energy_kWh, water_liters, emissions_kgCO2(optional)
          const rows = (res.data as any[]).map((r) => ({
            time: new Date(r.time),
            it_load_kW: Number(r.it_load_kW),
            facility_energy_kWh: Number(r.facility_energy_kWh),
            water_liters: Number(r.water_liters),
            emissions_kgCO2: r.emissions_kgCO2 != null ? Number(r.emissions_kgCO2) : undefined,
          }))
          // Basic validation
          const valid = rows.filter(
            (r) =>
              r.time instanceof Date &&
              !isNaN(r.time.getTime()) &&
              Number.isFinite(r.it_load_kW) &&
              Number.isFinite(r.facility_energy_kWh),
          )
          if (valid.length === 0) throw new Error("No valid rows parsed. Check headers and data types.")
          setTelemetry(valid)
          setSummaries(computeMetricSummaries(valid))
        } catch (err: any) {
          setCsvError(err.message || "Failed to parse CSV")
        }
      },
      error: (err) => setCsvError(err.message),
    })
  }

  async function handleGenerateRoadmap() {
    setIsGenerating(true)
    try {
      // Simulate async work (planner runs in main thread for now)
      await new Promise((resolve) => setTimeout(resolve, 500))
      const r = generatePlan({ ...planInput, startDate: new Date() }, telemetry)
      setPlanResult(r)
      setShowWizard(false)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div id="left-panel" className="h-full overflow-y-auto px-3 py-4">
      <Accordion type="multiple" defaultValue={["auto", "data", "costs", "energy", "sim"]} className="space-y-2">
        {/* Auto-Plan */}
        <AccordionItem value="auto" className="rounded-lg border border-neutral-800 bg-neutral-900 px-3">
          <AccordionTrigger className="text-neutral-100">Auto-Plan (Geolocation & Cost)</AccordionTrigger>
          <AccordionContent className="space-y-4 text-sm text-neutral-300">
            {!showWizard ? (
              <div className="space-y-4">
                {/* Quick View */}
                <div className="rounded-lg bg-neutral-800 p-3 border border-neutral-700 space-y-2">
                  <p className="text-xs font-medium text-neutral-200">Current Settings:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-neutral-500">Region:</p>
                      <p className="text-neutral-200 font-medium">{planInput.regionId}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Target:</p>
                      <p className="text-neutral-200 font-medium">{planInput.targetPct}%</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Budget:</p>
                      <p className="text-neutral-200 font-medium">${(planInput.budgetCapUSD / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Tariff:</p>
                      <p className="text-neutral-200 font-medium">${planInput.tariffUSDkWh.toFixed(3)}/kWh</p>
                    </div>
                  </div>
                </div>

                {/* Renewable Suggestion */}
                <RenewableSuggestion regionId={planInput.regionId} />

                {/* Cost Estimation */}
                <CostEstimationPanel
                  regionId={planInput.regionId}
                  tariffUSDkWh={planInput.tariffUSDkWh}
                  targetPct={planInput.targetPct}
                  budgetCapUSD={planInput.budgetCapUSD}
                />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowWizard(true)}
                    className="flex-1 bg-teal-500 hover:bg-teal-400 text-black"
                  >
                    Edit Settings
                  </Button>
                  <Button
                    onClick={handleGenerateRoadmap}
                    disabled={isGenerating}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⟳</span>
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Wizard Mode */}
                <AutoPlanWizard
                  planInput={planInput}
                  onUpdate={setPlanInput}
                  onGenerate={handleGenerateRoadmap}
                  isGenerating={isGenerating}
                />
                <Button
                  variant="outline"
                  onClick={() => setShowWizard(false)}
                  className="w-full bg-neutral-800 border-neutral-700"
                >
                  Back to Quick View
                </Button>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Telemetry & Data */}
        <AccordionItem value="data" className="rounded-lg border border-neutral-800 bg-neutral-900 px-3">
          <AccordionTrigger className="text-neutral-100">Telemetry & Data</AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-neutral-300">
            <div className="space-y-2">
              <Label htmlFor="csv">Upload CSV</Label>
              <Input
                id="csv"
                type="file"
                accept=".csv"
                onChange={handleCSV}
                className="bg-neutral-800 border-neutral-700"
              />
              {csvError && <p className="text-red-400 text-xs">{csvError}</p>}
              <Button onClick={loadSample} className="bg-teal-500 hover:bg-teal-400 text-black">
                Load sample data
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="refresh">Refresh interval (sec)</Label>
                <Input
                  id="refresh"
                  type="number"
                  min={5}
                  value={params.refreshSec}
                  onChange={(e) => setParams({ refreshSec: Number(e.target.value) })}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div>
                <Label htmlFor="date-range">Date range (hrs)</Label>
                <Input
                  id="date-range"
                  type="number"
                  min={1}
                  value={params.windowHours}
                  onChange={(e) => setParams({ windowHours: Number(e.target.value) })}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Costs & Tariffs */}
        <AccordionItem value="costs" className="rounded-lg border border-neutral-800 bg-neutral-900 px-3">
          <AccordionTrigger className="text-neutral-100">Costs & Tariffs</AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-neutral-300">
            <div>
              <Label>Tariff ($/kWh)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={params.tariff}
                onChange={(e) => setParams({ tariff: Number(e.target.value) })}
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
            <div>
              <Label>Tariff sensitivity ±%</Label>
              <Slider
                value={[params.tariffSensitivity]}
                onValueChange={(v) => setParams({ tariffSensitivity: v[0] })}
                min={0}
                max={50}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-neutral-400 mt-1">{params.tariffSensitivity}%</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Energy Sources & Materials */}
        <AccordionItem value="energy" className="rounded-lg border border-neutral-800 bg-neutral-900 px-3">
          <AccordionTrigger className="text-neutral-100">Energy Sources & Materials</AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-neutral-300">
            <Label>Renewable Mix (%)</Label>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-400 mb-1">Solar: {params.mixSolar}%</p>
                <Slider
                  value={[params.mixSolar]}
                  onValueChange={(v) => setParams({ mixSolar: v[0] })}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-1">Wind: {params.mixWind}%</p>
                <Slider
                  value={[params.mixWind]}
                  onValueChange={(v) => setParams({ mixWind: v[0] })}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-1">Hydro: {params.mixHydro}%</p>
                <Slider
                  value={[params.mixHydro]}
                  onValueChange={(v) => setParams({ mixHydro: v[0] })}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Simulation Controls */}
        <AccordionItem value="sim" className="rounded-lg border border-neutral-800 bg-neutral-900 px-3">
          <AccordionTrigger className="text-neutral-100">Simulation Controls</AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-neutral-300">
            <div className="flex gap-2">
              <Button variant="secondary" className="bg-neutral-800 border border-neutral-700">
                Reset
              </Button>
              <Button className="bg-teal-500 hover:bg-teal-400 text-black">Run</Button>
            </div>
            <p className="text-xs text-neutral-500">
              Roadmap phases will compute estimated cost/savings with your tariff and mix settings.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
