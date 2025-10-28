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
  BookOpen,
  Code,
  Database,
  Lightbulb,
  Zap,
  TrendingUp,
  Settings,
  FileText,
} from "lucide-react";

const sections = [
  {
    id: "overview",
    title: "Overview",
    icon: BookOpen,
    content: {
      description:
        "GreenCloud is a research-grade data center energy efficiency simulator that helps organizations optimize their renewable energy deployment and reduce carbon emissions.",
      features: [
        "Real-time PUE calculation and monitoring",
        "Renewable energy optimization (solar, wind, battery)",
        "Financial modeling (LCOE, NPV, IRR, ROI)",
        "Carbon footprint tracking and reduction strategies",
        "Multi-region support with location-specific data",
        "Scenario analysis and sensitivity testing",
      ],
    },
  },
  {
    id: "metrics",
    title: "Key Metrics Explained",
    icon: TrendingUp,
    content: {
      metrics: [
        {
          name: "PUE (Power Usage Effectiveness)",
          formula: "Total Facility Energy / IT Equipment Energy",
          description:
            "Industry standard efficiency metric. Lower is better. World-class: <1.2, Good: 1.2-1.5, Needs improvement: >1.5",
          example:
            "PUE of 1.5 means 50% energy overhead (cooling, power, lighting)",
        },
        {
          name: "WUE (Water Usage Effectiveness)",
          formula: "Annual Water Usage (L) / IT Equipment Energy (kWh)",
          description:
            "Measures water consumption for cooling. Critical in water-scarce regions like Rajasthan.",
          example:
            "WUE of 1.0 L/kWh is excellent, >2.0 indicates high water usage",
        },
        {
          name: "CUE (Carbon Usage Effectiveness)",
          formula: "Total CO₂ Emissions (kg) / IT Equipment Energy (kWh)",
          description:
            "Measures carbon intensity. Affected by grid mix and renewable energy adoption.",
          example: "Coal-heavy grid: 0.8, Solar-heavy: 0.1, 100% renewable: ~0",
        },
        {
          name: "LCOE (Levelized Cost of Energy)",
          formula: "Net Present Value of Costs / Lifetime Energy Production",
          description:
            "Cost per kWh over project lifetime. Accounts for CAPEX, OPEX, financing.",
          example: "Solar LCOE in India: $40-60/MWh, Grid: $80-100/MWh",
        },
        {
          name: "Capacity Factor",
          formula: "Actual Energy Production / Maximum Possible Production",
          description:
            "Percentage of time renewable source operates at full capacity.",
          example: "Solar in Jaipur: 21%, Wind in Texas: 35%, Nuclear: 90%",
        },
      ],
    },
  },
  {
    id: "algorithms",
    title: "Optimization Algorithms",
    icon: Code,
    content: {
      algorithms: [
        {
          name: "Auto-Plan Optimizer",
          description:
            "Determines optimal mix of solar, wind, and battery storage based on location, load profile, and budget constraints.",
          approach:
            "Linear programming with objective function minimizing LCOE while meeting renewable energy targets.",
          inputs:
            "Location, IT load, PUE targets, budget, timeline, electricity rates",
          outputs:
            "Solar capacity (kW), Wind capacity (kW), Battery size (kWh), Investment cost, ROI",
        },
        {
          name: "PUE Predictor",
          description:
            "Forecasts PUE based on cooling efficiency, IT load utilization, and weather conditions.",
          approach:
            "Regression model trained on industry benchmarks and first-principles thermodynamics.",
          accuracy: "±5% MAPE on validation datasets",
        },
        {
          name: "VPPA Financial Model",
          description:
            "Evaluates Virtual Power Purchase Agreements for renewable energy procurement.",
          approach:
            "Discounted cash flow analysis with strike price vs. market price scenarios.",
          considerations:
            "Basis risk, volume risk, price volatility, credit risk",
        },
        {
          name: "Sensitivity Analysis",
          description:
            "Tornado charts and spider plots showing impact of parameter changes on outcomes.",
          approach:
            "One-at-a-time (OAT) sensitivity and Monte Carlo simulation for risk analysis.",
        },
      ],
    },
  },
  {
    id: "data-sources",
    title: "Data Sources",
    icon: Database,
    content: {
      sources: [
        {
          category: "Solar Irradiance",
          source: "NREL NSRDB, NASA POWER",
          description:
            "Global Horizontal Irradiance (GHI) and Direct Normal Irradiance (DNI) data",
          coverage: "1998-present, 4km resolution",
        },
        {
          category: "Wind Speed",
          source: "NREL Wind Toolkit, ERA5",
          description: "Hub height wind speeds at 80m, 100m, 120m",
          coverage: "Global coverage, hourly resolution",
        },
        {
          category: "Grid Carbon Intensity",
          source: "IEA, Ember, CEA India",
          description: "Average CO₂ emissions per kWh by region",
          coverage: "Updated annually, state/country level",
        },
        {
          category: "Electricity Prices",
          source: "CERC India, EIA US, Eurostat",
          description: "Industrial tariffs including demand charges",
          coverage: "Monthly updates, utility-specific",
        },
        {
          category: "Technology Costs",
          source: "NREL ATB, BNEF, IRENA",
          description: "CAPEX/OPEX for solar, wind, batteries, cooling systems",
          coverage: "Annual updates with regional variations",
        },
      ],
    },
  },
  {
    id: "best-practices",
    title: "Best Practices",
    icon: Lightbulb,
    content: {
      practices: [
        {
          category: "Cooling Optimization",
          tips: [
            "Raise cold aisle temperature to 25-27°C (ASHRAE A1 envelope)",
            "Implement hot/cold aisle containment to prevent air mixing",
            "Use free cooling (economizers) when outdoor temp < 15°C",
            "Deploy liquid cooling for high-density racks (>20 kW)",
            "Install variable speed drives (VFDs) on cooling pumps and fans",
          ],
        },
        {
          category: "Power Distribution",
          tips: [
            "Use high-efficiency UPS systems (96%+ online double conversion)",
            "Deploy PDUs with per-outlet metering for granular monitoring",
            "Increase distribution voltage to 415V to reduce losses",
            "Right-size transformers to operate at 80-90% load (peak efficiency)",
            "Implement power capping to prevent oversubscription",
          ],
        },
        {
          category: "Renewable Energy",
          tips: [
            "Size solar for 50-70% of daytime load (best economics)",
            "Add 4-6 hours battery storage for >60% renewable penetration",
            "Consider wind PPAs in high wind regions (CF >30%)",
            "Use DC-coupled solar+storage to reduce conversion losses",
            "Install smart inverters with grid support functions",
          ],
        },
        {
          category: "Monitoring & Analytics",
          tips: [
            "Deploy sub-metering for IT load, cooling, lighting, UPS separately",
            "Calculate PUE in real-time (every 15 minutes minimum)",
            "Set up automated alerts for PUE >1.5 or anomalies",
            "Track server utilization to identify zombie servers (<10% CPU)",
            "Use DCIM software integrated with BMS and EPMS",
          ],
        },
      ],
    },
  },
  {
    id: "api",
    title: "API Reference",
    icon: Settings,
    content: {
      endpoints: [
        {
          method: "POST",
          path: "/api/optimize",
          description: "Run renewable energy optimization",
          requestBody: {
            location: "string",
            itLoad: "number (kW)",
            currentPUE: "number",
            targetPUE: "number",
            budget: "number (USD, optional)",
          },
          response: {
            solarCapacity: "number (kW)",
            windCapacity: "number (kW)",
            batteryCapacity: "number (kWh)",
            estimatedCost: "number (USD)",
            annualSavings: "number (USD)",
            paybackPeriod: "number (months)",
          },
        },
        {
          method: "POST",
          path: "/api/forecast",
          description: "Forecast energy consumption",
          requestBody: {
            historicalData: "array of {timestamp, energy, cost, carbon}",
            horizon: "number (months)",
            seasonality: "boolean",
          },
          response: {
            predictions: "array of monthly forecasts",
            metrics: "{mae, rmse, mape}",
            trends: "{energyGrowth, costGrowth, carbonIntensity}",
          },
        },
      ],
    },
  },
];

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-black py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Documentation</h1>
          <p className="mt-2 text-lg text-neutral-400">
            Complete technical reference for data center energy optimization
          </p>
        </div>

        {/* Quick Navigation */}
        <Card className="mb-8 bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-primary hover:text-white"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documentation Sections */}
        <div className="space-y-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                id={section.id}
                className="scroll-mt-8 bg-neutral-900 border-neutral-800"
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-primary/20 p-2 border border-primary/30">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-white">
                      {section.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Overview Section */}
                  {section.id === "overview" && section.content.description && (
                    <div>
                      <p className="mb-4 text-neutral-300">
                        {section.content.description}
                      </p>
                      <h3 className="mb-2 font-semibold text-white">
                        Key Features
                      </h3>
                      <ul className="space-y-2">
                        {section.content.features?.map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <Zap className="mr-2 mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                            <span className="text-neutral-400">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Metrics Section */}
                  {section.id === "metrics" && (
                    <div className="space-y-6">
                      {section.content.metrics?.map((metric, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-neutral-700 p-4 bg-neutral-800"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="font-semibold text-white">
                              {metric.name}
                            </h3>
                            <Badge variant="outline">Formula</Badge>
                          </div>
                          <code className="mb-3 block rounded bg-neutral-950 p-2 text-sm text-neutral-300 border border-neutral-700">
                            {metric.formula}
                          </code>
                          <p className="mb-2 text-sm text-neutral-400">
                            {metric.description}
                          </p>
                          <div className="rounded bg-blue-900/30 p-3 text-sm border border-blue-800/50">
                            <span className="font-medium text-blue-200">
                              Example:
                            </span>{" "}
                            <span className="text-blue-100">
                              {metric.example}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Algorithms Section */}
                  {section.id === "algorithms" && (
                    <div className="space-y-4">
                      {section.content.algorithms?.map((algo, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-neutral-700 p-4 bg-neutral-800"
                        >
                          <h3 className="mb-2 font-semibold text-white">
                            {algo.name}
                          </h3>
                          <p className="mb-3 text-sm text-neutral-400">
                            {algo.description}
                          </p>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-white">
                                Approach:
                              </span>{" "}
                              <span className="text-neutral-400">
                                {algo.approach}
                              </span>
                            </div>
                            {algo.inputs && (
                              <div>
                                <span className="font-medium text-white">
                                  Inputs:
                                </span>{" "}
                                <span className="text-neutral-400">
                                  {algo.inputs}
                                </span>
                              </div>
                            )}
                            {algo.outputs && (
                              <div>
                                <span className="font-medium text-white">
                                  Outputs:
                                </span>{" "}
                                <span className="text-neutral-400">
                                  {algo.outputs}
                                </span>
                              </div>
                            )}
                            {algo.accuracy && (
                              <div>
                                <Badge className="bg-green-900/30 text-green-200 border-green-700/50">
                                  {algo.accuracy}
                                </Badge>
                              </div>
                            )}
                            {algo.considerations && (
                              <div>
                                <span className="font-medium text-white">
                                  Considerations:
                                </span>{" "}
                                <span className="text-neutral-400">
                                  {algo.considerations}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Data Sources Section */}
                  {section.id === "data-sources" && (
                    <div className="space-y-3">
                      {section.content.sources?.map((source, idx) => (
                        <div
                          key={idx}
                          className="flex items-start space-x-3 rounded-lg border border-neutral-700 p-4 bg-neutral-800"
                        >
                          <Database className="mt-1 h-5 w-5 flex-shrink-0 text-neutral-400" />
                          <div className="flex-1">
                            <div className="mb-1 flex items-center justify-between">
                              <h3 className="font-semibold text-white">
                                {source.category}
                              </h3>
                              <Badge variant="secondary">{source.source}</Badge>
                            </div>
                            <p className="mb-1 text-sm text-neutral-400">
                              {source.description}
                            </p>
                            <p className="text-xs text-neutral-500">
                              Coverage: {source.coverage}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Best Practices Section */}
                  {section.id === "best-practices" && (
                    <div className="space-y-6">
                      {section.content.practices?.map((practice, idx) => (
                        <div key={idx}>
                          <h3 className="mb-3 font-semibold text-white">
                            {practice.category}
                          </h3>
                          <ul className="space-y-2">
                            {practice.tips.map((tip, tipIdx) => (
                              <li
                                key={tipIdx}
                                className="flex items-start rounded-lg bg-green-900/20 p-3 border border-green-700/40"
                              >
                                <span className="mr-2 text-green-400">✓</span>
                                <span className="text-sm text-neutral-300">
                                  {tip}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* API Section */}
                  {section.id === "api" && (
                    <div className="space-y-4">
                      {section.content.endpoints?.map((endpoint, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-neutral-700 p-4 bg-neutral-800"
                        >
                          <div className="mb-3 flex items-center space-x-2">
                            <Badge
                              className={
                                endpoint.method === "POST"
                                  ? "bg-blue-900/30 text-blue-200 border-blue-700/50"
                                  : "bg-green-900/30 text-green-200 border-green-700/50"
                              }
                            >
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm font-mono text-neutral-200">
                              {endpoint.path}
                            </code>
                          </div>
                          <p className="mb-3 text-sm text-neutral-400">
                            {endpoint.description}
                          </p>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h4 className="mb-2 text-sm font-semibold text-white">
                                Request Body
                              </h4>
                              <pre className="overflow-x-auto rounded bg-neutral-950 p-3 text-xs text-neutral-300 border border-neutral-700">
                                {JSON.stringify(endpoint.requestBody, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <h4 className="mb-2 text-sm font-semibold text-white">
                                Response
                              </h4>
                              <pre className="overflow-x-auto rounded bg-neutral-950 p-3 text-xs text-neutral-300 border border-neutral-700">
                                {JSON.stringify(endpoint.response, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer CTA */}
        <Card className="mt-12 bg-gradient-to-r from-green-900/20 to-blue-900/20 border-neutral-800">
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold text-white">Need More Help?</h2>
            <p className="mt-2 text-neutral-400">
              Check out our case studies or reach out to our team for
              personalized guidance
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <a
                href="/case-studies"
                className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90"
              >
                View Case Studies
              </a>
              <a
                href="/efficiency"
                className="rounded-lg bg-neutral-800 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-neutral-700 border border-neutral-700"
              >
                Try Simulator
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
