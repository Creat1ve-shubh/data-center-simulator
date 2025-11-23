# 🏗️ Pipeline Architecture Documentation

## Overview

GreenCloud uses a **sequential data pipeline** where each stage feeds into the next:

```
┌─────────────────────┐
│  Renewable Planner  │  Fetches solar/wind/hydro/temp data
│   (Data Producer)   │  
└──────────┬──────────┘
           │ HourlyEnergyData[]
           ▼
┌─────────────────────┐
│  Auto-Plan Optimizer│  MILP optimization for capacity sizing
│  (Decision Maker)   │  
└──────────┬──────────┘
           │ OptimalCapacities + Dispatch
           ▼
┌─────────────────────┐
│   PUE Predictor     │  Weather-dependent cooling model
│  (Load Adjuster)    │  
└──────────┬──────────┘
           │ AdjustedPUE + Savings
           ▼
┌─────────────────────┐
│  VPPA + Financial   │  Ownership vs PPA economics
│ (Economic Evaluator)│  
└──────────┬──────────┘
           │ NPV, ROI, Payback
           ▼
┌─────────────────────┐
│ Sensitivity Analysis│  Monte Carlo risk assessment
│  (Risk Assessor)    │  
└──────────┬──────────┘
           │
           ▼
      PipelineOutput
```

## Why This Architecture?

### ❌ **WRONG: Separate Components**
```typescript
// BAD: Each component works independently
const renewables = await fetchRenewables(lat, lon);  // Isolated
const config = await optimizePlan(budget);            // No knowledge of renewables
const pue = await predictPUE(temp);                   // No knowledge of config
const vppa = await analyzeVPPA(price);                // No knowledge of PUE or config
```

**Problem:** Each component operates in isolation without sharing context. The optimizer doesn't know about renewable availability, PUE doesn't adjust for the chosen configuration, and financial analysis doesn't account for PUE improvements.

### ✅ **RIGHT: Sequential Pipeline**
```typescript
// GOOD: Orchestrated pipeline where each stage uses previous outputs
const result = await runOptimizationPipeline({
  coordinates, load, constraints, pricing
});

// Inside pipeline:
// 1. Planner gets renewable data
// 2. Optimizer uses that data to size capacities
// 3. PUE adjusts load based on chosen config
// 4. Financial uses adjusted load for economics
// 5. Sensitivity assesses risk on all of the above
```

**Benefit:** Each stage has full context from previous stages, leading to accurate optimization.

---

## File Structure

```
backend/
├── types/
│   └── index.ts                      # Shared TypeScript interfaces
├── services/
│   ├── api/
│   │   └── renewables.ts             # [STAGE 1] API integration layer
│   ├── optimizer/
│   │   └── milp.ts                   # [STAGE 2] MILP solver
│   ├── predictor/
│   │   └── pue-model.ts              # [STAGE 3] Dynamic PUE model
│   ├── financial/
│   │   └── vppa-analyzer.ts          # [STAGE 4] VPPA financial model
│   ├── sensitivity/
│   │   └── monte-carlo.ts            # [STAGE 5] Risk analysis
│   └── orchestrator/
│       └── pipeline.ts               # 🎯 MAIN ORCHESTRATOR
app/
└── api/
    └── orchestrate/
        └── route.ts                  # Next.js API endpoint
```

---

## Pipeline Stages

### Stage 1: Renewable Planner (Data Producer)

**File:** `backend/services/api/renewables.ts`

**Purpose:** Fetch real-time renewable energy data from external APIs

**APIs Used:**
- NREL NSRDB (solar irradiance)
- Open-Meteo Renewable API (wind speed)
- Open-Meteo Hydrology API (hydro discharge)
- NASA POWER API (temperature for cooling)

**Input:**
```typescript
{
  latitude: 37.7749,
  longitude: -122.4194
}
```

**Output:**
```typescript
{
  hourlyData: HourlyEnergyData[],  // 8760 hours
  dataQuality: {
    solar: { available: true, hoursAvailable: 8760, source: "NREL" }
  }
}
```

