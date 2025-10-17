"use client"
import type { PlanPhase, PhaseActuals } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sparkline } from "@/components/charts/sparklines"

type Props = {
  phase: PlanPhase
  index: number
  onAddActuals: (phaseId: string, actuals: PhaseActuals) => void
  onReplanFromHere: (index: number) => void
  onPhaseSelect?: (phase: PlanPhase) => void
}

export function PhaseCard({ phase, index, onAddActuals, onReplanFromHere, onPhaseSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<PhaseActuals>({})
  const [isSaving, setIsSaving] = useState(false)

  const statusColor =
    phase.status === "done"
      ? "bg-green-600"
      : phase.status === "in-progress"
        ? "bg-cyan-600"
        : phase.status === "at-risk"
          ? "bg-orange-600"
          : "bg-neutral-600"

  const progressPct = phase.actuals ? 75 : 0

  async function handleSaveActuals() {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      onAddActuals(phase.id, form)
      setOpen(false)
      setForm({})
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800 text-white hover:border-cyan-600 transition-all cursor-pointer group">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{phase.name}</CardTitle>
          <Badge className={cn("text-white text-xs", statusColor)}>{phase.status}</Badge>
        </div>
        <p className="text-xs text-neutral-400">
          {phase.start.toLocaleDateString()} → {phase.end.toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-3" onClick={() => onPhaseSelect?.(phase)}>
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Progress</span>
            <span className="text-neutral-300">{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-neutral-800 p-2">
            <p className="text-neutral-400">CapEx</p>
            <p className="font-mono font-medium">${(phase.capexUSD / 1000).toFixed(0)}k</p>
          </div>
          <div className="rounded bg-neutral-800 p-2">
            <p className="text-neutral-400">Savings/yr</p>
            <p className="font-mono font-medium text-green-400">${(phase.expectedSavingsUSDyr / 1000).toFixed(0)}k</p>
          </div>
          <div className="rounded bg-neutral-800 p-2">
            <p className="text-neutral-400">ΔCO₂</p>
            <p className="font-mono font-medium text-cyan-400">{(phase.projDeltaCO2_kgYr / 1000).toFixed(0)}t</p>
          </div>
          <div className="rounded bg-neutral-800 p-2">
            <p className="text-neutral-400">ΔEnergy</p>
            <p className="font-mono font-medium">{(phase.projDeltaEnergy_kWhYr / 1000).toFixed(0)}k kWh</p>
          </div>
        </div>

        {/* Renewable mix badges */}
        {phase.allocations.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {phase.allocations.map((alloc) => (
              <Badge key={alloc.tech} variant="secondary" className="text-xs bg-neutral-800 text-neutral-300">
                {alloc.tech}
              </Badge>
            ))}
          </div>
        )}

        {/* Sparkline */}
        <div className="h-10">
          <Sparkline
            values={[(phase.actuals?.realizedCO2DeltaKg ?? 0) / 1000, (phase.projDeltaCO2_kgYr ?? 0) / 1000]}
            accent="#06b6d4"
            bg="#1a1f24"
          />
        </div>

        {/* Rationale */}
        {phase.rationale && <p className="text-xs text-neutral-400 line-clamp-2">{phase.rationale}</p>}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="text-xs flex-1">
                Record actuals
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-950 text-white border-neutral-800">
              <DialogHeader>
                <DialogTitle>Record actuals: {phase.name}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startActual">Start (actual)</Label>
                  <Input
                    id="startActual"
                    type="date"
                    className="bg-neutral-900 border-neutral-800 text-white"
                    onChange={(e) => setForm({ ...form, startActual: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div>
                  <Label htmlFor="endActual">End (actual)</Label>
                  <Input
                    id="endActual"
                    type="date"
                    className="bg-neutral-900 border-neutral-800 text-white"
                    onChange={(e) => setForm({ ...form, endActual: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div>
                  <Label htmlFor="capexActual">CapEx (actual)</Label>
                  <Input
                    id="capexActual"
                    type="number"
                    className="bg-neutral-900 border-neutral-800 text-white"
                    onChange={(e) => setForm({ ...form, capexActual: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="opexActual">OpEx (actual)</Label>
                  <Input
                    id="opexActual"
                    type="number"
                    className="bg-neutral-900 border-neutral-800 text-white"
                    onChange={(e) => setForm({ ...form, opexActual: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="realizedKWh">Realized kWh</Label>
                  <Input
                    id="realizedKWh"
                    type="number"
                    className="bg-neutral-900 border-neutral-800 text-white"
                    onChange={(e) => setForm({ ...form, realizedKWh: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="realizedCO2Delta">Realized ΔCO₂ (t)</Label>
                  <Input
                    id="realizedCO2Delta"
                    type="number"
                    className="bg-neutral-900 border-neutral-800 text-white"
                    onChange={(e) => setForm({ ...form, realizedCO2DeltaKg: Number(e.target.value) * 1000 })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="realizedPUEdelta">Realized ΔPUE</Label>
                  <Input
                    id="realizedPUEdelta"
                    type="number"
                    step="0.01"
                    className="bg-neutral-900 border-neutral-800 text-white"
                    onChange={(e) => setForm({ ...form, realizedPUEdelta: Number(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSaveActuals}
                  disabled={isSaving}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⟳</span>
                      Saving...
                    </>
                  ) : (
                    "Save actuals"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="outline" className="text-xs flex-1 bg-transparent border-neutral-700">
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
