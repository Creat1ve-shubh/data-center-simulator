"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import type { PlanInput } from "@/types"

type Props = {
  planInput: PlanInput
  onUpdate: (updates: Partial<PlanInput>) => void
  onGenerate: () => void
  isGenerating: boolean
}

export function AutoPlanWizard({ planInput, onUpdate, onGenerate, isGenerating }: Props) {
  const [step, setStep] = useState(1)

  const steps = [
    { num: 1, title: "Location & Target", desc: "Set your region and renewable energy goals" },
    { num: 2, title: "Budget & Timeline", desc: "Define financial constraints and timeline" },
    { num: 3, title: "Technology Mix", desc: "Select allowed renewable technologies" },
    { num: 4, title: "Review & Generate", desc: "Review settings and generate roadmap" },
  ]

  return (
    <div className="space-y-4">
      {/* Step Indicator */}
      <div className="flex gap-2">
        {steps.map((s) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              step === s.num ? "bg-teal-500 text-black" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            {s.num}
          </button>
        ))}
      </div>

      {/* Step Content */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-sm">{steps[step - 1].title}</CardTitle>
          <p className="text-xs text-neutral-400 mt-1">{steps[step - 1].desc}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Region</Label>
                <Select value={planInput.regionId} onValueChange={(v) => onUpdate({ regionId: v as any })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-west">US West (High Solar)</SelectItem>
                    <SelectItem value="us-east">US East (Balanced)</SelectItem>
                    <SelectItem value="eu-central">EU Central (Wind-Heavy)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-neutral-500 mt-2">
                  Your region determines available capacity factors and costs for each renewable source.
                </p>
              </div>
              <div>
                <Label className="text-xs">Renewable Energy Target (%)</Label>
                <Slider
                  value={[planInput.targetPct]}
                  onValueChange={(v) => onUpdate({ targetPct: v[0] })}
                  min={5}
                  max={100}
                  step={5}
                  className="mt-2"
                />
                <p className="text-xs text-neutral-400 mt-2">{planInput.targetPct}% of energy from renewables</p>
              </div>
              <div>
                <Label className="text-xs">Target Year</Label>
                <Input
                  type="number"
                  min={new Date().getFullYear()}
                  max={2050}
                  value={planInput.targetYear}
                  onChange={(e) => onUpdate({ targetYear: Number(e.target.value) })}
                  className="bg-neutral-800 border-neutral-700 text-sm"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Total Budget (USD)</Label>
                <Input
                  type="number"
                  min={0}
                  step={50000}
                  value={planInput.budgetCapUSD}
                  onChange={(e) => onUpdate({ budgetCapUSD: Number(e.target.value) })}
                  className="bg-neutral-800 border-neutral-700 text-sm"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Total capital available for the entire transition across all phases.
                </p>
              </div>
              <div>
                <Label className="text-xs">Electricity Tariff ($/kWh)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={planInput.tariffUSDkWh}
                  onChange={(e) => onUpdate({ tariffUSDkWh: Number(e.target.value) })}
                  className="bg-neutral-800 border-neutral-700 text-sm"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Your current grid electricity cost. Used to calculate savings.
                </p>
              </div>
              <div>
                <Label className="text-xs">Max Months per Phase</Label>
                <Slider
                  value={[planInput.maxMonthsPerPhase]}
                  onValueChange={(v) => onUpdate({ maxMonthsPerPhase: v[0] })}
                  min={3}
                  max={24}
                  step={1}
                  className="mt-2"
                />
                <p className="text-xs text-neutral-400 mt-2">{planInput.maxMonthsPerPhase} months per phase</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">Select which renewable technologies to allow:</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "allowSolar", label: "☀️ Solar", desc: "Photovoltaic panels" },
                  { key: "allowWind", label: "💨 Wind", desc: "Wind turbines" },
                  { key: "allowHydro", label: "💧 Hydro", desc: "Hydroelectric" },
                  { key: "allowStorage", label: "🔋 Storage", desc: "Battery systems" },
                ].map((tech) => (
                  <label
                    key={tech.key}
                    className="flex items-start gap-2 p-3 rounded-lg border border-neutral-700 bg-neutral-800 cursor-pointer hover:bg-neutral-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={planInput[tech.key as keyof PlanInput] as boolean}
                      onChange={(e) => onUpdate({ [tech.key]: e.target.checked })}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-xs font-medium">{tech.label}</p>
                      <p className="text-xs text-neutral-500">{tech.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-neutral-800 p-4 space-y-2 border border-neutral-700">
                <p className="text-xs font-medium text-neutral-300">Plan Summary:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-neutral-500">Region:</p>
                    <p className="text-neutral-200 font-medium">{planInput.regionId}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Target:</p>
                    <p className="text-neutral-200 font-medium">
                      {planInput.targetPct}% by {planInput.targetYear}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Budget:</p>
                    <p className="text-neutral-200 font-medium">${(planInput.budgetCapUSD / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Tariff:</p>
                    <p className="text-neutral-200 font-medium">${planInput.tariffUSDkWh.toFixed(3)}/kWh</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-neutral-400">
                The system will generate an optimal multi-phase roadmap based on your region's renewable capacity
                factors, LCOE costs, and permitting timelines.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="flex-1"
        >
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} className="flex-1 bg-teal-500 hover:bg-teal-400 text-black">
            Next
          </Button>
        ) : (
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex-1 bg-teal-500 hover:bg-teal-400 text-black"
          >
            {isGenerating ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Generating...
              </>
            ) : (
              "Generate Roadmap"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
