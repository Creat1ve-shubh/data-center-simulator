# 🗄️ Production Database Setup Guide

## Architecture Decision: SQL vs NoSQL

### ✅ **SQL (PostgreSQL) is Optimal** for this project

#### Why SQL is Right for Data Center Simulator:

| Feature                    | Why It Matters                      | SQL Advantage                            |
| -------------------------- | ----------------------------------- | ---------------------------------------- |
| **Relational Data**        | Users → Scenarios → Runs → Results  | Native foreign keys & joins              |
| **Financial Calculations** | NPV, ROI, payback calculations      | ACID transactions, consistency           |
| **Complex Queries**        | Filter, aggregate, paginate results | Native SQL optimization                  |
| **Time-Series Data**       | Telemetry with timestamps           | Efficient indexing & partitioning        |
| **Audit Trail**            | Reproducibility of calculations     | Transaction logs, point-in-time recovery |
| **Data Integrity**         | Prevent orphaned records            | Foreign key constraints                  |

#### Hybrid Approach (Current Setup):

```
PostgreSQL (Primary Database)
  ├─ Structured data (users, scenarios, runs)
  ├─ JSONB for flexible fields (constraints, pricing)
  └─ Time-series telemetry data

Redis (Cache Layer)
  ├─ Renewable energy data (6-hour TTL)
  ├─ Session data (if needed)
  └─ Rate limiting
```

---

## 🚀 Production Database Options

### Comparison Matrix

| Provider            | Free Tier | Price      | Best For     | Connection Pooling | Backups   | Scaling   |
| ------------------- | --------- | ---------- | ------------ | ------------------ | --------- | --------- |
| **Vercel Postgres** | 256 MB    | $10/mo Pro | Vercel apps  | ✅ Built-in        | ✅ Auto   | ✅ Auto   |
| **Neon**            | 0.5 GB    | $19/mo Pro | Serverless   | ✅ Built-in        | ✅ Auto   | ✅ Auto   |
| **Supabase**        | 500 MB    | $25/mo Pro | Full backend | ✅ Built-in        | ✅ Auto   | ✅ Auto   |
| **Railway**         | 512 MB    | $5/mo      | Quick start  | ⚠️ Manual          | ✅ Auto   | ⚠️ Manual |
| **AWS RDS**         | None      | ~$15/mo    | Enterprise   | ⚠️ Manual          | ✅ Config | ✅ Config |

---

## 🏆 Recommended: Neon + Vercel

**Why this combination is optimal:**

1. **Cost-effective:** Free tier covers development, $19/month for production
2. **Serverless-native:** Auto-scales with your Vercel functions
3. **Developer experience:** Database branching for testing
4. **Performance:** Built-in connection pooling
5. **Reliability:** 99.99% uptime SLA

### Complete Setup Guide

#### Step 1: Create Neon Database

```bash
# 1. Sign up at https://neon.tech
# 2. Create a new project
# 3. Copy the connection string
```

#### Step 2: Configure Prisma for Production

Your current setup is already optimal! Just ensure:

```typescript
// prisma.config.ts (already configured)
datasources: {
  db: {
    provider: 'postgresql',
    url: env('DATABASE_URL')
  }
}
```

#### Step 3: Add to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Add environment variable
vercel env add DATABASE_URL production

# Paste Neon connection string:
# postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

#### Step 4: Configure Connection Pooling

For serverless environments, use Neon's connection pooling:

```env
# Use the "Pooled connection" string from Neon dashboard
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require&pgbouncer=true"
```

Or use Prisma Accelerate:

```bash
# Install Accelerate
npx prisma generate --accelerate

# Get Accelerate connection string from Prisma Cloud
# Add to Vercel as DATABASE_URL
```

---

## 🔧 Production Configuration

### 1. Connection Pooling (Critical for Serverless)

#### Current Setup (Good)

```typescript
// lib/prisma.ts - Using pg adapter with connection pooling
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Adjust based on Vercel plan
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

#### Production Optimization

```typescript
// lib/prisma.ts - Enhanced for production
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Configure pool based on environment
const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString,
  max: isProduction ? 10 : 5, // More connections in production
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Connection timeout
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected pool error:", err);
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: isProduction ? ["error", "warn"] : ["query", "error", "warn"],
});

