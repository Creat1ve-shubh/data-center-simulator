"use client"

import { Button } from "@/components/ui/button"

export type ViewKind = "efficiency" | "roadmap"

export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewKind
  onChange: (v: ViewKind) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Select visualization view"
      className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900 p-1"
    >
      <Button
        role="tab"
        aria-selected={value === "efficiency"}
        onClick={() => onChange("efficiency")}
        className={`rounded-full px-4 py-1 text-sm ${
          value === "efficiency"
            ? "bg-teal-500 text-black hover:bg-teal-400"
            : "bg-transparent text-neutral-300 hover:text-white"
        }`}
      >
        Efficiency Analysis
      </Button>
      <Button
        role="tab"
        aria-selected={value === "roadmap"}
        onClick={() => onChange("roadmap")}
        className={`rounded-full px-4 py-1 text-sm ${
          value === "roadmap"
            ? "bg-teal-500 text-black hover:bg-teal-400"
            : "bg-transparent text-neutral-300 hover:text-white"
        }`}
      >
        Transition Roadmap
      </Button>
    </div>
  )
}
