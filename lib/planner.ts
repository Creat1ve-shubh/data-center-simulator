import { REGION_RESOURCES } from "@/lib/data/regions"
import { LCOE } from "@/lib/data/lcoe"
import { LEAD_TIMES } from "@/lib/data/lead-times"
import type { PlanInput, PlanResult, PlanPhase, RegionId, TelemetryPoint, TechAllocation } from "@/types"

function getRegionCF(regionId: RegionId) {
  const r = REGION_RESOURCES.find((x) => x.regionId === regionId)!
  return r
}

function getLcoe(regionId: RegionId, tech: TechAllocation["tech"]) {
  return LCOE.find((x) => x.regionId === regionId && x.tech === tech)!
}
function getLead(regionId: RegionId, tech: TechAllocation["tech"]) {
  return LEAD_TIMES.find((x) => x.regionId === regionId && x.tech === tech)!.months
}

function annualizeBaselineEnergy(telemetry: TelemetryPoint[]) {
  if (!telemetry.length) return 0
  // Approximate average facility energy per interval and scale to year
  const avg = telemetry.reduce((a, b) => a + b.facility_energy_kWh, 0) / telemetry.length
  // Guess interval duration from first two points
  const dt =
    telemetry.length > 1 ? Math.max(1, (telemetry[1].time.getTime() - telemetry[0].time.getTime()) / (1000 * 60)) : 5 // minutes
  const intervalsPerYear = (365 * 24 * 60) / dt
  return avg * intervalsPerYear
}

function kWhPerKWYear(cf: number) {
  return cf * 8760
}

function buildAlloc(
  regionId: RegionId,
  tech: TechAllocation["tech"],
  capacityKW: number,
  cf: number,
  tariffUSDkWh: number,
): TechAllocation & { savingsUSDyr: number } {
  const l = getLcoe(regionId, tech)
  const kwhYr = kWhPerKWYear(cf) * capacityKW
  const savings = Math.max(0, tariffUSDkWh - l.lcoePerKWh) * kwhYr
  return {
    tech,
    capacityKW,
    capexUSD: l.capexPerKW * capacityKW,
    expectedKWhYr: kwhYr,
    savingsUSDyr: savings,
  }
}

