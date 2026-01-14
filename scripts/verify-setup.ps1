# Setup verification script (Windows PowerShell)
# Checks if everything is ready for Docker deployment

$ErrorActionPreference = "Continue"

Write-Host "🔍 Data Center Simulator - Setup Verification" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

$Errors = 0
$Warnings = 0

# Function to check command
function Test-Command {
    param([string]$Command)
    
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        Write-Host "✓ $Command is installed" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "✗ $Command is not installed" -ForegroundColor Red
        $script:Errors++
        return $false
    }
}

# Function to check file
function Test-FileExists {
    param([string]$Path)
    
    if (Test-Path $Path) {
        Write-Host "✓ $Path exists" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "✗ $Path is missing" -ForegroundColor Red
        $script:Errors++
        return $false
    }
}

# Function to check directory
function Test-DirectoryExists {
    param([string]$Path)
    
    if (Test-Path $Path -PathType Container) {
        Write-Host "✓ $Path directory exists" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "⚠ $Path directory missing (will be created)" -ForegroundColor Yellow
        $script:Warnings++
        return $false
    }
}

Write-Host "1. Checking Required Commands" -ForegroundColor White
Write-Host "------------------------------" -ForegroundColor White
Test-Command "docker"
Test-Command "node"
Test-Command "pnpm"
Test-Command "git"
Write-Host ""

Write-Host "2. Checking Docker Files" -ForegroundColor White
Write-Host "------------------------" -ForegroundColor White
Test-FileExists "Dockerfile"
Test-FileExists "docker-compose.yml"
Test-FileExists "docker-compose.prod.yml"
Test-FileExists ".dockerignore"
Write-Host ""

Write-Host "3. Checking CI/CD Files" -ForegroundColor White
Write-Host "-----------------------" -ForegroundColor White
Test-FileExists ".github\workflows\ci-cd.yml"
Test-FileExists ".github\workflows\pr-tests.yml"
Write-Host ""

Write-Host "4. Checking Configuration Files" -ForegroundColor White
Write-Host "--------------------------------" -ForegroundColor White
Test-FileExists "vercel.json"
Test-FileExists ".env.docker"
Test-FileExists "next.config.mjs"
Test-FileExists "package.json"
Test-FileExists "prisma\schema.prisma"
Write-Host ""

Write-Host "5. Checking Scripts" -ForegroundColor White
Write-Host "-------------------" -ForegroundColor White
Test-FileExists "scripts\test-suite.js"
Test-FileExists "scripts\backup-db.sh"
Test-FileExists "scripts\backup-db.ps1"
Test-FileExists "scripts\restore-db.sh"
Test-FileExists "scripts\restore-db.ps1"
Write-Host ""

Write-Host "6. Checking Directories" -ForegroundColor White
Write-Host "-----------------------" -ForegroundColor White
Test-DirectoryExists "backups"
Test-DirectoryExists ".github\workflows"
Test-DirectoryExists "prisma"
Test-DirectoryExists "app\api"
Write-Host ""

Write-Host "7. Checking Documentation" -ForegroundColor White
Write-Host "-------------------------" -ForegroundColor White
Test-FileExists "DOCKER_DEPLOYMENT.md"
Test-FileExists "DOCKER_QUICKSTART.md"
Test-FileExists "DEPLOYMENT_CHECKLIST.md"
Test-FileExists "DOCKER_IMPLEMENTATION_SUMMARY.md"
Test-FileExists "README.md"
Write-Host ""

Write-Host "8. Checking Environment Setup" -ForegroundColor White
Write-Host "-----------------------------" -ForegroundColor White
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
    
    # Check for required variables
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "DATABASE_URL") {
        Write-Host "✓ DATABASE_URL is set" -ForegroundColor Green
    }
    else {
        Write-Host "⚠ DATABASE_URL not found in .env" -ForegroundColor Yellow
        $Warnings++
    }
}
else {
    Write-Host "⚠ .env file not found (copy from .env.docker)" -ForegroundColor Yellow
    $Warnings++
}
Write-Host ""

Write-Host "9. Testing Docker" -ForegroundColor White
Write-Host "-----------------" -ForegroundColor White
try {
    docker ps | Out-Null
    Write-Host "✓ Docker daemon is running" -ForegroundColor Green
}
catch {
    Write-Host "✗ Docker daemon is not running" -ForegroundColor Red
    $Errors++
}
Write-Host ""

Write-Host "10. Checking Git Repository" -ForegroundColor White
Write-Host "---------------------------" -ForegroundColor White
if (Test-Path ".git" -PathType Container) {
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
    
    # Check remote
    try {
        $remote = git remote get-url origin 2>$null
        if ($remote) {
            Write-Host "✓ Git remote configured: $remote" -ForegroundColor Green
        }
        else {
            Write-Host "⚠ No git remote configured" -ForegroundColor Yellow
            $Warnings++
        }
    }
    catch {
        Write-Host "⚠ No git remote configured" -ForegroundColor Yellow
        $Warnings++
    }
}
else {
    Write-Host "⚠ Not a git repository" -ForegroundColor Yellow
    $Warnings++
}
Write-Host ""

# Summary
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

if ($Errors -eq 0 -and $Warnings -eq 0) {
    Write-Host "✓ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 You're ready to deploy!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Copy .env.docker to .env and configure"
    Write-Host "2. Run: pnpm docker:up"
    Write-Host "3. Access: http://localhost:3000"
    Write-Host "4. Setup GitHub secrets for CI/CD"
    exit 0
}
elseif ($Errors -eq 0) {
    Write-Host "⚠ $Warnings warnings found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can proceed, but review the warnings above."
    exit 0
}
else {
    Write-Host "✗ $Errors errors found" -ForegroundColor Red
    if ($Warnings -gt 0) {
        Write-Host "⚠ $Warnings warnings found" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "❌ Please fix the errors above before proceeding." -ForegroundColor Red
    exit 1
}
