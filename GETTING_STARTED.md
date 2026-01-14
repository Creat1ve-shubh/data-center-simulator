# 🚀 Getting Started with Docker & CI/CD

This guide will help you set up and deploy your Data Center Simulator with Docker and CI/CD.

## ⚡ Quick Start (5 minutes)

### 1. Verify Setup

```bash
# Linux/Mac
bash scripts/verify-setup.sh

# Windows PowerShell
.\scripts\verify-setup.ps1
```

### 2. Configure Environment

```bash
# Copy the Docker environment template
cp .env.docker .env

# Edit .env and set your values
# At minimum, update the passwords:
# - POSTGRES_PASSWORD
# - REDIS_PASSWORD
```

### 3. Start Services

```bash
# Using pnpm scripts
pnpm docker:up

# Or using Docker Compose directly
docker-compose up -d

# Or using Make (if available)
make docker-up
```

### 4. Verify Application

```bash
# Wait a few seconds for services to start, then:
curl http://localhost:3000/api/health

# You should see: {"status":"healthy",...}
```

### 5. Access Application

Open your browser: http://localhost:3000

🎉 **That's it! You're running locally with Docker!**

---

## 📦 Full Setup Guide

### Prerequisites Installation

#### Windows

```powershell
# Install Chocolatey (if not installed)
# Then install required tools:
choco install docker-desktop
choco install nodejs-lts
choco install git

# Install pnpm
npm install -g pnpm

# Restart your terminal
```

#### macOS

```bash
# Install Homebrew (if not installed)
# Then install required tools:
brew install --cask docker
brew install node
brew install pnpm
brew install git
```

#### Linux (Ubuntu/Debian)

```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Node.js & pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# Git
sudo apt-get install git
```

---

## 🔧 Local Development Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/data-center-simulator.git
cd data-center-simulator
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Configure Environment

```bash
# Copy template
cp .env.docker .env

# Edit .env file with your favorite editor
# Example values:
# POSTGRES_PASSWORD=secure_password_here
# REDIS_PASSWORD=another_secure_password
# NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 4: Start with Docker

```bash
# Start all services (PostgreSQL, Redis, App)
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down
```

### Step 5: Run Tests

```bash
# Wait for services to be ready (about 10 seconds)
# Then run tests:
pnpm test
```

---

## 🌐 GitHub Actions CI/CD Setup

### Step 1: Create Accounts

#### Docker Hub

1. Sign up at https://hub.docker.com
2. Create new repository: `data-center-simulator`
3. Go to Account Settings → Security → New Access Token
4. Save the token securely

#### Vercel

1. Sign up at https://vercel.com
2. Install Vercel CLI:
   ```bash
   pnpm add -g vercel
   ```
3. Login and link project:
   ```bash
   vercel login
   vercel link
   ```
4. Get your credentials:
   ```bash
   # Your IDs will be in this file
   cat .vercel/project.json
   ```
5. Get your token from: https://vercel.com/account/tokens

### Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name         | Where to Get It                  |
| ------------------- | -------------------------------- |
| `DOCKER_USERNAME`   | Your Docker Hub username         |
| `DOCKER_PASSWORD`   | Docker Hub access token (Step 1) |
| `VERCEL_TOKEN`      | Vercel personal access token     |
| `VERCEL_ORG_ID`     | From `.vercel/project.json`      |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json`      |

### Step 3: Test CI/CD

1. Create a new branch:

   ```bash
   git checkout -b test-cicd
   ```

2. Make a small change (e.g., edit README.md)

3. Commit and push:

   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin test-cicd
   ```

4. Create a Pull Request on GitHub

5. Watch the **Actions** tab - tests should run automatically!

6. Merge to main - full CI/CD pipeline will run:
   - Tests
   - Docker build & push
   - Vercel deployment

---

## 🗄️ Database Setup

### Local Development (Docker)

Database is automatically created when you run `docker-compose up`.

### Production Database Options

#### Option 1: Vercel Postgres (Recommended)

```bash
# In Vercel Dashboard:
# 1. Go to your project
# 2. Click "Storage" tab
# 3. Click "Create Database"
# 4. Select "Postgres"
# 5. Copy connection string to Vercel environment variables
```

#### Option 2: External Provider

Popular options:

- **Supabase**: https://supabase.com (Free tier available)
- **Neon**: https://neon.tech (Free tier available)
- **Railway**: https://railway.app
- **AWS RDS**: https://aws.amazon.com/rds

Steps:

1. Create database instance
2. Get connection string
3. Add to Vercel environment variables as `DATABASE_URL`

### Redis Setup

#### Option 1: Vercel KV (Recommended)

```bash
# In Vercel Dashboard:
# 1. Go to your project
# 2. Click "Storage" tab
# 3. Click "Create Database"
# 4. Select "KV" (Redis)
# 5. Copy connection string to Vercel environment variables
```

#### Option 2: Upstash (Free tier)

1. Sign up at https://upstash.com
2. Create Redis database
3. Copy connection string
4. Add to Vercel as `REDIS_URL`

---

## 🧪 Testing

### Run All Tests

```bash
pnpm test
```

### Run Specific Tests

```bash
# Test API endpoints
API_URL=http://localhost:3000 node scripts/test-suite.js

