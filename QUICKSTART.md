# Quick Start Guide - Production Renewable Energy API

## 🚀 Get Started in 5 Minutes

### Step 1: Get Your NREL API Key (Required)

1. Visit: https://developer.nrel.gov/signup/
2. Fill out the form (free, instant approval)
3. Copy your API key

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your NREL API key
# NREL_API_KEY=your_actual_api_key_here
```

### Step 3: Install Dependencies

```bash
pnpm install
```

### Step 4: Run Development Server

```bash
pnpm dev
```

The API will be available at: `http://localhost:3000/api/plan`

### Step 5: Test the API

```bash
curl -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
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
      "minRenewableFraction": 0.8
    }
  }'
```

## 📊 Understanding the Response

The API returns an optimal renewable energy plan:

```json
{
  "optimal_plan": {
    "solar_kw": 800,        // Recommended solar capacity
    "wind_kw": 400,         // Recommended wind capacity
    "battery_kwh": 500      // Recommended battery capacity
  },
  "renewable_fraction": 0.85,  // 85% renewable energy
  "roi_months": 36,            // Payback period
  "co2_reduction": 3500000,    // Annual CO2 reduction (kg)
  "cost_savings": 180000,      // Annual cost savings (USD)
  "hourly_dispatch": [...]     // 8760 hours of dispatch schedule
}
```

## 🌍 Example Test Locations

### United States
```json
// San Francisco, CA
{"latitude": 37.7749, "longitude": -122.4194}

// Austin, TX (great solar)
{"latitude": 30.2672, "longitude": -97.7431}

// New York, NY
{"latitude": 40.7128, "longitude": -74.0060}
```

### International
```json
// Hamburg, Germany (good wind)
{"latitude": 53.5511, "longitude": 9.9937}

// Jaipur, India (excellent solar)
{"latitude": 26.9124, "longitude": 75.7873}

// Oslo, Norway (good hydro potential)
{"latitude": 59.9139, "longitude": 10.7522}
```

## 🔧 Common Parameters

### Current Load
- `averageKW`: Average IT load in kilowatts
- `peakKW`: Peak IT load
- `annualKWh`: Total annual energy consumption

**Example for a small data center:**
```json
{
  "averageKW": 500,
  "peakKW": 750,
  "annualKWh": 4380000
}
```

**Example for a large data center:**
```json
{
  "averageKW": 5000,
  "peakKW": 7500,
  "annualKWh": 43800000
}
```

### Constraints
- `budget`: Maximum capital expenditure (USD)
- `minRenewableFraction`: Minimum renewable energy target (0-1)
- `gridCarbonIntensity`: Grid carbon intensity (gCO2/kWh) - optional
- `gridPrice`: Grid electricity price (USD/kWh) - optional

**Conservative budget:**
```json
{
  "budget": 500000,
  "minRenewableFraction": 0.5
}
```

**Aggressive renewable target:**
```json
{
  "budget": 5000000,
  "minRenewableFraction": 0.95
}
```

## 📈 Interpreting Results

### Renewable Fraction
- **0.0 - 0.3**: Low renewable penetration
- **0.3 - 0.6**: Moderate renewable penetration
- **0.6 - 0.8**: High renewable penetration
- **0.8 - 1.0**: Very high renewable penetration

### ROI (Payback Period)
- **< 5 years**: Excellent investment
- **5-10 years**: Good investment
- **10-15 years**: Acceptable investment
- **> 15 years**: May need to reconsider or increase budget

### Cost Savings
Annual cost savings compared to 100% grid power:
- Includes reduced electricity bills
- Excludes O&M costs (already factored into OPEX)
- Does not include renewable energy incentives/tax credits

### CO2 Reduction
Annual CO2 reduction in kilograms:
- Compared to 100% grid power
- Based on regional grid carbon intensity
- Can be converted to carbon credits

## 🛠️ Troubleshooting

### "NREL_API_KEY_MISSING" Error
**Solution:** Add your NREL API key to `.env.local`

### "NO_DATA" Error
**Solution:** The location may not have NREL coverage. Try:
1. A different location (US locations have better coverage)
2. Wait and retry (API may be temporarily unavailable)

### "OPTIMIZATION_FAILED" Error
**Solution:** Constraints may be too strict. Try:
1. Increase budget
2. Decrease minRenewableFraction
3. Verify load values are realistic

### Slow Response Times
**Causes:**
- First request fetches data from multiple APIs (~10-15 seconds)
- Large datasets (8760 hours)

**Solutions:**
- Implement caching (see backend/README.md)
- Use smaller date ranges for testing
- Add loading indicators in UI

## 🎯 Next Steps

### 1. Frontend Integration
Create a React component to call the API:

```typescript
async function optimizeRenewables(
  latitude: number,
  longitude: number,
  loadKW: number,
  budget: number
) {
  const response = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      coordinates: { latitude, longitude },
      currentLoad: {
        averageKW: loadKW,
        peakKW: loadKW * 1.5,
        annualKWh: loadKW * 8760,
      },
      constraints: {
        budget,
        minRenewableFraction: 0.8,
      },
    }),
  });
  
  return await response.json();
}
```

### 2. Add Browser Geolocation
```typescript
function getCurrentLocation(): Promise<{latitude: number, longitude: number}> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      reject
    );
  });
}
```

### 3. Visualize Results
Use the `hourly_dispatch` data to create:
- Time series charts of generation vs. load
- Battery state of charge graph
- Renewable energy mix pie chart
- Cost comparison bar chart

### 4. Add Features
- Save optimization results
- Compare multiple scenarios
- Export to PDF/CSV
- Share results via link
- Add custom LCOE values

## 📚 Additional Resources

- **Backend Documentation:** `backend/README.md`
- **NREL API Docs:** https://developer.nrel.gov/docs/solar/
- **Open-Meteo Docs:** https://open-meteo.com/en/docs
- **NASA POWER Docs:** https://power.larc.nasa.gov/docs/

## 💡 Tips

1. **Start Small:** Test with low budgets and simple constraints
2. **Use Real Data:** Input actual data center load profiles
3. **Iterate:** Try different scenarios to find the optimal solution
4. **Validate:** Compare results with existing installations
5. **Cache Results:** Implement caching to reduce API calls

## 🤝 Contributing

Found a bug or have a suggestion? Please:
1. Check existing issues
2. Create a new issue with details
3. Submit a pull request

## 📄 License

See LICENSE file in project root.
