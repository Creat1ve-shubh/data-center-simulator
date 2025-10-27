"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"

const CASE_STUDIES = [
  {
    id: "jaipur",
    title: "Jaipur, India - Solar-Dominant",
    location: "Jaipur, India",
    size: "250 kWh/day",
    renewableMix: "60% Solar / 30% Grid / 10% Battery",
    results: {
      co2Reduction: 49,
      costSavings: 14.5,
      roiMonths: 16,
    },
    highlights: [
      "Deployed rooftop solar covering 60% of energy demand",
      "Battery storage for peak shaving",
      "Reduced grid dependency by 18%",
      "High irradiance conditions optimize ROI",
    ],
  },
  {
    id: "hamburg",
    title: "Hamburg, Germany - Wind-Dominant",
    location: "Hamburg, Germany",
    size: "400 kWh/day",
    renewableMix: "70% Wind / 20% Grid / 10% Solar",
    results: {
      co2Reduction: 46,
      costSavings: 15.7,
      roiMonths: 18,
    },
    highlights: [
      "Integrated wind energy through microgrid partnerships",
      "Dynamic allocation reduces grid backup by 25%",
      "Avoided 12% shortfall from prior static forecasts",
      "Cold climate enables efficient cooling",
    ],
  },
  {
    id: "oslo",
    title: "Oslo, Norway - Hydro-Dominant",
    location: "Oslo, Norway",
    size: "350 kWh/day",
    renewableMix: "90% Hydro / 10% Grid",
    results: {
      co2Reduction: 53,
      costSavings: 7.6,
      roiMonths: 12,
    },
    highlights: [
      "Optimized hydro-heavy mix with forecasting",
      "100% uptime in cold climatic conditions",
      "Reduced over-provisioning waste by 12%",
      "Predictive load balancing",
    ],
  },
  {
    id: "california",
    title: "California, USA - Hybrid Solar-Wind",
    location: "Global Technology Corporation, CA",
    size: "15 MW",
    renewableMix: "40% Renewable (Solar + Wind)",
    results: {
      co2Reduction: 42,
      costSavings: 2300000,
      roiMonths: 24,
    },
    highlights: [
      "PUE improvement from 1.45 → 1.28",
      "$2.3M annual operational savings",
      "Auto-Plan captured 6-7% additional renewable utilization",
      "Enterprise-scale deployment",
    ],
  },
  {
    id: "newyork",
    title: "New York, USA - VPPA Strategy",
    location: "Financial Services Provider, NY",
    size: "8 MW",
    renewableMix: "60% Renewable via VPPAs",
    results: {
      co2Reduction: 23,
      costSavings: 11,
      roiMonths: 20,
    },
    highlights: [
      "23% total energy reduction from workload scheduling",
      "Achieved compliance with regional emission standards",
      "Optimized procurement timing reduced peak purchases by 11%",
      "Zero upfront capital investment",
    ],
  },
]

export default function CaseStudiesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Case Studies</h1>
        <p className="text-gray-600 mt-1">
          Real-world applications of GreenCloud optimization across diverse locations and scales
        </p>
      </div>

      <div className="grid gap-6">
        {CASE_STUDIES.map((study) => (
          <Card key={study.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{study.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{study.location}</p>
                </div>
                <Badge variant="outline">{study.size}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Energy Mix</h4>
                  <p className="text-sm">{study.renewableMix}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 py-4 border-y">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{study.results.co2Reduction}%</div>
                    <div className="text-xs text-gray-600">CO₂ Reduction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {typeof study.results.costSavings === "number" && study.results.costSavings < 100
                        ? `${study.results.costSavings}%`
                        : `$${(study.results.costSavings / 1000000).toFixed(1)}M`}
                    </div>
                    <div className="text-xs text-gray-600">Annual Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{study.results.roiMonths} mo</div>
                    <div className="text-xs text-gray-600">ROI Period</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Key Achievements</h4>
                  <ul className="space-y-2">
                    {study.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-6">
          <p className="text-sm text-center text-gray-700">
            <strong>Note:</strong> These case studies demonstrate GreenCloud's optimization methodology using realistic
            data and scenarios. Results are based on simulator outputs with typical regional conditions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
