# Load environment variables from .env.local
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2] -replace '^"','' -replace '"$',''
        Set-Item -Path "env:$name" -Value $value
        Write-Host "✓ Loaded $name" -ForegroundColor Green
    }
}

# Start the Next.js dev server
Write-Host "`n🚀 Starting Next.js dev server with loaded environment..." -ForegroundColor Cyan
pnpm dev
