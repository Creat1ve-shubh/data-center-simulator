'use client';

import { useState } from 'react';
import { useSimulatorStore } from '@/store/simulator-store';
import { EfficiencyLineChart } from '@/components/charts/efficiency-line';
import { HeatmapCalendar } from '@/components/charts/heatmap-calendar';
import { SankeyEnergy } from '@/components/charts/sankey-energy';
import { ViolinPUE } from '@/components/charts/violin-pue';
import { ParetoInefficiency } from '@/components/charts/pareto-inefficiency';
import { Sparklines } from '@/components/charts/sparklines';
import { RadarBenchmark } from '@/components/charts/radar-benchmark';
import { ITLoadSimulator } from '@/components/efficiency/it-load-simulator';
import { AlertsRecommendations } from '@/components/efficiency/alerts-recommendations';
import { MetricsExplainer } from '@/components/info-panels/metrics-explainer';
import { TelemetryTable } from '@/components/telemetry-table';
import { SustainabilityScore } from '@/components/sustainability-score';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  optimizeRenewableDeployment,
  type OptimizationResult,
} from '@/lib/optimization/auto-plan';
import {
  forecastEnergyConsumption,
  generateSyntheticData,
  type ForecastResult,
} from '@/lib/forecasting/models';
import { analyzeVPPA, type VPPAResult } from '@/lib/financial/vppa';
import { exportToCSV, exportSimulationResults } from '@/lib/utils/export';
import {
  Zap,
  TrendingDown,
  DollarSign,
  Leaf,
  Download,
  Play,
  BarChart3,
  LineChart,
  PieChart,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function EfficiencyPage() {
  const { telemetry, summaries, leftOpen, setLeftOpen } = useSimulatorStore();
  
  // Optimization state
  const [location, setLocation] = useState('Jaipur');
  const [itLoad, setItLoad] = useState(10);
  const [currentPUE, setCurrentPUE] = useState(1.5);
  const [targetPUE, setTargetPUE] = useState(1.2);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  
  // Forecasting state
  const [forecastHorizon, setForecastHorizon] = useState(12);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  
  // VPPA state
  const [vppaStrikePrice, setVppaStrikePrice] = useState(60);
  const [vppaCapacity, setVppaCapacity] = useState(5000);
  const [vppaResult, setVppaResult] = useState<VPPAResult | null>(null);

  const handleRunOptimization = () => {
    const result = optimizeRenewableDeployment({
      location,
      itLoad,
      currentPUE,
      targetPUE,
    });
    setOptimizationResult(result);
  };

  const handleRunForecast = () => {
    // Generate synthetic historical data
    const historicalData = generateSyntheticData(24, itLoad * currentPUE * 730, 0.02);
    const result = forecastEnergyConsumption({
      historicalData,
      horizon: forecastHorizon,
      seasonality: true,
    });
    setForecastResult(result);
  };

  const handleRunVPPA = () => {
    const result = analyzeVPPA({
      contractCapacity: vppaCapacity,
      strikePrice: vppaStrikePrice,
      contractDuration: 10,
      energyType: 'solar',
      location,
      annualEnergyConsumption: itLoad * currentPUE * 8760,
    });
    setVppaResult(result);
  };

  const handleExportResults = () => {
    if (optimizationResult) {
      exportSimulationResults(
        {
          location,
          itLoad,
          currentPUE,
          targetPUE,
          timestamp: new Date().toISOString(),
        },
        [
          {
            metric: 'Solar Capacity (kW)',
            value: optimizationResult.solarCapacity,
          },
          {
            metric: 'Wind Capacity (kW)',
            value: optimizationResult.windCapacity,
          },
          {
            metric: 'Battery Capacity (kWh)',
            value: optimizationResult.batteryCapacity,
          },
          {
            metric: 'Total Cost (USD)',
            value: optimizationResult.estimatedCost,
          },
          {
            metric: 'Annual Savings (USD)',
            value: optimizationResult.annualSavings,
          },
          {
            metric: 'Payback Period (months)',
            value: optimizationResult.paybackPeriod,
          },
          {
            metric: 'CO2 Reduction (tons/year)',
            value: optimizationResult.co2Reduction,
          },
        ],
        optimizationResult.timeline,
        'optimization-results.csv'
      );
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <SustainabilityScore summaries={summaries} />
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">PUE (avg)</p>
          <p className="text-2xl font-semibold">{summaries?.pueAvg?.toFixed(2) ?? '--'}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">CUE (avg)</p>
          <p className="text-2xl font-semibold">{summaries?.cueAvg?.toFixed(3) ?? '--'}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">WUE (avg)</p>
          <p className="text-2xl font-semibold">{summaries?.wueAvg?.toFixed(3) ?? '--'}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="optimization">
              <Zap className="mr-2 h-4 w-4" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="forecasting">
              <LineChart className="mr-2 h-4 w-4" />
              Forecasting
            </TabsTrigger>
            <TabsTrigger value="financial">
              <DollarSign className="mr-2 h-4 w-4" />
              Financial
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
              <Sparklines data={telemetry} />
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
              <EfficiencyLineChart data={telemetry} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                <h3 className="text-sm font-medium mb-4">Benchmark Comparison</h3>
                <RadarBenchmark summaries={summaries} />
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
                <ITLoadSimulator telemetry={telemetry} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
                <HeatmapCalendar data={telemetry} />
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
                <SankeyEnergy data={telemetry} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
                <ViolinPUE data={telemetry} />
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
                <ParetoInefficiency data={telemetry} />
              </div>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <h3 className="text-sm font-medium mb-3">Alerts & Recommendations</h3>
              <AlertsRecommendations telemetry={telemetry} />
            </div>
            <MetricsExplainer />
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2">
              <TelemetryTable data={telemetry} />
            </div>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Renewable Energy Optimization</CardTitle>
                <CardDescription>
                  Automatically generate optimal renewable energy deployment plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <select
                      id="location"
                      title="Select location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="Jaipur">Jaipur, India</option>
                      <option value="Bangalore">Bangalore, India</option>
                      <option value="Mumbai">Mumbai, India</option>
                      <option value="Delhi">Delhi, India</option>
                      <option value="California">California, USA</option>
                      <option value="Texas">Texas, USA</option>
                      <option value="Frankfurt">Frankfurt, Germany</option>
                      <option value="Singapore">Singapore</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itLoad">IT Load (kW)</Label>
                    <Input
                      id="itLoad"
                      type="number"
                      value={itLoad}
                      onChange={(e) => setItLoad(Number(e.target.value))}
                      min="1"
                      max="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentPUE">Current PUE</Label>
                    <Input
                      id="currentPUE"
                      type="number"
                      step="0.1"
                      value={currentPUE}
                      onChange={(e) => setCurrentPUE(Number(e.target.value))}
                      min="1.0"
                      max="3.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetPUE">Target PUE</Label>
                    <Input
                      id="targetPUE"
                      type="number"
                      step="0.1"
                      value={targetPUE}
                      onChange={(e) => setTargetPUE(Number(e.target.value))}
                      min="1.0"
                      max="3.0"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleRunOptimization} className="bg-green-600 hover:bg-green-700">
                    <Play className="mr-2 h-4 w-4" />
                    Run Auto-Plan Optimization
                  </Button>
                  {optimizationResult && (
                    <Button onClick={handleExportResults} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export Results
                    </Button>
                  )}
                </div>

                {optimizationResult && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Solar Capacity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{optimizationResult.solarCapacity} kW</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Wind Capacity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{optimizationResult.windCapacity} kW</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Battery Storage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{optimizationResult.batteryCapacity} kWh</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">${(optimizationResult.estimatedCost / 1000).toFixed(0)}K</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-green-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center space-x-2">
                            <TrendingDown className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="text-sm text-gray-600">Annual Savings</p>
                              <p className="text-2xl font-bold text-green-700">
                                ${(optimizationResult.annualSavings / 1000).toFixed(0)}K
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center space-x-2">
                            <Leaf className="h-8 w-8 text-blue-600" />
                            <div>
                              <p className="text-sm text-gray-600">CO₂ Reduction</p>
                              <p className="text-2xl font-bold text-blue-700">
                                {optimizationResult.co2Reduction} tons/yr
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-yellow-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-8 w-8 text-yellow-600" />
                            <div>
                              <p className="text-sm text-gray-600">Payback Period</p>
                              <p className="text-2xl font-bold text-yellow-700">
                                {optimizationResult.paybackPeriod} months
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Capacity Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsPie>
                            <Pie
                              data={[
                                { name: 'Solar', value: optimizationResult.solarCapacity },
                                { name: 'Wind', value: optimizationResult.windCapacity },
                                { name: 'Battery', value: optimizationResult.batteryCapacity / 4 },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry: any) =>
                                `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`
                              }
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {COLORS.map((color, index) => (
                                <Cell key={`cell-${index}`} fill={color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Implementation Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={optimizationResult.timeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="phase" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="duration" fill="#10b981" name="Duration (months)" />
                            <Bar dataKey="cost" fill="#3b82f6" name="Cost (USD)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {optimizationResult.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start">
                              <Badge variant="outline" className="mr-2 mt-0.5">
                                {idx + 1}
                              </Badge>
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecasting Tab */}
          <TabsContent value="forecasting" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Energy Consumption Forecasting</CardTitle>
                <CardDescription>
                  Predict future energy consumption, costs, and carbon emissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="forecastHorizon">Forecast Horizon (months)</Label>
                    <Input
                      id="forecastHorizon"
                      type="number"
                      value={forecastHorizon}
                      onChange={(e) => setForecastHorizon(Number(e.target.value))}
                      min="1"
                      max="36"
                    />
                  </div>
                </div>

                <Button onClick={handleRunForecast} className="bg-blue-600 hover:bg-blue-700">
                  <Play className="mr-2 h-4 w-4" />
                  Generate Forecast
                </Button>

                {forecastResult && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{forecastResult.metrics.mape}% MAPE</div>
                          <p className="text-xs text-gray-500">Mean Absolute % Error</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Energy Growth</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{forecastResult.trends.energyGrowth}%</div>
                          <p className="text-xs text-gray-500">Per year</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Carbon Intensity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {forecastResult.trends.carbonIntensity.toFixed(3)}
                          </div>
                          <p className="text-xs text-gray-500">kg CO₂ / kWh</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Energy Consumption Forecast</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={forecastResult.predictions}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="energyLower"
                              stackId="1"
                              stroke="#93c5fd"
                              fill="#dbeafe"
                              name="Lower Bound"
                            />
                            <Area
                              type="monotone"
                              dataKey="energy"
                              stackId="2"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              name="Forecast"
                            />
                            <Area
                              type="monotone"
                              dataKey="energyUpper"
                              stackId="3"
                              stroke="#93c5fd"
                              fill="#dbeafe"
                              name="Upper Bound"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Virtual PPA Analysis</CardTitle>
                <CardDescription>
                  Evaluate financial impact of renewable energy power purchase agreements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vppaCapacity">Contract Capacity (kW)</Label>
                    <Input
                      id="vppaCapacity"
                      type="number"
                      value={vppaCapacity}
                      onChange={(e) => setVppaCapacity(Number(e.target.value))}
                      min="100"
                      max="100000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vppaStrikePrice">Strike Price (USD/MWh)</Label>
                    <Input
                      id="vppaStrikePrice"
                      type="number"
                      value={vppaStrikePrice}
                      onChange={(e) => setVppaStrikePrice(Number(e.target.value))}
                      min="20"
                      max="200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={location} disabled />
                  </div>
                </div>

                <Button onClick={handleRunVPPA} className="bg-purple-600 hover:bg-purple-700">
                  <Play className="mr-2 h-4 w-4" />
                  Analyze VPPA
                </Button>

                {vppaResult && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">NPV</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            ${(vppaResult.financialMetrics.npv / 1000).toFixed(0)}K
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">IRR</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {vppaResult.financialMetrics.irr.toFixed(1)}%
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">LCOE</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            ${vppaResult.financialMetrics.lcoe.toFixed(0)}
                          </div>
                          <p className="text-xs text-gray-500">/MWh</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Hedge Effectiveness</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {vppaResult.financialMetrics.hedgeEffectiveness}%
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Cash Flow Projection (10 Years)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsLine data={vppaResult.annualCashFlows}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="cumulativeSavings"
                              stroke="#10b981"
                              strokeWidth={2}
                              name="Cumulative Savings"
                            />
                            <Line
                              type="monotone"
                              dataKey="netCost"
                              stroke="#ef4444"
                              strokeWidth={2}
                              name="Net Cost"
                            />
                          </RechartsLine>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Risk Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Badge>Volume Risk</Badge>
                          <p className="mt-1 text-sm text-gray-600">
                            {vppaResult.riskAnalysis.volumeRisk}
                          </p>
                        </div>
                        <div>
                          <Badge>Price Risk</Badge>
                          <p className="mt-1 text-sm text-gray-600">
                            {vppaResult.riskAnalysis.priceRisk}
                          </p>
                        </div>
                        <div>
                          <Badge>Basis Risk</Badge>
                          <p className="mt-1 text-sm text-gray-600">
                            {vppaResult.riskAnalysis.basisRisk}
                          </p>
                        </div>
                        <div className="mt-4 rounded-lg bg-blue-50 p-4">
                          <p className="font-medium text-blue-900">Recommendation</p>
                          <p className="mt-1 text-sm text-blue-700">
                            {vppaResult.riskAnalysis.recommendation}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
