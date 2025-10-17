export function RoadmapExplainer() {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
      <p className="font-medium mb-1">How the roadmap is decided</p>
      <p className="text-neutral-400">
        The simulator ranks technologies by estimated cost per kWh (LCOE) and capacity factor for your region, then
        assembles phases that fit your budget and typical permitting timelines. It adds efficiency retrofits and storage
        when helpful for resilience and peak coverage. Expected vs Actual compares projected reductions to your realized
        telemetry after phase dates.
      </p>
    </div>
  )
}
