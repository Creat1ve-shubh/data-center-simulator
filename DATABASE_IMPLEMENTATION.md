# Database Integration - Implementation Summary

## ✅ Completed Tasks

### 1. Database Schema Extension

- **File**: `prisma/schema.prisma`
- **Changes**: Added `TelemetryData` model with comprehensive fields:
  - Energy metrics (facilityEnergyKWh, itLoadKW, coolingLoadKW)
  - Renewable generation (solarGenKW, windGenKW, batterySOC)
  - Grid interaction (gridImportKW)
  - Environmental data (outdoorTempC, carbonIntensity)
  - Indexed on `scenarioId + timestamp` for performance
- **Migration**: `add_telemetry` (schema ready, pending execution)

### 2. API Endpoints Created

#### Telemetry API (`app/api/telemetry/route.ts`)

- **POST**: Bulk upload telemetry data
  - Validates scenario exists
  - Uses `createMany` for efficient batch inserts
  - Returns count of inserted records
- **GET**: Query telemetry with filters
  - Filter by `scenarioId`, `startDate`, `endDate`
  - Ordered by timestamp descending
  - Limit results to 1000 records

#### Scenario Management APIs

- **`app/api/scenarios/route.ts`**
  - POST: Create scenario with constraints, pricing, currentLoad
  - GET: List scenarios with pagination, include run counts, telemetry counts
- **`app/api/scenarios/[id]/route.ts`**
  - GET: Fetch scenario details with nested runs, stages, vppa, sensitivity
  - DELETE: Delete scenario (cascades to related data)

#### Pipeline Runs API

- **`app/api/runs/route.ts`**
  - GET: List pipeline runs with filters (scenarioId, success, pagination)
  - Query param `includeDetails=true` for full nested data
- **`app/api/runs/[id]/route.ts`**
  - GET: Fetch specific run with all stages, vppa, sensitivity
  - DELETE: Delete pipeline run

### 3. Pipeline Persistence (`app/api/orchestrate/route.ts`)

**Enhanced to save results automatically:**

- Accepts optional `scenarioId` in request body
- After successful pipeline execution, creates:
  - `PipelineRun` record with summary metrics (solar_kw, wind_kw, battery_kwh, totalCapex, paybackMonths, npv20yr, roiPercent, renewableFraction, co2ReductionTonYear)
  - 4 `StageResult` records (planner, optimizer, pue, financial)
  - `VPPAResult` (if VPPA enabled)
  - `SensitivityResult` (if sensitivity analysis enabled)
- Returns `pipelineRunId` in response
- Gracefully handles DB write failures (continues execution)

### 4. Roadmap Page Database Integration (`app/roadmap/page.tsx`)

**Smart data fetching logic:**

1. **Check database first**: If `scenarioId` exists, fetch latest successful run
2. **Reconstruct pipeline output**: Convert DB record to expected format
3. **Fallback to live execution**: If no saved results, run pipeline and save
4. **Visual indicators**:
   - 📊 Green badge: "Loaded from database" + run ID + timestamp
   - ⚡ Blue badge: "Live execution"

### 5. Store Enhancement (`store/simulator-store.ts`)

Added scenario tracking:

```typescript
scenarioId: string | null
setScenarioId: (id: string | null) => void
```

### 6. Documentation

- **`DATABASE.md`**: Comprehensive integration guide with:
  - Architecture overview
  - Database schema reference
  - Data flow diagrams (telemetry → DB → pipeline → roadmap)
  - API endpoint documentation with examples
  - Database management commands
  - Complete workflow examples
  - Security notes and next steps

## 📁 Files Created/Modified

### Created Files

1. `app/api/telemetry/route.ts` (API for telemetry upload/query)
2. `app/api/scenarios/route.ts` (Scenario creation/listing)
3. `app/api/scenarios/[id]/route.ts` (Scenario details/deletion)
4. `app/api/runs/route.ts` (Pipeline runs listing)
5. `app/api/runs/[id]/route.ts` (Pipeline run details/deletion)
6. `DATABASE.md` (Integration guide)
7. `DATABASE_IMPLEMENTATION.md` (This file)

### Modified Files

1. `prisma/schema.prisma` - Added TelemetryData model
2. `app/api/orchestrate/route.ts` - Added database persistence
3. `app/roadmap/page.tsx` - Fetch from DB, fallback to live
4. `store/simulator-store.ts` - Added scenarioId state

## 🔄 Data Flow Architecture

```
┌─────────────────┐
│  Data Center    │
│   Telemetry     │
└────────┬────────┘
         │
         ▼
  POST /api/telemetry
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│  telemetry_data │
└────────┬────────┘
         │
         ▼
  GET /api/telemetry
         │
         ▼
┌─────────────────┐
│  Pipeline Input │
│ (scenarioId set)│
└────────┬────────┘
         │
         ▼
 POST /api/orchestrate
         │
         ├─────────────────────┐
         ▼                     ▼
  Run Optimization      Save to Database
  Pipeline (live)       - PipelineRun
         │              - StageResults
         │              - VPPAResult
         │              - SensitivityResult
         │                     │
         └──────┬──────────────┘
                ▼
          Return Result
          + pipelineRunId
                │
                ▼
┌─────────────────────────┐
│   Roadmap Page Load     │
│ Check DB for saved runs │
└────────┬────────────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
Found in DB   Not Found
    │          │
    │          ▼
    │    Execute Live
    │    (new run)
    │          │
    └────┬─────┘
         ▼
   Display Results
   with Data Source Badge
```

