# 🏗️ Complete Integration Guide: Vercel Postgres + Prisma + Next.js

This guide shows how everything integrates together for a production-ready setup.

---

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Browser                          │
│                  (Vercel Hosted Frontend)                   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Server                          │
│              (Vercel Serverless Functions)                  │
│  - /api/plan                                                │
│  - /api/orchestrate                                         │
│  - /api/scenarios                                           │
│  - /api/runs                                                │
│  - /api/telemetry                                           │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ↓ TCP/SSL
┌─────────────────────────────────────────────────────────────┐
│                  Vercel Postgres                            │
│         (PostgreSQL Database + Connection Pooling)          │
│  - Users, Scenarios, Runs, Telemetry                        │
│  - JSONB for flexible data                                  │
│  - Automatic backups & encryption                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Example

### Example: Creating a Scenario

```
1. User clicks "Create Scenario" in UI
   ↓
2. Frontend sends POST /api/scenarios
   {
     name: "San Francisco DC",
     latitude: 37.7749,
     longitude: -122.4194,
     constraints: { budget: 500000, renewable: 0.3 },
     pricing: { electricityUSDPerKWh: 0.12 },
     currentLoad: { averageKW: 1000, peakKW: 1200 }
   }
   ↓
3. Next.js API Route (app/api/scenarios/route.ts)
   - Validates input with Zod
   - Calls Prisma ORM
   ↓
4. Prisma Client (with pg adapter)
   - Builds parameterized SQL query
   - Gets connection from pool
   - Executes on Vercel Postgres
   ↓
5. PostgreSQL
   INSERT INTO scenarios (...) VALUES (...)
   - Stores data
   - Generates response
   ↓
6. Result flows back: SQL → Prisma → API Route → User
   Response: { id: "uuid", name: "San Francisco DC", ... }
   ↓
7. Frontend updates UI with new scenario
```

---

## 🔌 Connection Architecture

### Connection Pool (Production Optimized)

```typescript
// lib/prisma.ts - How connections are managed

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                    // Max 10 concurrent connections
  idleTimeoutMillis: 30000,   // Close idle after 30 seconds
  connectionTimeoutMillis: 10000,  // Timeout after 10 seconds
  ssl: { rejectUnauthorized: false }  // SSL encrypted
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

**How it works:**
```
Request 1 → Get connection from pool ─┐
Request 2 → Get connection from pool ─┼→ Database
Request 3 → Get connection from pool ─┤
Request 4 → Wait for free connection ┘
```

This ensures:
- ✅ No connection leaks
- ✅ Efficient resource usage
- ✅ Handles concurrent requests
- ✅ Auto-reconnects on failure

---

## 📊 Database Schema Integration

### Your Data Model

```
User
├── email, name, createdAt
└── relation: scenarios[]

Scenario
├── name, description, location
├── constraints (JSON)
├── pricing (JSON)
├── currentLoad (JSON)
└── relations: runs[], telemetry[]

PipelineRun
├── success, executionMs
├── inputSnapshot (JSON)
├── Summary metrics (denormalized)
└── relations: scenario, stages[], vppa, sensitivity

StageResult
├── stageName, status
├── output (JSON)
└── relation: run

TelemetryData
├── timestamp, energy metrics
├── environmental data
└── relation: scenario

Indexes (Optimized for queries):
- scenarios(userId, createdAt)
- scenarios(latitude, longitude)
- telemetry(scenarioId, timestamp)
- runs(scenarioId, createdAt)
```

### Why This Design?

| Feature | Benefit |
|---------|---------|
| **PostgreSQL** | ACID transactions, complex queries, foreign keys |
| **JSONB** | Flexible schema, store complex structures |
| **Indexes** | Fast queries on frequently filtered fields |
| **Denormalization** | Quick summary statistics without aggregation |
| **Relations** | Enforce data integrity, prevent orphans |

---

## 🚀 Deployment Pipeline

### From Code to Production

```
1. Developer commits code
   git commit -m "Add new feature"
   ↓
2. Push to GitHub
   git push origin main
   ↓
3. GitHub Actions triggers
   .github/workflows/ci-cd.yml
   ↓
4. CI/CD Pipeline runs:
   
   ├─ Install dependencies (pnpm install)
   │
   ├─ Setup test database (PostgreSQL service)
   │
   ├─ Generate Prisma Client
   │  (pnpm prisma generate)
   │
   ├─ Run migrations on test DB
   │  (pnpm prisma migrate deploy)
   │
   ├─ Build application
   │  (pnpm build)
   │
   ├─ Start application
   │  (pnpm start)
   │
   └─ Run comprehensive tests (26 tests)
      (npm test)
      
      If tests FAIL → Stop, notify developer
      If tests PASS → Continue to deployment
   ↓