**Key Function:** `fetchAllRenewableData(lat, lon)`

---

### Stage 2: Auto-Plan Optimizer (Decision Maker)

**File:** `backend/services/optimizer/milp.ts`

**Purpose:** Determine optimal solar/wind/battery capacities using Mixed-Integer Linear Programming

**Algorithm:** MILP (Mixed-Integer Linear Programming)

**Input:**
```typescript
{
  hourlyData: [...],            // From Stage 1
  costs: { solar: 1200, wind: 1500, battery: 300 },
  constraints: { budget: 2000000, targetRenewable: 0.8 }
}
```

**Output:**
```typescript
{
  optimalCapacities: {
    solar_kw: 850,
    wind_kw: 300,
    battery_kwh: 500
  },
  hourlyDispatch: [...],        // Hour-by-hour energy flow
  metrics: { renewable_fraction: 0.82 }
}
```

**Key Function:** `solveMILP(input)`

**Objective:** Minimize total cost (CAPEX + OPEX) while meeting renewable fraction target

---

### Stage 3: PUE Predictor (Load Adjuster)

**File:** `backend/services/predictor/pue-model.ts`

**Purpose:** Adjust facility load based on weather-dependent cooling requirements

**Model:** Dynamic PUE based on outdoor temperature:
- Cold (<10°C): PUE = 1.2 (free cooling)
- Moderate (10-25°C): PUE = 1.4
- Hot (25-35°C): PUE = 1.6
- Very hot (>35°C): PUE = 1.8

**Input:**
```typescript
{
  hourlyWeather: [...],         // From Stage 1
  itLoad: { average_kw: 1200 },
  baseline_pue: 1.5,
  renewable_config: { solar_kw: 850, wind_kw: 300 }  // From Stage 2
}
```

**Output:**
```typescript
{
  adjustedLoad: {
    baseline_pue: 1.5,
    adjusted_pue: 1.42,         // 5.3% improvement
    annual_energy_savings_kwh: 105120
  },
  coolingImpact: {
    cooling_cost_savings_usd_year: 12614
  }
}
```

**Key Function:** `computePUEAdjusted(input)`

**Why It Matters:** PUE affects total energy consumption, which impacts both costs and renewable sizing accuracy.

---

### Stage 4: VPPA + Financial Analysis (Economic Evaluator)

**File:** `backend/services/financial/vppa-analyzer.ts`

**Purpose:** Evaluate financial performance under ownership and VPPA models

**Models:**
1. **Ownership:** Direct ownership of renewable assets
2. **VPPA:** Virtual Power Purchase Agreement (fixed strike price contract)

**Input:**
```typescript
{
  optimalCapacities: {...},    // From Stage 2
  adjustedPUE: {...},           // From Stage 3
  pricing: { electricity: 0.12, carbon: 50 }
}
```

**Output:**
```typescript
{
  ownership: {
    total_capex: 1985000,
    annual_savings: 150000,
    payback_period_months: 36,
    roi_percent: 24.5,
    npv_20yr: 1250000
  },
  vppa: {
    strike_price_per_mwh: 65,
    hedge_effectiveness_percent: 85
  },
  carbon: {
    co2_reduction_tons_year: 1200
  }
}
```

**Key Functions:**
- `analyzeOwnershipModel()`
- `analyzeVPPAFinancials()`

---

### Stage 5: Sensitivity Analysis (Risk Assessor)

**File:** `backend/services/sensitivity/monte-carlo.ts`

**Purpose:** Assess financial risk using Monte Carlo simulation

**Method:** Run 1000+ iterations with randomized inputs to build probability distributions

**Varied Parameters:**
- Electricity price (±15%)
- IT load (±10%)
- Renewable generation (±12%)

**Input:**
```typescript
{
  baseCase: { npv: 1250000, payback_months: 36 },  // From Stage 4
  varianceFactors: { priceVolatility: 0.15 },
  iterations: 1000
}
```

