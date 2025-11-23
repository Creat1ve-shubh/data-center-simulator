# 🚀 Production Deployment Guide

## ✅ What You Have Now

Your GreenCloud Data Center Simulator now includes:

1. **✨ AI-Powered Renewable Planner** (NEW!)
   - Real-time API integration (NREL, Open-Meteo, NASA)
   - MILP optimization for capacity sizing
   - Frontend UI at `/renewable-planner`
   - Backend API at `/api/plan`

2. **📊 Original Simulator Features**
   - Efficiency analysis
   - Transition roadmap
   - Telemetry monitoring
   - Case studies
   - Documentation

## 🎯 Quick Start (5 Minutes)

### 1. Environment Setup

Already done! Your `.env.local` should have:
```bash
NREL_API_KEY=your_key_here
```

### 2. Start Development Server

```bash
pnpm dev
```

### 3. Test the New Feature

**Option A: Browser**
1. Navigate to `http://localhost:3000/renewable-planner`
2. Click "Use My Location" or enter coordinates
3. Adjust load and budget settings
4. Click "Optimize Renewable Plan"
5. Wait 30-60 seconds for results

**Option B: API Test Script**
```bash
pnpm test:api
```

This tests 3 different locations automatically.

## 📁 New Files Added

```
📦 data-center-simulator
├── 📂 backend/
│   ├── types/index.ts                    # TypeScript type definitions
│   ├── utils/energy-conversions.ts       # Energy conversion utilities
│   ├── services/
│   │   ├── api/renewables.ts             # API integrations (NREL, Open-Meteo, NASA)
│   │   └── optimizer/milp.ts             # MILP optimization engine
│   └── README.md                         # Technical documentation
│
├── 📂 app/
│   ├── api/plan/route.ts                 # Next.js API endpoint
│   └── renewable-planner/page.tsx        # Frontend page
│
├── 📂 components/
│   └── renewable-optimizer.tsx           # React component
│
├── 📂 scripts/
│   └── test-api.js                       # API testing script
│
├── .env.example                          # Environment template
├── QUICKSTART.md                         # Quick start guide
├── FRONTEND_INTEGRATION.md               # Frontend integration docs
└── DEPLOYMENT.md                         # This file
```

## 🔌 API Endpoint Details

### POST `/api/plan`

**Request:**
```json
{
  "coordinates": { "latitude": 37.7749, "longitude": -122.4194 },
  "currentLoad": { "averageKW": 1200, "peakKW": 1560 },
  "constraints": {
    "budget": 2000000,
    "targetRenewableFraction": 0.8,
    "maxSolarKW": 10000,
    "maxWindKW": 5000,
    "maxBatteryKWh": 5000
  },
  "pricing": {
    "electricityUSDPerKWh": 0.12,
    "carbonUSDPerTon": 50,
    "solarCapexUSDPerKW": 1200,
    "windCapexUSDPerKW": 1500,
    "batteryCapexUSDPerKWh": 300
  }
}
```

**Response:**
```json
{
  "optimal_plan": {
    "solar_kw": 850,
    "wind_kw": 300,
    "battery_kwh": 500
  },
  "renewable_fraction": 0.82,
  "roi_months": 36,
  "co2_reduction_tons_year": 1200,
  "cost_savings_usd_year": 150000,
  "hourly_dispatch": [...]
}
```

## 🌐 Production Deployment

### Vercel (Recommended)

1. **Push to GitHub:**
```bash
git add .
git commit -m "Add AI renewable planner"
git push origin main
```

2. **Deploy to Vercel:**
```bash
vercel
```

3. **Set Environment Variables:**
```bash
vercel env add NREL_API_KEY
```
Enter your NREL API key when prompted.

4. **Deploy:**
```bash
vercel --prod
```

### Environment Variables Required

```bash
NREL_API_KEY=your_nrel_api_key_here
```

Optional (for advanced features):
```bash
NODE_ENV=production
API_TIMEOUT_MS=60000
MAX_OPTIMIZATION_HOURS=8760
```

## 🎨 Frontend Access

### Direct Navigation
Users can access the new planner via:
- Navigation menu: **"AI Planner"** tab
- Direct URL: `/renewable-planner`

### Component Integration
Embed the optimizer anywhere:
```tsx
import { RenewableOptimizer } from "@/components/renewable-optimizer";

<RenewableOptimizer 
  onResultsUpdate={(results) => {
    console.log("Got results:", results);
  }}
/>
```

## 📊 Performance Optimization

### 1. API Caching
Add response caching to reduce API calls:

```typescript
// In app/api/plan/route.ts
const cache = new Map();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const cacheKey = `${body.coordinates.latitude},${body.coordinates.longitude}`;
  
  if (cache.has(cacheKey)) {
    return NextResponse.json(cache.get(cacheKey));
  }
  
  const result = await optimizeRenewablePlan(body);
  cache.set(cacheKey, result);
  
  return NextResponse.json(result);
}
```

### 2. Database Integration
Store optimization results:

```bash
pnpm add @prisma/client prisma
npx prisma init
```

Create schema:
```prisma
model OptimizationResult {
  id        String   @id @default(cuid())
  latitude  Float
  longitude Float
  result    Json
  createdAt DateTime @default(now())
}
```

### 3. Background Jobs
For long-running optimizations:

```bash
pnpm add bullmq redis
```

Queue optimization jobs and return results asynchronously.

## 🐛 Troubleshooting

### Error: "NREL API key not found"
```bash
# Check environment variable
echo $NREL_API_KEY

# Restart dev server after adding .env.local
pnpm dev
```

### Error: "Request timeout"
Increase timeout in `app/api/plan/route.ts`:
```typescript
export const maxDuration = 120; // 2 minutes
```

### Error: "Rate limit exceeded"
Implement request caching or upgrade NREL API plan.

### Optimization takes too long
Reduce time horizon:
```typescript
// In backend/services/optimizer/milp.ts
const MAX_HOURS = 2160; // 90 days instead of full year
```

## 📈 Monitoring

### Add Analytics
```bash
pnpm add @vercel/analytics
```

Track optimization requests:
```typescript
import { track } from '@vercel/analytics';

track('optimization_request', {
  latitude: body.coordinates.latitude,
  longitude: body.coordinates.longitude,
  budget: body.constraints.budget
});
```

### Error Tracking
```bash
pnpm add @sentry/nextjs
```

Initialize Sentry:
```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
});
```

## 🔐 Security Best Practices

1. **Rate Limiting**
```bash
pnpm add @upstash/ratelimit @upstash/redis
```

2. **API Key Rotation**
- Store in environment variables
- Never commit to git
- Rotate quarterly

3. **Input Validation**
Already implemented in `app/api/plan/route.ts`

4. **CORS Configuration**
```typescript
// next.config.mjs
export default {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' }
        ]
      }
    ]
  }
}
```

## 🧪 Testing

### Unit Tests
```bash
pnpm add -D jest @testing-library/react @testing-library/jest-dom
```

### API Tests
```bash
pnpm test:api
```

### E2E Tests
```bash
pnpm add -D @playwright/test
npx playwright install
```

## 📚 Documentation

- **Backend:** [`backend/README.md`](backend/README.md)
- **Quick Start:** [`QUICKSTART.md`](QUICKSTART.md)
- **Frontend:** [`FRONTEND_INTEGRATION.md`](FRONTEND_INTEGRATION.md)
- **API Types:** [`backend/types/index.ts`](backend/types/index.ts)

## 🚀 Next Features to Add

1. **Historical Comparison**
   - Store past optimizations
   - Show trends over time

2. **Multi-Location Analysis**
   - Compare multiple sites
   - Aggregate recommendations

3. **Real-Time Updates**
   - WebSocket for live progress
   - Incremental results display

4. **Export Reports**
   - PDF generation
   - Excel export
   - Email delivery

5. **Advanced Constraints**
   - Land availability
   - Grid connection capacity
   - Environmental permits
   - Seasonal factors

## 💡 Tips

### Development
```bash
# Hot reload works
pnpm dev

# Check types
pnpm build

# Format code
pnpm format
```

### Production
```bash
# Build optimized
pnpm build

# Start production server
pnpm start

# Test production build locally
pnpm build && pnpm start
```

### Debugging
```bash
# Enable verbose logging
DEBUG=* pnpm dev

# Check API response
curl -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d '{"coordinates":{"latitude":37.7749,"longitude":-122.4194},...}'
```

## ✨ Success Metrics

Track these KPIs:
- ✅ Optimization requests per day
- ⏱️ Average optimization time
- 💰 Total cost savings calculated
- 🌱 Total CO₂ reduction potential
- 📊 User satisfaction score

## 🎉 You're Ready!

Your renewable energy optimizer is production-ready. Key highlights:

✅ Real-time API integration  
✅ MILP optimization engine  
✅ Beautiful React UI  
✅ Comprehensive documentation  
✅ Test scripts included  
✅ Error handling implemented  
✅ Type-safe TypeScript code  

**Next Steps:**
1. Test locally: `pnpm dev` → visit `/renewable-planner`
2. Run tests: `pnpm test:api`
3. Deploy: `vercel --prod`
4. Monitor: Add analytics
5. Scale: Implement caching

Need help? Check the documentation files or open an issue!

---

**Built with:** Next.js 15, TypeScript, NREL API, Open-Meteo, NASA POWER, MILP Optimization