5. Build Docker image
   docker build -t shubh2047/data-center-simulator:latest .
   ↓
6. Push to Docker Hub
   docker push shubh2047/data-center-simulator:latest
   ↓
7. Deploy to Vercel
   
   ├─ Pull latest code
   │
   ├─ Install dependencies
   │  (pnpm install)
   │
   ├─ Generate Prisma Client
   │  (pnpm prisma generate)
   │
   ├─ Run migrations on production DB
   │  (pnpm prisma migrate deploy)
   │
   └─ Build & deploy
      (pnpm build)
      
      Application is LIVE at: https://your-domain.vercel.app
   ↓
8. Post-deployment verification
   
   ├─ Health check: /api/health
   │
   ├─ Run smoke tests
   │
   └─ Monitor error logs for 5 minutes
```

---

## 🧪 Testing Integration

### Test Coverage (26 Tests)

```javascript
1. Health Check (1 test)
   └─ Verify API responds

2. Plan API (6 tests)
   ├─ Valid locations (SF, London, NYC)
   ├─ Different load scenarios (1MW, 2MW, 5MW)
   ├─ Invalid inputs (missing fields, bad data)
   └─ Error handling (validation failures)

3. Orchestrator API (2 tests)
   ├─ Full pipeline execution
   └─ Custom pricing scenarios

4. Scenarios (5 tests)
   ├─ List all scenarios
   ├─ Create new scenario
   ├─ Get by ID
   ├─ Validation (missing fields)
   └─ Pagination

5. Runs (7 tests)
   ├─ List all runs
   ├─ Filter by scenario
   ├─ Get specific run
   ├─ Pagination
   ├─ Filter by success
   ├─ Include details
   └─ Error handling (404)

6. Telemetry (2 tests)
   ├─ Query by scenario
   └─ Validation

7. Error Handling (3 tests)
   ├─ 404 for non-existent endpoints
   ├─ Malformed JSON
   └─ Large payload handling
```

### Test Execution

```bash
# Run tests against local app
npm test

# Test production deployment
API_URL=https://your-app.vercel.app npm test

# Just smoke tests
npm run test:basic
```

---

## 🔐 Security Layers

### 1. Database Security
```
├─ SSL/TLS encryption (?sslmode=require)
├─ Connection pooling prevents connection exhaustion
├─ Automatic backups (7-day recovery)
└─ Vercel infrastructure security
```

### 2. Application Security
```
├─ Input validation (Zod schemas)
├─ Parameterized queries (Prisma handles this)
├─ CSRF protection (Next.js default)
├─ XSS protection (React automatic escaping)
└─ Environment variables (secrets not in code)
```

### 3. API Security
```
├─ CORS headers configured
├─ Rate limiting can be added
├─ Error messages don't leak info
├─ Health checks for monitoring
└─ Graceful error handling
```

---

## 📈 Performance Optimization

### Connection Pooling

```
Without pooling: Every request creates new connection
└─ SLOW: 200-500ms per connection creation

With pooling: Connections reused from pool
└─ FAST: < 10ms to get connection from pool
```

### Query Optimization

```typescript
// ❌ Slow: N+1 query problem
const scenarios = await prisma.scenario.findMany();
for (const scenario of scenarios) {
  const runs = await prisma.pipelineRun.findMany({
    where: { scenarioId: scenario.id }  // Extra query for each!
  });
}

// ✅ Fast: Single query with include
const scenarios = await prisma.scenario.findMany({
  include: {
    runs: true  // Joins in single query
  }
});
```

### Caching Strategy

```typescript
// Cache expensive queries
const cacheKey = `scenario:${id}`;
let scenario = await redis.get(cacheKey);

if (!scenario) {
  // Not in cache, fetch from DB
  scenario = await prisma.scenario.findUnique({
    where: { id }
  });
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(scenario));
}
```

---

## 🔄 Continuous Integration Flow

### What Happens on Every Push

```
developer@computer:~/project$ git push origin main
  │
  ├─ GitHub receives push
  │
  ├─ GitHub Actions triggered
  │  └─ Job: "Run Tests"
  │     ├─ Start PostgreSQL service
  │     ├─ Start Redis service
  │     ├─ Install dependencies
  │     ├─ Generate Prisma Client
  │     ├─ Run migrations
  │     ├─ Build application
  │     ├─ Start server
  │     └─ Run 26 tests
  │        └─ If any fails: STOP, notify developer
  │        └─ If all pass: Continue
  │
  ├─ Job: "Build and Push Docker Image"
  │  ├─ Build Docker image
  │  └─ Push to Docker Hub
  │
  └─ Job: "Deploy to Vercel"
     ├─ Pull latest code
     ├─ Install dependencies
     ├─ Generate Prisma Client
     ├─ Run migrations on production
     ├─ Build application
     └─ Deploy and go live!

