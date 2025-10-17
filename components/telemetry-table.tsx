"use client"

import { useState } from "react"
import type { TelemetryPoint } from "@/types"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

export function TelemetryTable({ data }: { data: TelemetryPoint[] }) {
  const [open, setOpen] = useState(false)
  const sample = data.slice(-20) // concise by default

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-neutral-300">
            <tr className="border-b border-neutral-800">
              <th className="text-left py-2 pr-4">Time</th>
              <th className="text-right py-2 pr-4">IT Load (kW)</th>
              <th className="text-right py-2 pr-4">Facility Energy (kWh)</th>
              <th className="text-right py-2 pr-4">Water (L)</th>
              <th className="text-right py-2 pr-0">PUE</th>
            </tr>
          </thead>
          <tbody>
            {sample.map((d, i) => {
              const pue =
                d.facility_energy_kWh > 0 && d.it_load_kW > 0 ? d.facility_energy_kWh / d.it_load_kW : Number.NaN
              return (
                <tr key={i} className="border-b border-neutral-900/60">
                  <td className="py-2 pr-4 text-neutral-300">{d.time.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right">{d.it_load_kW.toFixed(1)}</td>
                  <td className="py-2 pr-4 text-right">{d.facility_energy_kWh.toFixed(1)}</td>
                  <td className="py-2 pr-4 text-right">{(d.water_liters ?? 0).toFixed(0)}</td>
                  <td className="py-2 pr-0 text-right">{Number.isFinite(pue) ? pue.toFixed(2) : "--"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="secondary" className="bg-neutral-800 border border-neutral-700">
              Read more (full telemetry)
            </Button>
          </DrawerTrigger>
          <DrawerContent className="bg-neutral-950 text-neutral-100">
            <DrawerHeader>
              <DrawerTitle>Telemetry (full)</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-auto max-h-[70vh]">
              <table className="w-full text-sm">
                <thead className="text-neutral-300 sticky top-0 bg-neutral-950">
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-2 pr-4">Time</th>
                    <th className="text-right py-2 pr-4">IT Load (kW)</th>
                    <th className="text-right py-2 pr-4">Facility Energy (kWh)</th>
                    <th className="text-right py-2 pr-4">Water (L)</th>
                    <th className="text-right py-2 pr-0">PUE</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => {
                    const pue =
                      d.facility_energy_kWh > 0 && d.it_load_kW > 0 ? d.facility_energy_kWh / d.it_load_kW : Number.NaN
                    return (
                      <tr key={i} className="border-b border-neutral-900/60">
                        <td className="py-2 pr-4 text-neutral-300">{d.time.toLocaleString()}</td>
                        <td className="py-2 pr-4 text-right">{d.it_load_kW.toFixed(1)}</td>
                        <td className="py-2 pr-4 text-right">{d.facility_energy_kWh.toFixed(1)}</td>
                        <td className="py-2 pr-4 text-right">{(d.water_liters ?? 0).toFixed(0)}</td>
                        <td className="py-2 pr-0 text-right">{Number.isFinite(pue) ? pue.toFixed(2) : "--"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