**Output:**
```typescript
{
  monteCarlo: {
    confidence_95_percent: {
      npv_min: 850000,
      npv_max: 1650000,
      roi_min_months: 28,
      roi_max_months: 44
    },
    risk_metrics: {
      probability_positive_npv: 0.94,  // 94% chance of profit
      value_at_risk_95: -150000        // Worst 5% scenario
    }
  },
  tornadoChart: [
    { variable: "Electricity Price", impact_on_npv: 375000, rank: 1 }
  ],
  recommendations: [
    "✅ Low risk: Over 90% probability of positive NPV"
  ]
}
```

**Key Function:** `runSensitivityAnalysis(input)`

---

## Orchestrator: The Brain

**File:** `backend/services/orchestrator/pipeline.ts`

**Function:** `runOptimizationPipeline(input: PipelineInput): Promise<PipelineOutput>`

### How It Works

```typescript
export async function runOptimizationPipeline(input: PipelineInput) {
  // Stage 1: Fetch renewable data
  const plannerOutput = await fetchAllRenewableData(lat, lon);
  
  // Stage 2: Optimize capacities using data from Stage 1
  const optimizerOutput = await solveMILP({
    hourlyData: plannerOutput.hourlyData,  // ✅ Uses Stage 1 output
    costs: input.pricing,
    constraints: input.constraints
  });
  
  // Stage 3: Adjust PUE using config from Stage 2
  const pueOutput = await computePUEAdjusted({
    hourlyWeather: plannerOutput.hourlyData,  // ✅ Uses Stage 1 output
    renewable_config: optimizerOutput.optimalCapacities  // ✅ Uses Stage 2 output
  });
  
  // Stage 4: Financial analysis using adjusted load from Stage 3
  const financialOutput = await analyzeFinancials({
    optimalCapacities: optimizerOutput.optimalCapacities,  // ✅ Uses Stage 2 output
    adjustedPUE: pueOutput.adjustedLoad  // ✅ Uses Stage 3 output
  });
  
  // Stage 5: Risk analysis using financials from Stage 4
  const sensitivityOutput = await runSensitivityAnalysis({
    baseCase: financialOutput.ownership  // ✅ Uses Stage 4 output
  });
  
  // Return unified output
  return { stages: { planner, optimizer, pue, financial, sensitivity }, summary };
}
```

### Error Handling

- **Critical Errors:** Stages 1, 2, 4 must succeed (pipeline fails if they error)
- **Recoverable Errors:** Stages 3, 5 can fail gracefully (use fallback values)

Example:
```typescript
if (pueError) {
  pueOutput = { status: 'error', adjustedLoad: { baseline_pue: 1.5 } };
  errors.push({ stage: 'pue', recoverable: true });
}
```

---

## API Endpoint

**URL:** `POST /api/orchestrate`

### Request

```typescript
POST /api/orchestrate

{
  "coordinates": { "latitude": 37.7749, "longitude": -122.4194 },
  "currentLoad": {
    "averageKW": 1200,
    "peakKW": 1560,
    "currentPUE": 1.5
  },
  "constraints": {
    "budget": 2000000,
    "targetRenewableFraction": 0.8
  },
  "pricing": {
    "electricityUSDPerKWh": 0.12,
    "carbonUSDPerTon": 50,
    "solarCapexUSDPerKW": 1200,
    "windCapexUSDPerKW": 1500,
    "batteryCapexUSDPerKWh": 300
  },
  "vppa": {
    "considerVPPA": true,
    "strikePrice": 65
  },
  "sensitivity": {
    "runMonteCarlo": true,
    "iterations": 1000
  }
}
```

### Response

```typescript
{
  "success": true,
  "executionTimeMs": 45230,
  "stages": {
    "planner": { ... },
    "optimizer": { ... },
    "pue": { ... },
    "financial": { ... },
    "sensitivity": { ... }
  },
  "summary": {
    "optimal_plan": {
      "solar_kw": 850,
      "wind_kw": 300,
      "battery_kwh": 500
    },
    "financial_best_case": {
      "model": "ownership",
      "total_investment": 1985000,
      "annual_savings": 150000,
      "payback_months": 36,
      "roi_percent": 24.5
    },
    "environmental": {
      "renewable_fraction": 0.82,
      "co2_reduction_tons_year": 1200,
      "equivalent_cars_removed": 261
    },
    "risk_profile": {
      "confidence_level": 0.94,
      "worst_case_payback_months": 44,
      "best_case_payback_months": 28
    }
  }
}
```

