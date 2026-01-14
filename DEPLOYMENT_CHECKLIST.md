# 🚀 Deployment Checklist

## Pre-Deployment

### 1. Environment Configuration

- [ ] Copy `.env.docker` to `.env` and configure all variables
- [ ] Set strong passwords for PostgreSQL and Redis
- [ ] Configure production `DATABASE_URL`
- [ ] Configure production `REDIS_URL`
- [ ] Set `NEXT_PUBLIC_API_URL` to production URL

### 2. GitHub Repository Setup

- [ ] Repository is public or organization has access
- [ ] Main branch is protected
- [ ] Pull request reviews are required

### 3. GitHub Secrets Configuration

Go to: `Settings` → `Secrets and variables` → `Actions`

#### Docker Hub Secrets

- [ ] `DOCKER_USERNAME` - Your Docker Hub username
- [ ] `DOCKER_PASSWORD` - Docker Hub access token (not password)

Create token at: https://hub.docker.com/settings/security

#### Vercel Secrets

- [ ] `VERCEL_TOKEN` - Personal access token
- [ ] `VERCEL_ORG_ID` - Organization ID
- [ ] `VERCEL_PROJECT_ID` - Project ID

Get credentials:

```bash
vercel login
vercel link
cat .vercel/project.json
```

### 4. Docker Hub Setup

- [ ] Create repository: `your-username/data-center-simulator`
- [ ] Set repository to public or private as needed
- [ ] Configure automated builds (optional)

### 5. Vercel Project Setup

- [ ] Create new project linked to GitHub repo
- [ ] Configure environment variables in Vercel dashboard
- [ ] Enable automatic deployments from main branch
- [ ] Setup production domain (optional)

## Database Setup

### 6. Production Database

- [ ] Choose database provider (Vercel Postgres, AWS RDS, etc.)
- [ ] Create database instance
- [ ] Configure connection pooling
- [ ] Set up SSL/TLS connections
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts

### 7. Redis Cache

- [ ] Choose Redis provider (Vercel KV, Upstash, AWS ElastiCache)
- [ ] Create Redis instance
- [ ] Configure persistence (optional)
- [ ] Set eviction policy (recommend: allkeys-lru)
- [ ] Configure maxmemory limit

## Testing

### 8. Local Testing

- [ ] Test Docker build locally: `docker build -t test .`
- [ ] Test with docker-compose: `docker-compose up`
- [ ] Run API test suite: `pnpm test`
- [ ] Test health endpoint: `curl http://localhost:3000/api/health`
- [ ] Verify database migrations work
- [ ] Test Redis caching

### 9. CI/CD Testing

- [ ] Create test branch and push
- [ ] Verify PR tests run successfully
- [ ] Check test coverage
- [ ] Review GitHub Actions logs
- [ ] Verify linting passes

## Deployment

### 10. Initial Deployment

- [ ] Push to main branch
- [ ] Monitor GitHub Actions workflow
- [ ] Verify Docker image pushed to Docker Hub
- [ ] Verify Vercel deployment successful
- [ ] Check deployment logs

### 11. Post-Deployment Verification

- [ ] Test production health endpoint
- [ ] Test all API endpoints in production
- [ ] Verify database connectivity
- [ ] Verify Redis caching works
- [ ] Check application performance
- [ ] Review error logs

### 12. Monitoring Setup

- [ ] Configure Vercel Analytics
- [ ] Setup error tracking (Sentry, optional)
- [ ] Configure uptime monitoring
- [ ] Setup log aggregation
- [ ] Configure performance monitoring

## Security

### 13. Security Checklist

- [ ] All secrets are stored securely (no hardcoded values)
- [ ] Database uses SSL/TLS
- [ ] Redis requires password
- [ ] Rate limiting configured (if needed)
- [ ] CORS properly configured
- [ ] Review Trivy security scan results
- [ ] Environment variables not exposed in logs
- [ ] Dependency vulnerabilities addressed

### 14. Access Control

- [ ] GitHub repository permissions reviewed
- [ ] Docker Hub repository access restricted
- [ ] Vercel project access restricted
- [ ] Database access limited to necessary IPs
- [ ] Redis access limited to necessary IPs

## Documentation

### 15. Documentation Complete

- [ ] README.md updated with deployment info
- [ ] DOCKER_DEPLOYMENT.md reviewed
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Troubleshooting guide available

## Backup & Recovery

### 16. Backup Strategy

- [ ] Database backup script tested
- [ ] Backup schedule configured
- [ ] Backup retention policy set
- [ ] Restore procedure tested
- [ ] Disaster recovery plan documented

### 17. Rollback Plan

- [ ] Previous Docker image versions available
- [ ] Rollback procedure documented
- [ ] Database rollback strategy defined
- [ ] Vercel rollback tested

## Performance

### 18. Performance Optimization

- [ ] Docker image size optimized (check with `docker images`)
- [ ] Next.js build optimized
- [ ] Database queries optimized
- [ ] Redis caching configured properly
- [ ] CDN configured (Vercel handles this)
- [ ] API response times acceptable

## Final Checks

### 19. Production Readiness

- [ ] All tests passing
- [ ] No critical errors in logs
- [ ] Performance metrics acceptable
- [ ] Security scan passed
- [ ] Documentation complete
- [ ] Team trained on deployment process

### 20. Go-Live

- [ ] Announce maintenance window (if needed)
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Address any issues immediately
- [ ] Announce successful deployment

## Post-Deployment

### 21. Ongoing Maintenance

- [ ] Monitor application health daily
- [ ] Review logs weekly
- [ ] Update dependencies monthly
- [ ] Review security scans
- [ ] Backup verification monthly
- [ ] Performance review quarterly

---

## Quick Commands Reference

### Deployment

```bash
# Test locally
pnpm docker:up
pnpm test

# Deploy to production (automatic via CI/CD)
git push origin main
```

### Monitoring

```bash
# Check Docker image
docker pull your-username/data-center-simulator:latest

# View Vercel deployments
vercel ls

# Test production API
curl https://your-app.vercel.app/api/health
```

### Rollback

```bash
# Vercel rollback to previous deployment
vercel rollback

# Docker rollback to previous version
docker pull your-username/data-center-simulator:previous-tag
```

---

**Remember**: Always test in staging before deploying to production!

**Last Updated**: January 2026
