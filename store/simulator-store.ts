"use client"

import { create } from "zustand"
import type { TelemetryPoint, MetricSummaries, RoadmapPhase, PlanInput, PlanResult, RegionId } from "@/types"

type ViewKind = "efficiency" | "roadmap"

type Params = {
  refreshSec: number
  windowHours: number
  tariff: number
  tariffSensitivity: number
  mixSolar: number
  mixWind: number
  mixHydro: number
}

type Store = {
  view: ViewKind
  setView: (v: ViewKind) => void
  leftOpen: boolean
  setLeftOpen: (b: boolean) => void

  telemetry: TelemetryPoint[]
  setTelemetry: (t: TelemetryPoint[]) => void

  summaries: MetricSummaries | null
  setSummaries: (s: MetricSummaries) => void

  phases: RoadmapPhase[]
  addPhase: (p: RoadmapPhase) => void
  updatePhase: (idx: number, p: Partial<RoadmapPhase>) => void

  params: Params
  setParams: (p: Partial<Params>) => void

  planInput: PlanInput
  setPlanInput: (p: Partial<PlanInput>) => void
  planResult: PlanResult | null
  setPlanResult: (r: PlanResult | null) => void
}

export const useSimulatorStore = create<Store>((set) => ({
  view: "efficiency",
  setView: (v) => set({ view: v }),
  leftOpen: true,
  setLeftOpen: (b) => set({ leftOpen: b }),

  telemetry: [],
  setTelemetry: (t) => set({ telemetry: t }),

  summaries: null,
  setSummaries: (s) => set({ summaries: s }),

  phases: [],
  addPhase: (p) => set((st) => ({ phases: [...st.phases, p] })),
  updatePhase: (idx, patch) =>
    set((st) => {
      const next = st.phases.slice()
      next[idx] = { ...next[idx], ...patch }
      return { phases: next }
    }),

  params: {
    refreshSec: 30,
    windowHours: 24,
    tariff: 0.12,
    tariffSensitivity: 10,
    mixSolar: 20,
    mixWind: 10,
    mixHydro: 0,
  },
  setParams: (p) => set((st) => ({ params: { ...st.params, ...p } })),

  planInput: {
    regionId: "us-west" as RegionId,
    targetPct: 40,
    targetYear: new Date().getFullYear() + 3,
    budgetCapUSD: 2_000_000,
    maxPhases: 3,
    maxMonthsPerPhase: 12,
    allowSolar: true,
    allowWind: true,
    allowHydro: false,
    allowStorage: true,
    startDate: new Date(),
    tariffUSDkWh: 0.12,
  },
  setPlanInput: (p) => set((st) => ({ planInput: { ...st.planInput, ...p } })),
  planResult: null,
  setPlanResult: (r) => set({ planResult: r }),
}))
