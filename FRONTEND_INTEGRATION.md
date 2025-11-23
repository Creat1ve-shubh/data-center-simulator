# Frontend Integration Guide - Renewable Energy Optimizer

## 🎯 Overview

This guide shows you how to integrate the AI-powered renewable energy optimizer into your application. The optimizer uses real-time weather APIs and MILP algorithms to recommend optimal solar, wind, and battery configurations.

## 📍 Quick Access

**New Page:** `/renewable-planner`

Navigate to `http://localhost:3000/renewable-planner` to access the optimizer.

## 🧩 Components Created

### 1. Main Optimizer Component
**File:** `components/renewable-optimizer.tsx`

A standalone React component that can be embedded anywhere in your app.

```tsx
import { RenewableOptimizer } from "@/components/renewable-optimizer";

export default function MyPage() {
  return (
    <div>
      <RenewableOptimizer 
        onResultsUpdate={(results) => {
          console.log("Optimization complete:", results);
        }}
      />
    </div>
  );
}
```

### 2. Dedicated Page
**File:** `app/renewable-planner/page.tsx`

A full-featured page with:
- Feature cards explaining capabilities
- How-it-works section
- Main optimizer component
- Data sources documentation
- Technical notes

## 🔌 API Integration

### Endpoint
```
POST /api/plan
```

### Request Format
```typescript
{
  coordinates: {
    latitude: number,    // -90 to 90
    longitude: number    // -180 to 180
  },
  currentLoad: {
    averageKW: number,   // Average load in kilowatts
    peakKW: number       // Peak load (typically 1.3x average)
  },
  constraints: {
    budget: number,                    // Total capital budget (USD)
    targetRenewableFraction: number,   // 0-1 (e.g., 0.8 = 80%)
    maxSolarKW: number,                // Max solar capacity
    maxWindKW: number,                 // Max wind capacity
    maxBatteryKWh: number              // Max battery capacity
  },
  pricing: {
    electricityUSDPerKWh: number,      // Grid electricity price
    carbonUSDPerTon: number,           // Carbon price
    solarCapexUSDPerKW: number,        // Solar installation cost
    windCapexUSDPerKW: number,         // Wind installation cost
    batteryCapexUSDPerKWh: number      // Battery installation cost
  }
}
```

### Response Format
```typescript
{
  optimal_plan: {
    solar_kw: number,
    wind_kw: number,
    battery_kwh: number
  },
  renewable_fraction: number,           // 0-1
  roi_months: number,                   // Payback period
  co2_reduction_tons_year: number,      // Annual CO2 savings
  cost_savings_usd_year: number,        // Annual cost savings
  hourly_dispatch: Array<{
    hour: number,
    solar_kw: number,
    wind_kw: number,
    battery_kw: number,
    grid_kw: number
  }>,
  metadata: {
    location: { latitude: number, longitude: number },
    optimization_time_ms: number,
    data_quality: string
  }
}
```

## 🎨 UI Features

### Browser Geolocation
```typescript
// Click "Use My Location" button
// Automatically fills latitude/longitude from browser
```

### Form Inputs
- **Latitude/Longitude:** Decimal degrees (e.g., 37.7749)
- **Average Load:** Data center average power consumption (kW)
- **Budget:** Available capital for renewable installations (USD)
- **Target Renewable:** Desired percentage (0-100%)
- **Electricity Price:** Grid electricity cost ($/kWh)

### Results Display
Three metric cards show:
1. **Optimal Configuration:** Solar/wind/battery capacities
2. **Financial Impact:** Annual savings, ROI, payback period
3. **Environmental Impact:** Renewable percentage, CO2 reduction

### Hourly Dispatch Table
Shows hour-by-hour energy sources (first 24 hours visible)

## 🔧 Customization Examples

### Custom Styling
```tsx
<RenewableOptimizer 
  onResultsUpdate={(results) => {
    // Handle results in parent component
    setOptimalPlan(results.optimal_plan);
    showSuccessMessage(`Achieved ${(results.renewable_fraction * 100).toFixed(1)}%`);
  }}
/>
```

### Integrate with Existing Dashboard
```tsx
"use client";

import { useState } from "react";
import { RenewableOptimizer } from "@/components/renewable-optimizer";
import type { OptimizationResponse } from "@/backend/types";

export default function Dashboard() {
  const [results, setResults] = useState<OptimizationResponse | null>(null);

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Optimizer */}
      <RenewableOptimizer onResultsUpdate={setResults} />
      
      {/* Right: Custom visualizations */}
      <div>
        {results && (
          <>
            <MyCustomChart data={results.hourly_dispatch} />
            <MyFinancialProjection roi={results.roi_months} />
          </>
        )}
      </div>
    </div>
  );
}
```

### Pre-fill Form Data
Modify the component to accept initial values:

```tsx
// In components/renewable-optimizer.tsx
export interface RenewableOptimizerProps {
  onResultsUpdate?: (results: OptimizationResponse) => void;
  initialData?: {
    latitude?: string;
    longitude?: string;
    averageKW?: string;
    budget?: string;
  };
}

// Use initialData to set default useState values
const [latitude, setLatitude] = useState<string>(
  initialData?.latitude || "37.7749"
);
```

## 📊 Example Use Cases

### Case 1: Quick Assessment
```typescript
// User clicks "Use My Location" → Auto-fills coordinates
// User enters: 1200 kW load, $2M budget
// Click "Optimize"
// Result: 850 kW solar, 300 kW wind, 500 kWh battery
```

### Case 2: Budget Constraint
```typescript
// User wants to see impact of different budgets
// Try $500k, $1M, $2M, $5M
// Compare ROI and renewable fraction
```

### Case 3: Location Comparison
```typescript
// Compare San Francisco vs. Texas vs. Germany
// Same load, same budget
// See how solar/wind potential varies
```

## 🚀 Performance

### Optimization Time
- **Typical:** 30-60 seconds
- **Factors:** Location, data availability, system load
- **UI:** Shows loading spinner with estimated time

### API Rate Limits
- **NREL:** 1000 requests/hour
- **Open-Meteo:** Generous, no auth required
- **NASA POWER:** Generous, recommended caching

### Optimization
```typescript
// Add request caching to reduce API calls
const cache = new Map<string, OptimizationResponse>();

async function optimizeWithCache(params: OptimizationRequest) {
  const key = `${params.coordinates.latitude},${params.coordinates.longitude}`;
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const response = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  
  const result = await response.json();
  cache.set(key, result);
  
  return result;
}
```

## 🐛 Error Handling

### Common Errors

**Invalid Coordinates**
```json
{
  "error": "Invalid latitude: must be between -90 and 90"
}
```

**Missing API Key**
```json
{
  "error": "Configuration error: NREL API key not found"
}
```

**Rate Limit**
```json
{
  "error": "API rate limit exceeded. Please try again later."
}
```

**Timeout**
```json
{
  "error": "Request timeout. The optimization took too long."
}
```

### Error Display in UI
The component automatically displays errors in a red alert box below the form.

## 🎯 Next Steps

### Add Visualizations
```bash
pnpm add recharts
```

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

function DispatchChart({ data }: { data: HourlyDispatch[] }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="hour" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="solar_kw" stroke="#10b981" />
      <Line type="monotone" dataKey="wind_kw" stroke="#3b82f6" />
      <Line type="monotone" dataKey="grid_kw" stroke="#6b7280" />
    </LineChart>
  );
}
```

### Save Results
```typescript
function downloadResults(results: OptimizationResponse) {
  const blob = new Blob([JSON.stringify(results, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `renewable-plan-${Date.now()}.json`;
  a.click();
}
```

### Compare Multiple Scenarios
```typescript
const [scenarios, setScenarios] = useState<OptimizationResponse[]>([]);

function addScenario(result: OptimizationResponse) {
  setScenarios(prev => [...prev, result]);
}

// Display comparison table
<table>
  <thead>
    <tr>
      <th>Budget</th>
      <th>Solar (kW)</th>
      <th>Wind (kW)</th>
      <th>ROI (months)</th>
    </tr>
  </thead>
  <tbody>
    {scenarios.map((s, i) => (
      <tr key={i}>
        <td>${s.metadata.budget.toLocaleString()}</td>
        <td>{s.optimal_plan.solar_kw}</td>
        <td>{s.optimal_plan.wind_kw}</td>
        <td>{s.roi_months}</td>
      </tr>
    ))}
  </tbody>
</table>
```

## 📝 Testing

### Test Locations
```typescript
const testLocations = [
  { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
  { name: "Austin, TX", lat: 30.2672, lon: -97.7431 },
  { name: "Hamburg, Germany", lat: 53.5511, lon: 9.9937 },
  { name: "Jaipur, India", lat: 26.9124, lon: 75.7873 },
];
```

### Test Scenarios
```typescript
const testScenarios = [
  { load: 500, budget: 500000, target: 50 },    // Small, conservative
  { load: 1200, budget: 2000000, target: 80 },  // Medium, aggressive
  { load: 5000, budget: 10000000, target: 90 }, // Large, very aggressive
];
```

## 🔐 Security Notes

- API keys stored in environment variables only
- No sensitive data in client-side code
- Rate limiting on API endpoint recommended
- Input validation on both frontend and backend

## 📚 Additional Resources

- **Backend Documentation:** `/backend/README.md`
- **Quick Start Guide:** `/QUICKSTART.md`
- **API Types:** `/backend/types/index.ts`
- **Example Request:** See "How It Works" section on the page

---

**Questions?** Check the technical notes section on the `/renewable-planner` page or review the API documentation at `/api/plan` (GET request).
