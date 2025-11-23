# Data center simulator

_Automatically synced with your [v0.app](https://v0.app) deployments_

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/creat1veshubhs-projects/v0-data-center-simulator)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/WsZeNVO9lwW)

## Overview

This repository hosts a data center transition simulator with an orchestrated optimization pipeline.

### Pipeline Architecture

The optimization pipeline runs sequential stages exposed via `POST /api/orchestrate`:

1. Renewable Planner – Fetches & normalizes solar, wind, hydro, cooling (NASA POWER) data with synthetic fallback.
2. Auto-Plan Optimizer – MILP sizing for solar, wind, battery vs. budget & renewable fraction targets.
3. PUE Predictor – Adjusts facility energy using weather-derived cooling load impacts.
4. Financial & VPPA – Ownership economics (CAPEX/OPEX, NPV, ROI, payback) plus optional VPPA hedge analysis.
5. Sensitivity – Monte Carlo (default 300 iterations) exploring volatility in price, load, renewable outputs.

Unified output includes per-stage details plus a consolidated summary (`optimal_plan`, financial best case, environmental metrics, risk profile).

### Renewable Data Caching (Redis)

Hourly renewable datasets are cached (6h TTL) if `REDIS_URL` is set. The key pattern:
`renewables:<lat>:<lon>:<startDate>:<endDate>`.
Graceful fallback: if Redis is absent or errors, pipeline proceeds without caching.

### VPPA Forward Curve Override

You can pass an optional `vppa.forwardCurve` array (USD/MWh per year) in the pipeline input to override default regional projections. Length should cover the `contractDuration`; if shorter, last value repeats.

### Sensitivity Defaults

`iterations` defaults to 300. Variance factor defaults:
`priceVolatility=0.15`, `loadVariance=0.10`, `renewableVariance=0.12`.

### Example Pipeline Input

```jsonc
{
  "coordinates": { "latitude": 37.77, "longitude": -122.42 },
  "currentLoad": { "averageKW": 1000, "peakKW": 1200, "currentPUE": 1.5 },
  "constraints": { "budget": 1000000, "targetRenewableFraction": 0.8 },
  "pricing": {
    "electricityUSDPerKWh": 0.12,
    "carbonUSDPerTon": 50,
    "solarCapexUSDPerKW": 1200,
    "windCapexUSDPerKW": 1500,
    "batteryCapexUSDPerKWh": 400,
  },
  "vppa": {
    "considerVPPA": true,
    "strikePrice": 85,
    "contractDuration": 15,
    "forwardCurve": [
      82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110,
    ],
  },
  "sensitivity": { "runMonteCarlo": true },
}
```

### Environment Variables

See `.env.example` for required and optional variables (`REDIS_URL`, API keys).

### Roadmap Page Integration

`/roadmap` renders pipeline stages + data source badges (API vs synthetic fallback) from orchestrator output.

### Development Notes

- Caching layer implemented via lazy Redis client (`ioredis`).
- Synthetic generation triggers when solar & wind API data are both absent or all-zero.
- Forward curves allow closer alignment with market desk projections.
- Sensitivity results provide confidence and worst/best case payback windows.

### Future Enhancements

- Persist scenario runs
- Add battery degradation modeling
- Multi-region aggregation
- Scenario diffing & export

## Deployment

Your project is live at:

**[https://vercel.com/creat1veshubhs-projects/v0-data-center-simulator](https://vercel.com/creat1veshubhs-projects/v0-data-center-simulator)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/WsZeNVO9lwW](https://v0.app/chat/projects/WsZeNVO9lwW)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
