# 🐳 Docker Hub Integration

## Repository Information

- **Docker Hub Repository**: https://hub.docker.com/repository/docker/shubh2047/data-center-simulator
- **Image Name**: `shubh2047/data-center-simulator`
- **Registry**: docker.io

## Automated Builds

The CI/CD pipeline automatically builds and pushes Docker images on every push to the `main` branch.

### Image Tags

Images are tagged with multiple identifiers:

- `latest` - Latest stable build from main branch
- `main-<commit-sha>` - Specific commit from main branch
- `<branch-name>` - Branch-specific builds

## Manual Docker Operations

### Pull Image

```bash
docker pull shubh2047/data-center-simulator:latest
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="your_database_url" \
  -e REDIS_URL="your_redis_url" \
  --name datacenter-app \
  shubh2047/data-center-simulator:latest
```

### Using Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## Build and Push Manually

### Build Locally

```bash
docker build -t shubh2047/data-center-simulator:latest .
```

### Tag Image

```bash
docker tag shubh2047/data-center-simulator:latest shubh2047/data-center-simulator:v1.0.0
```

### Push to Docker Hub

```bash
# Login first
docker login

# Push specific tag
docker push shubh2047/data-center-simulator:latest
docker push shubh2047/data-center-simulator:v1.0.0

# Push all tags
docker push --all-tags shubh2047/data-center-simulator
```

## Image Information

### Size Optimization

- Base Image: Node 20 Alpine (~100MB)
- Final Image: ~400-500MB (optimized with multi-stage build)
- Includes: Next.js app, Prisma client, dependencies

### Multi-Platform Support

Images are built for:

- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64)

## GitHub Actions Integration

### Required Secrets

The following secrets are configured in GitHub Actions:

- `DOCKER_USERNAME`: shubh2047
- `DOCKER_PASSWORD`: [Personal Access Token]

### Workflow Triggers

Docker images are built and pushed when:

- ✅ Code is pushed to `main` or `develop` branches
- ✅ All tests pass successfully
- ✅ Pull requests are merged to main

### Build Process

1. Run tests (unit, integration, API)
2. Build Docker image with multi-stage process
3. Tag image with multiple identifiers
4. Push to Docker Hub
5. Run security scan (Trivy)

## Monitoring

### View Build Status

- GitHub Actions: https://github.com/Creat1ve-shubh/data-center-simulator/actions
- Docker Hub: https://hub.docker.com/repository/docker/shubh2047/data-center-simulator/builds

### Check Image Size

```bash
docker images shubh2047/data-center-simulator
```

### Inspect Image

```bash
docker inspect shubh2047/data-center-simulator:latest
```

### View Image History

```bash
docker history shubh2047/data-center-simulator:latest
```

## Security

### Vulnerability Scanning

Images are automatically scanned with Trivy in the CI/CD pipeline. View results in GitHub Security tab.

### Manual Scan

```bash
# Install Trivy
# Then scan image
trivy image shubh2047/data-center-simulator:latest
```

### Best Practices

- ✅ Non-root user in container
- ✅ Multi-stage build for minimal attack surface
- ✅ No secrets in image layers
- ✅ Regular base image updates
- ✅ Security scanning in CI/CD

## Troubleshooting

### Build Failed in CI/CD

1. Check GitHub Actions logs
2. Verify Docker Hub credentials in secrets
3. Check if repository exists and has write permissions

### Cannot Pull Image

```bash
# Verify image exists
docker search shubh2047/data-center-simulator

# Try with explicit registry
docker pull docker.io/shubh2047/data-center-simulator:latest
```

### Image Size Too Large

```bash
# Analyze layers
docker history shubh2047/data-center-simulator:latest

# Use dive for detailed analysis
dive shubh2047/data-center-simulator:latest
```

### Push Permission Denied

```bash
# Re-login to Docker Hub
docker logout
docker login

# Verify credentials
docker info | grep Username
```

## Production Deployment

### Using the Image

```yaml
# docker-compose.prod.yml
services:
  app:
    image: shubh2047/data-center-simulator:latest
    # ... other configuration
```

### Environment Variables

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXT_PUBLIC_API_URL` - Public API URL

### Health Check

```bash
# Check container health
docker ps
docker inspect --format='{{.State.Health.Status}}' datacenter-app

# Test endpoint
curl http://localhost:3000/api/health
```

## Cleanup

### Remove Old Images

```bash
# Remove specific image
docker rmi shubh2047/data-center-simulator:old-tag

# Remove dangling images
docker image prune

# Remove all unused images
docker image prune -a
```

### Docker Hub Cleanup

Old images can be deleted from the Docker Hub web interface:

1. Go to repository
2. Click "Tags" tab
3. Select tags to delete
4. Click "Delete"

## Additional Resources

- [Docker Hub Repository](https://hub.docker.com/repository/docker/shubh2047/data-center-simulator)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions](https://github.com/Creat1ve-shubh/data-center-simulator/actions)
- [CI/CD Workflow](.github/workflows/ci-cd.yml)

---

**Last Updated**: January 14, 2026
**Maintainer**: Creat1ve-shubh