export function generatePlan(input: PlanInput, telemetry: TelemetryPoint[]): PlanResult {
  const cf = getRegionCF(input.regionId)
  const baseline_kWhYr = annualizeBaselineEnergy(telemetry)
  const targetEnergy_kWhYr = (Math.max(0, Math.min(100, input.targetPct)) / 100) * baseline_kWhYr

  const candidates: Array<{
    tech: TechAllocation["tech"]
    score: number // lower is better (net abatement cost proxy)
    cf: number
  }> = []

  if (input.allowSolar) {
    const l = getLcoe(input.regionId, "solar")
    candidates.push({ tech: "solar", score: l.lcoePerKWh, cf: cf.solarCF })
  }
  if (input.allowWind) {
    const l = getLcoe(input.regionId, "wind")
    candidates.push({ tech: "wind", score: l.lcoePerKWh, cf: cf.windCF })
  }
  if (input.allowHydro) {
    const l = getLcoe(input.regionId, "hydro")
    candidates.push({ tech: "hydro", score: l.lcoePerKWh, cf: cf.hydroCF })
  }

  // Efficiency as "virtual tech" reducing facility energy by percentage with low capex
  const eff = getLcoe(input.regionId, "efficiency")
  candidates.push({ tech: "efficiency", score: Math.max(0.005, eff.lcoePerKWh), cf: 0 })

  // Sort by score (cheapest kWh first)
  candidates.sort((a, b) => a.score - b.score)

  const phases: PlanPhase[] = []
  let remainingBudget = input.budgetCapUSD
  let deliveredEnergy = 0

  const phaseCount = Math.max(3, input.maxPhases)
  let currentStart = new Date(input.startDate)

  for (let p = 0; p < phaseCount; p++) {
    const phaseName = `Phase ${p + 1}`
    const allocations: TechAllocation[] = []
    let phaseCapex = 0
    let phaseEnergy = 0
    let phaseSavings = 0
    const rationaleParts: string[] = []

    if (p >= 3 && deliveredEnergy >= targetEnergy_kWhYr) break
    if (p >= 3 && remainingBudget <= 0) break

    for (const c of candidates) {
      if (p < phaseCount - 1 && deliveredEnergy >= targetEnergy_kWhYr) break

      const remainingEnergy = Math.max(0, targetEnergy_kWhYr - deliveredEnergy)
      const phasesLeft = Math.max(1, phaseCount - p)
      const phaseChunk = remainingEnergy / phasesLeft

      if (c.tech === "efficiency") {
        const plannedPct = 5 // %
        const maxPct = 15
        const existingEffPct =
          allocations.filter((a) => a.tech === "efficiency").reduce((acc, a) => acc + (a.capacityKW || 0), 0) || 0
        if (existingEffPct < maxPct) {
          const addPct = Math.min(plannedPct, maxPct - existingEffPct)
          const kWhReduced = (addPct / 100) * baseline_kWhYr
          const capex = 200_000 // simple proxy
          if (phaseCapex + capex <= remainingBudget) {
            allocations.push({
              tech: "efficiency",
              capacityKW: addPct, // store pct in capacityKW for simplicity
              capexUSD: capex,
              expectedKWhYr: kWhReduced,
            })
            phaseCapex += capex
            phaseEnergy += kWhReduced
            const effSavings = input.tariffUSDkWh * kWhReduced
            phaseSavings += effSavings
            rationaleParts.push(`Efficiency retrofit ${addPct}% to cut baseline energy.`)
          }
        }
        continue
      }

      const l = getLcoe(input.regionId, c.tech)
      const cfVal = c.cf
      if (cfVal <= 0) continue
      const kwhPerKW = kWhPerKWYear(cfVal)
      const neededKW = Math.max(0, phaseChunk / kwhPerKW)
      if (!isFinite(neededKW) || neededKW <= 0) continue

      const capexNeeded = neededKW * l.capexPerKW
      const budgetLeft = remainingBudget - phaseCapex
      const scale = Math.min(1, Math.max(0, budgetLeft / Math.max(1, capexNeeded)))
      const allocKW = Math.max(0, Math.floor(neededKW * scale))

      if (allocKW > 0) {
        const alloc = buildAlloc(input.regionId, c.tech, allocKW, cfVal, input.tariffUSDkWh)
        allocations.push(alloc)
        phaseCapex += alloc.capexUSD
        phaseEnergy += alloc.expectedKWhYr
        phaseSavings += alloc.savingsUSDyr
        rationaleParts.push(
          `${c.tech} chosen for CF ${Math.round(cfVal * 100)}% and LCOE $${l.lcoePerKWh.toFixed(3)}/kWh.`,
        )
      }
    }

    if (allocations.length === 0 && p < 2) {
      allocations.push({
        tech: "solar",
        capacityKW: 100,
        capexUSD: 100_000,
        expectedKWhYr: 100_000,
      })
      phaseCapex = 100_000
      phaseEnergy = 100_000
      rationaleParts.push("Placeholder phase for transition planning.")
    } else if (allocations.length === 0) {
      break
    }

    const phaseLead = Math.min(
      input.maxMonthsPerPhase,
      Math.max(...allocations.map((a) => getLead(input.regionId, a.tech))),
    )
    const start = new Date(currentStart)
    const end = new Date(start)
    end.setMonth(end.getMonth() + phaseLead)
    currentStart = new Date(end)

    const projDeltaCO2 = 0 // Without external factors, assume zero-emission renewables; could multiply by baseline EF if provided.
    deliveredEnergy += phaseEnergy
    remainingBudget -= phaseCapex

    phases.push({
      id: `phase-${p + 1}`,
      name: phaseName,
      start,
      end,
      allocations,
      capexUSD: Math.round(phaseCapex),
      expectedSavingsUSDyr: Math.round(phaseSavings),
      projDeltaCO2_kgYr: Math.round(projDeltaCO2),
      projDeltaEnergy_kWhYr: Math.round(phaseEnergy),
      rationale: rationaleParts.join(" "),
      status: "planned",
    })
  }

  const expectedSeries: PlanResult["expectedSeries"] = []
  if (phases.length) {
    const start = phases[0].start
    const last = phases[phases.length - 1].end
    const cursor = new Date(start)
    let cumEnergy = 0
    const cumCO2 = 0
    while (cursor <= last) {
      const active = phases.filter((ph) => ph.end <= cursor)
      cumEnergy = active.reduce((acc, ph) => acc + ph.projDeltaEnergy_kWhYr / 12, 0) + cumEnergy
      expectedSeries.push({ time: new Date(cursor), cumulativeEnergy_kWh: cumEnergy, cumulativeCO2_kg: cumCO2 })
      cursor.setMonth(cursor.getMonth() + 1)
    }
  }

  return {
    phases,
    expectedSeries,
    totals: {
      capexUSD: phases.reduce((a, b) => a + b.capexUSD, 0),
      expectedSavingsUSDyr: phases.reduce((a, b) => a + b.expectedSavingsUSDyr, 0),
      coveragePct: baseline_kWhYr ? Math.min(100, (deliveredEnergy / baseline_kWhYr) * 100) : 0,
    },
    rationale:
      phases.length > 0
        ? `Plan prioritizes lowest LCOE and higher CF first within budget and permitting limits.`
        : `Insufficient budget or constraints prevent a viable plan.`,
  }
}
