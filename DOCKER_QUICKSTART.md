# Docker & CI/CD Quick Start

This file provides quick commands to get started with Docker and CI/CD.

## 🚀 Quick Start

### Start with Docker Compose

```bash
# Copy environment file
cp .env.docker .env

# Start all services
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down
```

### Individual Commands

```bash
# Build Docker image
pnpm docker:build

# Run tests
pnpm test

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate
```

## 📝 Setup GitHub Actions

1. Go to your repository on GitHub
2. Navigate to `Settings` → `Secrets and variables` → `Actions`
3. Add these secrets:
   - `DOCKER_USERNAME` - Your Docker Hub username
   - `DOCKER_PASSWORD` - Your Docker Hub token
   - `VERCEL_TOKEN` - Your Vercel token
   - `VERCEL_ORG_ID` - Your Vercel organization ID
   - `VERCEL_PROJECT_ID` - Your Vercel project ID

## 📚 Documentation

Full documentation available in [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

## 🔗 Useful Links

- Health Check: http://localhost:3000/api/health
- Application: http://localhost:3000
- Docker Hub: https://hub.docker.com
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Actions: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
