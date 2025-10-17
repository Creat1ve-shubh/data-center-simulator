"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    const flag = localStorage.getItem("sim_onboarding_dismissed")
    if (!flag) setOpen(true)
  }, [])

  function handleClose() {
    setOpen(false)
    if (dontShowAgain) {
      localStorage.setItem("sim_onboarding_dismissed", "1")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg border-neutral-800 bg-neutral-900 text-neutral-100">
        <DialogHeader>
          <DialogTitle>Data Center Efficiency Simulator</DialogTitle>
          <DialogDescription className="text-neutral-300">
            Analyze current efficiency and plan your renewable transition—no external APIs required. Upload telemetry
            (CSV), adjust scenarios, and switch between Efficiency Analysis and the Transition Roadmap using the
            top-center toggle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm text-neutral-300">
          <p>Quick start:</p>
          <ul className="list-disc pl-5">
            <li>Use the left panel to upload CSV telemetry or load sample data.</li>
            <li>Adjust costs, energy mix, and materials to simulate phases.</li>
            <li>View metrics (PUE, CUE, WUE), sustainability score, and a dynamic roadmap.</li>
          </ul>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="size-4 accent-teal-400"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>Don’t show again</span>
          </label>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="bg-teal-500 hover:bg-teal-400 text-black">
            Get started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
