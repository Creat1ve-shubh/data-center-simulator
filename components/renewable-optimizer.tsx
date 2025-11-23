"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, Zap, DollarSign, Leaf, Clock } from "lucide-react";
import type {
  OptimizationRequest,
  OptimizationResponse,
} from "@/backend/types";

interface RenewableOptimizerProps {
  onResultsUpdate?: (results: OptimizationResponse) => void;
}

export function RenewableOptimizer({
  onResultsUpdate,
}: RenewableOptimizerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<OptimizationResponse | null>(null);

  // Form state
  const [latitude, setLatitude] = useState<string>("37.7749");
  const [longitude, setLongitude] = useState<string>("-122.4194");
  const [averageKW, setAverageKW] = useState<string>("1200");
  const [budget, setBudget] = useState<string>("2000000");
  const [targetRenewable, setTargetRenewable] = useState<string>("80");
  const [electricityPrice, setElectricityPrice] = useState<string>("0.12");

  // Get user's location from browser
  const handleGetLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(4));
        setLongitude(position.coords.longitude.toFixed(4));
        setLoading(false);
      },
      (error) => {
        setError(`Location error: ${error.message}`);
        setLoading(false);
      }
    );
  };

  // Submit optimization request
  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const request: OptimizationRequest = {
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
        currentLoad: {
          averageKW: parseFloat(averageKW),
          peakKW: parseFloat(averageKW) * 1.3, // Assume 30% peak margin
        },
        constraints: {
          budget: parseFloat(budget),
          targetRenewableFraction: parseFloat(targetRenewable) / 100,
          maxSolarKW: 10000,
          maxWindKW: 5000,
          maxBatteryKWh: 5000,
        },
        pricing: {
          electricityUSDPerKWh: parseFloat(electricityPrice),
          carbonUSDPerTon: 50,
          solarCapexUSDPerKW: 1200,
          windCapexUSDPerKW: 1500,
          batteryCapexUSDPerKWh: 300,
        },
      };

      console.log("Sending optimization request:", request);

      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data: OptimizationResponse = await response.json();
      setResults(data);

      if (onResultsUpdate) {
        onResultsUpdate(data);
      }

      console.log("Optimization results:", data);
    } catch (err: any) {
      console.error("Optimization error:", err);
      setError(err.message || "Failed to optimize renewable plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Renewable Energy Optimizer
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Get real-time renewable energy recommendations using live weather
            data and MILP optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude" className="text-neutral-300">
                Latitude
              </Label>
              <Input
                id="latitude"
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="37.7749"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude" className="text-neutral-300">
                Longitude
              </Label>
              <Input
                id="longitude"
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-122.4194"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleGetLocation}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Use My Location
          </Button>

          {/* Load & Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="load" className="text-neutral-300">
                Average Load (kW)
              </Label>
              <Input
                id="load"
                type="number"
                value={averageKW}
                onChange={(e) => setAverageKW(e.target.value)}
                placeholder="1200"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-neutral-300">
                Budget (USD)
              </Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="2000000"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>

          {/* Target & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target" className="text-neutral-300">
                Target Renewable (%)
              </Label>
              <Input
                id="target"
                type="number"
                min="0"
                max="100"
                value={targetRenewable}
                onChange={(e) => setTargetRenewable(e.target.value)}
                placeholder="80"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-neutral-300">
                Electricity Price ($/kWh)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={electricityPrice}
                onChange={(e) => setElectricityPrice(e.target.value)}
                placeholder="0.12"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>

          {/* Optimize Button */}
          <Button
            onClick={handleOptimize}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing... (may take 30-60s)
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Optimize Renewable Plan
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-900/20 border-red-800"
            >
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {results && results.optimal_plan && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Optimal Configuration */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Optimal Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Solar PV:</span>
                <span className="text-white font-bold">
                  {(results.optimal_plan.solar_kw ?? 0).toFixed(0)} kW
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Wind:</span>
                <span className="text-white font-bold">
                  {(results.optimal_plan.wind_kw ?? 0).toFixed(0)} kW
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Battery:</span>
                <span className="text-white font-bold">
                  {(results.optimal_plan.battery_kwh ?? 0).toFixed(0)} kWh
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Financial Metrics */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Financial Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Annual Savings:</span>
                <span className="text-green-400 font-bold">
                  ${(results.cost_savings ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">ROI Period:</span>
                <Badge variant="outline" className="text-white">
                  {(results.roi_months ?? 0).toFixed(0)} months
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Payback:</span>
                <span className="text-white">
                  {((results.roi_months ?? 0) / 12).toFixed(1)} years
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Environmental Impact */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Renewable:</span>
                <Badge className="bg-primary/20 text-primary border-primary/40">
                  {((results.renewable_fraction ?? 0) * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">CO₂ Reduction:</span>
                <span className="text-primary font-bold">
                  {((results.co2_reduction ?? 0) / 1000).toFixed(0)} tons/year
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Equivalent:</span>
                <span className="text-neutral-300 text-sm">
                  {((results.co2_reduction ?? 0) / 1000 / 4.6).toFixed(0)} cars
                  off road
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hourly Dispatch Preview */}
      {results &&
        results.hourly_dispatch &&
        results.hourly_dispatch.length > 0 && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Energy Dispatch Schedule (First 24 Hours)
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Hour-by-hour breakdown of energy sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left text-neutral-400 py-2">Hour</th>
                      <th className="text-right text-neutral-400 py-2">
                        Solar (kW)
                      </th>
                      <th className="text-right text-neutral-400 py-2">
                        Wind (kW)
                      </th>
                      <th className="text-right text-neutral-400 py-2">
                        Battery (kW)
                      </th>
                      <th className="text-right text-neutral-400 py-2">
                        Grid (kW)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.hourly_dispatch.slice(0, 24).map((hour, idx) => (
                      <tr key={idx} className="border-b border-neutral-800">
                        <td className="text-neutral-300 py-2">{idx}</td>
                        <td className="text-right text-white">
                          {(hour.solar_kw ?? 0).toFixed(0)}
                        </td>
                        <td className="text-right text-white">
                          {(hour.wind_kw ?? 0).toFixed(0)}
                        </td>
                        <td className="text-right text-white">
                          {(
                            (hour.battery_discharge_kw ?? 0) -
                            (hour.battery_charge_kw ?? 0)
                          ).toFixed(0)}
                        </td>
                        <td className="text-right text-neutral-400">
                          {(hour.grid_import_kw ?? 0).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-neutral-500 mt-4">
                Showing first 24 hours of {results.hourly_dispatch.length} total
                hours analyzed
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
