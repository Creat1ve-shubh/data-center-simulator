// Phase 6: Research Dashboard for User Validation

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { OptimizationProblem, OptimizationConstraints } from "@/lib/optimization/optimization-algorithm"
import {
  greedyOptimization,
  lpOptimization,
  multiObjectiveOptimization,
} from "@/lib/optimization/optimization-algorithm"
import { performSensitivityAnalysis } from "@/lib/optimization/sensitivity-analysis"
import { probabilisticForecast } from "@/lib/forecasting/solar-wind-forecast"
import { compareVPPAvsGrid } from "@/lib/financial/vppa-modeling"
import type { Region, LCOEData } from "@/types"

interface ResearchDashboardProps {
  region: Region
  lcoeData: LCOEData
  annualEnergyDemand: number
}

export function ResearchDashboard({ region, lcoeData, annualEnergyDemand }: ResearchDashboardProps) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<"greedy" | "lp" | "multi">("greedy")
  const [showSensitivity, setShowSensitivity] = useState(false)
  const [showForecasting, setShowForecasting] = useState(false)
  const [showVPPA, setShowVPPA] = useState(false)

  const baseConstraints: OptimizationConstraints = {
    maxBudget: 50000000, // $50M
    minRenewableTarget: 80,
    maxGridImport: 20,
    siteLandArea: 100,
    siteRoofArea: 50000,
    annualEnergyDemand,
  }

  let optimization: OptimizationProblem
  if (selectedAlgorithm === "greedy") {
    optimization = greedyOptimization(baseConstraints, lcoeData, region, annualEnergyDemand)
  } else if (selectedAlgorithm === "lp") {
    optimization = lpOptimization(baseConstraints, lcoeData, region, annualEnergyDemand)
  } else {
    optimization = multiObjectiveOptimization(baseConstraints, lcoeData, region, annualEnergyDemand)
  }

  const sensitivity = performSensitivityAnalysis(baseConstraints, lcoeData, region, annualEnergyDemand)
  const forecast = probabilisticForecast(region, 24)
  const vppaComparison = compareVPPAvsGrid(
    {
      duration: 10,
      volume: annualEnergyDemand * 0.8,
      strikePrice: 60,
      escalationRate: 2,
      counterpartyRating: "AA",
    },
    80,
  )

  return (
    <div className="space-y-6">
      {/* Algorithm Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Algorithm Comparison</CardTitle>
          <CardDescription>Phase 2: Formalized optimization with mathematical constraints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {(["greedy", "lp", "multi"] as const).map((algo) => (
              <Button
                key={algo}
                variant={selectedAlgorithm === algo ? "default" : "outline"}
                onClick={() => setSelectedAlgorithm(algo)}
              >
                {algo === "greedy" ? "Greedy" : algo === "lp" ? "Linear Programming" : "Multi-Objective"}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 rounded-lg">
              <p className="text-sm text-slate-400">Total CapEx</p>
              <p className="text-2xl font-bold text-cyan-400">${(optimization.objective / 1000000).toFixed(1)}M</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-lg">
              <p className="text-sm text-slate-400">Renewable %</p>
              <p className="text-2xl font-bold text-green-400">{optimization.renewablePercentage.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-lg">
              <p className="text-sm text-slate-400">Payback Period</p>
              <p className="text-2xl font-bold text-yellow-400">{optimization.paybackPeriod.toFixed(1)} years</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-lg">
              <p className="text-sm text-slate-400">Annual Savings</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${(optimization.annualSavings / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Solar Capacity</p>
              <p className="font-semibold">{optimization.solarCapacity.toFixed(1)} MW</p>
            </div>
            <div>
              <p className="text-slate-400">Wind Capacity</p>
              <p className="font-semibold">{optimization.windCapacity.toFixed(1)} MW</p>
            </div>
            <div>
              <p className="text-slate-400">Hydro Capacity</p>
              <p className="font-semibold">{optimization.hydroCapacity.toFixed(1)} MW</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensitivity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Sensitivity Analysis</CardTitle>
          <CardDescription>Phase 3: Impact of parameter variations on optimization results</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setShowSensitivity(!showSensitivity)}>
            {showSensitivity ? "Hide" : "Show"} Sensitivity Analysis
          </Button>
          {showSensitivity && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-slate-900 rounded-lg">
                <p className="font-semibold mb-2">Budget Sensitivity</p>
                <p className="text-sm text-slate-400">
                  Renewable % ranges from {Math.min(...sensitivity.budgetSensitivity.renewablePercentages).toFixed(1)}%
                  to {Math.max(...sensitivity.budgetSensitivity.renewablePercentages).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-slate-900 rounded-lg">
                <p className="font-semibold mb-2">Tariff Sensitivity</p>
                <p className="text-sm text-slate-400">
                  Payback period ranges from {Math.min(...sensitivity.tariffSensitivity.paybackPeriods).toFixed(1)} to{" "}
                  {Math.max(...sensitivity.tariffSensitivity.paybackPeriods).toFixed(1)} years
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecasting */}
      <Card>
        <CardHeader>
          <CardTitle>Solar & Wind Forecasting</CardTitle>
          <CardDescription>Phase 4: 24-hour probabilistic forecasts with uncertainty quantification</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setShowForecasting(!showForecasting)}>
            {showForecasting ? "Hide" : "Show"} Forecasts
          </Button>
          {showForecasting && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-slate-900 rounded-lg">
                <p className="font-semibold mb-2">Solar Forecast Accuracy (RMSE)</p>
                <p className="text-lg text-cyan-400">{forecast.accuracy.toFixed(2)}%</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-800 rounded">
                  <p className="text-slate-400">Solar (Next 24h)</p>
                  <p className="font-semibold">
                    {forecast.solarForecasts[12]?.forecast.toFixed(1)}% ±{" "}
                    {(
                      (forecast.solarForecasts[12]?.upper68 || 0) - (forecast.solarForecasts[12]?.forecast || 0)
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <div className="p-3 bg-slate-800 rounded">
                  <p className="text-slate-400">Wind (Next 24h)</p>
                  <p className="font-semibold">
                    {forecast.windForecasts[12]?.forecast.toFixed(1)}% ±{" "}
                    {((forecast.windForecasts[12]?.upper68 || 0) - (forecast.windForecasts[12]?.forecast || 0)).toFixed(
                      1,
                    )}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VPPA Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>VPPA Financial Modeling</CardTitle>
          <CardDescription>Phase 5: Virtual Power Purchase Agreement analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setShowVPPA(!showVPPA)}>
            {showVPPA ? "Hide" : "Show"} VPPA Analysis
          </Button>
          {showVPPA && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-lg">
                  <p className="text-sm text-slate-400">NPV (10-year VPPA)</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${(vppaComparison.vppaAnalysis.npv / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="p-4 bg-slate-900 rounded-lg">
                  <p className="text-sm text-slate-400">Total Savings vs Grid</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ${(vppaComparison.savings / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-slate-800 rounded">
                  <p className="text-slate-400">IRR</p>
                  <p className="font-semibold text-yellow-400">{vppaComparison.vppaAnalysis.irr.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-slate-800 rounded">
                  <p className="text-slate-400">Price Stability</p>
                  <p className="font-semibold text-blue-400">
                    {vppaComparison.vppaAnalysis.priceStability.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-slate-800 rounded">
                  <p className="text-slate-400">Risk Score</p>
                  <p className="font-semibold text-orange-400">{vppaComparison.vppaAnalysis.riskScore}/100</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
