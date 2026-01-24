# Load environment variables from .env.local
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2] -replace '^"','' -replace '"$',''
        Set-Item -Path "env:$name" -Value $value
    }
}

# Run the test suite
Write-Host "🧪 Running comprehensive test suite..." -ForegroundColor Cyan
pnpm test
