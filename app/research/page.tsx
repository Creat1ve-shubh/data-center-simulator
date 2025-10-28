// Phase 6: Research Dashboard Page

import { ResearchDashboard } from "@/components/research/research-dashboard"
import { REGIONS, LCOE_DATA } from "@/lib/data/regions"

export default function ResearchPage() {
  const selectedRegion = REGIONS.find((r) => r.name === "California") || REGIONS[0]
  const annualEnergyDemand = 50000 // MWh/year

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Research Dashboard</h1>
          <p className="text-slate-400">Phases 2-6: Optimization, Forecasting, and Financial Analysis</p>
        </div>

        <ResearchDashboard region={selectedRegion} lcoeData={LCOE_DATA} annualEnergyDemand={annualEnergyDemand} />
      </div>
    </main>
  )
}
