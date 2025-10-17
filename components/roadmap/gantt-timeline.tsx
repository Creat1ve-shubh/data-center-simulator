"use client"

import type { PlanPhase } from "@/types"

type Props = {
  phases: PlanPhase[]
}

export function GanttTimeline({ phases }: Props) {
  if (!phases.length) return <p className="text-neutral-400 text-sm">No phases to display.</p>

  const minDate = new Date(Math.min(...phases.map((p) => p.start.getTime())))
  const maxDate = new Date(Math.max(...phases.map((p) => p.end.getTime())))
  const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)

  const getPosition = (date: Date) => {
    const days = (date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    return (days / totalDays) * 100
  }

  const getWidth = (start: Date, end: Date) => {
    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    return (days / totalDays) * 100
  }

  const statusColors = {
    planned: "bg-neutral-700 hover:bg-neutral-600",
    "in-progress": "bg-cyan-600 hover:bg-cyan-500",
    "at-risk": "bg-orange-600 hover:bg-orange-500",
    done: "bg-green-600 hover:bg-green-500",
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-neutral-100">Phase Timeline (Gantt View)</h3>

      {/* Timeline header with date range */}
      <div className="relative h-8 bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-between px-4 text-xs text-neutral-500 font-medium">
          <span>{minDate.toLocaleDateString()}</span>
          <span>{maxDate.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {phases.map((phase) => (
          <div key={phase.id}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-neutral-200">{phase.name}</p>
              <span className="text-xs text-neutral-500">{Math.round(getWidth(phase.start, phase.end))}%</span>
            </div>
            <div className="relative h-10 bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden group">
              {/* Planned bar */}
              <div
                className={`absolute top-0 bottom-0 ${statusColors[phase.status || "planned"]} opacity-85 transition-all duration-200 flex items-center px-2`}
                style={{
                  left: `${getPosition(phase.start)}%`,
                  width: `${getWidth(phase.start, phase.end)}%`,
                }}
              >
                <span className="text-xs text-white font-medium truncate">
                  {phase.start.toLocaleDateString()} → {phase.end.toLocaleDateString()}
                </span>
              </div>

              {/* Actual dates overlay if available */}
              {phase.actuals?.startActual && phase.actuals?.endActual && (
                <div
                  className="absolute top-0 bottom-0 border-2 border-cyan-400 opacity-70 rounded"
                  style={{
                    left: `${getPosition(new Date(phase.actuals.startActual))}%`,
                    width: `${getWidth(new Date(phase.actuals.startActual), new Date(phase.actuals.endActual))}%`,
                  }}
                  title={`Actual: ${new Date(phase.actuals.startActual).toLocaleDateString()} → ${new Date(phase.actuals.endActual).toLocaleDateString()}`}
                />
              )}

              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 whitespace-nowrap z-10">
                <div className="font-medium">{phase.name}</div>
                <div className="text-neutral-400">CapEx: ${(phase.capexUSD / 1000).toFixed(0)}k</div>
                <div className="text-neutral-400">Savings: ${(phase.expectedSavingsUSDyr / 1000).toFixed(0)}k/yr</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-neutral-400 pt-3 border-t border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-neutral-700" />
          <span>Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-cyan-600" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-600" />
          <span>At Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-600" />
          <span>Done</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-cyan-400" />
          <span>Actual (if recorded)</span>
        </div>
      </div>
    </div>
  )
}
