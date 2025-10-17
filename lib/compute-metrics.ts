import type { TelemetryPoint, MetricSummaries } from "@/types"

export function computeMetricSummaries(data: TelemetryPoint[]): MetricSummaries {
  if (!data || data.length === 0) return { pueAvg: Number.NaN, cueAvg: Number.NaN, wueAvg: Number.NaN }

  let pueSum = 0
  let pueN = 0
  let cueSum = 0
  let cueN = 0
  let wueSum = 0
  let wueN = 0

  for (const d of data) {
    const pue = d.facility_energy_kWh > 0 && d.it_load_kW > 0 ? d.facility_energy_kWh / d.it_load_kW : Number.NaN
    if (Number.isFinite(pue)) {
      pueSum += pue
      pueN++
    }
    const cue = d.emissions_kgCO2 != null && d.it_load_kW > 0 ? d.emissions_kgCO2 / d.it_load_kW : Number.NaN
    if (Number.isFinite(cue)) {
      cueSum += cue
      cueN++
    }
    const wue = d.water_liters != null && d.it_load_kW > 0 ? d.water_liters / d.it_load_kW : Number.NaN
    if (Number.isFinite(wue)) {
      wueSum += wue
      wueN++
    }
  }

  return {
    pueAvg: pueN ? pueSum / pueN : Number.NaN,
    cueAvg: cueN ? cueSum / cueN : Number.NaN,
    wueAvg: wueN ? wueSum / wueN : Number.NaN,
  }
}