## 🎯 Usage Example

### Complete End-to-End Flow

```typescript
// 1. Create Scenario
const scenario = await fetch("/api/scenarios", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "SF Data Center Q1 2024",
    description: "Phase 1 renewable integration",
    constraints: { budget: 1000000, maxSolarKW: 5000 },
    pricing: { electricityUSDPerKWh: 0.12 },
    currentLoad: { averageKW: 1000, peakKW: 1200, currentPUE: 1.5 },
  }),
}).then((r) => r.json());

// 2. Set in store (enables persistence)
setScenarioId(scenario.id);

// 3. Upload historical telemetry
await fetch("/api/telemetry", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    scenarioId: scenario.id,
    data: [
      {
        timestamp: "2024-01-15T10:00:00Z",
        facilityEnergyKWh: 1200,
        itLoadKW: 800,
        coolingLoadKW: 300,
        pue: 1.5,
        solarGenKW: 150,
        windGenKW: 75,
        batterySOC: 0.8,
        gridImportKW: 975,
        outdoorTempC: 22,
        carbonIntensity: 0.4,
      },
      // ... more data points
    ],
  }),
});

// 4. Run optimization pipeline (auto-saves to DB)
const result = await fetch("/api/orchestrate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    scenarioId: scenario.id, // KEY: Enables DB persistence
    coordinates: { latitude: 37.77, longitude: -122.42 },
    currentLoad: { averageKW: 1000, peakKW: 1200, currentPUE: 1.5 },
    constraints: { budget: 1000000, targetRenewableFraction: 0.8 },
    pricing: { electricityUSDPerKWh: 0.12, carbonUSDPerTon: 50 },
    vppa: { enabled: true, contractDuration: 15 },
    sensitivity: { enabled: true },
  }),
}).then((r) => r.json());

console.log("Saved as:", result.pipelineRunId);

// 5. Navigate to /roadmap page
// - Automatically fetches from DB (shows green badge)
// - Displays pipeline analysis + implementation roadmap
// - Shows: Run ID, timestamp, execution time
```

## ⚠️ Pending Items

### Critical

1. **Run Migration**: Execute `npx prisma migrate dev --name add_telemetry`
   - Close Prisma Studio first to avoid lock
   - Creates `telemetry_data` table in PostgreSQL

### Recommended

1. **Test Complete Flow**:

   ```bash
   # 1. Create scenario via API
   # 2. Upload telemetry
   # 3. Run pipeline with scenarioId
   # 4. Check database has PipelineRun + stages
   # 5. Reload roadmap page (should show green badge)
   ```

2. **Verify Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   - Check `pipeline_runs` table populated
   - Verify nested relations (stages, vppa, sensitivity)

### Future Enhancements

- User authentication (assign scenarios to users)
- Scenario access controls (multi-tenant)
- Data retention policies (auto-archive old runs)
- Result caching (Redis for frequently accessed runs)
- Audit logging (track who modified scenarios)
- Export functionality (CSV, PDF reports)

## 🔐 Security Considerations

**Current State**: No authentication implemented

- ⚠️ **DO NOT expose to public internet**
- Database credentials in `.env` (git-ignored)
- Input validation on all endpoints
- Prepared statements via Prisma (SQL injection safe)

**Before Production**:

1. Implement authentication (NextAuth.js recommended)
2. Add authorization middleware (check scenario ownership)
3. Rate limiting on API endpoints
4. Input sanitization (additional layer)
5. HTTPS only (SSL/TLS)
6. Database backups (automated daily)

## 📊 Database Performance

### Indexes Created

- `TelemetryData`: `@@index([scenarioId, timestamp])`
- Enables fast queries: "Get last 30 days for scenario X"

### Query Optimizations

- Pagination limits (default 10, max 100 recommended)
- `includeDetails` flag (only fetch nested data when needed)
- Batch inserts (`createMany` for telemetry)
- Selective field projection (use `select` for counts)

### Monitoring

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## ✨ Benefits Achieved

1. **Historical Tracking**: All pipeline executions saved permanently
2. **Performance**: Roadmap loads instantly from DB (no re-computation)
3. **Telemetry Storage**: Enables time-series analysis and trending
4. **Audit Trail**: Complete record of optimization decisions
5. **Reproducibility**: Can review past scenarios and results
6. **Multi-scenario**: Support multiple data centers/configurations
7. **Data Integrity**: PostgreSQL ACID compliance, cascading deletes

## 🎓 Learning Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **PostgreSQL**: https://www.postgresql.org/docs/current/
- **Database Design**: Consider adding materialized views for analytics

---

**Implementation Date**: January 2024  
**Status**: ✅ Complete (pending migration execution)  
**Next Action**: Run `npx prisma migrate dev --name add_telemetry`
