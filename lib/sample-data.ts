import type { TelemetryPoint } from "@/types"

export function generateSampleTelemetry(): TelemetryPoint[] {
  const now = Date.now()
  const points: TelemetryPoint[] = []
  let it = 1200 // kW
  let facility = 1700 // kWh over interval proxy
  let renewable = 0.3 // 30% renewable energy

  for (let i = 0; i < 288; i++) {
    // 5-min intervals over 24h
    const t = new Date(now - (288 - i) * 5 * 60 * 1000)

    // random walk for IT load
    it = Math.max(600, Math.min(2000, it + (Math.random() - 0.5) * 60))

    // random walk for facility energy
    facility = Math.max(900, Math.min(3000, facility + (Math.random() - 0.5) * 90))

    // random walk for water usage
    const water = Math.max(100, Math.min(2000, (points.at(-1)?.water_liters ?? 500) + (Math.random() - 0.5) * 40))

    // random walk for renewable percentage (30-70%)
    renewable = Math.max(0.3, Math.min(0.7, renewable + (Math.random() - 0.5) * 0.05))

    // Calculate emissions based on energy mix
    // Assume grid carbon intensity: 400 gCO2/kWh (non-renewable), 50 gCO2/kWh (renewable)
    const gridCarbonIntensity = 400 // gCO2/kWh
    const renewableCarbonIntensity = 50 // gCO2/kWh
    const avgCarbonIntensity = (gridCarbonIntensity * (1 - renewable) + renewableCarbonIntensity * renewable) / 1000 // convert to kg
    const emissions = facility * avgCarbonIntensity

    points.push({
      time: t,
      it_load_kW: it,
      facility_energy_kWh: facility,
      water_liters: water,
      emissions_kgCO2: emissions,
      renewable_pct: renewable,
      solar_pct: renewable * 0.4,
      wind_pct: renewable * 0.35,
      hydro_pct: renewable * 0.25,
    })
  }
  return points
}
