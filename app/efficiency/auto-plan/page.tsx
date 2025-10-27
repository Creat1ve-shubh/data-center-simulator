"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lightbulb, TrendingDown, DollarSign, Leaf } from "lucide-react"
import { generateLocationDataset } from "@/lib/data/real-datasets"
import { optimizeEnergyMix } from "@/lib/optimization/auto-plan"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { exportResultsToCSV, generatePDFReport } from "@/lib/utils/export"

const LOCATION_INFO = {
  jaipur: { name: "Jaipur, India", climate: "Hot/Sunny", bestRenewable: "Solar" },
  hamburg: { name: "Hamburg, Germany", climate: "Windy/Cool", bestRenewable: "Wind" },
  oslo: { name: "Oslo, Norway", climate: "Cold/Hydro", bestRenewable: "Hydro" },
  california: { name: "California, USA", climate: "Sunny/Moderate", bestRenewable: "Solar" },
  newyork: { name: "New York, USA", climate: "Mixed", bestRenewable: "Mixed" },
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function AutoPlanPage() {
  const [location, setLocation] = useState("jaipur")
  const [itLoad, setItLoad] = useState(10)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runSimulation = async () => {
    setLoading(true)

    try {
      const dataset = generateLocationDataset(location, 8760)
      const scaledLoad = dataset.map((d) => d.itLoadKw * (itLoad / 10))

      const optimizedResult = optimizeEnergyMix({
        locationId: location,
        hourlyLoad: scaledLoad,
        solarCF: dataset.map((d) => d.solarIrradianceWm2 / 1000),
        windCF: dataset.map((d) => Math.min(d.windSpeedMs / 15, 1)),
        gridPrice: dataset.map((d) => d.gridPriceUsdKwh),
        gridCarbon: dataset.map((d) => d.gridCarbonGco2Kwh),
        constraints: {
          maxSolarCapacity: 100,
          maxWindCapacity: 50,
          maxBatteryCapacity: 200,
        },
        costs: {
          solarCapexPerKw: 1200,
          windCapexPerKw: 1500,
          batteryCapexPerKwh: 400,
          maintenancePerKwh: 0.01,
          carbonPricePerTon: 50,
          discountRate: 0.07,
        },
      })

      setResults(optimizedResult)
    } catch (error) {
      console.error("Simulation error:", error)
    }

    setLoading(false)
  }

  const energyMixData = results
    ? [
        { name: "Solar", value: results.capacities.solarKw },
        { name: "Wind", value: results.capacities.windKw },
        { name: "Battery", value: results.capacities.batteryKwh / 10 },
      ]
    : []

  const comparisonData = results
    ? [
        {
          category: "Cost",
          Baseline: results.comparison.baselineCostUSD,
          Optimized: results.metrics.annualOpexUSD,
        },
        {
          category: "CO₂",
          Baseline: results.comparison.baselineCO2Tons,
          Optimized: results.metrics.annualCO2Tons,
        },
      ]
    : []

  const hourlyData =
    results?.hourlyDispatch.slice(0, 168).map((d: any) => ({
      hour: d.hour,
      Grid: d.gridKw,
      Solar: d.solarKw,
      Wind: d.windKw,
      Battery: d.batteryDischargeKw - d.batteryChargeKw,
    })) || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GreenCloud Auto-Plan</h1>
          <p className="text-gray-600 mt-1">Optimize your data center energy mix and reduce carbon emissions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label>Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOCATION_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.name} ({info.bestRenewable}-optimal)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Climate: {LOCATION_INFO[location as keyof typeof LOCATION_INFO].climate}
              </p>
            </div>

            <div>
              <Label>Average IT Load: {itLoad} kW</Label>
              <Slider
                value={[itLoad]}
                onValueChange={([v]) => setItLoad(v)}
                min={5}
                max={50}
                step={0.5}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">Equivalent to ~{Math.round(itLoad / 0.3)} servers</p>
            </div>
          </div>

          <Button onClick={runSimulation} disabled={loading} className="w-full" size="lg">
            {loading ? "Running Simulation..." : "Run Auto-Plan Optimization"}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Cost Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{results.comparison.savingsPct.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">${results.comparison.savingsUSD.toLocaleString()}/yr</div>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">CO₂ Reduction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {results.comparison.co2ReductionPct.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {results.comparison.co2ReductionTons.toFixed(1)} tons/yr
                    </div>
                  </div>
                  <Leaf className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">ROI Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{results.metrics.roiMonths} mo</div>
                    <div className="text-xs text-gray-500">
                      ${results.metrics.totalCapexUSD.toLocaleString()} investment
                    </div>
                  </div>
                  <TrendingDown className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Renewable %</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {(results.metrics.renewableFraction * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">of annual energy</div>
                  </div>
                  <Lightbulb className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>
                Auto-Plan Recommendations for {LOCATION_INFO[location as keyof typeof LOCATION_INFO].name}:
              </strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  Install {results.capacities.solarKw.toFixed(1)} kW of solar panels (~
                  {Math.round(results.capacities.solarKw / 0.4)} m² area)
                </li>
                <li>Deploy {results.capacities.windKw.toFixed(1)} kW of wind capacity</li>
                <li>Add {results.capacities.batteryKwh.toFixed(1)} kWh battery storage for load shifting</li>
                <li>
                  Expected payback in {results.metrics.roiMonths} months with $
                  {results.comparison.savingsUSD.toLocaleString()}/yr savings
                </li>
                <li>Reduce emissions by {results.comparison.co2ReductionTons.toFixed(1)} tons CO₂/year</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="infrastructure" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="hourly">Hourly Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="infrastructure" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Energy Mix</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={energyMixData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) =>
                          `${entry.name}: ${entry.value.toFixed(1)} ${entry.name === "Battery" ? "kWh" : "kW"}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {energyMixData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Baseline vs Optimized</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Baseline" fill="#ff4444" />
                      <Bar dataKey="Optimized" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hourly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Energy Dispatch (First Week)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" label={{ value: "Hour", position: "insideBottom", offset: -5 }} />
                      <YAxis label={{ value: "Power (kW)", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Solar" stroke="#FFD700" strokeWidth={2} />
                      <Line type="monotone" dataKey="Wind" stroke="#00C49F" strokeWidth={2} />
                      <Line type="monotone" dataKey="Grid" stroke="#FF4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="Battery" stroke="#0088FE" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportResultsToCSV(results, location)}>
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const report = generatePDFReport(results, location)
                const blob = new Blob([report], { type: "text/plain" })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `greencloud-report-${location}.txt`
                a.click()
              }}
            >
              Download Report
            </Button>
          </div>
        </>
      )}

      {!results && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              Configure your data center parameters above and click "Run Auto-Plan Optimization" to see results
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
