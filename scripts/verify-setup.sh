#!/bin/bash

# Setup verification script
# Checks if everything is ready for Docker deployment

set -e

echo "🔍 Data Center Simulator - Setup Verification"
echo "=============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check command
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is missing"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check directory
check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 directory exists"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $1 directory missing (will be created)"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo "1. Checking Required Commands"
echo "------------------------------"
check_command "docker"
check_command "docker-compose" || check_command "docker compose"
check_command "node"
check_command "pnpm" || check_command "npm"
check_command "git"
echo ""

echo "2. Checking Docker Files"
echo "------------------------"
check_file "Dockerfile"
check_file "docker-compose.yml"
check_file "docker-compose.prod.yml"
check_file ".dockerignore"
echo ""

echo "3. Checking CI/CD Files"
echo "-----------------------"
check_file ".github/workflows/ci-cd.yml"
check_file ".github/workflows/pr-tests.yml"
echo ""

echo "4. Checking Configuration Files"
echo "--------------------------------"
check_file "vercel.json"
check_file ".env.docker"
check_file "next.config.mjs"
check_file "package.json"
check_file "prisma/schema.prisma"
echo ""

echo "5. Checking Scripts"
echo "-------------------"
check_file "scripts/test-suite.js"
check_file "scripts/backup-db.sh"
check_file "scripts/backup-db.ps1"
check_file "scripts/restore-db.sh"
check_file "scripts/restore-db.ps1"
echo ""

echo "6. Checking Directories"
echo "-----------------------"
check_directory "backups"
check_directory ".github/workflows"
check_directory "prisma"
check_directory "app/api"
echo ""

echo "7. Checking Documentation"
echo "-------------------------"
check_file "DOCKER_DEPLOYMENT.md"
check_file "DOCKER_QUICKSTART.md"
check_file "DEPLOYMENT_CHECKLIST.md"
check_file "DOCKER_IMPLEMENTATION_SUMMARY.md"
check_file "README.md"
echo ""

echo "8. Checking Environment Setup"
echo "-----------------------------"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Check for required variables
    if grep -q "DATABASE_URL" .env; then
        echo -e "${GREEN}✓${NC} DATABASE_URL is set"
    else
        echo -e "${YELLOW}⚠${NC} DATABASE_URL not found in .env"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found (copy from .env.docker)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "9. Testing Docker"
echo "-----------------"
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker daemon is running"
else
    echo -e "${RED}✗${NC} Docker daemon is not running"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "10. Checking Git Repository"
echo "---------------------------"
if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git repository initialized"
    
    # Check remote
    if git remote get-url origin &> /dev/null; then
        REMOTE=$(git remote get-url origin)
        echo -e "${GREEN}✓${NC} Git remote configured: $REMOTE"
    else
        echo -e "${YELLOW}⚠${NC} No git remote configured"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Not a git repository"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "=============================================="
echo "Summary"
echo "=============================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "🚀 You're ready to deploy!"
    echo ""
    echo "Next steps:"
    echo "1. Copy .env.docker to .env and configure"
    echo "2. Run: pnpm docker:up"
    echo "3. Access: http://localhost:3000"
    echo "4. Setup GitHub secrets for CI/CD"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warnings found${NC}"
    echo ""
    echo "You can proceed, but review the warnings above."
    exit 0
else
    echo -e "${RED}✗ $ERRORS errors found${NC}"
    [ $WARNINGS -gt 0 ] && echo -e "${YELLOW}⚠ $WARNINGS warnings found${NC}"
    echo ""
    echo "❌ Please fix the errors above before proceeding."
    exit 1
fi
