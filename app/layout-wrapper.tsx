"use client"

import type React from "react"

import { MainNav } from "@/components/main-nav"
import { OnboardingModal } from "@/components/onboarding-modal"
import { useEffect } from "react"
import { useSimulatorStore } from "@/store/simulator-store"
import { generateSampleTelemetry } from "@/lib/sample-data"
import { computeMetricSummaries } from "@/lib/compute-metrics"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { telemetry, setTelemetry, setSummaries, leftOpen, setLeftOpen } = useSimulatorStore()

  // Initialize sample data
  useEffect(() => {
    if (!telemetry || telemetry.length === 0) {
      const sample = generateSampleTelemetry()
      setTelemetry(sample)
      setSummaries(computeMetricSummaries(sample))
    }
  }, [telemetry, setTelemetry, setSummaries])

  // Ctrl+B hotkey to toggle left panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault()
        setLeftOpen(!leftOpen)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [leftOpen, setLeftOpen])

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <MainNav />
      <main className="flex-1 flex flex-col">{children}</main>
      <OnboardingModal />
    </div>
  )
}
