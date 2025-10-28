"use client";

import type React from "react";

import { OnboardingModal } from "@/components/onboarding-modal";
import { useEffect } from "react";
import { useSimulatorStore } from "@/store/simulator-store";
import { generateSampleTelemetry } from "@/lib/sample-data";
import { computeMetricSummaries } from "@/lib/compute-metrics";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { telemetry, setTelemetry, setSummaries } = useSimulatorStore();

  // Initialize sample data
  useEffect(() => {
    if (!telemetry || telemetry.length === 0) {
      const sample = generateSampleTelemetry();
      setTelemetry(sample);
      setSummaries(computeMetricSummaries(sample));
    }
  }, [telemetry, setTelemetry, setSummaries]);

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <main className="flex-1 flex flex-col">{children}</main>
      <OnboardingModal />
    </div>
  );
}
