# 🧪 Test Running Guide

## Prerequisites

Before running tests, ensure you have:

1. **Database running** (PostgreSQL)
2. **Application server running** (Next.js dev server or Docker container)
3. **Environment variables configured**

## Running Tests Locally

### Option 1: Using Docker Compose (Recommended) ⭐

This is the easiest way to run tests as it sets up everything automatically.

#### Step 1: Start Services

```powershell
# Start PostgreSQL, Redis, and the app
docker-compose up -d

# Wait for services to be ready (about 15-20 seconds)
Start-Sleep -Seconds 20
```

#### Step 2: Run Tests

```powershell
# Run comprehensive test suite
npm test

# Or run basic tests
npm run test:basic
```

#### Step 3: View Logs (Optional)

```powershell
# View application logs
docker-compose logs -f app

# View all services logs
docker-compose logs -f
```

#### Step 4: Stop Services

```powershell
docker-compose down
```

### Option 2: Using Local Development Server

If you prefer running without Docker:

#### Step 1: Start Database

You need PostgreSQL running locally or accessible remotely.

```powershell
# Option A: Use Docker for database only
docker run -d `
  --name postgres-test `
  -e POSTGRES_USER=test_user `
  -e POSTGRES_PASSWORD=test_password `
  -e POSTGRES_DB=datacenter_sim `
  -p 5432:5432 `
  postgres:16-alpine

# Option B: Use existing PostgreSQL installation
# Ensure it's running on localhost:5432
```

#### Step 2: Configure Environment

Create `.env.local`:

```env
DATABASE_URL="postgresql://test_user:test_password@localhost:5432/datacenter_sim"
REDIS_URL="redis://localhost:6379"
```

#### Step 3: Run Migrations

```powershell
pnpm prisma generate
pnpm prisma migrate deploy
```

#### Step 4: Start Dev Server

```powershell
# In one terminal
pnpm dev

# Or start in background (Windows PowerShell)
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "pnpm dev"
```

#### Step 5: Wait for Server to Start

```powershell
# Wait 15 seconds for server to be ready
Start-Sleep -Seconds 15
```

#### Step 6: Run Tests

```powershell
# In another terminal (or same if server is in background)
npm test
```

## Test Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm test` | Comprehensive test suite (26 tests) | Before deployment, CI/CD |
| `npm run test:basic` | Quick smoke tests (6 tests) | Quick validation |
| `npm run test:api` | Test plan API only | Debugging plan endpoint |
| `npm run test:orchestrate` | Test orchestrator API only | Debugging orchestration |

## Testing Against Production

### Test Deployed Application

```powershell
# Set production URL
$env:API_URL = "https://your-app.vercel.app"

# Run tests
npm test

# Clear environment variable
Remove-Item Env:\API_URL
```

## CI/CD Testing

Tests run automatically in GitHub Actions when you:

- Push to `main` or `develop` branches
- Create a pull request
- Manually trigger workflow

### View CI/CD Test Results

1. Go to: https://github.com/Creat1ve-shubh/data-center-simulator/actions
2. Click on the latest workflow run
3. Expand "Run Comprehensive API tests" step

## Common Issues & Solutions

### Issue: "fetch failed" errors

**Problem:** Application server is not running or not ready.

**Solutions:**

```powershell
# Check if server is running
curl http://localhost:3000/api/health

# If using Docker, check container status
docker ps

# If using dev server, check process
Get-Process -Name node
```

### Issue: "Prisma Client could not locate the Query Engine"

**Problem:** Prisma Client not generated.

**Solution:**

```powershell
pnpm prisma generate
```

### Issue: "Database connection failed"

**Problem:** PostgreSQL is not running or DATABASE_URL is incorrect.

**Solutions:**

```powershell
# Check if PostgreSQL is running
docker ps | Select-String postgres

# Test database connection
pnpm prisma db pull

# Verify DATABASE_URL in .env.local
cat .env.local
```

### Issue: "Expected status 404, got 500"

**Problem:** API error instead of proper error handling.

**Solution:** This has been fixed in [app/api/runs/[id]/route.ts](app/api/runs/[id]/route.ts). Pull latest changes:

```powershell
git pull origin main
```

### Issue: Tests timeout

