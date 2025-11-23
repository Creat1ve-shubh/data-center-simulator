/**
 * Test Script for Orchestrator Pipeline
 * Tests the complete optimization pipeline end-to-end
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function testOrchestrator() {
  console.log('🧪 Testing Orchestrator Pipeline\n');
  console.log(`API URL: ${BASE_URL}/api/orchestrate\n`);
  
  // Test Case 1: San Francisco (High Solar)
  console.log('═══════════════════════════════════════');
  console.log('Test 1: San Francisco, CA (High Solar)');
  console.log('═══════════════════════════════════════\n');
  
  const sf_request = {
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    currentLoad: {
      averageKW: 1200,
      peakKW: 1560,
      currentPUE: 1.5
    },
    constraints: {
      budget: 2000000,
      targetRenewableFraction: 0.8,
      maxSolarKW: 10000,
      maxWindKW: 5000,
      maxBatteryKWh: 5000
    },
    pricing: {
      electricityUSDPerKWh: 0.19, // CA electricity expensive
      carbonUSDPerTon: 50,
      solarCapexUSDPerKW: 1200,
      windCapexUSDPerKW: 1500,
      batteryCapexUSDPerKWh: 300
    },
    vppa: {
      considerVPPA: true,
      strikePrice: 80, // USD per MWh
      contractDuration: 15
    },
    sensitivity: {
      runMonteCarlo: true,
      iterations: 500, // Reduced for faster testing
      varianceFactors: {
        priceVolatility: 0.15,
        loadVariance: 0.10,
        renewableVariance: 0.12
      }
    }
  };
  
  try {
    console.log('📡 Sending request...');
    const start = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sf_request)
    });
    
    const duration = Date.now() - start;
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Request failed:', error);
      return;
    }
    
    const result = await response.json();
    
    console.log(`✅ Pipeline completed in ${duration}ms (server: ${result.executionTimeMs}ms)\n`);
    
    // Display Summary
    console.log('📊 OPTIMIZATION RESULTS\n');
    
    console.log('🔋 Optimal Configuration:');
    console.log(`  Solar PV:    ${result.summary.optimal_plan.solar_kw.toFixed(0)} kW`);
    console.log(`  Wind:        ${result.summary.optimal_plan.wind_kw.toFixed(0)} kW`);
    console.log(`  Battery:     ${result.summary.optimal_plan.battery_kwh.toFixed(0)} kWh\n`);
    
    console.log('💰 Financial Performance:');
    console.log(`  Model:       ${result.summary.financial_best_case.model}`);
    console.log(`  Investment:  $${result.summary.financial_best_case.total_investment.toLocaleString()}`);
    console.log(`  Annual Save: $${result.summary.financial_best_case.annual_savings.toLocaleString()}`);
    console.log(`  Payback:     ${result.summary.financial_best_case.payback_months.toFixed(0)} months`);
    console.log(`  ROI:         ${result.summary.financial_best_case.roi_percent.toFixed(1)}%\n`);
    
    console.log('🌱 Environmental Impact:');
    console.log(`  Renewable %: ${(result.summary.environmental.renewable_fraction * 100).toFixed(1)}%`);
    console.log(`  CO₂ Reduced: ${result.summary.environmental.co2_reduction_tons_year.toFixed(0)} tons/year`);
    console.log(`  Equivalent:  ${result.summary.environmental.equivalent_cars_removed.toFixed(0)} cars removed\n`);
    
    if (result.stages.sensitivity) {
      console.log('⚠️  Risk Analysis:');
      console.log(`  Confidence:  ${(result.summary.risk_profile.confidence_level * 100).toFixed(0)}%`);
      console.log(`  Best Case:   ${result.summary.risk_profile.best_case_payback_months.toFixed(0)} months payback`);
      console.log(`  Worst Case:  ${result.summary.risk_profile.worst_case_payback_months.toFixed(0)} months payback\n`);
      
      if (result.stages.sensitivity.recommendations?.length > 0) {
        console.log('💡 Recommendations:');
        result.stages.sensitivity.recommendations.forEach(rec => {
          console.log(`  ${rec}`);
        });
        console.log();
      }
    }
    
    // Display Stage Performance
    console.log('⏱️  Stage Performance:');
    console.log(`  Planner:     ${result.stages.planner.status}`);
    console.log(`  Optimizer:   ${result.stages.optimizer.status} (${result.stages.optimizer.solverInfo.solve_time_seconds.toFixed(1)}s)`);
    console.log(`  PUE:         ${result.stages.pue.status}`);
    console.log(`  Financial:   ${result.stages.financial.status}`);
    console.log(`  Sensitivity: ${result.stages.sensitivity?.status || 'skipped'}\n`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('⚠️  Warnings/Errors:');
      result.errors.forEach(err => {
        const icon = err.recoverable ? '⚠️' : '❌';
        console.log(`  ${icon} [${err.stage}] ${err.message}`);
      });
      console.log();
    }
    
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  // Test Case 2: Texas (High Wind)
  console.log('═══════════════════════════════════════');
  console.log('Test 2: Austin, TX (High Wind)');
  console.log('═══════════════════════════════════════\n');
  
  const tx_request = {
    ...sf_request,
    coordinates: { latitude: 30.2672, longitude: -97.7431 },
    pricing: {
      ...sf_request.pricing,
      electricityUSDPerKWh: 0.11 // TX electricity cheaper
    }
  };
  
  try {
    console.log('📡 Sending request...');
    const start = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx_request)
    });
    
    const duration = Date.now() - start;
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Request failed:', error);
      return;
    }
    
    const result = await response.json();
    
    console.log(`✅ Pipeline completed in ${duration}ms\n`);
    
    console.log('📊 QUICK SUMMARY\n');
    console.log(`  Solar:       ${result.summary.optimal_plan.solar_kw.toFixed(0)} kW`);
    console.log(`  Wind:        ${result.summary.optimal_plan.wind_kw.toFixed(0)} kW`);
    console.log(`  Payback:     ${result.summary.financial_best_case.payback_months.toFixed(0)} months`);
    console.log(`  Renewable %: ${(result.summary.environmental.renewable_fraction * 100).toFixed(1)}%`);
    console.log(`  Confidence:  ${(result.summary.risk_profile.confidence_level * 100).toFixed(0)}%\n`);
    
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
console.log('Starting orchestrator tests...\n');
console.log('⚠️  Note: These tests will take 60-120 seconds due to MILP optimization\n');

testOrchestrator()
  .then(() => {
    console.log('✅ All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
