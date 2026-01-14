# 🐳 Docker & CI/CD Deployment Guide

Complete guide for containerizing and deploying the Data Center Simulator application.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development with Docker](#local-development-with-docker)
- [Docker Compose Setup](#docker-compose-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment to Vercel](#deployment-to-vercel)
- [Docker Hub Publishing](#docker-hub-publishing)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software

- [Docker](https://www.docker.com/get-started) (v24.0+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.20+)
- [Node.js](https://nodejs.org/) (v20+) - for local development
- [pnpm](https://pnpm.io/) (v9+)
- [Git](https://git-scm.com/)

### Required Accounts

- [Docker Hub](https://hub.docker.com/) account (for image storage)
- [Vercel](https://vercel.com/) account (for deployment)
- [GitHub](https://github.com/) account (for CI/CD)

## 🏃 Local Development with Docker

### 1. Setup Environment Variables

Copy the Docker environment template:

```bash
cp .env.docker .env
```

Edit `.env` with your configuration:

```env
# Database
POSTGRES_USER=datacenter
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=datacenter_db

# Redis
REDIS_PASSWORD=your_redis_password

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Build and Run with Docker Compose

Start all services (app, database, redis):

```bash
docker-compose up -d
```

This will:

- ✅ Start PostgreSQL database
- ✅ Start Redis cache
- ✅ Build the Next.js application
- ✅ Run database migrations
- ✅ Start the application on port 3000

### 3. Access the Application

- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 5. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

## 🔨 Building Docker Image Manually

### Build the image:

```bash
docker build -t data-center-simulator:latest .
```

### Run the container:

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e REDIS_URL="redis://:pass@host:6379" \
  data-center-simulator:latest
```

## 🚀 CI/CD Pipeline

### Overview

The CI/CD pipeline automatically:

1. ✅ Runs tests on every push/PR
2. ✅ Builds Docker image on main branch
3. ✅ Pushes image to Docker Hub
4. ✅ Deploys to Vercel
5. ✅ Runs security scans

### Setup GitHub Secrets

Go to your repository settings: `Settings` → `Secrets and variables` → `Actions`

Add these secrets:

#### Docker Hub Credentials

```
DOCKER_USERNAME=your_dockerhub_username
DOCKER_PASSWORD=your_dockerhub_token
```

#### Vercel Credentials

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

### Get Vercel Credentials

1. **Vercel Token**:

   - Go to https://vercel.com/account/tokens
   - Create new token

2. **Org & Project IDs**:

   ```bash
   # Install Vercel CLI
   pnpm add -g vercel

   # Login
   vercel login

   # Link project
   vercel link

   # Get IDs from .vercel/project.json
   cat .vercel/project.json
   ```

### Workflow Triggers

The pipeline runs on:

- **Push to main/develop**: Full CI/CD (test, build, deploy)
- **Pull Requests**: Tests only
- **Manual trigger**: Can be run from GitHub Actions tab

## 📦 Docker Hub Publishing

### Automatic Publishing

Images are automatically published to Docker Hub when:

- Code is pushed to `main` branch
- All tests pass

### Manual Publishing

```bash
# Login to Docker Hub
docker login

# Build with tag
docker build -t your-username/data-center-simulator:latest .
docker build -t your-username/data-center-simulator:v1.0.0 .

# Push to Docker Hub
docker push your-username/data-center-simulator:latest
docker push your-username/data-center-simulator:v1.0.0
```

### Pull Image from Docker Hub

```bash
docker pull your-username/data-center-simulator:latest
```

## 🌐 Deployment to Vercel

### Automatic Deployment

Vercel deployment happens automatically via CI/CD pipeline when:

- Code is pushed to `main` branch
- All tests pass

### Manual Deployment

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Configure Vercel Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=your_production_database_url
REDIS_URL=your_production_redis_url
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

### Using Vercel Postgres & Redis

Vercel provides managed databases:

1. Go to your project → Storage
2. Create Postgres database
3. Create Redis (KV) database
4. Copy connection strings to environment variables

## 🧪 Running Tests

### Local Tests

```bash
# Install dependencies
pnpm install

# Run test suite
node scripts/test-suite.js

# Test specific API
API_URL=http://localhost:3000 node scripts/test-suite.js
```

### Docker Container Tests

```bash
# Start services
docker-compose up -d

# Wait for services to be ready
sleep 10

# Run tests
docker-compose exec app node scripts/test-suite.js

# Or test from outside
API_URL=http://localhost:3000 node scripts/test-suite.js
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-14T10:00:00.000Z",
  "services": {
    "database": "connected",
    "application": "running"
  }
}
```

### Container Health Status

```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{.State.Health.Status}}' datacenter-app
```

## 🛠️ Troubleshooting

### Issue: Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Issue: Port Already in Use

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or change port in .env
APP_PORT=3001
```

### Issue: Build Failed

```bash
# Clean build
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Tests Failing

```bash
# Check application logs
docker-compose logs app

# Verify database migration
docker-compose exec app npx prisma migrate status

# Run migrations manually
docker-compose exec app npx prisma migrate deploy
```

### Issue: Docker Image Too Large

Current optimizations:

- ✅ Multi-stage build
- ✅ Node.js Alpine base image
- ✅ Proper .dockerignore
- ✅ Standalone Next.js output

To further reduce size:

```bash
# Use docker-slim
docker-slim build your-image:latest

# Check image size
docker images | grep data-center-simulator
```

## 📊 Pipeline Status

Check pipeline status:

- GitHub Actions: `https://github.com/YOUR_USERNAME/data-center-simulator/actions`
- Vercel Deployments: `https://vercel.com/dashboard`
- Docker Hub: `https://hub.docker.com/r/YOUR_USERNAME/data-center-simulator`

## 🔄 Update Workflow

1. Make code changes
2. Commit and push to feature branch
3. Create Pull Request → Tests run automatically
4. Merge to main → Full CI/CD pipeline runs
5. Docker image published to Docker Hub
6. Application deployed to Vercel

## 🎯 Production Checklist

Before deploying to production:

- [ ] Update environment variables in Vercel
- [ ] Configure production database
- [ ] Set up monitoring and alerts
- [ ] Configure CORS policies
- [ ] Enable rate limiting
- [ ] Set up backup strategy
- [ ] Configure CDN (Vercel handles this)
- [ ] Set up custom domain (optional)
- [ ] Configure SSL certificates (Vercel handles this)
- [ ] Review security scan results

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)

## 🤝 Support

For issues or questions:

- Open an issue on GitHub
- Check existing documentation
- Review CI/CD logs in GitHub Actions

---

**Last Updated**: January 2026