---

## Frontend Integration

### Old Way (Broken)
```typescript
// ❌ BAD: Separate API calls
const renewables = await fetch('/api/renewables');
const plan = await fetch('/api/optimize');
const pue = await fetch('/api/pue');
// These don't share data!
```

### New Way (Correct)
```typescript
// ✅ GOOD: Single orchestrated call
const result = await fetch('/api/orchestrate', {
  method: 'POST',
  body: JSON.stringify(pipelineInput)
});

// Result contains all stages + unified summary
console.log(result.summary.optimal_plan);
console.log(result.summary.financial_best_case);
console.log(result.summary.risk_profile);
```

---

## Testing

### Test Script

```bash
pnpm test:orchestrate
```

**File:** `scripts/test-orchestrate.js`

```javascript
const response = await fetch('http://localhost:3000/api/orchestrate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    currentLoad: { averageKW: 1200, peakKW: 1560, currentPUE: 1.5 },
    constraints: { budget: 2000000, targetRenewableFraction: 0.8 },
    pricing: {
      electricityUSDPerKWh: 0.12,
      carbonUSDPerTon: 50,
      solarCapexUSDPerKW: 1200,
      windCapexUSDPerKW: 1500,
      batteryCapexUSDPerKWh: 300
    },
    vppa: { considerVPPA: true },
    sensitivity: { runMonteCarlo: true, iterations: 500 }
  })
});

const result = await response.json();
console.log('✅ Pipeline completed in', result.executionTimeMs, 'ms');
console.log('Solar:', result.summary.optimal_plan.solar_kw, 'kW');
console.log('Wind:', result.summary.optimal_plan.wind_kw, 'kW');
console.log('Payback:', result.summary.financial_best_case.payback_months, 'months');
console.log('Risk confidence:', (result.summary.risk_profile.confidence_level * 100).toFixed(1), '%');
```

---

## Key Takeaways

1. **Sequential Flow:** Each stage depends on the previous stage's output
2. **Single Entry Point:** Always call `/api/orchestrate`, never individual stages
3. **Context Preservation:** Orchestrator passes full context through the pipeline
4. **Error Recovery:** Non-critical stages (PUE, Sensitivity) can fail gracefully
5. **Unified Output:** One response contains all stages + a summary

---

## Migration Guide

### If you have existing code calling separate APIs:

**Before:**
```typescript
const solarData = await fetch('/api/renewables/solar');
const windData = await fetch('/api/renewables/wind');
const plan = await fetch('/api/plan', { body: { ... } });
```

**After:**
```typescript
const result = await fetch('/api/orchestrate', {
  method: 'POST',
  body: JSON.stringify({
    coordinates, currentLoad, constraints, pricing
  })
});

// Access everything from result.stages or result.summary
const { optimal_plan, financial_best_case, risk_profile } = result.summary;
```

---

## Performance

- **Stage 1 (Planner):** 5-10 seconds (API fetches)
- **Stage 2 (Optimizer):** 20-40 seconds (MILP solving)
- **Stage 3 (PUE):** <1 second (simple computation)
- **Stage 4 (Financial):** <1 second (NPV calculations)
- **Stage 5 (Sensitivity):** 5-10 seconds (1000 Monte Carlo iterations)

**Total:** 30-60 seconds typical

---

## Future Enhancements

1. **Caching:** Cache Stage 1 (renewable data) for 24 hours per location
2. **Async Mode:** Queue-based processing for long-running optimizations
3. **Scenario Versioning:** Save multiple runs to database for comparison
4. **Real-time Progress:** WebSocket updates during pipeline execution
5. **Hybrid Optimization:** Run MILP + genetic algorithms in parallel

---

**Questions?** Check the code comments in `backend/services/orchestrator/pipeline.ts`

**Contribute:** Open a PR with improvements to any stage!
