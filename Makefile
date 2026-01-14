# Makefile for Data Center Simulator
# Provides convenient commands for Docker and development tasks

.PHONY: help install dev build test docker-build docker-up docker-down docker-logs clean

# Default target
help:
	@echo "Data Center Simulator - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Start development server"
	@echo "  make build         - Build the application"
	@echo "  make test          - Run test suite"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build  - Build Docker image"
	@echo "  make docker-up     - Start all Docker containers"
	@echo "  make docker-down   - Stop all Docker containers"
	@echo "  make docker-logs   - View Docker logs"
	@echo "  make docker-clean  - Clean Docker resources"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate    - Run database migrations"
	@echo "  make db-generate   - Generate Prisma client"
	@echo "  make db-studio     - Open Prisma Studio"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make clean-all     - Clean everything including node_modules"

# Development commands
install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

test:
	node scripts/test-suite.js

# Docker commands
docker-build:
	docker build -t data-center-simulator:latest .

docker-up:
	docker-compose up -d
	@echo "Waiting for services to start..."
	@sleep 5
	@echo "Services are ready!"
	@echo "Application: http://localhost:3000"
	@echo "Health check: http://localhost:3000/api/health"

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-clean:
	docker-compose down -v
	docker system prune -f

# Database commands
db-migrate:
	pnpm prisma migrate deploy

db-generate:
	pnpm prisma generate

db-studio:
	pnpm prisma studio

# Cleanup commands
clean:
	rm -rf .next
	rm -rf out
	rm -rf dist
	rm -rf build

clean-all: clean
	rm -rf node_modules
	rm -rf .pnpm-store
