# Database backup script for Docker PostgreSQL (Windows)
# Usage: .\scripts\backup-db.ps1

param(
    [string]$BackupDir = "./backups",
    [string]$ContainerName = "datacenter-postgres"
)

$ErrorActionPreference = "Stop"

# Configuration
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "backup_$Timestamp.sql"

# Load environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

$PostgresUser = $env:POSTGRES_USER
if (-not $PostgresUser) { $PostgresUser = "datacenter" }

$PostgresDB = $env:POSTGRES_DB
if (-not $PostgresDB) { $PostgresDB = "datacenter_db" }

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "🔄 Starting database backup..." -ForegroundColor Cyan
Write-Host "📦 Container: $ContainerName" -ForegroundColor Gray
Write-Host "📁 Backup file: $BackupFile" -ForegroundColor Gray

# Create backup
docker exec -t $ContainerName pg_dump `
    -U $PostgresUser `
    -d $PostgresDB `
    --clean --if-exists `
    | Out-File -FilePath $BackupFile -Encoding UTF8

# Compress backup
Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip" -Force
Remove-Item $BackupFile

Write-Host "✅ Backup completed: ${BackupFile}.zip" -ForegroundColor Green
$FileSize = (Get-Item "${BackupFile}.zip").Length / 1MB
Write-Host "📊 File size: $([math]::Round($FileSize, 2)) MB" -ForegroundColor Gray

# Keep only last 7 backups
$AllBackups = Get-ChildItem -Path $BackupDir -Filter "backup_*.zip" | Sort-Object LastWriteTime -Descending
if ($AllBackups.Count -gt 7) {
    Write-Host "🧹 Cleaning old backups (keeping last 7)..." -ForegroundColor Cyan
    $AllBackups | Select-Object -Skip 7 | Remove-Item -Force
}

Write-Host "✅ Backup process completed successfully!" -ForegroundColor Green
