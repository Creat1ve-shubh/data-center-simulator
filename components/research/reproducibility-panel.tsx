"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { type ReproducibilityPackage, exportReproducibilityPackage, exportAsCSV } from "@/lib/utils/reproducibility"

interface ReproducibilityPanelProps {
  package: ReproducibilityPackage
}

export function ReproducibilityPanel({ package: pkg }: ReproducibilityPanelProps) {
  const [copied, setCopied] = useState(false)

  const handleExportJSON = () => {
    const json = exportReproducibilityPackage(pkg)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reproducibility-${pkg.region.name}-${new Date().toISOString().split("T")[0]}.json`
    a.click()
  }

  const handleExportCSV = () => {
    const csv = exportAsCSV(pkg.input_data)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `telemetry-${pkg.region.name}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const handleCopyJSON = () => {
    const json = exportReproducibilityPackage(pkg)
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Reproducibility Package</h3>
        <p className="text-sm text-gray-400 mb-4">Export research results for reproducibility and peer review</p>
      </div>

      <div className="space-y-2">
        <div className="text-sm">
          <p className="font-medium">Version: {pkg.version}</p>
          <p className="text-gray-400">Generated: {new Date(pkg.timestamp).toLocaleString()}</p>
          <p className="text-gray-400">Region: {pkg.region.name}</p>
          <p className="text-gray-400">Data Points: {pkg.input_data.length}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-sm">Assumptions</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          {pkg.metadata.assumptions.map((assumption, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>{assumption}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={handleExportJSON} variant="outline" size="sm" className="text-xs bg-transparent">
          Export JSON
        </Button>
        <Button onClick={handleExportCSV} variant="outline" size="sm" className="text-xs bg-transparent">
          Export CSV
        </Button>
        <Button onClick={handleCopyJSON} variant="outline" size="sm" className="text-xs col-span-2 bg-transparent">
          {copied ? "Copied!" : "Copy JSON"}
        </Button>
      </div>
    </Card>
  )
}
