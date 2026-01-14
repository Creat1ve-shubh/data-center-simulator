# Database restore script for Docker PostgreSQL (Windows)
# Usage: .\scripts\restore-db.ps1 -BackupFile "./backups/backup_20260114_120000.sql.zip"

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$ContainerName = "datacenter-postgres"
)

$ErrorActionPreference = "Stop"

# Load environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
}
else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

$PostgresUser = $env:POSTGRES_USER
if (-not $PostgresUser) { $PostgresUser = "datacenter" }

$PostgresDB = $env:POSTGRES_DB
if (-not $PostgresDB) { $PostgresDB = "datacenter_db" }

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Backup file not found: $BackupFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available backups:" -ForegroundColor Yellow
    Get-ChildItem -Path "./backups" -Filter "backup_*.zip" | Format-Table Name, Length, LastWriteTime
    exit 1
}

Write-Host "⚠️  WARNING: This will replace the current database!" -ForegroundColor Yellow
Write-Host "📦 Container: $ContainerName" -ForegroundColor Gray
Write-Host "📁 Backup file: $BackupFile" -ForegroundColor Gray
Write-Host ""

$Confirmation = Read-Host "Continue? (yes/no)"
if ($Confirmation -ne "yes") {
    Write-Host "❌ Restore cancelled" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Starting database restore..." -ForegroundColor Cyan

# Extract backup
$TempFile = [System.IO.Path]::GetTempFileName() + ".sql"
Expand-Archive -Path $BackupFile -DestinationPath ([System.IO.Path]::GetTempPath()) -Force
$ExtractedFile = (Get-ChildItem -Path ([System.IO.Path]::GetTempPath()) -Filter "backup_*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
Copy-Item $ExtractedFile $TempFile -Force

# Restore database
Get-Content $TempFile | docker exec -i $ContainerName psql `
    -U $PostgresUser `
    -d $PostgresDB

Remove-Item $TempFile -Force

Write-Host "✅ Database restored successfully!" -ForegroundColor Green
Write-Host "🔄 Restarting application..." -ForegroundColor Cyan
docker-compose restart app

Write-Host "✅ Restore process completed!" -ForegroundColor Green