// Graceful shutdown
if (typeof window === "undefined") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
    await pool.end();
  });
}
```

### 2. Database Migrations Strategy

```json
// package.json - Production migration scripts
{
  "scripts": {
    "migrate:prod": "prisma migrate deploy",
    "migrate:dev": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed"
  }
}
```

### 3. Vercel Build Configuration

Update `vercel.json`:

```json
{
  "buildCommand": "pnpm prisma generate && pnpm prisma migrate deploy && pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

### 4. Environment Variables Setup

```bash
# Required for Production
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Optional but Recommended
DATABASE_POOL_MAX=10
DATABASE_TIMEOUT_MS=10000
NODE_ENV=production

# For Redis (if using external Redis)
REDIS_URL="redis://user:pass@host:6379"

# For monitoring
SENTRY_DSN="https://..." # Optional
```

---

## 📊 Database Optimization

### 1. Indexing Strategy (Already Optimal)

Your current indexes are well-designed:

```prisma
// Scenarios
@@index([userId, createdAt])      // User's scenarios sorted by date
@@index([latitude, longitude])     // Geo-based queries

// TelemetryData
@@index([scenarioId, timestamp])  // Time-series queries
@@index([timestamp])              // Global time queries

// PipelineRun
@@index([scenarioId, createdAt])  // Scenario's runs sorted
@@index([success, createdAt])     // Filter successful runs
```

### 2. Query Optimization

```typescript
// Good: Use selective includes
const runs = await prisma.pipelineRun.findMany({
  where: { scenarioId },
  select: {
    id: true,
    success: true,
    createdAt: true,
    // Only include what you need
  },
  take: 10,
});

// Better: Use cursor-based pagination for large datasets
const runs = await prisma.pipelineRun.findMany({
  where: { scenarioId },
  take: 10,
  cursor: lastId ? { id: lastId } : undefined,
  orderBy: { createdAt: "desc" },
});
```

### 3. Caching Strategy

```typescript
// Use Redis for frequently accessed data
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Fetch from database
  const data = await fetchFn();

  // Cache for next time
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}

// Usage
const scenario = await getCachedOrFetch(
  `scenario:${id}`,
  () => prisma.scenario.findUnique({ where: { id } }),
  3600 // 1 hour
);
```

---

## 🔒 Security Best Practices

### 1. Connection Security

```typescript
// Always use SSL in production
const connectionString = process.env.DATABASE_URL;

// Validate SSL requirement
if (
  process.env.NODE_ENV === "production" &&
  !connectionString.includes("sslmode=require")
) {
  console.warn("⚠️  SSL not enforced on production database!");
}
```

### 2. Input Validation

```typescript
// Use Prisma's built-in validation + Zod
import { z } from "zod";

const createScenarioSchema = z.object({
  name: z.string().min(1).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  constraints: z.object({
    budget: z.number().positive(),
    targetRenewableFraction: z.number().min(0).max(1),
  }),
});

// Validate before database operations
const validated = createScenarioSchema.parse(input);
await prisma.scenario.create({ data: validated });
```

### 3. SQL Injection Prevention

```typescript
// ✅ Safe: Prisma parameterizes queries automatically
await prisma.scenario.findMany({
  where: { name: { contains: userInput } },
});

// ❌ Never use raw SQL with user input without parameterization
// If you must use raw SQL:
await prisma.$queryRaw`
  SELECT * FROM scenarios WHERE name LIKE ${`%${userInput}%`}
`;
```

---

## 📈 Monitoring & Observability

### 1. Query Performance Monitoring

```typescript
// lib/prisma.ts - Add query logging
export const prisma = new PrismaClient({
  adapter,
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "stdout",
      level: "error",
    },
  ],
});

// Log slow queries
prisma.$on("query", (e) => {
  if (e.duration > 1000) {
    // Queries taking > 1s
    console.warn("Slow query detected:", {
      query: e.query,
      duration: `${e.duration}ms`,
    });
  }
});
```

### 2. Connection Pool Monitoring

```typescript
// Add to your health check endpoint
export async function GET() {
  const poolStatus = {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount,
  };

  return Response.json({
    status: "healthy",
    database: poolStatus,
  });
}
```

### 3. Error Tracking

```typescript
// Wrap database operations with error handling
async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Database error in ${context}:`, error);

    // Send to monitoring service (Sentry, etc.)
    // Sentry.captureException(error, { tags: { context } });

    throw error;
  }
}
```

---

## 🔄 Backup & Recovery

### Automated Backups (Neon)

```bash
# Neon provides automatic backups
# Point-in-time recovery up to 7 days (free tier)
# 30 days on paid plans

# Restore from Neon dashboard or CLI
neonctl branches create --name recovery-point --parent main
```

### Manual Backup Script

```typescript
// scripts/backup-db.ts
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = `backup-${timestamp}.sql`;

  const command = `pg_dump ${process.env.DATABASE_URL} -f ${backupFile}`;

  try {
    await execAsync(command);
    console.log(`✅ Backup created: ${backupFile}`);
  } catch (error) {
    console.error("❌ Backup failed:", error);
  }
}

backupDatabase();
```

---

## 🎯 Production Deployment Steps

### 1. Pre-deployment Checklist

- [ ] DATABASE_URL added to Vercel environment variables
- [ ] Connection pooling configured
- [ ] SSL mode enabled (`?sslmode=require`)
- [ ] Migrations tested in staging environment
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Error tracking set up

### 2. Deployment Process

```bash
# 1. Test migrations locally
pnpm prisma migrate dev

# 2. Generate Prisma Client
pnpm prisma generate

# 3. Run tests
npm test

# 4. Deploy to Vercel
vercel --prod

# 5. Verify deployment
curl https://your-app.vercel.app/api/health
```

### 3. Post-deployment Verification

```bash
# Check database connection
curl https://your-app.vercel.app/api/health

# Run production tests
API_URL=https://your-app.vercel.app npm test

# Monitor logs
vercel logs --follow
```

---

## 💰 Cost Estimation

### Development (Free Tier)

- **Neon:** Free 0.5 GB
- **Vercel:** Free hosting
- **Redis:** Railway free tier (500 MB)
- **Total:** $0/month

### Production (Small Scale)

- **Neon Pro:** $19/month (10 GB database)
- **Vercel Pro:** $20/month (better limits)
- **Redis:** Upstash $10/month (1 GB)
- **Total:** ~$50/month

### Production (Medium Scale)

- **Neon Scale:** $69/month (50 GB)
- **Vercel Pro:** $20/month
- **Redis:** Upstash $30/month (10 GB)
- **Total:** ~$120/month

---

## 📚 Additional Resources

- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Vercel Postgres Guide](https://vercel.com/docs/storage/vercel-postgres)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Decision:** Use **PostgreSQL (Neon)** with **Prisma + connection pooling**  
**Setup Time:** ~15 minutes  
**Production Ready:** ✅ Yes
