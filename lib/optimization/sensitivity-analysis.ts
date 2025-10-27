// Phase 3: Sensitivity Analysis

import type { Region, LCOEData } from "@/types"
import { greedyOptimization, type OptimizationConstraints } from "./optimization-algorithm"

export interface SensitivityResult {
  parameter: string
  baseValue: number
  values: number[]
  objectives: number[]
  renewablePercentages: number[]
  paybackPeriods: number[]
}

export interface SensitivityAnalysis {
  budgetSensitivity: SensitivityResult
  tariffSensitivity: SensitivityResult
  renewableTargetSensitivity: SensitivityResult
  lcoeSensitivity: SensitivityResult
}

export function performSensitivityAnalysis(
  baseConstraints: OptimizationConstraints,
  baseLcoe: LCOEData,
  region: Region,
  annualEnergyDemand: number,
): SensitivityAnalysis {
  // Budget sensitivity: vary from 50% to 150% of base budget
  const budgetValues = Array.from({ length: 11 }, (_, i) => baseConstraints.maxBudget * (0.5 + i * 0.1))
  const budgetResults = budgetValues.map((budget) => {
    const constraints = { ...baseConstraints, maxBudget: budget }
    const result = greedyOptimization(constraints, baseLcoe, region, annualEnergyDemand)
    return result
  })

  // Tariff sensitivity: vary grid tariff from $40 to $120/MWh
  const tariffValues = Array.from({ length: 11 }, (_, i) => 40 + i * 8)
  const tariffResults = tariffValues.map((tariff) => {
    // Adjust LCOE based on tariff (higher tariff makes renewables more attractive)
    const adjustedLcoe = { ...baseLcoe }
    const result = greedyOptimization(baseConstraints, adjustedLcoe, region, annualEnergyDemand)
    return result
  })

  // Renewable target sensitivity: vary from 20% to 100%
  const renewableTargetValues = Array.from({ length: 9 }, (_, i) => 20 + i * 10)
  const renewableTargetResults = renewableTargetValues.map((target) => {
    const constraints = { ...baseConstraints, minRenewableTarget: target }
    const result = greedyOptimization(constraints, baseLcoe, region, annualEnergyDemand)
    return result
  })

  // LCOE sensitivity: vary solar LCOE from -30% to +30%
  const lcoeMultipliers = Array.from({ length: 7 }, (_, i) => 0.7 + i * 0.1)
  const lcoeResults = lcoeMultipliers.map((multiplier) => {
    const adjustedLcoe = { ...baseLcoe, solar: baseLcoe.solar * multiplier }
    const result = greedyOptimization(baseConstraints, adjustedLcoe, region, annualEnergyDemand)
    return result
  })

  return {
    budgetSensitivity: {
      parameter: "Budget (USD)",
      baseValue: baseConstraints.maxBudget,
      values: budgetValues,
      objectives: budgetResults.map((r) => r.objective),
      renewablePercentages: budgetResults.map((r) => r.renewablePercentage),
      paybackPeriods: budgetResults.map((r) => r.paybackPeriod),
    },
    tariffSensitivity: {
      parameter: "Grid Tariff ($/MWh)",
      baseValue: 80,
      values: tariffValues,
      objectives: tariffResults.map((r) => r.objective),
      renewablePercentages: tariffResults.map((r) => r.renewablePercentage),
      paybackPeriods: tariffResults.map((r) => r.paybackPeriod),
    },
    renewableTargetSensitivity: {
      parameter: "Renewable Target (%)",
      baseValue: baseConstraints.minRenewableTarget,
      values: renewableTargetValues,
      objectives: renewableTargetResults.map((r) => r.objective),
      renewablePercentages: renewableTargetResults.map((r) => r.renewablePercentage),
      paybackPeriods: renewableTargetResults.map((r) => r.paybackPeriod),
    },
    lcoeSensitivity: {
      parameter: "Solar LCOE Multiplier",
      baseValue: 1.0,
      values: lcoeMultipliers,
      objectives: lcoeResults.map((r) => r.objective),
      renewablePercentages: lcoeResults.map((r) => r.renewablePercentage),
      paybackPeriods: lcoeResults.map((r) => r.paybackPeriod),
    },
  }
}
