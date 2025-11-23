"use client";

import { RenewableOptimizer } from "@/components/renewable-optimizer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  TrendingUp,
  Leaf,
  DollarSign,
  Clock,
  Database,
} from "lucide-react";

export default function RenewablePlannerPage() {
  return (
    <div className="min-h-screen bg-black py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-white">
              AI-Powered Renewable Planner
            </h1>
            <Badge className="bg-primary/20 text-primary border-primary/40">
              Production Ready
            </Badge>
          </div>
          <p className="mt-2 text-lg text-neutral-400">
            Real-time renewable energy optimization using live weather APIs and
            MILP algorithms
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <Database className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-white text-sm">
                Real-Time Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-400">
                Live solar, wind, and hydro data from NREL, Open-Meteo, and NASA
                APIs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle className="text-white text-sm">
                MILP Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-400">
                Mixed-integer linear programming for optimal capacity sizing
              </p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <DollarSign className="h-8 w-8 text-yellow-500 mb-2" />
              <CardTitle className="text-white text-sm">
                Cost Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-400">
                Detailed ROI, payback period, and lifetime savings calculations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <Leaf className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-white text-sm">CO₂ Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-400">
                Real carbon reduction estimates based on location-specific grid
                data
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="bg-neutral-900 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">How It Works</CardTitle>
            <CardDescription className="text-neutral-400">
              4-step optimization process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/20 text-primary border border-primary/40 w-8 h-8 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h3 className="text-white font-semibold">Location Input</h3>
                </div>
                <p className="text-sm text-neutral-400">
                  Enter coordinates or use browser geolocation
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/20 text-primary border border-primary/40 w-8 h-8 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h3 className="text-white font-semibold">API Fetch</h3>
                </div>
                <p className="text-sm text-neutral-400">
                  Retrieve 8760 hours of solar, wind, hydro, and temperature
                  data
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/20 text-primary border border-primary/40 w-8 h-8 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h3 className="text-white font-semibold">MILP Solve</h3>
                </div>
                <p className="text-sm text-neutral-400">
                  Optimize solar, wind, and battery capacities using linear
                  programming
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/20 text-primary border border-primary/40 w-8 h-8 flex items-center justify-center font-bold">
                    4
                  </div>
                  <h3 className="text-white font-semibold">Results</h3>
                </div>
                <p className="text-sm text-neutral-400">
                  Get optimal plan with costs, savings, ROI, and hourly dispatch
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Optimizer Component */}
        <RenewableOptimizer />

        {/* Data Sources Info */}
        <Card className="bg-neutral-900 border-neutral-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white text-lg">Data Sources</CardTitle>
            <CardDescription className="text-neutral-400">
              Production-grade APIs with hourly resolution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-white font-semibold">
                  Solar (NREL NSRDB API)
                </h4>
                <p className="text-sm text-neutral-400">
                  Global Horizontal Irradiance (GHI), Direct Normal Irradiance
                  (DNI), and Diffuse Horizontal Irradiance (DHI). Converted to
                  PV power output using efficiency model.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-semibold">
                  Wind (Open-Meteo Renewable API)
                </h4>
                <p className="text-sm text-neutral-400">
                  Wind speed at 10m, 80m, 120m heights. Converted to turbine
                  power output using power curve model (2.5MW turbine with 6.5
                  m/s cut-in, 12 m/s rated, 25 m/s cut-out).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-semibold">
                  Hydro (Open-Meteo Hydrology API)
                </h4>
                <p className="text-sm text-neutral-400">
                  River discharge data converted to hydroelectric potential
                  using flow-to-power mapping (requires minimum 5 m³/s flow
                  rate).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-semibold">
                  Temperature (NASA POWER API)
                </h4>
                <p className="text-sm text-neutral-400">
                  Ambient temperature for dynamic PUE cooling model. Affects
                  data center energy efficiency and cooling requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Notes */}
        <Card className="bg-neutral-900 border-neutral-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Performance & Limitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-400">
            <div>
              <strong className="text-white">Optimization Time:</strong>{" "}
              Typically 30-60 seconds for full year optimization (8760 hours)
            </div>
            <div>
              <strong className="text-white">API Rate Limits:</strong> NREL
              allows 1000 requests/hour. Open-Meteo and NASA POWER are generous
              but implement caching for production.
            </div>
            <div>
              <strong className="text-white">Data Coverage:</strong> NREL NSRDB
              covers most of North/South America. Use fallback APIs for other
              regions or implement regional data sources.
            </div>
            <div>
              <strong className="text-white">Accuracy:</strong> Results are
              estimates based on historical weather patterns. Actual performance
              will vary based on equipment specifications and local conditions.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
