"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const PipelineStagesPanel = ({
  pipelineOutput,
}: {
  pipelineOutput: any;
}): React.ReactElement => {
  if (!pipelineOutput) return null;
  const { stages, summary, errors, executionTimeMs } = pipelineOutput;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-neutral-900 border-neutral-800">
          <div className="text-xs text-neutral-400 mb-1">Optimal Plan</div>
          <div className="text-2xl font-bold text-white">
            {(
              summary.optimal_plan.solar_kw + summary.optimal_plan.wind_kw
            ).toFixed(0)}{" "}
            kW
          </div>
          <div className="text-xs text-neutral-300 mt-2">
            Solar: {summary.optimal_plan.solar_kw.toFixed(0)} kW • Wind:{" "}
            {summary.optimal_plan.wind_kw.toFixed(0)} kW • Battery:{" "}
            {summary.optimal_plan.battery_kwh.toFixed(0)} kWh
          </div>
        </Card>

        <Card className="p-4 bg-neutral-900 border-neutral-800">
          <div className="text-xs text-neutral-400 mb-1">
            Financial Best Case
          </div>
          <div className="text-2xl font-bold text-green-400">
            {summary.financial_best_case.payback_months.toFixed(0)} mo
          </div>
          <div className="text-xs text-neutral-300 mt-2">
            ROI: {summary.financial_best_case.roi_percent.toFixed(1)}% •
            Savings: $
            {(summary.financial_best_case.annual_savings / 1000).toFixed(0)}k/yr
          </div>
        </Card>

        <Card className="p-4 bg-neutral-900 border-neutral-800">
          <div className="text-xs text-neutral-400 mb-1">
            Environmental Impact
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {(summary.environmental.renewable_fraction * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-neutral-300 mt-2">
            CO₂: {summary.environmental.co2_reduction_tons_year.toFixed(0)}{" "}
            tons/yr • Cars:{" "}
            {summary.environmental.equivalent_cars_removed.toFixed(0)}
          </div>
        </Card>
      </div>

      {/* Detailed Pipeline Stages */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-neutral-900 border border-neutral-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stages">Stage Details</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          {stages.sensitivity && (
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-4 bg-neutral-900 border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Pipeline Execution</h3>
              <Badge
                variant={pipelineOutput.success ? "default" : "destructive"}
              >
                {pipelineOutput.success ? "Success" : "Failed"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
              <div>
                <div className="text-neutral-400">Planner</div>
                <div className="text-white font-medium">
                  {stages.planner?.status}
                </div>
                <div className="text-neutral-500">
                  {stages.planner?.hourlyData?.length || 0}h data
                </div>
              </div>
              <div>
                <div className="text-neutral-400">Optimizer</div>
                <div className="text-white font-medium">
                  {stages.optimizer?.status}
                </div>
                <div className="text-neutral-500">
                  {stages.optimizer?.metrics?.renewable_fraction
                    ? (
                        stages.optimizer.metrics.renewable_fraction * 100
                      ).toFixed(0)
                    : 0}
                  % renewable
                </div>
              </div>
              <div>
                <div className="text-neutral-400">PUE Model</div>
                <div className="text-white font-medium">
                  {stages.pue?.status}
                </div>
                <div className="text-neutral-500">
                  {stages.pue?.adjustedLoad?.pue_improvement_percent?.toFixed(
                    1
                  ) || 0}
                  % improvement
                </div>
              </div>
              <div>
                <div className="text-neutral-400">Financial</div>
                <div className="text-white font-medium">
                  {stages.financial?.status}
                </div>
                <div className="text-neutral-500">
                  NPV: $
                  {(stages.financial?.ownership?.npv_20yr / 1000000).toFixed(
                    1
                  ) || 0}
                  M
                </div>
              </div>
              {stages.sensitivity && (
                <div>
                  <div className="text-neutral-400">Sensitivity</div>
                  <div className="text-white font-medium">
                    {stages.sensitivity.status}
                  </div>
                  <div className="text-neutral-500">
                    {stages.sensitivity.monteCarlo?.iterations} runs
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-800 text-xs text-neutral-400">
              Execution time: {(executionTimeMs / 1000).toFixed(1)}s
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          <Card className="p-4 bg-neutral-900 border-neutral-800">
            <h4 className="text-sm font-semibold mb-3">
              Stage 1: Renewable Planner
            </h4>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Status:</span>
                <span className="text-white">{stages.planner?.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Solar Source:</span>
                <span className="text-white">
                  {stages.planner?.dataQuality?.solar?.source}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Wind Source:</span>
                <span className="text-white">
                  {stages.planner?.dataQuality?.wind?.source}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Hours Available:</span>
                <span className="text-white">
                  {stages.planner?.hourlyData?.length || 0}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-neutral-900 border-neutral-800">
            <h4 className="text-sm font-semibold mb-3">
              Stage 2: MILP Optimizer
            </h4>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Solution:</span>
                <span className="text-white">{stages.optimizer?.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Solar Capacity:</span>
                <span className="text-white">
                  {stages.optimizer?.optimalCapacities?.solar_kw?.toFixed(1)} kW
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Wind Capacity:</span>
                <span className="text-white">
                  {stages.optimizer?.optimalCapacities?.wind_kw?.toFixed(1)} kW
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Battery:</span>
                <span className="text-white">
                  {stages.optimizer?.optimalCapacities?.battery_kwh?.toFixed(1)}{" "}
                  kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total CAPEX:</span>
                <span className="text-white">
                  $
                  {(stages.optimizer?.metrics?.total_capex / 1000000).toFixed(
                    2
                  )}
                  M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Solve Time:</span>
                <span className="text-white">
                  {stages.optimizer?.solverInfo?.solve_time_seconds?.toFixed(2)}
                  s
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-neutral-900 border-neutral-800">
            <h4 className="text-sm font-semibold mb-3">
              Stage 3: PUE Predictor
            </h4>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Baseline PUE:</span>
                <span className="text-white">
                  {stages.pue?.adjustedLoad?.baseline_pue?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Adjusted PUE:</span>
                <span className="text-green-400">
                  {stages.pue?.adjustedLoad?.adjusted_pue?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Improvement:</span>
                <span className="text-green-400">
                  {stages.pue?.adjustedLoad?.pue_improvement_percent?.toFixed(
                    1
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Energy Savings:</span>
                <span className="text-white">
                  {(
                    stages.pue?.adjustedLoad?.annual_energy_savings_kwh / 1000
                  ).toFixed(0)}{" "}
                  MWh/yr
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card className="p-4 bg-neutral-900 border-neutral-800">
            <h4 className="text-sm font-semibold mb-3">Ownership Model</h4>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Total CAPEX:</span>
                <span className="text-white">
                  $
                  {(stages.financial?.ownership?.total_capex / 1000000).toFixed(
                    2
                  )}
                  M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Annual OPEX:</span>
                <span className="text-white">
                  $
                  {(stages.financial?.ownership?.annual_opex / 1000).toFixed(0)}
                  k
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Annual Savings:</span>
                <span className="text-green-400">
                  $
                  {(stages.financial?.ownership?.annual_savings / 1000).toFixed(
                    0
                  )}
                  k
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Payback Period:</span>
                <span className="text-white">
                  {stages.financial?.ownership?.payback_period_months?.toFixed(
                    1
                  )}{" "}
                  months
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">ROI:</span>
                <span className="text-green-400">
                  {stages.financial?.ownership?.roi_percent?.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">NPV (20yr):</span>
                <span className="text-white">
                  $
                  {(stages.financial?.ownership?.npv_20yr / 1000000).toFixed(2)}
                  M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">IRR:</span>
                <span className="text-white">
                  {stages.financial?.ownership?.irr_percent?.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>

          {stages.financial?.vppa && (
            <Card className="p-4 bg-neutral-900 border-neutral-800">
              <h4 className="text-sm font-semibold mb-3">VPPA Model</h4>
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Strike Price:</span>
                  <span className="text-white">
                    ${stages.financial.vppa.strike_price_per_mwh}/MWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Contract Value:</span>
                  <span className="text-white">
                    $
                    {(stages.financial.vppa.contract_value / 1000000).toFixed(
                      2
                    )}
                    M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Hedge Effectiveness:</span>
                  <span className="text-green-400">
                    {stages.financial.vppa.hedge_effectiveness_percent?.toFixed(
                      0
                    )}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">LCOE:</span>
                  <span className="text-white">
                    ${stages.financial.vppa.lcoe_per_mwh?.toFixed(2)}/MWh
                  </span>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4 bg-neutral-900 border-neutral-800">
            <h4 className="text-sm font-semibold mb-3">Carbon Economics</h4>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">CO₂ Reduction:</span>
                <span className="text-green-400">
                  {stages.financial?.carbon?.co2_reduction_tons_year?.toFixed(
                    0
                  )}{" "}
                  tons/yr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Carbon Credit Value:</span>
                <span className="text-white">
                  $
                  {(
                    stages.financial?.carbon?.carbon_credit_value_usd_year /
                    1000
                  ).toFixed(0)}
                  k/yr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Lifetime Reduction:</span>
                <span className="text-green-400">
                  {(
                    stages.financial?.carbon?.lifetime_co2_reduction_tons / 1000
                  ).toFixed(1)}
                  k tons
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {stages.sensitivity && (
          <TabsContent value="risk" className="space-y-4">
            <Card className="p-4 bg-neutral-900 border-neutral-800">
              <h4 className="text-sm font-semibold mb-3">
                Monte Carlo Analysis
              </h4>
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Iterations:</span>
                  <span className="text-white">
                    {stages.sensitivity.monteCarlo?.iterations}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">
                    Positive NPV Probability:
                  </span>
                  <span className="text-green-400">
                    {(
                      stages.sensitivity.monteCarlo?.risk_metrics
                        ?.probability_positive_npv * 100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Expected Value:</span>
                  <span className="text-white">
                    $
                    {(
                      stages.sensitivity.monteCarlo?.risk_metrics
                        ?.expected_value / 1000000
                    ).toFixed(2)}
                    M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Value at Risk (95%):</span>
                  <span className="text-yellow-400">
                    $
                    {(
                      stages.sensitivity.monteCarlo?.risk_metrics
                        ?.value_at_risk_95 / 1000000
                    ).toFixed(2)}
                    M
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-neutral-900 border-neutral-800">
              <h4 className="text-sm font-semibold mb-3">
                95% Confidence Interval
              </h4>
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">NPV Range:</span>
                  <span className="text-white">
                    $
                    {(
                      stages.sensitivity.monteCarlo?.confidence_95_percent
                        ?.npv_min / 1000000
                    ).toFixed(2)}
                    M - $
                    {(
                      stages.sensitivity.monteCarlo?.confidence_95_percent
                        ?.npv_max / 1000000
                    ).toFixed(2)}
                    M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Payback Range:</span>
                  <span className="text-white">
                    {stages.sensitivity.monteCarlo?.confidence_95_percent?.roi_min_months?.toFixed(
                      0
                    )}{" "}
                    -
                    {stages.sensitivity.monteCarlo?.confidence_95_percent?.roi_max_months?.toFixed(
                      0
                    )}{" "}
                    mo
                  </span>
                </div>
              </div>
            </Card>

            {stages.sensitivity.tornadoChart?.length > 0 && (
              <Card className="p-4 bg-neutral-900 border-neutral-800">
                <h4 className="text-sm font-semibold mb-3">
                  Sensitivity Rankings
                </h4>
                <div className="text-xs space-y-1">
                  {stages.sensitivity.tornadoChart
                    .slice(0, 5)
                    .map((item: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-neutral-400">
                          {item.variable}:
                        </span>
                        <span className="text-white">
                          ${(item.impact_on_npv / 1000).toFixed(0)}k impact
                        </span>
                      </div>
                    ))}
                </div>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {errors?.length > 0 && (
        <Card className="p-4 bg-red-950/20 border-red-900">
          <h4 className="text-sm font-semibold text-red-400 mb-2">
            Pipeline Errors
          </h4>
          <ul className="text-xs text-red-300 space-y-1">
            {errors.map((e: any, i: number) => (
              <li key={i}>
                <strong>{e.stage}:</strong> {e.message}
                {e.recoverable && (
                  <span className="text-red-400 ml-2">(recoverable)</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
export default PipelineStagesPanel;
