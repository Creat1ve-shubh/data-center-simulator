import type { TelemetryPoint } from "@/types"

export function generateSampleTelemetry(): TelemetryPoint[] {
  const now = Date.now()
  const points: TelemetryPoint[] = []
  let it = 1200 // kW
  let facility = 1700 // kWh over interval proxy
  for (let i = 0; i < 288; i++) {
    // 5-min intervals over 24h
    const t = new Date(now - (288 - i) * 5 * 60 * 1000)
    // random walk
    it = Math.max(600, Math.min(2000, it + (Math.random() - 0.5) * 60))
    facility = Math.max(900, Math.min(3000, facility + (Math.random() - 0.5) * 90))
    const water = Math.max(100, Math.min(2000, (points.at(-1)?.water_liters ?? 500) + (Math.random() - 0.5) * 40))
    points.push({
      time: t,
      it_load_kW: it,
      facility_energy_kWh: facility,
      water_liters: water,
    })
  }
  return points
}
