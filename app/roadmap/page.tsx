"use client"
import { useSimulatorStore } from "@/store/simulator-store"
import { TransitionRoadmap } from "@/components/roadmap/transition-roadmap"
import { Button } from "@/components/ui/button"

export default function RoadmapPage() {
  const { leftOpen, setLeftOpen } = useSimulatorStore()

  return (
    <>
      <header className="border-b border-neutral-800 bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-neutral-300 hover:text-white"
            onClick={() => setLeftOpen(!leftOpen)}
            aria-expanded={leftOpen}
            title="Toggle panel (Ctrl+B)"
          >
            {leftOpen ? "Hide panel" : "Show panel"}
          </Button>
          <h1 className="text-lg font-semibold">Transition Roadmap</h1>
          <div className="w-[96px]" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 pb-8 flex-1 flex flex-col gap-6 py-4">
        <TransitionRoadmap />
      </div>
    </>
  )
}
