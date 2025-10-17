"use client"

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import type { PlanPhase } from "@/types"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

type Props = {
  phase: PlanPhase | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PhaseDetailDrawer({ phase, open, onOpenChange }: Props) {
  if (!phase) return null

  const costData = [
    { name: "CapEx", value: phase.capexUSD },
    { name: "OpEx (1yr)", value: phase.expectedSavingsUSDyr * 0.1 },
  ]

  const co2Data = [
    { name: "Projected", value: phase.projDeltaCO2_kgYr / 1000 },
    { name: "Actual", value: (phase.actuals?.realizedCO2DeltaKg ?? 0) / 1000 },
  ]

  const COLORS = ["#06b6d4", "#f59e0b"]

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-neutral-950 text-neutral-100 max-h-[90vh]">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle>{phase.name}</DrawerTitle>
            <Badge className="bg-cyan-600 text-white">{phase.status}</Badge>
          </div>
        </DrawerHeader>

        <div className="overflow-auto px-4 pb-4 space-y-6">
          {/* Timeline */}
          <div>
            <h3 className="text-sm font-medium mb-3">Timeline</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <p className="text-xs text-neutral-400">Planned Start</p>
                <p className="font-mono text-sm">{phase.start.toLocaleDateString()}</p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <p className="text-xs text-neutral-400">Planned End</p>
                <p className="font-mono text-sm">{phase.end.toLocaleDateString()}</p>
              </div>
              {phase.actuals?.startActual && (
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <p className="text-xs text-neutral-400">Actual Start</p>
                  <p className="font-mono text-sm text-cyan-400">
                    {new Date(phase.actuals.startActual).toLocaleDateString()}
                  </p>
                </div>
              )}
              {phase.actuals?.endActual && (
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <p className="text-xs text-neutral-400">Actual End</p>
                  <p className="font-mono text-sm text-cyan-400">
                    {new Date(phase.actuals.endActual).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div>
            <h3 className="text-sm font-medium mb-3">Cost Breakdown</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <p className="text-xs text-neutral-400">Planned CapEx</p>
                <p className="font-mono text-lg font-bold">${(phase.capexUSD / 1000).toFixed(0)}k</p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <p className="text-xs text-neutral-400">Expected Savings/yr</p>
                <p className="font-mono text-lg font-bold text-green-400">
                  ${(phase.expectedSavingsUSDyr / 1000).toFixed(0)}k
                </p>
              </div>
              {phase.actuals?.capexActual && (
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <p className="text-xs text-neutral-400">Actual CapEx</p>
                  <p className="font-mono text-lg font-bold text-cyan-400">
                    ${(phase.actuals.capexActual / 1000).toFixed(0)}k
                  </p>
                </div>
              )}
              {phase.actuals?.opexActual && (
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <p className="text-xs text-neutral-400">Actual OpEx</p>
                  <p className="font-mono text-lg font-bold text-cyan-400">
                    ${(phase.actuals.opexActual / 1000).toFixed(0)}k
                  </p>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#353b42" />
                <XAxis dataKey="name" stroke="#6e6e6e" />
                <YAxis stroke="#6e6e6e" />
                <Tooltip contentStyle={{ backgroundColor: "#1a1f24", border: "1px solid #353b42" }} />
                <Bar dataKey="value" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Environmental Impact */}
          <div>
            <h3 className="text-sm font-medium mb-3">Environmental Impact</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <p className="text-xs text-neutral-400">Projected ΔCO₂/yr</p>
                <p className="font-mono text-lg font-bold text-cyan-400">
                  {(phase.projDeltaCO2_kgYr / 1000).toFixed(1)}t
                </p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <p className="text-xs text-neutral-400">Projected ΔEnergy/yr</p>
                <p className="font-mono text-lg font-bold">{(phase.projDeltaEnergy_kWhYr / 1000).toFixed(0)}k kWh</p>
              </div>
              {phase.actuals?.realizedCO2DeltaKg && (
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <p className="text-xs text-neutral-400">Actual ΔCO₂</p>
                  <p className="font-mono text-lg font-bold text-cyan-400">
                    {(phase.actuals.realizedCO2DeltaKg / 1000).toFixed(1)}t
                  </p>
                </div>
              )}
              {phase.actuals?.realizedKWh && (
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <p className="text-xs text-neutral-400">Actual kWh</p>
                  <p className="font-mono text-lg font-bold">{(phase.actuals.realizedKWh / 1000).toFixed(0)}k kWh</p>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={co2Data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(0)}t`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {co2Data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1a1f24", border: "1px solid #353b42" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Technology Allocations */}
          <div>
            <h3 className="text-sm font-medium mb-3">Technology Allocations</h3>
            <div className="space-y-2">
              {phase.allocations.map((alloc, i) => (
                <div key={i} className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm capitalize">{alloc.tech}</p>
                    <Badge variant="secondary" className="text-xs">
                      {alloc.capacityKW.toLocaleString()} kW
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Expected: {alloc.expectedKWhYr.toLocaleString()} kWh/yr • CapEx: ${alloc.capexUSD.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Rationale */}
          {phase.rationale && (
            <div>
              <h3 className="text-sm font-medium mb-2">Rationale</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{phase.rationale}</p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
