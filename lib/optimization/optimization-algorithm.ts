// Phase 2: Formalize Optimization Algorithm with Mathematical Constraints

import type { Region, LCOEData } from "@/types"

export interface OptimizationProblem {
  objective: number // Total cost in USD
  solarCapacity: number // MW
  windCapacity: number // MW
  hydroCapacity: number // MW
  batteryCapacity: number // MWh
  gridImportPercentage: number // 0-100%
  renewablePercentage: number // 0-100%
  paybackPeriod: number // years
  annualSavings: number // USD
  emissionReduction: number // kg CO2
}

export interface OptimizationConstraints {
  maxBudget: number // USD
  minRenewableTarget: number // 0-100%
  maxGridImport: number // 0-100%
  siteLandArea: number // hectares
  siteRoofArea: number // m²
  annualEnergyDemand: number // MWh
}

// Decision variables for optimization
interface DecisionVariables {
  solarCapacity: number
  windCapacity: number
  hydroCapacity: number
  batteryCapacity: number
  gridImportPercentage: number
}

// Heuristic greedy algorithm - fast approximation
export function greedyOptimization(
  constraints: OptimizationConstraints,
  lcoeData: LCOEData,
  region: Region,
  annualEnergyDemand: number,
): OptimizationProblem {
  const renewableTarget = constraints.minRenewableTarget
  const targetRenewableEnergy = (annualEnergyDemand * renewableTarget) / 100

  // Sort technologies by LCOE (lowest cost first)
  const technologies = [
    { name: "solar", lcoe: lcoeData.solar, capacity: 0, maxCapacity: constraints.siteRoofArea / 10 },
    { name: "wind", lcoe: lcoeData.wind, capacity: 0, maxCapacity: 50 },
    { name: "hydro", lcoe: lcoeData.hydro, capacity: 0, maxCapacity: 30 },
  ].sort((a, b) => a.lcoe - b.lcoe)

  let remainingEnergy = targetRenewableEnergy
  let totalCapex = 0
  const capacities: Record<string, number> = { solar: 0, wind: 0, hydro: 0 }

  // Greedy allocation: pick cheapest technologies first
  for (const tech of technologies) {
    const capacityFactor = region.capacityFactors[tech.name as keyof typeof region.capacityFactors] || 0.25
    const annualEnergyPerMW = 8760 * capacityFactor
    const neededCapacity = Math.min(remainingEnergy / annualEnergyPerMW, tech.maxCapacity)

    if (neededCapacity > 0) {
      capacities[tech.name] = neededCapacity
      const capex = neededCapacity * tech.lcoe * 1000000 // Convert $/kW to total cost
      totalCapex += capex
      remainingEnergy -= neededCapacity * annualEnergyPerMW

      if (remainingEnergy <= 0) break
    }
  }

  // Add battery storage for 4 hours of peak load
  const peakLoad = (annualEnergyDemand / 8760) * 1.5 // Assume 50% peak multiplier
  const batteryCapacity = (peakLoad * 4) / 1000 // Convert to MWh
  const batteryCapex = batteryCapacity * lcoeData.battery * 1000000
  totalCapex += batteryCapex

  // Calculate financial metrics
  const gridImportPercentage = Math.max(0, (remainingEnergy / annualEnergyDemand) * 100)
  const renewablePercentage = 100 - gridImportPercentage
  const annualOpex = totalCapex * 0.03 // 3% annual maintenance
  const gridCost = ((annualEnergyDemand * gridImportPercentage) / 100) * 80 // $80/MWh grid price
  const annualSavings = gridCost - annualOpex
  const paybackPeriod = totalCapex / Math.max(annualSavings, 1)

  // Estimate emission reduction (assume 0.5 kg CO2/kWh for grid)
  const emissionReduction = ((annualEnergyDemand * renewablePercentage) / 100) * 0.5 * 1000

  return {
    objective: totalCapex,
    solarCapacity: capacities.solar,
    windCapacity: capacities.wind,
    hydroCapacity: capacities.hydro,
    batteryCapacity,
    gridImportPercentage,
    renewablePercentage,
    paybackPeriod,
    annualSavings,
    emissionReduction,
  }
}