**Problem:** API is too slow or database is overloaded.

**Solutions:**

```powershell
# Restart services
docker-compose restart

# Or rebuild
docker-compose down
docker-compose up -d --build
```

## Test Execution Flow

```
┌─────────────────────────────────────┐
│  1. Health Check                    │
│     └─ Verify API is responsive     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  2. Plan API Tests (6 tests)        │
│     ├─ Valid inputs                 │
│     ├─ Invalid inputs               │
│     └─ Edge cases                   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  3. Orchestrator API Tests          │
│     └─ Full pipeline execution      │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  4. Scenarios API Tests             │
│     ├─ List scenarios               │
│     ├─ Create scenario              │
│     └─ Get by ID                    │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  5. Runs API Tests                  │
│     ├─ List runs                    │
│     ├─ Filter by scenario           │
│     ├─ Get by ID                    │
│     └─ Pagination                   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  6. Telemetry API Tests             │
│     └─ Query telemetry data         │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  7. Error Handling Tests            │
│     ├─ 404 errors                   │
│     ├─ Malformed JSON               │
│     └─ Large payloads               │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Test Summary & Results             │
└─────────────────────────────────────┘
```

## Expected Test Results

### Successful Run

```
✓ Passed: 25
✗ Failed: 0
📊 Total Tests: 25
📈 Pass Rate: 100.0%

✅ ALL TESTS PASSED - PRODUCTION READY!
```

### Acceptable Run (for deployment)

```
✓ Passed: 24
✗ Failed: 1
📊 Total Tests: 25
📈 Pass Rate: 96.0%

⚠️  1 TEST(S) FAILED - REVIEW REQUIRED
```

> **Note:** Pass rate must be ≥ 90% for deployment to proceed.

## Performance Benchmarks

Expected response times on local development:

| Endpoint | Average | Max Acceptable |
|----------|---------|----------------|
| Health Check | < 50ms | < 200ms |
| Plan API | < 1s | < 3s |
| Orchestrator API | < 2s | < 5s |
| Scenarios API | < 500ms | < 2s |
| Runs API | < 500ms | < 2s |

## Debugging Failed Tests

### Enable Verbose Logging

Modify the test file temporarily to see full responses:

```javascript
// In scripts/test-suite-comprehensive.js
// Add this in the testEndpoint function
console.log('Response:', JSON.stringify(data, null, 2));
```

### Test Individual Endpoints

```powershell
# Test health endpoint
curl http://localhost:3000/api/health | ConvertFrom-Json

# Test plan API
$body = @{
  coordinates = @{latitude = 37.7749; longitude = -122.4194}
  currentLoad = @{averageKW = 1000; peakKW = 1200; currentPUE = 1.5}
  constraints = @{budget = 500000; targetRenewableFraction = 0.3}
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/plan -Body $body -ContentType "application/json"
```

### Check Application Logs

```powershell
# Docker logs
docker-compose logs app

# Dev server logs
# Check terminal where pnpm dev is running
```

## Best Practices

1. **Always start services before testing**
   - Use Docker Compose for consistency
   - Wait for services to be fully ready

2. **Run tests frequently**
   - Before committing changes
   - After making API modifications
   - Before creating pull requests

3. **Monitor test output**
   - Check which specific tests fail
   - Review error messages carefully
   - Fix underlying issues, not just tests

4. **Keep test database clean**
   - Docker Compose recreates database on restart
   - Use migrations for schema changes

5. **Test both locally and in CI/CD**
   - Local testing for quick feedback
   - CI/CD for production readiness

## Quick Start Commands

### Full Test Cycle (Docker)

```powershell
# One-liner to run full test cycle
docker-compose up -d ; Start-Sleep -Seconds 20 ; npm test ; docker-compose down
```

### Daily Development Workflow

```powershell
# Morning: Start services
docker-compose up -d

# During development: Run tests frequently
npm run test:basic

# Before committing: Run full test suite
npm test

# Evening: Stop services
docker-compose down
```

## Additional Resources

- [TEST_COVERAGE.md](./TEST_COVERAGE.md) - Detailed test documentation
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Deployment guide
- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - Docker setup

---

**Last Updated:** January 14, 2026  
**Maintained By:** Data Center Simulator Team
