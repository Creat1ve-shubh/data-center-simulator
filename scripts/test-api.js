#!/usr/bin/env node

/**
 * Test Script for Renewable Energy Optimizer API
 * 
 * Usage: node scripts/test-api.js
 * 
 * Tests the /api/plan endpoint with various scenarios
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api/plan';

async function ensureServerIsRunning() {
  const origin = new URL(API_URL).origin;
  const healthUrl = `${origin}/api/plan`;
  try {
    const res = await fetch(healthUrl, { method: 'GET' });
    // Any JSON is fine here (route exposes a GET info handler)
    if (!res.ok) {
      console.error(`❌ Server responded with ${res.status}. Is the dev server running?`);
      console.error('➡️  Start it in another terminal:');
      console.error('   pnpm dev   (or)   npm run dev');
      process.exit(1);
    }
    return true;
  } catch (e) {
    console.error('❌ Could not connect to http://localhost:3000');
    console.error('➡️  Start the Next.js dev server in another terminal:');
    console.error('   pnpm dev   (or)   npm run dev');
    process.exit(1);
  }
}

const testScenarios = [
  {
    name: 'San Francisco - Medium Load',
    request: {
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      currentLoad: { averageKW: 1200, peakKW: 1560 },
      constraints: {
        budget: 2000000,
        targetRenewableFraction: 0.8,
        maxSolarKW: 10000,
        maxWindKW: 5000,
        maxBatteryKWh: 5000
      },
      pricing: {
        electricityUSDPerKWh: 0.12,
        carbonUSDPerTon: 50,
        solarCapexUSDPerKW: 1200,
        windCapexUSDPerKW: 1500,
        batteryCapexUSDPerKWh: 300
      }
    }
  },
  {
    name: 'Austin, TX - High Solar',
    request: {
      coordinates: { latitude: 30.2672, longitude: -97.7431 },
      currentLoad: { averageKW: 800, peakKW: 1040 },
      constraints: {
        budget: 1500000,
        targetRenewableFraction: 0.9,
        maxSolarKW: 10000,
        maxWindKW: 5000,
        maxBatteryKWh: 5000
      },
      pricing: {
        electricityUSDPerKWh: 0.10,
        carbonUSDPerTon: 40,
        solarCapexUSDPerKW: 1100,
        windCapexUSDPerKW: 1400,
        batteryCapexUSDPerKWh: 280
      }
    }
  },
  {
    name: 'Hamburg, Germany - High Wind',
    request: {
      coordinates: { latitude: 53.5511, longitude: 9.9937 },
      currentLoad: { averageKW: 1500, peakKW: 1950 },
      constraints: {
        budget: 3000000,
        targetRenewableFraction: 0.75,
        maxSolarKW: 10000,
        maxWindKW: 5000,
        maxBatteryKWh: 5000
      },
      pricing: {
        electricityUSDPerKWh: 0.20,
        carbonUSDPerTon: 80,
        solarCapexUSDPerKW: 1300,
        windCapexUSDPerKW: 1600,
        batteryCapexUSDPerKWh: 350
      }
    }
  }
];

async function testEndpoint(scenario) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${scenario.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log('Request:', JSON.stringify(scenario.request, null, 2));
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scenario.request)
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ ERROR (${response.status}):`, errorData);
      return false;
    }
    
  const result = await response.json();
    
  console.log(`\n✅ SUCCESS (${duration}ms)`);
  console.log('\nOptimal Plan:');
  const plan = result.optimal_plan || {};
  const solarKW = Number.isFinite(Number(plan.solar_kw)) ? Number(plan.solar_kw) : null;
  const windKW = Number.isFinite(Number(plan.wind_kw)) ? Number(plan.wind_kw) : null;
  const batteryKWh = Number.isFinite(Number(plan.battery_kwh)) ? Number(plan.battery_kwh) : null;
  console.log(`  Solar PV:     ${solarKW !== null ? solarKW.toFixed(0) : 'N/A'} kW`);
  console.log(`  Wind:         ${windKW !== null ? windKW.toFixed(0) : 'N/A'} kW`);
  console.log(`  Battery:      ${batteryKWh !== null ? batteryKWh.toFixed(0) : 'N/A'} kWh`);
    
    console.log('\nFinancial Metrics:');
  const renFrac = Number(result.renewable_fraction);
  const roiMonths = Number(result.roi_months);
  console.log(`  Renewable %:  ${Number.isFinite(renFrac) ? (renFrac * 100).toFixed(1) + '%' : 'N/A'}`);
  console.log(`  ROI:          ${Number.isFinite(roiMonths) ? roiMonths.toFixed(0) + ' months (' + (roiMonths / 12).toFixed(1) + ' years)' : 'N/A'}`);
  console.log(`  Annual Save:  $${(result.cost_savings ?? 0).toLocaleString()}`);
    
    console.log('\nEnvironmental Impact:');
  const co2Tons = ((result.co2_reduction ?? 0) / 1000);
  console.log(`  CO₂ Reduced:  ${co2Tons.toFixed(0)} tons/year`);
  console.log(`  Equivalent:   ${(co2Tons / 4.6).toFixed(0)} cars off the road`);
    
    if (result.hourly_dispatch && result.hourly_dispatch.length > 0) {
      console.log(`\nDispatch Data: ${result.hourly_dispatch.length} hours`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ EXCEPTION:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests');
  console.log(`API Endpoint: ${API_URL}\n`);
  await ensureServerIsRunning();
  
  let passed = 0;
  let failed = 0;
  
  for (const scenario of testScenarios) {
    const result = await testEndpoint(scenario);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait 2 seconds between requests to avoid rate limits
    if (testScenarios.indexOf(scenario) < testScenarios.length - 1) {
      console.log('\nWaiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('Test Summary');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
