"use client";

import type React from "react";

import { useState } from "react";
import type { RegionId } from "@/types";

// Minimal local Accordion components fallback to avoid module resolution errors.
// These are simple wrappers using native <details>/<summary> semantics and can be
// replaced with the project's full UI Accordion implementation when available.
function Accordion({ children, ...props }: any) {
  return <div {...props}>{children}</div>;
}
function AccordionItem({ children, ...props }: any) {
  return (
    <details className="mb-2" {...props}>
      {children}
    </details>
  );
}
function AccordionTrigger({ children, ...props }: any) {
  return (
    <summary className="cursor-pointer list-none px-1" {...props}>
      {children}
    </summary>
  );
}
function AccordionContent({ children, ...props }: any) {
  return (
    <div className="px-2 py-1" {...props}>
      {children}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
// Replaced the custom Select UI import with a native <select> element in the JSX
// to avoid dependency on '@/components/ui/select' which may not exist in this project.
import Papa from "papaparse";
import { useSimulatorStore } from "@/store/simulator-store";
import { computeMetricSummaries } from "@/lib/compute-metrics";
import { generateSampleTelemetry } from "@/lib/sample-data";
import { generatePlan } from "@/lib/planner";

export function LeftPanel() {
  const {
    setTelemetry,
    setSummaries,
    setParams,
    params,
    planInput,
    setPlanInput,
    setPlanResult,
    telemetry,
  } = useSimulatorStore();
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  function loadSample() {
    const sample = generateSampleTelemetry();
    setTelemetry(sample);
    setSummaries(computeMetricSummaries(sample));
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    setCsvError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res: Papa.ParseResult<any>) => {
        try {
          // Expect columns: time, it_load_kW, facility_energy_kWh, water_liters, emissions_kgCO2(optional)
          const rows = (res.data as any[]).map((r) => ({
            time: new Date(r.time),
            it_load_kW: Number(r.it_load_kW),
            facility_energy_kWh: Number(r.facility_energy_kWh),
            water_liters: Number(r.water_liters),
            emissions_kgCO2:
              r.emissions_kgCO2 != null ? Number(r.emissions_kgCO2) : undefined,
          }));
          // Basic validation
          const valid = rows.filter(
            (r) =>
              r.time instanceof Date &&
              !isNaN(r.time.getTime()) &&
              Number.isFinite(r.it_load_kW) &&
              Number.isFinite(r.facility_energy_kWh)
          );
          if (valid.length === 0)
            throw new Error(
              "No valid rows parsed. Check headers and data types."
            );
          setTelemetry(valid);
          setSummaries(computeMetricSummaries(valid));
        } catch (err: any) {
          setCsvError(err.message || "Failed to parse CSV");
        }
      },
      error: (err: Papa.ParseError) => setCsvError(err.message),
    });
  }

  async function handleGenerateRoadmap() {
    setIsGenerating(true);
    try {
      // Simulate async work (planner runs in main thread for now)
      await new Promise((resolve) => setTimeout(resolve, 500));
      const r = generatePlan(
        { ...planInput, startDate: new Date() },
        telemetry
      );
      setPlanResult(r);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div id="left-panel" className="h-full overflow-y-auto px-3 py-4">
      <Accordion
        type="multiple"
        defaultValue={["auto", "data", "costs", "energy", "sim"]}
        className="space-y-2"
      >
        {/* Auto-Plan */}
        <AccordionItem
          value="auto"
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3"
        >
          <AccordionTrigger className="text-neutral-100">
            Auto-Plan (Geolocation & Cost)
          </AccordionTrigger>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Region</Label>
                <select
                  value={planInput.regionId ?? ""}
                  onChange={(e) =>
                    setPlanInput({
                      regionId: e.target.value
                        ? (e.target.value as RegionId)
                        : undefined,
                    })
                  }
                  className="bg-neutral-800 border-neutral-700 w-full p-2 rounded"
                >
                  <option value="">Select region</option>
                  <option value="us-west">US West</option>
                  <option value="us-east">US East</option>
                  <option value="eu-central">EU Central</option>
                </select>
              </div>
              <div>
                <Label>Target %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={planInput.targetPct}
                  onChange={(e) =>
                    setPlanInput({ targetPct: Number(e.target.value) })
                  }
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              </div>
              <div>
                <Label>Target year</Label>
                <Input
                  type="number"
                  min={new Date().getFullYear()}
                  value={planInput.targetYear}
                  onChange={(e) =>
                    setPlanInput({ targetYear: Number(e.target.value) })
                  }
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div>
                <Label>Budget (USD)</Label>
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  value={planInput.budgetCapUSD}
                  onChange={(e) =>
                    setPlanInput({ budgetCapUSD: Number(e.target.value) })
                  }
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div>
                <Label>Max phases</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={planInput.maxPhases}
                  onChange={(e) =>
                    setPlanInput({ maxPhases: Number(e.target.value) })
                  }
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div>
                <Label>Max months per phase</Label>
                <Input
                  type="number"
                  min={3}
                  max={24}
                  value={planInput.maxMonthsPerPhase}
                  onChange={(e) =>
                    setPlanInput({ maxMonthsPerPhase: Number(e.target.value) })
                  }
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div>
                <Label>Tariff ($/kWh)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={planInput.tariffUSDkWh}
                  onChange={(e) =>
                    setPlanInput({ tariffUSDkWh: Number(e.target.value) })
                  }
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="col-span-2 grid grid-cols-4 gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    aria-label="Allow Solar"
                    checked={planInput.allowSolar}
                    onChange={(e) =>
                      setPlanInput({ allowSolar: e.target.checked })
                    }
                  />
                  <span>Solar</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    aria-label="Allow Wind"
                    checked={planInput.allowWind}
                    onChange={(e) =>
                      setPlanInput({ allowWind: e.target.checked })
                    }
                  />
                  <span>Wind</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    aria-label="Allow Hydro"
                    checked={planInput.allowHydro}
                    onChange={(e) =>
                      setPlanInput({ allowHydro: e.target.checked })
                    }
                  />
                  <span>Hydro</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    aria-label="Allow Storage"
                    checked={planInput.allowStorage}
                    onChange={(e) =>
                      setPlanInput({ allowStorage: e.target.checked })
                    }
                  />
                  <span>Storage</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-teal-500 hover:bg-teal-400 text-black disabled:opacity-50"
                onClick={handleGenerateRoadmap}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Generating...
                  </>
                ) : (
                  "Generate roadmap"
                )}
              </Button>
              <p className="text-xs text-neutral-500">
                Generates a phased plan using regional CF, LCOE, and lead
                times—no external APIs.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Telemetry & Data */}
        <AccordionItem
          value="data"
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3"
        >
          <AccordionTrigger className="text-neutral-100">
            Telemetry & Data
          </AccordionTrigger>
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
              <Button
                onClick={loadSample}
                className="bg-teal-500 hover:bg-teal-400 text-black"
              >
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
                  onChange={(e) =>
                    setParams({ refreshSec: Number(e.target.value) })
                  }
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
                  onChange={(e) =>
                    setParams({ windowHours: Number(e.target.value) })
                  }
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Costs & Tariffs */}
        <AccordionItem
          value="costs"
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3"
        >
          <AccordionTrigger className="text-neutral-100">
            Costs & Tariffs
          </AccordionTrigger>
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
              <p className="text-xs text-neutral-400 mt-1">
                {params.tariffSensitivity}%
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Energy Sources & Materials */}
        <AccordionItem
          value="energy"
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3"
        >
          <AccordionTrigger className="text-neutral-100">
            Energy Sources & Materials
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-neutral-300">
            <Label>Renewable Mix (%)</Label>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-400 mb-1">
                  Solar: {params.mixSolar}%
                </p>
                <Slider
                  value={[params.mixSolar]}
                  onValueChange={(v) => setParams({ mixSolar: v[0] })}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-1">
                  Wind: {params.mixWind}%
                </p>
                <Slider
                  value={[params.mixWind]}
                  onValueChange={(v) => setParams({ mixWind: v[0] })}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-1">
                  Hydro: {params.mixHydro}%
                </p>
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
        <AccordionItem
          value="sim"
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3"
        >
          <AccordionTrigger className="text-neutral-100">
            Simulation Controls
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-neutral-300">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="bg-neutral-800 border border-neutral-700"
              >
                Reset
              </Button>
              <Button className="bg-teal-500 hover:bg-teal-400 text-black">
                Run
              </Button>
            </div>
            <p className="text-xs text-neutral-500">
              Roadmap phases will compute estimated cost/savings with your
              tariff and mix settings.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
