"use client"

import { useState } from "react"
import { ReproducibilityPanel } from "@/components/research/reproducibility-panel"
import { createReproducibilityPackage } from "@/lib/utils/reproducibility"
import { generateRealDataset } from "@/lib/data/real-datasets"
import { optimizeRenewableTransition } from "@/lib/optimization/optimization-algorithm"
import { compareBaselines } from "@/lib/validation/baseline-comparisons"
import { performSensitivityAnalysis } from "@/lib/optimization/sensitivity-analysis"
import { REGIONS } from "@/lib/data/regions"

export default function ReproducibilityPage() {
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0])
  const [loading, setLoading] = useState(false)
  const [package_, setPackage] = useState<any>(null)

  const handleGeneratePackage = async () => {
    setLoading(true)
    try {
      // Generate input data
      const inputData = generateRealDataset(selectedRegion, 365)

      // Run optimization
      const optimizationResults = [
        optimizeRenewableTransition(inputData, selectedRegion, {
          budget_USD: 10000000,
          target_renewable_percentage: 80,
          planning_horizon_years: 10,
        }),
      ]

      // Generate baselines
      const baselineResults = compareBaselines(inputData, selectedRegion)

      // Sensitivity analysis
      const sensitivityAnalysis = performSensitivityAnalysis(inputData, selectedRegion)

      // Create package
      const pkg = createReproducibilityPackage(
        selectedRegion,
        inputData,
        optimizationResults,
        baselineResults,
        sensitivityAnalysis,
      )

      setPackage(pkg)
    } catch (error) {
      console.error("Error generating package:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reproducibility Package</h1>
          <p className="text-gray-400">Generate and export research results for peer review and reproducibility</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Region</label>
            <select
              value={selectedRegion.name}
              onChange={(e) => {
                const region = REGIONS.find((r) => r.name === e.target.value)
                if (region) setSelectedRegion(region)
              }}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
            >
              {REGIONS.map((region) => (
                <option key={region.name} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGeneratePackage}
            disabled={loading}
            className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 text-white rounded font-medium"
          >
            {loading ? "Generating..." : "Generate Reproducibility Package"}
          </button>
        </div>

        {package_ && <ReproducibilityPanel package={package_} />}
      </div>
    </div>
  )
}
