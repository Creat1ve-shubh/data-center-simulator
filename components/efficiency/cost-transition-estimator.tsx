"use client"

import { Card } from "@/components/ui/card"
import { DollarSign, TrendingUp, Leaf, Clock } from "lucide-react"

interface CostEstimatorProps {
  plan?: {
    estimatedCost: number
    paybackPeriod: number
    annualSavings: number
    co2Reduction: number
  }
}

export function CostTransitionEstimator({ plan }: CostEstimatorProps) {
  if (!plan) {
    return (
      <Card className="p-4 bg-neutral-900 border-neutral-800">
        <p className="text-neutral-400 text-sm">Generate a plan to see cost estimates</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="p-4 bg-neutral-900 border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-teal-500" />
          <span className="text-xs text-neutral-400">Setup Cost</span>
        </div>
        <p className="text-lg font-semibold text-white">${(plan.estimatedCost / 1000000).toFixed(1)}M</p>
      </Card>

      <Card className="p-4 bg-neutral-900 border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-neutral-400">Payback Period</span>
        </div>
        <p className="text-lg font-semibold text-white">{plan.paybackPeriod.toFixed(1)} yrs</p>
      </Card>

      <Card className="p-4 bg-neutral-900 border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-xs text-neutral-400">Annual Savings</span>
        </div>
        <p className="text-lg font-semibold text-white">${(plan.annualSavings / 1000).toFixed(0)}K</p>
      </Card>

      <Card className="p-4 bg-neutral-900 border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="w-4 h-4 text-emerald-500" />
          <span className="text-xs text-neutral-400">CO₂ Reduction</span>
        </div>
        <p className="text-lg font-semibold text-white">{plan.co2Reduction.toLocaleString()} tons/yr</p>
      </Card>
    </div>
  )
}
