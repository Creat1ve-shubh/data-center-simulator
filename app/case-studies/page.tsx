"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  TrendingDown,
  Leaf,
  DollarSign,
  Zap,
  Clock,
  MapPin,
} from "lucide-react";

const caseStudies = [
  {
    id: 1,
    company: "Tech Giant India - Mumbai Data Center",
    location: "Mumbai, India",
    size: "5 MW IT Load",
    industry: "Cloud Services",
    challenge:
      "High energy costs (₹8/kWh) and 1.8 PUE were impacting profitability. Grid carbon intensity of 0.82 kg CO₂/kWh made it difficult to meet corporate sustainability targets.",
    solution: [
      "Implemented AI-driven cooling optimization reducing PUE from 1.8 to 1.3",
      "Deployed 3 MW rooftop solar with 12 MWh battery storage",
      "Signed 2 MW wind PPA with Karnataka wind farm",
      "Installed real-time energy monitoring with DCIM integration",
    ],
    results: {
      pueReduction: "1.8 → 1.3 (28% improvement)",
      renewableEnergy: "65% of total consumption",
      costSavings: "₹4.2 Cr annually ($510K)",
      co2Reduction: "3,200 tons/year",
      payback: "3.2 years",
      additionalBenefits: [
        "Improved LEED certification to Gold",
        "Reduced cooling equipment failures by 40%",
        "Enabled participation in demand response programs",
      ],
    },
    timeline: "18 months (Assessment to Full Operation)",
    investment: "₹18 Cr ($2.2M)",
    icon: Building2,
    color: "blue",
  },
  {
    id: 2,
    company: "European Fintech - Frankfurt Colocation",
    location: "Frankfurt, Germany",
    size: "2 MW IT Load",
    industry: "Financial Services",
    challenge:
      "Extremely high electricity costs (€320/MWh) and strict regulatory requirements for renewable energy usage under EU taxonomy. Limited rooftop space prevented on-site solar deployment.",
    solution: [
      "Negotiated 10-year Virtual PPA for 15 GWh/year wind energy",
      "Implemented waste heat recovery system for district heating",
      "Upgraded to high-efficiency UPS systems (96% efficiency)",
      "Deployed liquid cooling for high-density AI workloads",
    ],
    results: {
      pueReduction: "1.5 → 1.2 (20% improvement)",
      renewableEnergy: "100% via VPPA + RECs",
      costSavings: "€1.2M annually",
      co2Reduction: "4,800 tons/year",
      payback: "Immediate (VPPA hedge locked in savings)",
      additionalBenefits: [
        "Qualified for EU Green Bond financing",
        "Sold waste heat for €150K/year",
        "Reduced cooling CAPEX by 30% with liquid cooling",
      ],
    },
    timeline: "12 months (VPPA negotiation to operation)",
    investment: "€1.8M",
    icon: Building2,
    color: "green",
  },
  {
    id: 3,
    company: "Solar City Data Center - Jaipur",
    location: "Jaipur, Rajasthan",
    size: "1 MW IT Load",
    industry: "SaaS Provider",
    challenge:
      "New greenfield data center in Rajasthan wanted to be 100% renewable from day one. Excellent solar resources (5.5 kWh/m²/day) but unreliable grid and frequent outages.",
    solution: [
      "Built 1.5 MW DC-coupled solar with 4 MWh lithium-ion storage",
      "Implemented evaporative cooling leveraging dry Rajasthan climate",
      "Deployed diesel gensets only for backup (N+1 redundancy)",
      "Used AI-based solar forecasting for battery optimization",
    ],
    results: {
      pueReduction: "Achieved 1.15 PUE from day 1",
      renewableEnergy: "92% solar + storage, 8% grid",
      costSavings: "₹1.8 Cr annually vs. grid-only",
      co2Reduction: "1,850 tons/year",
      payback: "4.5 years",
      additionalBenefits: [
        "Diesel consumption reduced 95% vs. typical Indian DC",
        'Won "Greenest Data Center in India" award',
        "Attracted sustainability-focused enterprise customers",
      ],
    },
    timeline: "24 months (Design to Operation)",
    investment: "₹12 Cr ($1.5M)",
    icon: Building2,
    color: "yellow",
  },
  {
    id: 4,
    company: "HyperScale Cloud - Texas Campus",
    location: "Austin, Texas",
    size: "50 MW IT Load",
    industry: "Hyperscale Cloud",
    challenge:
      "Massive power consumption (350 GWh/year) with high summer cooling loads (100°F+). Texas grid had reliability issues, and need to match 100% renewable energy commitment.",
    solution: [
      "Negotiated portfolio of wind PPAs (200 MW) and solar PPAs (150 MW)",
      "Implemented 100% outside air economization for 60% of the year",
      "Built on-site 10 MW/40 MWh grid-scale battery for demand response",
      "Deployed advanced workload orchestration to follow renewable generation",
    ],
    results: {
      pueReduction: "1.4 → 1.1 (21% improvement)",
      renewableEnergy: "100% matched annually",
      costSavings: "$12M annually via demand response",
      co2Reduction: "175,000 tons/year avoided",
      payback: "N/A (OPEX model via PPAs)",
      additionalBenefits: [
        "Earned $8M/year from grid services (ERCOT)",
        "Enabled carbon-free cloud regions for customers",
        "Reduced water consumption by 85% vs. traditional cooling",
      ],
    },
    timeline: "36 months (Campus build + PPA negotiation)",
    investment: "$45M (infrastructure upgrades)",
    icon: Building2,
    color: "purple",
  },
];