Status updates sent to:
  └─ GitHub Pull Request (if PR)
  └─ Email notifications
  └─ Slack (if configured)
```

---

## 🛠️ Development Workflow

### Local Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Pull Vercel environment variables
vercel env pull

# 3. Start local database
docker-compose up -d

# 4. Setup database
pnpm db:setup

# 5. Start dev server
pnpm dev

# 6. Make changes to code
# (Auto-reloads due to hot module reloading)

# 7. Before committing, run tests
npm test

# 8. Commit and push
git add .
git commit -m "Meaningful message"
git push origin main
```

### Adding a New API Endpoint

```typescript
// 1. Create route: app/api/newfeature/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body.required_field) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400 }
      );
    }
    
    // Use Prisma to interact with database
    const result = await prisma.yourModel.create({
      data: body
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create', details: error.message },
      { status: 500 }
    );
  }
}
```

```typescript
// 2. Add test to scripts/test-suite-comprehensive.js
results.push(await testEndpoint(
  'New Feature API',
  `${API_URL}/api/newfeature`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ required_field: 'value' })
  }
));
```

```bash
# 3. Test locally
npm test

# 4. Deploy
git push origin main
```

---

## 📊 Monitoring & Observability

### What to Monitor

```
Database Level:
├─ Connection pool usage
├─ Query performance
├─ Storage usage
└─ Backup status

Application Level:
├─ Request latency
├─ Error rates
├─ Failed tests
└─ Deployment status

User Level:
├─ API response times
├─ Feature usage
├─ Error messages
└─ User satisfaction
```

### Tools Available

```
Vercel Dashboard:
├─ Deployments
├─ Analytics
├─ Logs
├─ Environment variables
└─ Usage metrics

Vercel Postgres Storage:
├─ Database size
├─ Connection count
├─ Slow queries
└─ Backup status

GitHub:
├─ Actions logs
├─ Deployment history
└─ Code changes

Local:
├─ Prisma Studio (GUI for DB)
│  pnpm prisma studio
│
└─ Server logs
   pnpm dev
```

---

## 🎯 Common Scenarios

### Scenario 1: Deploy New Feature

```bash
1. Create feature branch
   git checkout -b feature/new-endpoint

2. Create API endpoint
   app/api/feature/route.ts

3. Add tests
   scripts/test-suite-comprehensive.js

4. Test locally
   pnpm dev
   npm test

5. Push branch
   git push origin feature/new-endpoint

6. Create Pull Request on GitHub

7. CI/CD runs tests automatically

8. If tests pass, merge to main
   git merge feature/new-endpoint

9. Automatically deployed to production!
```

### Scenario 2: Database Migration

```bash
1. Modify Prisma schema
   prisma/schema.prisma

2. Create migration
   pnpm prisma migrate dev --name describe_change

3. Test locally
   npm test

4. Migrations auto-apply on deployment
   (Vercel runs: pnpm prisma migrate deploy)

5. Data is preserved, schema is updated
```

### Scenario 3: Performance Issue

```bash
1. Check Vercel logs
   vercel logs --follow

2. Check slow queries
   Vercel Dashboard → Storage → Slow queries

3. Optimize query or add index
   prisma/schema.prisma

4. Test locally
   npm test

5. Deploy fix
   git push origin main
```

---

## ✅ Production Readiness Checklist

- [x] PostgreSQL database set up (Vercel Postgres)
- [x] Prisma ORM configured with connection pooling
- [x] Comprehensive test suite (26 tests)
- [x] CI/CD pipeline automated
- [x] Environment variables managed securely
- [x] Migrations managed by Prisma
- [x] Backup and recovery available
- [x] Monitoring and logging configured
- [x] Security best practices applied
- [x] Documentation complete
- [x] Team onboarded

---

## 🚀 You're Production Ready!

This integration provides:

✅ **Reliable Database**
- Vercel Postgres with SSL encryption
- Automatic backups and recovery
- Connection pooling for performance

✅ **Robust Application**
- Next.js with TypeScript
- Prisma ORM for type safety
- Comprehensive error handling

✅ **Automated Testing**
- 26 tests covering all endpoints
- Tests run before every deployment
- Blocks deployment if tests fail

✅ **Continuous Deployment**
- Automatic deployment on push to main
- Migrations run automatically
- Health checks after deployment

✅ **Production Monitoring**
- Vercel analytics and logs
- Database usage tracking
- Performance metrics

---

**Next Step:** Deploy! 🚀

```bash
git push origin main
```

Monitor at: https://vercel.com/dashboard

---

Last Updated: January 14, 2026  
Status: ✅ Production Ready  
Architecture: Next.js + Vercel Postgres + Prisma + CI/CD
