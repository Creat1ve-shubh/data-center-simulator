"use client"

import { useMemo, useState } from "react"
import type { TelemetryPoint } from "@/types"
import { Slider } from "@/components/ui/slider"

type Props = {
  telemetry: TelemetryPoint[]
}

export function ITLoadSimulator({ telemetry }: Props) {
  const [itLoadMultiplier, setItLoadMultiplier] = useState(1)

  const baseline = useMemo(() => {
    if (!telemetry.length) return { pue: 0, cost: 0, co2: 0 }
    const avgItLoad = telemetry.reduce((a, b) => a + b.it_load_kW, 0) / telemetry.length
    const avgFacility = telemetry.reduce((a, b) => a + b.facility_energy_kWh, 0) / telemetry.length
    const avgCO2 = telemetry.reduce((a, b) => a + (b.emissions_kgCO2 || 0), 0) / telemetry.length
    const pue = avgFacility / Math.max(1, avgItLoad)
    return {
      pue,
      cost: avgFacility * 0.12, // $0.12/kWh
      co2: avgCO2,
    }
  }, [telemetry])

  const simulated = useMemo(() => {
    const newItLoad = baseline.pue > 0 ? (baseline.cost / 0.12 / baseline.pue) * itLoadMultiplier : 0
    const newCost = baseline.cost * itLoadMultiplier
    const newCO2 = baseline.co2 * itLoadMultiplier
    return {
      pue: baseline.pue,
      cost: newCost,
      co2: newCO2,
      itLoad: newItLoad,
    }
  }, [baseline, itLoadMultiplier])

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-neutral-400 mb-2 block">
          IT Load Multiplier: {itLoadMultiplier.toFixed(2)}x
        </label>
        <Slider
          value={[itLoadMultiplier]}
          onValueChange={(v) => setItLoadMultiplier(v[0])}
          min={0.5}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-neutral-800 bg-neutral-800/50 p-3">
          <p className="text-neutral-500 text-xs">Baseline Cost/hr</p>
          <p className="font-mono text-lg">${baseline.cost.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-800/50 p-3">
          <p className="text-neutral-500 text-xs">Simulated Cost/hr</p>
          <p className="font-mono text-lg text-cyan-400">${simulated.cost.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-800/50 p-3">
          <p className="text-neutral-500 text-xs">Baseline CO₂/hr</p>
          <p className="font-mono text-lg">{baseline.co2.toFixed(1)} kg</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-800/50 p-3">
          <p className="text-neutral-500 text-xs">Simulated CO₂/hr</p>
          <p className="font-mono text-lg text-orange-400">{simulated.co2.toFixed(1)} kg</p>
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Adjust the slider to simulate different IT load scenarios and see the impact on cost and emissions.
      </p>
    </div>
  )
}