const keyLearnings = [
  {
    title: "Location Matters",
    description:
      "Data center location significantly impacts renewable energy options. Jaipur excels in solar (21% CF), Texas in wind (35% CF), while Singapore faces challenges with both.",
    icon: MapPin,
  },
  {
    title: "PUE First, Renewables Second",
    description:
      "Reducing PUE from 1.8 to 1.3 is more cost-effective than offsetting waste with renewables. Focus on efficiency before generation.",
    icon: Zap,
  },
  {
    title: "Financial Structures Vary",
    description:
      "Direct ownership works for tax-advantaged entities. PPAs work better for enterprises without solar tax credits. VPPAs hedge price risk without physical delivery.",
    icon: DollarSign,
  },
  {
    title: "Storage is Critical",
    description:
      "For >50% renewable penetration, battery storage is essential. 4-6 hours of storage enables 70-80% renewable energy usage.",
    icon: Clock,
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-neutral-950 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-100">
            Real-World Case Studies
          </h1>
          <p className="mt-2 text-lg text-neutral-400">
            Learn from successful data center energy transformations across the
            globe
          </p>
        </div>

        {/* Key Learnings */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {keyLearnings.map((learning) => {
            const Icon = learning.icon;
            return (
              <Card
                key={learning.title}
                className="bg-neutral-900 border-neutral-800"
              >
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="rounded-lg bg-green-600/20 p-2">
                      <Icon className="h-5 w-5 text-green-500" />
                    </div>
                    <CardTitle className="text-base text-neutral-100">
                      {learning.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-400">
                    {learning.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Case Studies */}
        <div className="space-y-8">
          {caseStudies.map((study) => {
            const Icon = study.icon;
            const colorClasses = {
              blue: "bg-blue-900/30 border-blue-700/50",
              green: "bg-green-900/30 border-green-700/50",
              yellow: "bg-yellow-900/30 border-yellow-700/50",
              purple: "bg-purple-900/30 border-purple-700/50",
            };

            return (
              <Card
                key={study.id}
                className="overflow-hidden bg-neutral-900 border-neutral-800"
              >
                <CardHeader
                  className={`${colorClasses[study.color as keyof typeof colorClasses]} border-b`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="rounded-lg p-3 bg-neutral-800">
                        <Icon className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-neutral-100">
                          {study.company}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{study.location}</Badge>
                            <Badge variant="secondary">{study.size}</Badge>
                            <Badge variant="secondary">{study.industry}</Badge>
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Challenge & Solution */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 font-semibold text-neutral-100">
                          Challenge
                        </h3>
                        <p className="text-sm text-neutral-300">
                          {study.challenge}
                        </p>
                      </div>

                      <div>
                        <h3 className="mb-2 font-semibold text-neutral-100">
                          Solution
                        </h3>
                        <ul className="space-y-2 text-sm text-neutral-300">
                          {study.solution.map((item, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2 text-green-500">✓</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-neutral-100">
                        Results
                      </h3>
                      <div className="grid gap-3">
                        <div className="flex items-center justify-between rounded-lg bg-blue-900/20 border border-blue-700/30 p-3">
                          <span className="text-sm font-medium text-blue-200">
                            PUE Improvement
                          </span>
                          <span className="text-sm font-semibold text-blue-400">
                            {study.results.pueReduction}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-green-900/20 border border-green-700/30 p-3">
                          <span className="text-sm font-medium text-green-200">
                            Renewable Energy
                          </span>
                          <span className="text-sm font-semibold text-green-400">
                            {study.results.renewableEnergy}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-yellow-900/20 border border-yellow-700/30 p-3">
                          <span className="text-sm font-medium text-yellow-200">
                            Cost Savings
                          </span>
                          <span className="text-sm font-semibold text-yellow-400">
                            {study.results.costSavings}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-purple-900/20 border border-purple-700/30 p-3">
                          <span className="text-sm font-medium text-purple-200">
                            CO₂ Reduction
                          </span>
                          <span className="text-sm font-semibold text-purple-400">
                            {study.results.co2Reduction}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-neutral-800 p-3">
                          <span className="text-sm font-medium text-neutral-100">
                            Payback Period
                          </span>
                          <span className="text-sm font-semibold text-neutral-300">
                            {study.results.payback}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg bg-neutral-800 p-4">
                        <h4 className="mb-2 text-sm font-semibold text-neutral-100">
                          Additional Benefits
                        </h4>
                        <ul className="space-y-1 text-sm text-neutral-300">
                          {study.results.additionalBenefits.map(
                            (benefit, idx) => (
                              <li key={idx} className="flex items-start">
                                <Leaf className="mr-2 mt-0.5 h-3 w-3 flex-shrink-0 text-green-600" />
                                {benefit}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 flex items-center justify-between border-t border-neutral-700 pt-4 text-sm text-neutral-400">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Timeline: {study.timeline}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Investment: {study.investment}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-green-900/30 to-blue-900/30 border-green-700/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-neutral-100">
              Ready to Optimize Your Data Center?
            </h2>
            <p className="mt-2 text-neutral-300">
              Use our simulator to create a custom renewable energy plan for
              your facility
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <a
                href="/efficiency"
                className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700"
              >
                Run Simulation
              </a>
              <a
                href="/docs"
                className="rounded-lg bg-neutral-800 px-6 py-3 font-medium text-neutral-100 shadow-sm transition-colors hover:bg-neutral-700 border border-neutral-700"
              >
                Read Documentation
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
