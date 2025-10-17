"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import type { TelemetryPoint } from "@/types"

export function HeatmapCalendar({ data }: { data: TelemetryPoint[] }) {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!ref.current || !data.length) return
    const svg = d3.select(ref.current)
    svg.selectAll("*").remove()
    const width = 760,
      height = 140,
      cell = 12,
      padding = 4
    svg.attr("width", width).attr("height", height)

    // Aggregate by day: avg PUE
    const byDay = d3.rollups(
      data,
      (arr) => {
        const pues = arr
          .map((d) =>
            d.facility_energy_kWh > 0 && d.it_load_kW > 0 ? d.facility_energy_kWh / d.it_load_kW : Number.NaN,
          )
          .filter(Number.isFinite) as number[]
        return pues.length ? d3.mean(pues)! : Number.NaN
      },
      (d) => d3.timeDay(d.time),
    )

    const days = byDay.map(([day]) => day as Date)
    const values = byDay.map(([, v]) => v as number).filter(Number.isFinite)
    const color = d3.scaleSequential(d3.interpolateTurbo).domain(d3.extent(values) as [number, number])

    const min = d3.min(days)!,
      max = d3.max(days)!
    const weeks = d3.timeWeek.count(d3.timeWeek.floor(min), max) + 1

    const g = svg.append("g").attr("transform", "translate(20,20)")
    byDay.forEach(([day, val]) => {
      const week = d3.timeWeek.count(d3.timeWeek.floor(min), day as Date)
      const w = week * (cell + padding)
      const dow = (day as Date).getDay()
      g.append("rect")
        .attr("x", w)
        .attr("y", dow * (cell + padding))
        .attr("width", cell)
        .attr("height", cell)
        .attr("rx", 2)
        .attr("fill", Number.isFinite(val as number) ? color(val as number) : "#27272a")
    })

    g.append("text").attr("x", 0).attr("y", -6).attr("fill", "#9ca3af").attr("font-size", 12).text("Daily avg PUE")
  }, [data])

  return (
    <div className="w-full overflow-auto">
      <svg ref={ref} />
    </div>
  )
}
