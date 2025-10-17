export function MetricsExplainer() {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
      <p className="font-medium mb-1">What do these metrics mean?</p>
      <ul className="list-disc pl-5 space-y-2 text-neutral-300">
        <li>
          Power Usage Effectiveness (PUE): **$$
          {"\\text{PUE} = \\frac{\\text{Total Facility Energy}}{\\text{IT Equipment Energy}}"}$$** — lower is better.
        </li>
        <li>
          Carbon Usage Effectiveness (CUE): **$$
          {"\\text{CUE} = \\frac{\\text{Total CO_2 Emissions}}{\\text{IT Equipment Energy}}"}$$** — lower reflects
          cleaner energy and efficiency.
        </li>
        <li>
          Water Usage Effectiveness (WUE): **$$
          {"\\text{WUE} = \\frac{\\text{Total Water Usage}}{\\text{IT Equipment Energy}}"}$$** — lower suggests reduced
          cooling water intensity.
        </li>
      </ul>
    </div>
  )
}
