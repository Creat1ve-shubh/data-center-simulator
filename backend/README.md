# Production Backend Architecture

## Overview

This backend architecture converts the academic GreenCloud simulator into a production-ready renewable energy optimization service. It integrates real-time data from multiple APIs and uses mathematical optimization (MILP) to generate optimal renewable energy deployment plans for data centers.

## Architecture

```
/backend
├── /services
│   ├── /api
│   │   └── renewables.ts       # External API integrations
│   └── /optimizer
│       └── milp.ts              # MILP optimization engine
├── /types
│   └── index.ts                 # TypeScript interfaces
└── /utils
    └── energy-conversions.ts    # Energy calculation utilities

/app
└── /api
    └── /plan
        └── route.ts             # Next.js API endpoint
```

## Data Flow

1. **Client Request** → POST `/api/plan` with coordinates and constraints
2. **Data Fetching** → Fetch renewable data from external APIs in parallel
3. **Data Normalization** → Convert to hourly energy dataset (8760 hours)
4. **Optimization** → Run MILP solver to find optimal capacities
5. **Dispatch Simulation** → Simulate hourly energy dispatch
6. **Response** → Return optimal plan with metrics and hourly schedule

## External APIs

### 1. NREL NSRDB (Solar Data)
- **Purpose**: Solar irradiance and PV potential
- **Endpoint**: `https://developer.nrel.gov/api/solar/nsrdb_psm3_download.json`
- **API Key**: Required (free at https://developer.nrel.gov/signup/)
- **Data**: GHI, DNI, DHI, temperature, wind speed
- **Resolution**: Hourly
- **Coverage**: US and some international locations
- **Rate Limit**: 1,000 requests/hour (free tier)

### 2. Open-Meteo (Wind Data)
- **Purpose**: Wind speed and turbine power output
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **API Key**: Not required
- **Data**: Wind speed at 10m, 80m, 100m, wind direction, temperature
- **Resolution**: Hourly
- **Coverage**: Global
- **Rate Limit**: 10,000 requests/day (free)

### 3. Open-Meteo Hydrology (Hydro Data)
- **Purpose**: River discharge for hydropower potential
- **Endpoint**: `https://api.open-meteo.com/v1/flood`
- **API Key**: Not required
- **Data**: River discharge, precipitation, soil moisture
- **Resolution**: Hourly
- **Coverage**: Limited (major rivers)
- **Note**: Optional - returns empty if unavailable

### 4. NASA POWER (Temperature/Cooling)
- **Purpose**: Temperature data for PUE cooling calculations
- **Endpoint**: `https://power.larc.nasa.gov/api/temporal/hourly/point`
- **API Key**: Not required
- **Data**: 2m temperature, wind speed, solar radiation, humidity
- **Resolution**: Hourly
- **Coverage**: Global
- **Rate Limit**: 300 requests/hour

## MILP Optimization

### Decision Variables
- `solar_capacity_kw`: Solar PV capacity to install (kW)
- `wind_capacity_kw`: Wind turbine capacity to install (kW)
- `battery_capacity_kwh`: Battery storage capacity to install (kWh)
- `hourly_dispatch[h]`: Energy dispatch for each hour

### Objective Function
Minimize: `Total Cost = CAPEX + OPEX + Carbon Cost`

Where:
- CAPEX = Solar cost + Wind cost + Battery cost
- OPEX = Annual operating costs over project lifetime
- Carbon Cost = Emissions × Carbon price

### Constraints
1. **Energy Balance**: `generation + storage - load = 0` (for each hour)
2. **Capacity Limits**: `generation ≤ installed_capacity × capacity_factor`
3. **Battery Limits**: 
   - Charge/discharge rate ≤ 25% of capacity per hour
   - SOC bounds: 10% ≤ SOC ≤ 95%
   - Round-trip efficiency: 85%
4. **Budget**: `total_capex ≤ max_budget`
5. **Renewable Target**: `renewable_fraction ≥ min_target`

### Algorithm
1. **Greedy Initial Solution**: Allocate budget based on LCOE
2. **Gradient Descent Refinement**: Iteratively improve solution
3. **Dispatch Simulation**: Simulate hourly operation
4. **Metrics Calculation**: Compute financial and environmental metrics

## Energy Conversions

### Solar Power
```
P_solar = Capacity × (Irradiance/1000) × Temp_Factor × Efficiency
```
- Standard Test Conditions: 1000 W/m², 25°C
- Temperature coefficient: -0.4%/°C
- System efficiency: ~18%

### Wind Power
```
P_wind = 0.5 × ρ × A × v³ × Cp
```
- Cut-in speed: 3 m/s
- Rated speed: 12 m/s
- Cut-out speed: 25 m/s
- Power coefficient (Cp): 0.4

### Hydro Power
```
P_hydro = ρ × g × h × Q × η
```
- Water density (ρ): 1000 kg/m³
- Gravity (g): 9.81 m/s²
- Typical head (h): 50 m
- Turbine efficiency (η): 85%

### Dynamic PUE
```
PUE = 1.2 + 0.02×(T_outdoor - 20) + load_impact + cooling_benefit
```
- Base PUE: 1.2 (ideal conditions)
- Temperature impact: +0.02 per °C above 20°C
- Free cooling: -0.1 when T < 15°C
- Range: 1.05 - 2.5

## API Endpoints

### POST /api/plan

**Request:**
```json
{
  "coordinates": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "currentLoad": {
    "averageKW": 1000,
    "peakKW": 1500,
    "annualKWh": 8760000
  },
  "constraints": {
    "budget": 2000000,
    "minRenewableFraction": 0.8,
    "gridCarbonIntensity": 400,
    "gridPrice": 0.12
  }
}
```

**Response:**
```json
{
  "optimal_plan": {
    "solar_kw": 800,
    "wind_kw": 400,
    "battery_kwh": 500
  },
  "renewable_fraction": 0.85,
  "roi_months": 36,
  "co2_reduction": 3500000,
  "cost_savings": 180000,
  "hourly_dispatch": [...],
  "metadata": {
    "location": {...},
    "timestamp": "2025-11-05T...",
    "dataQuality": {...}
  }
}
```

### GET /api/plan

Returns API information and documentation.

## Error Handling

### Error Codes
- `VALIDATION_ERROR`: Invalid request parameters
- `NREL_API_KEY_MISSING`: NREL API key not configured
- `NREL_API_ERROR`: NREL API returned error
- `OPEN_METEO_API_ERROR`: Open-Meteo API error
- `NASA_POWER_API_ERROR`: NASA POWER API error
- `NO_DATA`: No data available for location
- `OPTIMIZATION_FAILED`: MILP solver failed
- `INTERNAL_ERROR`: Server error

### Error Response Format
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid coordinates",
  "details": {...},
  "timestamp": "2025-11-05T..."
}
```

## Configuration

### Environment Variables
See `.env.example` for all configuration options.

**Required:**
- `NREL_API_KEY`: Your NREL API key

**Optional:**
- API endpoints (use defaults)
- LCOE/OPEX values (use defaults)
- Optimization parameters
- Rate limiting configuration

### Default LCOE Values (2024 US Averages)
- Solar: $1,200/kW CAPEX, $15/kW/year OPEX
- Wind: $1,500/kW CAPEX, $30/kW/year OPEX
- Battery: $300/kWh CAPEX, $5/kWh/year OPEX
- Carbon: $0.05/kg CO2 ($50/ton)

## Performance

### Expected Response Times
- Data fetching: 5-15 seconds (parallel API calls)
- Optimization: 2-5 seconds
- Total: 10-20 seconds

### Optimization
- Use caching for repeated locations
- Implement rate limiting
- Add request queuing for high load
- Consider pre-computing common locations

## Deployment

### Prerequisites
1. Node.js 18+ and pnpm
2. NREL API key
3. Environment variables configured

### Steps
1. Copy `.env.example` to `.env.local`
2. Add your NREL API key
3. Install dependencies: `pnpm install`
4. Build: `pnpm build`
5. Start: `pnpm start`

### Production Considerations
- Add Redis caching for API responses
- Implement rate limiting (e.g., with Redis)
- Add monitoring (Sentry, DataDog)
- Use CDN for static assets
- Implement authentication if needed
- Add request logging
- Set up CI/CD pipeline

## Testing

### Manual Testing
```bash
curl -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "coordinates": {"latitude": 37.7749, "longitude": -122.4194},
    "currentLoad": {"averageKW": 1000, "peakKW": 1500, "annualKWh": 8760000},
    "constraints": {"budget": 2000000, "minRenewableFraction": 0.8}
  }'
