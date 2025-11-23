# Database Integration Guide

## Overview

The Data Center Simulator now supports full database persistence using PostgreSQL and Prisma ORM. This enables storing telemetry data, scenarios, pipeline execution results, and analysis outputs for historical tracking and analysis.

## Architecture

### Database: PostgreSQL 18

- **Host**: localhost
- **Port**: 5433
- **Database**: datacenter_simulator
- **User**: shubh

### ORM: Prisma 7

- Configuration file: `prisma/prisma.config.ts`
- Schema file: `prisma/schema.prisma`
- Client singleton: `lib/prisma.ts`

## Database Schema

### Core Tables

1. **users** - User accounts
2. **scenarios** - Data center optimization scenarios
3. **telemetry_data** - Time-series telemetry from data centers
4. **pipeline_runs** - Optimization pipeline execution records
5. **stage_results** - Individual pipeline stage outputs
6. **vppa_results** - Virtual Power Purchase Agreement analysis
7. **sensitivity_results** - Risk and sensitivity analysis
8. **renewable_cache** - Cached renewable energy forecasts

## Data Flow

### 1. Telemetry Upload → Database

Data centers upload operational telemetry via POST request:

```typescript
POST /api/telemetry
Content-Type: application/json

{
  "scenarioId": "uuid",
  "data": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "facilityEnergyKWh": 1200,
      "itLoadKW": 800,
      "coolingLoadKW": 300,
      "pue": 1.5,
      "solarGenKW": 150,
      "windGenKW": 75,
      "batterySOC": 0.8,
      "gridImportKW": 975,
      "outdoorTempC": 22,
      "carbonIntensity": 0.4
    }
  ]
}
```

**Response**: 201 Created with inserted count

**Query telemetry**:

```
GET /api/telemetry?scenarioId=uuid&startDate=2024-01-01&endDate=2024-01-31
```

### 2. Pipeline Execution → Database

When the optimization pipeline runs, results are automatically saved:

```typescript
POST /api/orchestrate
Content-Type: application/json

{
  "scenarioId": "uuid",  // Optional: if provided, saves to database
  "coordinates": { "latitude": 37.77, "longitude": -122.42 },
  "currentLoad": { "averageKW": 1000, "peakKW": 1200, "currentPUE": 1.5 },
  "constraints": {
    "budget": 1000000,
    "targetRenewableFraction": 0.8,
    "maxSolarKW": 5000,
    "maxWindKW": 3000,
    "maxBatteryKWh": 2000
  },
  "pricing": {
    "electricityUSDPerKWh": 0.12,
    "carbonUSDPerTon": 50,
    "solarCapexUSDPerKW": 1200,
    "windCapexUSDPerKW": 1500,
    "batteryCapexUSDPerKWh": 400
  },
  "vppa": {
    "enabled": true,
    "contractDuration": 15,
    "forwardCurve": [45, 47, 49, 51, 53]
  },
  "sensitivity": {
    "enabled": true,
    "monteCarlo": { "iterations": 1000 }
  }
}
```

**Response**: Pipeline result + `pipelineRunId`

**Database records created**:

- 1 `PipelineRun` with summary metrics
- 4 `StageResult` records (planner, optimizer, pue, financial)
- 1 `VPPAResult` (if VPPA enabled)
- 1 `SensitivityResult` (if sensitivity enabled)

### 3. Roadmap Fetch from Database

The roadmap page intelligently fetches data:

1. **First checks database** for existing pipeline runs (if `scenarioId` exists)
2. **Falls back to live execution** if no saved results found
3. **Displays data source badge** showing "Loaded from database" or "Live execution"

**Fetch saved runs**:

```
GET /api/runs?scenarioId=uuid&success=true&limit=10&includeDetails=true
```

**Response**:

```json
{
  "runs": [
    {
      "id": "run-uuid",
      "scenarioId": "scenario-uuid",
      "success": true,
      "executionMs": 2340,
      "solarKw": 2500,
      "windKw": 1500,
      "batteryKwh": 1000,
      "totalCapex": 850000,
      "paybackMonths": 48,
      "npv20yr": 1200000,
      "roiPercent": 15.2,
      "renewableFraction": 0.82,
      "co2ReductionTonYear": 1250,
      "createdAt": "2024-01-15T10:00:00Z",
      "stages": [...],
      "vppa": {...},
      "sensitivity": {...}
    }
  ],
  "total": 15,
  "hasMore": true
}
```

## API Endpoints

### Scenarios

- `POST /api/scenarios` - Create scenario
- `GET /api/scenarios` - List scenarios (paginated)
- `GET /api/scenarios/[id]` - Get scenario details with runs
- `DELETE /api/scenarios/[id]` - Delete scenario (cascades)

### Telemetry

- `POST /api/telemetry` - Bulk upload telemetry
- `GET /api/telemetry` - Query telemetry (filters: scenarioId, dateRange)

### Pipeline Runs

- `POST /api/orchestrate` - Execute pipeline (saves if scenarioId provided)
- `GET /api/runs` - List pipeline runs (filters: scenarioId, success, pagination)
- `GET /api/runs/[id]` - Get run details with all stages
- `DELETE /api/runs/[id]` - Delete run

## Database Management

### Prisma Studio

```bash
npx prisma studio
```

Visual database browser at http://localhost:49152

### Migrations

```bash
# Create migration after schema changes
npx prisma migrate dev --name migration_name

# Check migration status
npx prisma migrate status

# Reset database (DEVELOPMENT ONLY)
npx prisma migrate reset
```

### Direct SQL Access

```bash
psql -h localhost -p 5433 -U shubh -d datacenter_simulator
```

## Store Integration

The `simulator-store.ts` now includes:

```typescript
{
  scenarioId: string | null,
  setScenarioId: (id: string | null) => void
}
```

Set scenario ID to enable database persistence:

```typescript
const { setScenarioId } = useSimulatorStore();
setScenarioId("uuid-from-scenario-creation");
```

## Usage Examples

### Complete Workflow

1. **Create Scenario**

```typescript
const scenario = await fetch('/api/scenarios', {
  method: 'POST',
  body: JSON.stringify({
    name: 'SF Data Center Q1 2024',
    description: 'Phase 1 renewable integration',
    constraints: {...},
    pricing: {...},
    currentLoad: {...}
  })
}).then(r => r.json());

setScenarioId(scenario.id);
```

2. **Upload Telemetry**

```typescript
await fetch("/api/telemetry", {
  method: "POST",
  body: JSON.stringify({
    scenarioId: scenario.id,
    data: telemetryPoints,
  }),
});
```

3. **Run Pipeline** (automatically saves to DB)

```typescript
const result = await fetch('/api/orchestrate', {
  method: 'POST',
  body: JSON.stringify({
    scenarioId: scenario.id,
    coordinates: {...},
    currentLoad: {...},
    constraints: {...},
    pricing: {...}
  })
}).then(r => r.json());

console.log('Pipeline Run ID:', result.pipelineRunId);
```

4. **View Results** - Navigate to `/roadmap` page
   - Shows green badge "📊 Loaded from database" if results exist
   - Shows blue badge "⚡ Live execution" if running new analysis

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "details": "Additional context"
}
```

Pipeline saves gracefully handle database failures - execution continues even if DB write fails.

## Performance Considerations

- **Telemetry bulk inserts**: Use `createMany` for efficient batch uploads
- **Query pagination**: Default limit is 10, max recommended is 100
- **Includes**: Set `includeDetails=true` only when needed (increases response size)
- **Indexes**: scenarioId and timestamp are indexed for fast queries

## Security Notes

- No authentication implemented yet - **DO NOT expose to public internet**
- Database credentials in `.env` file (git-ignored)
- Input validation on all API endpoints
- Prepared statements via Prisma prevent SQL injection

## Next Steps

- [ ] Run pending migration: `npx prisma migrate dev --name add_telemetry`
- [ ] Implement user authentication
- [ ] Add scenario access controls
- [ ] Create data retention policies
- [ ] Add audit logging
- [ ] Implement result caching layer
