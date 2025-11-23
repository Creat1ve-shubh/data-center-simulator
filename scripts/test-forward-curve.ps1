# Test VPPA forward curve integration
Write-Host "Waiting for server..."
Start-Sleep -Seconds 3

$body = @{
    coordinates = @{
        latitude = 37.77
        longitude = -122.42
    }
    currentLoad = @{
        averageKW = 1000
        peakKW = 1200
        currentPUE = 1.5
    }
    constraints = @{
        budget = 2000000
        targetRenewableFraction = 0.8
    }
    pricing = @{
        electricityUSDPerKWh = 0.12
        carbonUSDPerTon = 50
        solarCapexUSDPerKW = 1200
        windCapexUSDPerKW = 1500
        batteryCapexUSDPerKWh = 400
    }
    vppa = @{
        considerVPPA = $true
        strikePrice = 85
        contractDuration = 10
        forwardCurve = @(90,92,94,96,98,100,102,104,106,108)
    }
    sensitivity = @{
        runMonteCarlo = $false
    }
} | ConvertTo-Json -Depth 10

Write-Host "=== Testing VPPA Forward Curve Override ==="
try {
    $res = Invoke-RestMethod -Uri 'http://localhost:3000/api/orchestrate' -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 120
    Write-Host "✓ Request successful"
    Write-Host ""
    Write-Host "VPPA Results:"
    Write-Host "  Strike Price: $($res.stages.financial.vppa.strike_price_per_mwh) USD/MWh"
    Write-Host "  Year 1 Market: $($res.stages.financial.vppa.annual_cash_flows[0].market_price) USD/MWh (expected 90)"
    Write-Host "  Year 2 Market: $($res.stages.financial.vppa.annual_cash_flows[1].market_price) USD/MWh (expected 92)"
    Write-Host "  Year 3 Market: $($res.stages.financial.vppa.annual_cash_flows[2].market_price) USD/MWh (expected 94)"
    Write-Host ""
    if ($res.stages.financial.vppa.annual_cash_flows[0].market_price -eq 90) {
        Write-Host "✓ Forward curve override working correctly!" -ForegroundColor Green
    } else {
        Write-Host "✗ Forward curve not applied (using regional defaults)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}