```

### Test Locations
- California: 37.7749, -122.4194
- Texas: 31.9686, -99.9018
- New York: 40.7128, -74.0060
- Germany: 51.1657, 10.4515
- India: 26.9124, 75.7873

## Limitations

1. **Data Coverage**: NREL NSRDB limited to US and some international
2. **Historical Data**: Some APIs only provide recent data
3. **Hydro Data**: Limited coverage, may not be available
4. **API Rate Limits**: Free tiers have restrictions
5. **Optimization**: Heuristic solver, not guaranteed global optimum
6. **Real-time**: Data may not be real-time (depends on API)

## Future Enhancements

1. **Python Integration**: Use Pyomo/OR-Tools for true MILP
2. **Machine Learning**: Predict future generation patterns
3. **Real-time Pricing**: Integrate electricity market APIs
4. **Grid Integration**: Add grid stability constraints
5. **Multi-site**: Optimize across multiple data centers
6. **Demand Response**: Include load shifting optimization
7. **Weather Forecasts**: Use predictions for future planning
8. **Cost Updates**: Auto-update LCOE from market data

## Support

For issues or questions:
1. Check API documentation links
2. Review error messages and codes
3. Verify API keys and configuration
4. Check API rate limits and quotas
5. Review logs for detailed error information

## License

See project LICENSE file.
