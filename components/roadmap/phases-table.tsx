"use client"
import type { PlanResult } from "@/types"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSimulatorStore } from "@/store/simulator-store"

export function PhasesTable({ plan }: { plan?: PlanResult }) {
  const { roadmapDrawerOpen, setRoadmapDrawerOpen } = useSimulatorStore((s) => ({
    roadmapDrawerOpen: s.roadmapDrawerOpen,
    setRoadmapDrawerOpen: s.setRoadmapDrawerOpen,
  }))

  return (
    <Drawer open={roadmapDrawerOpen} onOpenChange={setRoadmapDrawerOpen}>
      <DrawerContent className="bg-[#0b0f12] text-white border-[#353b42]">
        <DrawerHeader>
          <DrawerTitle>Roadmap Details</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[70vh] overflow-auto p-4">
          <Table>
            <TableHeader>
              <TableRow className="border-[#353b42]">
                <TableHead className="text-gray-300">Phase</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Start</TableHead>
                <TableHead className="text-gray-300">End</TableHead>
                <TableHead className="text-gray-300">CapEx</TableHead>
                <TableHead className="text-gray-300">Proj ΔCO₂</TableHead>
                <TableHead className="text-gray-300">Actual ΔCO₂</TableHead>
                <TableHead className="text-gray-300">Allocations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan?.phases.map((p) => (
                <TableRow key={p.id} className="border-[#353b42] hover:bg-[#1a1f24]">
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="capitalize">{p.status}</TableCell>
                  <TableCell>{new Date(p.start).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(p.end).toLocaleDateString()}</TableCell>
                  <TableCell>${Math.round(p.capex).toLocaleString()}</TableCell>
                  <TableCell>{Math.round(p.projDeltaCO2).toLocaleString()} t</TableCell>
                  <TableCell>{Math.round(p.actuals?.realizedCO2Delta ?? 0).toLocaleString()} t</TableCell>
                  <TableCell className="truncate">{p.allocations.map((a) => a.tech).join(", ") || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