# Test health endpoint
curl http://localhost:3000/api/health
```

### Test in Production

```bash
# After deployment
API_URL=https://your-app.vercel.app node scripts/test-suite.js
```

---

## 📊 Monitoring

### View Logs

#### Local (Docker)

```bash
# All services
pnpm docker:logs

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
```

#### Production (Vercel)

```bash
# Using Vercel CLI
vercel logs

# Or in Vercel Dashboard:
# Go to your project → Deployments → Click deployment → View Logs
```

### Health Checks

```bash
# Local
curl http://localhost:3000/api/health

# Production
curl https://your-app.vercel.app/api/health
```

---

## 💾 Backup & Restore

### Backup Database

#### Linux/Mac

```bash
bash scripts/backup-db.sh
```

#### Windows PowerShell

```powershell
.\scripts\backup-db.ps1
```

Backups are saved to `./backups/` directory.

### Restore Database

#### Linux/Mac

```bash
bash scripts/restore-db.sh ./backups/backup_20260114_120000.sql.gz
```

#### Windows PowerShell

```powershell
.\scripts\restore-db.ps1 -BackupFile "./backups/backup_20260114_120000.sql.zip"
```

---

## 🔄 Common Workflows

### Update Code

```bash
# 1. Make changes
# 2. Test locally
pnpm docker:up
pnpm test

# 3. Commit and push
git add .
git commit -m "Your changes"
git push

# 4. CI/CD automatically runs!
```

### Deploy to Production

```bash
# Just push to main branch
git push origin main

# Or create PR and merge
git checkout -b feature/my-feature
# ... make changes ...
git push origin feature/my-feature
# Create PR on GitHub and merge
```

### Roll Back Deployment

```bash
# Vercel CLI
vercel rollback

# Or in Vercel Dashboard:
# Deployments → Previous deployment → Promote to Production
```

---

## 🆘 Troubleshooting

### Docker Issues

**Error: Port already in use**

```bash
# Solution 1: Change port in .env
APP_PORT=3001

# Solution 2: Stop conflicting service
# Find process:
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Kill process:
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Linux/Mac
```

**Error: Database connection failed**

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

**Error: Docker daemon not running**

```bash
# Start Docker Desktop (Windows/Mac)
# Or start Docker service (Linux)
sudo systemctl start docker
```

### Build Issues

**Error: Build failed**

```bash
# Clean everything
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

**Error: Out of memory**

```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory
# Set to at least 4GB
```

### CI/CD Issues

**Error: Tests failing in CI**

1. Check GitHub Actions logs
2. Run tests locally: `pnpm test`
3. Check if all services are healthy
4. Verify environment variables

**Error: Docker push failed**

1. Verify `DOCKER_USERNAME` secret
2. Verify `DOCKER_PASSWORD` secret
3. Check Docker Hub repository exists
4. Verify token has push permissions

**Error: Vercel deployment failed**

1. Verify all Vercel secrets are set
2. Check Vercel environment variables
3. Verify DATABASE_URL is set
4. Check Vercel build logs

---

## 📚 Additional Resources

- [Full Docker Documentation](./DOCKER_DEPLOYMENT.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Implementation Summary](./DOCKER_IMPLEMENTATION_SUMMARY.md)
- [Docker Hub](https://hub.docker.com)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 🎯 Next Steps

After completing this guide:

1. ✅ Set up GitHub secrets for CI/CD
2. ✅ Configure production database
3. ✅ Push to GitHub to trigger CI/CD
4. ✅ Monitor deployment in Actions tab
5. ✅ Test production deployment
6. ✅ Set up monitoring and alerts
7. ✅ Configure backups

---

## 💡 Tips

- **Use environment-specific configs**: Different `.env` files for dev/prod
- **Monitor costs**: Check your cloud provider usage
- **Regular backups**: Schedule daily database backups
- **Security updates**: Keep dependencies updated
- **Log aggregation**: Consider tools like Datadog or LogRocket
- **Performance monitoring**: Use Vercel Analytics

---

**Need Help?** Check the troubleshooting section or review the detailed documentation files.

**Last Updated**: January 2026