// Linear Programming based optimization (simplified)
export function lpOptimization(
  constraints: OptimizationConstraints,
  lcoeData: LCOEData,
  region: Region,
  annualEnergyDemand: number,
): OptimizationProblem {
  // Simplified LP approach: balance cost and renewable target
  const renewableTarget = constraints.minRenewableTarget
  const targetRenewableEnergy = (annualEnergyDemand * renewableTarget) / 100

  // Optimal mix based on LCOE and capacity factors
  const solarCF = region.capacityFactors.solar || 0.25
  const windCF = region.capacityFactors.wind || 0.35
  const hydroCF = region.capacityFactors.hydro || 0.45

  // Weighted allocation based on LCOE efficiency
  const solarWeight = (1 / lcoeData.solar) * solarCF
  const windWeight = (1 / lcoeData.wind) * windCF
  const hydroWeight = (1 / lcoeData.hydro) * hydroCF
  const totalWeight = solarWeight + windWeight + hydroWeight

  const solarAllocation = (solarWeight / totalWeight) * targetRenewableEnergy
  const windAllocation = (windWeight / totalWeight) * targetRenewableEnergy
  const hydroAllocation = (hydroWeight / totalWeight) * targetRenewableEnergy

  const solarCapacity = solarAllocation / (8760 * solarCF)
  const windCapacity = windAllocation / (8760 * windCF)
  const hydroCapacity = hydroAllocation / (8760 * hydroCF)

  const totalCapex =
    solarCapacity * lcoeData.solar * 1000000 +
    windCapacity * lcoeData.wind * 1000000 +
    hydroCapacity * lcoeData.hydro * 1000000

  const batteryCapacity = ((annualEnergyDemand / 8760) * 1.5 * 4) / 1000
  const batteryCapex = batteryCapacity * lcoeData.battery * 1000000
  const totalCost = totalCapex + batteryCapex

  const gridImportPercentage = 100 - renewableTarget
  const annualOpex = totalCost * 0.03
  const gridCost = ((annualEnergyDemand * gridImportPercentage) / 100) * 80
  const annualSavings = gridCost - annualOpex
  const paybackPeriod = totalCost / Math.max(annualSavings, 1)
  const emissionReduction = ((annualEnergyDemand * renewableTarget) / 100) * 0.5 * 1000

  return {
    objective: totalCost,
    solarCapacity,
    windCapacity,
    hydroCapacity,
    batteryCapacity,
    gridImportPercentage,
    renewablePercentage: renewableTarget,
    paybackPeriod,
    annualSavings,
    emissionReduction,
  }
}

// Multi-objective optimization: balance cost, emissions, and reliability
export function multiObjectiveOptimization(
  constraints: OptimizationConstraints,
  lcoeData: LCOEData,
  region: Region,
  annualEnergyDemand: number,
  weights: { cost: number; emissions: number; reliability: number } = { cost: 0.5, emissions: 0.3, reliability: 0.2 },
): OptimizationProblem {
  // Get both solutions
  const greedySolution = greedyOptimization(constraints, lcoeData, region, annualEnergyDemand)
  const lpSolution = lpOptimization(constraints, lcoeData, region, annualEnergyDemand)

  // Normalize objectives (0-1 scale)
  const maxCost = Math.max(greedySolution.objective, lpSolution.objective)
  const maxEmissions = Math.max(greedySolution.emissionReduction, lpSolution.emissionReduction)

  const greedyScore =
    weights.cost * (greedySolution.objective / maxCost) +
    weights.emissions * (1 - greedySolution.emissionReduction / maxEmissions) +
    weights.reliability * (greedySolution.renewablePercentage / 100)

  const lpScore =
    weights.cost * (lpSolution.objective / maxCost) +
    weights.emissions * (1 - lpSolution.emissionReduction / maxEmissions) +
    weights.reliability * (lpSolution.renewablePercentage / 100)

  // Return the solution with better multi-objective score
  return greedyScore < lpScore ? greedySolution : lpSolution
}
