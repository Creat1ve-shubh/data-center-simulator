"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { useResizeObserver } from "@/hooks/use-resize-observer"
import type { TelemetryPoint } from "@/types"

export function EfficiencyLineChart({ data }: { data: TelemetryPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const size = useResizeObserver(containerRef)

  useEffect(() => {
    if (!size || !svgRef.current) return
    const { width, height } = size
    const margin = { top: 20, right: 20, bottom: 28, left: 44 }
    const w = Math.max(320, width) - margin.left - margin.right
    const h = Math.max(220, height) - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const g = svg
      .attr("width", w + margin.left + margin.right)
      .attr("height", h + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.time) as [Date, Date])
      .range([0, w])
    // Compute PUE for each row
    const withPUE = data.map((d) => ({
      t: d.time,
      pue: d.facility_energy_kWh > 0 && d.it_load_kW > 0 ? d.facility_energy_kWh / d.it_load_kW : Number.NaN,
    }))
    const pueValues = withPUE.map((d) => d.pue).filter((v) => Number.isFinite(v)) as number[]
    const y = d3
      .scaleLinear()
      .domain(d3.extent(pueValues) as [number, number])
      .nice()
      .range([h, 0])

    const line = d3
      .line<{ t: Date; pue: number }>()
      .defined((d) => Number.isFinite(d.pue))
      .x((d) => x(d.t))
      .y((d) => y(d.pue))

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickSizeOuter(0))
      .call((g) => g.selectAll("text").attr("fill", "#d4d4d8"))
      .call((g) => g.selectAll("line,path").attr("stroke", "#3f3f46"))

    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0))
      .call((g) => g.selectAll("text").attr("fill", "#d4d4d8"))
      .call((g) => g.selectAll("line,path").attr("stroke", "#3f3f46"))

    // Line (teal)
    g.append("path")
      .datum(withPUE)
      .attr("fill", "none")
      .attr("stroke", "#14b8a6")
      .attr("stroke-width", 2)
      .attr("d", line)

    // Hover interaction
    const focus = g.append("g").style("display", "none")
    focus.append("circle").attr("r", 4).attr("fill", "#14b8a6")
    const tooltipBg = focus.append("rect").attr("fill", "#111827").attr("stroke", "#374151").attr("rx", 4)
    const tooltipText = focus.append("text").attr("fill", "#e5e7eb").attr("font-size", 12).attr("dy", "-0.7em")

    const bisect = d3.bisector<{ t: Date; pue: number }, Date>((d) => d.t).center
    const overlay = g
      .append("rect")
      .attr("fill", "transparent")
      .attr("pointer-events", "all")
      .attr("width", w)
      .attr("height", h)
      .on("mouseenter", () => focus.style("display", null))
      .on("mouseleave", () => focus.style("display", "none"))
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event)
        const t = x.invert(mx)
        const i = bisect(withPUE, t)
        const d = withPUE[Math.max(0, Math.min(withPUE.length - 1, i))]
        const cx = x(d.t)
        const cy = y(d.pue)
        focus.attr("transform", `translate(${cx},${cy})`)
        const text = `${d.t.toLocaleString()} • PUE ${Number.isFinite(d.pue) ? d.pue.toFixed(2) : "--"}`
        tooltipText.text(text)
        const bbox = (tooltipText.node() as SVGGraphicsElement).getBBox()
        tooltipBg
          .attr("x", bbox.x - 6)
          .attr("y", bbox.y - 4)
          .attr("width", bbox.width + 12)
          .attr("height", bbox.height + 8)
      })

    // Grid (subtle)
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-w)
          .tickFormat(() => ""),
      )
      .call((g) => g.selectAll("line").attr("stroke", "#27272a").attr("stroke-dasharray", "2,2"))
      .call((g) => g.select(".domain").remove())
  }, [data, size])

  return (
    <div ref={containerRef} className="relative w-full h-[340px]">
      <svg ref={svgRef} />
    </div>
  )
}
