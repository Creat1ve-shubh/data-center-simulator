"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LCOE } from "@/lib/data/lcoe"
import { REGION_RESOURCES } from "@/lib/data/regions"
import type { RegionId } from "@/types"

type Props = {
  regionId: RegionId
  tariffUSDkWh: number
  targetPct: number
  budgetCapUSD: number
}

export function CostEstimationPanel({ regionId, tariffUSDkWh, targetPct, budgetCapUSD }: Props) {
  const region = REGION_RESOURCES.find((r) => r.regionId === regionId)
  if (!region) return null

  // Get LCOE for each technology
  const techs = ["solar", "wind", "hydro", "storage", "efficiency"] as const
  const costs = techs.map((tech) => {
    const lcoe = LCOE.find((l) => l.regionId === regionId && l.tech === tech)
    return {
      tech,
      capexPerKW: lcoe?.capexPerKW || 0,
      lcoePerKWh: lcoe?.lcoePerKWh || 0,
    }
  })

  // Calculate estimated annual savings per technology
  const estimatedAnnualEnergy = 1000000 // kWh (placeholder)
  const targetEnergy = (targetPct / 100) * estimatedAnnualEnergy

  // Simple cost estimation: assume equal distribution across allowed techs
  const allowedTechs = costs.filter((c) => c.lcoePerKWh > 0 || c.tech === "efficiency")
  const energyPerTech = targetEnergy / Math.max(1, allowedTechs.length)

  const estimations = allowedTechs.map((c) => {
    const kwhPerKW =
      c.tech === "efficiency"
        ? 1
        : 8760 * (c.tech === "solar" ? region.solarCF : c.tech === "wind" ? region.windCF : region.hydroCF)
    const neededKW = energyPerTech / Math.max(1, kwhPerKW)
    const capex = neededKW * c.capexPerKW
    const annualSavings = energyPerTech * (tariffUSDkWh - c.lcoePerKWh)
    const payback = capex > 0 ? capex / Math.max(1, annualSavings) : 0

    return {
      tech: c.tech,
      capex: Math.round(capex),
      annualSavings: Math.round(annualSavings),
      payback: payback.toFixed(1),
      lcoe: c.lcoePerKWh.toFixed(3),
    }
  })

  const totalCapex = estimations.reduce((a, b) => a + b.capex, 0)
  const totalAnnualSavings = estimations.reduce((a, b) => a + b.annualSavings, 0)
  const avgPayback = totalCapex > 0 ? (totalCapex / Math.max(1, totalAnnualSavings)).toFixed(1) : "N/A"
  const roi = totalCapex > 0 ? (((totalAnnualSavings * 10) / totalCapex) * 100).toFixed(0) : "N/A"

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-sm">Cost Estimation</CardTitle>
        <p className="text-xs text-neutral-400 mt-1">Estimated costs for {targetPct}% renewable transition</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-neutral-800 p-3 border border-neutral-700">
            <p className="text-xs text-neutral-400">Total CapEx</p>
            <p className="text-lg font-bold text-teal-400">${(totalCapex / 1000000).toFixed(1)}M</p>
          </div>
          <div className="rounded-lg bg-neutral-800 p-3 border border-neutral-700">
            <p className="text-xs text-neutral-400">Annual Savings</p>
            <p className="text-lg font-bold text-green-400">${(totalAnnualSavings / 1000).toFixed(0)}K</p>
          </div>
          <div className="rounded-lg bg-neutral-800 p-3 border border-neutral-700">
            <p className="text-xs text-neutral-400">Payback Period</p>
            <p className="text-lg font-bold text-orange-400">{avgPayback} years</p>
          </div>
          <div className="rounded-lg bg-neutral-800 p-3 border border-neutral-700">
            <p className="text-xs text-neutral-400">10-Year ROI</p>
            <p className="text-lg font-bold text-blue-400">{roi}%</p>
          </div>
        </div>

        {/* Budget Feasibility */}
        <div className="rounded-lg bg-neutral-800 p-3 border border-neutral-700">
          <p className="text-xs text-neutral-400 mb-2">Budget Feasibility</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${totalCapex <= budgetCapUSD ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(100, (totalCapex / budgetCapUSD) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium">{totalCapex <= budgetCapUSD ? "✓ Feasible" : "✗ Over budget"}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Estimated: ${(totalCapex / 1000000).toFixed(1)}M / Budget: ${(budgetCapUSD / 1000000).toFixed(1)}M
          </p>
        </div>

        {/* Technology Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-300">Technology Breakdown:</p>
          <div className="space-y-2">
            {estimations.map((est) => (
              <div key={est.tech} className="text-xs rounded-lg bg-neutral-800 p-2 border border-neutral-700">
                <div className="flex justify-between mb-1">
                  <span className="font-medium capitalize">{est.tech}</span>
                  <span className="text-neutral-400">LCOE: ${est.lcoe}/kWh</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-neutral-400">
                  <div>CapEx: ${(est.capex / 1000).toFixed(0)}K</div>
                  <div>Savings: ${(est.annualSavings / 1000).toFixed(0)}K/yr</div>
                  <div>Payback: {est.payback}yr</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
