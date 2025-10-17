"use client"

import { useMemo } from "react"
import type { TelemetryPoint } from "@/types"
import { AlertCircle, Lightbulb } from "lucide-react"

type Props = {
  telemetry: TelemetryPoint[]
}

export function AlertsRecommendations({ telemetry }: Props) {
  const alerts = useMemo(() => {
    if (!telemetry.length) return []

    const issues: { type: "alert" | "recommendation"; title: string; description: string }[] = []

    // Check for high PUE
    const avgPue =
      telemetry.reduce((a, b) => a + b.facility_energy_kWh / Math.max(1, b.it_load_kW), 0) / telemetry.length
    if (avgPue > 2) {
      issues.push({
        type: "alert",
        title: "High PUE Detected",
        description: `Average PUE is ${avgPue.toFixed(2)}, indicating inefficient cooling. Consider airflow optimization or cooling system upgrades.`,
      })
    }

    // Check for high water usage
    const avgWue =
      telemetry.reduce((a, b) => a + (b.water_liters || 0) / Math.max(1, b.it_load_kW), 0) / telemetry.length
    if (avgWue > 2) {
      issues.push({
        type: "alert",
        title: "High Water Usage",
        description: `Average WUE is ${avgWue.toFixed(2)} L/kWh. Evaluate water-efficient cooling technologies.`,
      })
    }

    // Check for high emissions
    const avgCue =
      telemetry.reduce((a, b) => a + (b.emissions_kgCO2 || 0) / Math.max(1, b.it_load_kW), 0) / telemetry.length
    if (avgCue > 0.5) {
      issues.push({
        type: "recommendation",
        title: "Renewable Energy Opportunity",
        description: `Current CUE is ${avgCue.toFixed(3)}. Renewable energy integration could reduce emissions by 30-50%.`,
      })
    }

    // Check for load variability
    const itLoads = telemetry.map((t) => t.it_load_kW)
    const meanLoad = itLoads.reduce((a, b) => a + b) / itLoads.length
    const variance = itLoads.reduce((a, b) => a + Math.pow(b - meanLoad, 2)) / itLoads.length
    const stdDev = Math.sqrt(variance)
    if (stdDev / meanLoad > 0.4) {
      issues.push({
        type: "recommendation",
        title: "Load Balancing Opportunity",
        description: `High load variability detected (${((stdDev / meanLoad) * 100).toFixed(0)}%). Better workload distribution could improve efficiency.`,
      })
    }

    return issues
  }, [telemetry])

  if (!alerts.length) {
    return <p className="text-neutral-400 text-sm">No alerts or recommendations at this time.</p>
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`rounded-lg border p-3 flex gap-3 ${
            alert.type === "alert" ? "border-orange-600/50 bg-orange-950/20" : "border-green-600/50 bg-green-950/20"
          }`}
        >
          {alert.type === "alert" ? (
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Lightbulb className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-medium text-neutral-100">{alert.title}</p>
            <p className="text-xs text-neutral-400 mt-1">{alert.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
