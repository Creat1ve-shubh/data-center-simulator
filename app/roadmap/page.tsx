"use client";

import { useSimulatorStore } from "@/store/simulator-store";
import TransitionRoadmap from "@/components/roadmap/transition-roadmap";
import PipelineStagesPanel from "@/components/roadmap/pipeline-stages-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import React, { useEffect, useState } from "react";

export default function RoadmapPage() {
  const { leftOpen, setLeftOpen, planInput, scenarioId } = useSimulatorStore();
  const [pipelineOutput, setPipelineOutput] = useState<any>(null);
  const [pipelineRun, setPipelineRun] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"live" | "database">("live");

  // Fetch latest pipeline run from database or execute live
  useEffect(() => {
    async function fetchPipelineResults() {
      if (!planInput || !planInput.regionId) return;
      setLoading(true);
      setError(null);

      try {
        // First, try to fetch latest successful run from database if scenarioId exists
        if (scenarioId) {
          const runsRes = await fetch(
            `/api/runs?scenarioId=${scenarioId}&success=true&limit=1&includeDetails=true`
          );

          if (runsRes.ok) {
            const runsData = await runsRes.json();

            if (runsData.runs && runsData.runs.length > 0) {
              const latestRun = runsData.runs[0];
              setPipelineRun(latestRun);

              // Reconstruct pipeline output from database record
              const reconstructedOutput = reconstructPipelineOutput(latestRun);
              setPipelineOutput(reconstructedOutput);
              setDataSource("database");
              setLoading(false);
              return;
            }
          }
        }

        // No saved results, run pipeline live and save to database
        setDataSource("live");
        const req = {
          scenarioId: scenarioId || undefined,
          coordinates: planInput?.coordinates ?? {
            latitude: 37.77,
            longitude: -122.42,
          },
          currentLoad: {
            averageKW: planInput?.averageKW ?? 1000,
            peakKW: planInput?.peakKW ?? 1200,
            currentPUE: planInput?.currentPUE ?? 1.5,
          },
          constraints: {
            budget: planInput?.budgetCapUSD ?? 1_000_000,
            targetRenewableFraction: (planInput?.targetPct ?? 80) / 100,
            maxSolarKW: planInput?.maxSolarKW,
            maxWindKW: planInput?.maxWindKW,
            maxBatteryKWh: planInput?.maxBatteryKWh,
          },
          pricing: {
            electricityUSDPerKWh: planInput?.tariffUSDkWh ?? 0.12,
            carbonUSDPerTon: planInput?.carbonUSDPerTon ?? 50,
            solarCapexUSDPerKW: planInput?.solarCapexUSDPerKW ?? 1200,
            windCapexUSDPerKW: planInput?.windCapexUSDPerKW ?? 1500,
            batteryCapexUSDPerKWh: planInput?.batteryCapexUSDPerKWh ?? 400,
          },
          vppa: planInput?.vppa,
          sensitivity: planInput?.sensitivity,
        };

        const res = await fetch("/api/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setPipelineOutput(data);
        setPipelineRun(null);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchPipelineResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planInput, scenarioId]);

  // Reconstruct pipeline output format from database record
  function reconstructPipelineOutput(run: any) {
    const stages: any = {};
    run.stages?.forEach((stage: any) => {
      stages[stage.stageName] = stage.output;
    });

    return {
      success: run.success,
      executionTimeMs: run.executionMs,
      stages,
      summary: {
        optimal_plan: {
          solar_kw: run.solarKw,
          wind_kw: run.windKw,
          battery_kwh: run.batteryKwh,
        },
        financial_best_case: {
          total_investment: run.totalCapex,
          payback_months: run.paybackMonths,
          roi_percent: run.roiPercent,
        },
        environmental: {
          renewable_fraction: run.renewableFraction,
          co2_reduction_tons_year: run.co2ReductionTonYear,
        },
      },
      pipelineRunId: run.id,
    };
  }

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
          <h1 className="text-lg font-semibold">Transition Roadmap</h1>
          <div className="w-[96px]" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 pb-8 flex-1 flex flex-col gap-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-neutral-400 text-sm">
              Loading pipeline analysis...
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-900 bg-red-950/20 p-4">
            <div className="text-red-400 text-sm font-medium">
              Pipeline Error
            </div>
            <div className="text-red-300 text-xs mt-1">{error}</div>
          </div>
        ) : pipelineOutput ? (
          <>
            {/* Data source and metadata badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {dataSource === "database" ? (
                <>
                  <Badge
                    variant="outline"
                    className="bg-green-900/20 text-green-300 border-green-700"
                  >
                    📊 Loaded from database
                  </Badge>
                  {pipelineRun && (
                    <Badge
                      variant="outline"
                      className="bg-neutral-800 text-neutral-300 border-neutral-700"
                    >
                      Run ID: {pipelineRun.id.slice(0, 8)}...
                    </Badge>
                  )}
                  {pipelineRun?.createdAt && (
                    <Badge
                      variant="outline"
                      className="bg-neutral-800 text-neutral-400 border-neutral-700"
                    >
                      {new Date(pipelineRun.createdAt).toLocaleString()}
                    </Badge>
                  )}
                </>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-blue-900/20 text-blue-300 border-blue-700"
                >
                  ⚡ Live execution
                </Badge>
              )}

              <Badge
                variant="outline"
                className="bg-neutral-800 text-neutral-300 border-neutral-700"
              >
                Data source:{" "}
                {pipelineOutput.stages?.planner?.dataQuality?.solar?.source ||
                  "Unknown"}
              </Badge>

              {pipelineOutput.stages?.planner?.dataQuality?.solar?.source ===
                "synthetic" && (
                <Badge
                  variant="outline"
                  className="bg-yellow-900/20 text-yellow-300 border-yellow-700"
                >
                  ⚠ Synthetic fallback
                </Badge>
              )}

              <Badge
                variant="outline"
                className="bg-neutral-800 text-neutral-400 border-neutral-700"
              >
                Executed in {(pipelineOutput.executionTimeMs / 1000).toFixed(1)}
                s
              </Badge>
            </div>

            {/* Pipeline Analysis */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Pipeline Analysis</h2>
              <PipelineStagesPanel pipelineOutput={pipelineOutput} />
            </div>

            {/* Transition Roadmap */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Implementation Roadmap
              </h2>
              <TransitionRoadmap />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12 text-neutral-500 text-sm">
            Configure parameters and run optimization to view results
          </div>
        )}
      </div>
    </>
  );
}
