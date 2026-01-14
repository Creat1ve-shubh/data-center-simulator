/**
 * Comprehensive API Test Suite for Production Readiness
 * Tests all API endpoints with various scenarios, edge cases, and error handling
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Color output for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test utilities
async function testEndpoint(name, url, options = {}, expectedStatus = 200, expectFailure = false) {
  try {
    log(`\n🧪 Testing: ${name}`, 'blue');
    const response = await fetch(url, options);
    let data;
    
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
    
    // Check if status matches expectation
    if (expectedStatus && response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}: ${JSON.stringify(data)}`);
    }
    
    // If we expect failure and got an error response, that's success
    if (expectFailure && !response.ok) {
      log(`✓ ${name} - PASSED (correctly rejected)`, 'green');
      return { success: true, data, status: response.status };
    }
    
    // If we don't expect failure but got an error, that's failure
    if (!expectFailure && !response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
    
    log(`✓ ${name} - PASSED`, 'green');
    return { success: true, data, status: response.status };
  } catch (error) {
    log(`✗ ${name} - FAILED: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Delay utility
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test suite
async function runTests() {
  log('='.repeat(80), 'blue');
  log('  DATA CENTER SIMULATOR - COMPREHENSIVE API TEST SUITE', 'blue');
  log('='.repeat(80), 'blue');
  log(`\n🎯 Target API: ${API_URL}\n`);

  const results = [];
  let createdScenarioId = null;
  let createdRunId = null;

  // ==========================================
  // SECTION 1: HEALTH & AVAILABILITY TESTS
  // ==========================================
  log('\n' + '='.repeat(80), 'magenta');
  log('  SECTION 1: Health & Availability Tests', 'magenta');
  log('='.repeat(80), 'magenta');

  // Test 1: Health Check
  results.push(await testEndpoint(
    'Health Check - Basic',
    `${API_URL}/api/health`
  ));

  await delay(500);

  // ==========================================
  // SECTION 2: PLAN API TESTS
  // ==========================================
  log('\n' + '='.repeat(80), 'magenta');
  log('  SECTION 2: Plan API Tests', 'magenta');
  log('='.repeat(80), 'magenta');

  // Test 2: Plan API - Valid Request (US West Coast)
  results.push(await testEndpoint(
    'Plan API - San Francisco',
    `${API_URL}/api/plan`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        currentLoad: {
          averageKW: 1000,
          peakKW: 1200,
          currentPUE: 1.5
        },
        constraints: {
          budget: 500000,
          targetRenewableFraction: 0.3
        }
      })
    }
  ));

  await delay(500);

  // Test 3: Plan API - Valid Request (Europe)
  results.push(await testEndpoint(
    'Plan API - London',
    `${API_URL}/api/plan`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: { latitude: 51.5074, longitude: -0.1278 },
        currentLoad: {
          averageKW: 2000,
          peakKW: 2500,
          currentPUE: 1.8
        },
        constraints: {
          budget: 1000000,
          targetRenewableFraction: 0.5
        }
      })
    }
  ));

  await delay(500);

  // Test 4: Plan API - High Load Scenario
  results.push(await testEndpoint(
    'Plan API - High Load (5MW)',
    `${API_URL}/api/plan`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        currentLoad: {
          averageKW: 5000,
          peakKW: 6000,
          currentPUE: 1.6
        },
        constraints: {
          budget: 2000000,
          targetRenewableFraction: 0.7
        }
      })
    }
  ));

  await delay(500);

  // Test 5: Plan API - Missing Required Fields
  results.push(await testEndpoint(
    'Plan API - Missing Coordinates (should fail)',
    `${API_URL}/api/plan`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentLoad: {
          averageKW: 1000,
          peakKW: 1200,
          currentPUE: 1.5
        }
      })
    },
    400,
    true // expect failure
  ));

  await delay(500);

  // Test 6: Plan API - Invalid Data Types
  results.push(await testEndpoint(
    'Plan API - Invalid Data Types (should fail)',
    `${API_URL}/api/plan`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: { latitude: "not a number", longitude: -122.4194 },
        currentLoad: {
          averageKW: -1000, // negative value
          peakKW: 1200,
          currentPUE: 1.5
        },
        constraints: {
          budget: 500000,
          targetRenewableFraction: 1.5 // > 1.0 invalid
        }
      })
    },
    null,
    true // expect failure
  ));

  await delay(500);

  // Test 7: Plan API - Invalid Coordinates (Out of Bounds)
  results.push(await testEndpoint(
    'Plan API - Invalid Latitude (should fail)',
    `${API_URL}/api/plan`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: { latitude: 95, longitude: -122.4194 }, // lat > 90
        currentLoad: {
          averageKW: 1000,
          peakKW: 1200,
          currentPUE: 1.5
        },
        constraints: {
          budget: 500000,
          targetRenewableFraction: 0.3
        }
      })
    },
    null,
    true
  ));

  await delay(500);

  // ==========================================
  // SECTION 3: ORCHESTRATOR API TESTS
  // ==========================================
  log('\n' + '='.repeat(80), 'magenta');
  log('  SECTION 3: Orchestrator API Tests', 'magenta');
  log('='.repeat(80), 'magenta');

  // Test 8: Orchestrator API - Complete Pipeline
  results.push(await testEndpoint(
    'Orchestrator API - Full Pipeline',
    `${API_URL}/api/orchestrate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        currentLoad: {
          averageKW: 1000,
          peakKW: 1200,
          currentPUE: 1.5
        },
        constraints: {
          budget: 1000000,
          targetRenewableFraction: 0.5
        },
        pricing: {
          electricityUSDPerKWh: 0.12,
          carbonUSDPerTon: 50
        }
      })
    }
  ));

  await delay(500);

  // Test 9: Orchestrator API - Custom Pricing
  results.push(await testEndpoint(
    'Orchestrator API - Custom Pricing',
    `${API_URL}/api/orchestrate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: { latitude: 51.5074, longitude: -0.1278 },
        currentLoad: {
          averageKW: 2000,
          peakKW: 2500,
          currentPUE: 1.7
        },
        constraints: {
          budget: 1500000,
          targetRenewableFraction: 0.6
        },
        pricing: {
          electricityUSDPerKWh: 0.15,
          carbonUSDPerTon: 75
        }
      })
    }
  ));

  await delay(500);

  // ==========================================
  // SECTION 4: SCENARIOS API TESTS
  // ==========================================
  log('\n' + '='.repeat(80), 'magenta');
  log('  SECTION 4: Scenarios API Tests', 'magenta');
  log('='.repeat(80), 'magenta');

  // Test 10: Scenarios API - List All
  const scenariosList = await testEndpoint(
    'Scenarios API - List All',
    `${API_URL}/api/scenarios`
  );
  results.push(scenariosList);

  await delay(500);

  // Test 11: Scenarios API - Create New Scenario
  const createScenario = await testEndpoint(
    'Scenarios API - Create New',
    `${API_URL}/api/scenarios`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Test Scenario ${Date.now()}`,
        description: 'Automated test scenario',
        latitude: 37.7749,
        longitude: -122.4194,
        currentLoad: {
          averageKW: 1000,
          peakKW: 1200,
          currentPUE: 1.5
        },
        constraints: {
          budget: 500000,
          targetRenewableFraction: 0.3
        },
        pricing: {
          electricityUSDPerKWh: 0.12,
          carbonUSDPerTon: 50
        }
      })
    },
    201
  );
  results.push(createScenario);
  
  if (createScenario.success && createScenario.data) {
    createdScenarioId = createScenario.data.id;
    log(`📝 Created scenario ID: ${createdScenarioId}`, 'yellow');
  }

  await delay(500);

  // Test 12: Scenarios API - Get Specific Scenario
  if (createdScenarioId) {
    results.push(await testEndpoint(
      'Scenarios API - Get by ID',
      `${API_URL}/api/scenarios/${createdScenarioId}`
    ));
    await delay(500);
  }

  // Test 13: Scenarios API - Missing Required Fields
  results.push(await testEndpoint(
    'Scenarios API - Missing Fields (should fail)',
    `${API_URL}/api/scenarios`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Incomplete Scenario'
        // Missing required fields
      })
    },
    400,
    true
  ));

  await delay(500);

  // Test 14: Scenarios API - Pagination
  results.push(await testEndpoint(
    'Scenarios API - Paginated List',
    `${API_URL}/api/scenarios?limit=5&offset=0`
  ));

  await delay(500);

  // ==========================================
  // SECTION 5: RUNS API TESTS
  // ==========================================
  log('\n' + '='.repeat(80), 'magenta');
  log('  SECTION 5: Pipeline Runs API Tests', 'magenta');
  log('='.repeat(80), 'magenta');

  // Test 15: Runs API - List All Runs
  const runsList = await testEndpoint(
    'Runs API - List All',
    `${API_URL}/api/runs`
  );
  results.push(runsList);

  if (runsList.success && runsList.data && runsList.data.runs && runsList.data.runs.length > 0) {
    createdRunId = runsList.data.runs[0].id;
    log(`📝 Found run ID: ${createdRunId}`, 'yellow');
  }

  await delay(500);

  // Test 16: Runs API - Get by Scenario ID
  if (createdScenarioId) {
    results.push(await testEndpoint(
      'Runs API - Filter by Scenario',
      `${API_URL}/api/runs?scenarioId=${createdScenarioId}`
    ));
    await delay(500);
  }

  // Test 17: Runs API - Get Specific Run
  if (createdRunId) {
    results.push(await testEndpoint(
      'Runs API - Get by ID',
      `${API_URL}/api/runs/${createdRunId}`
    ));
    await delay(500);
  }

  // Test 18: Runs API - Pagination
  results.push(await testEndpoint(
    'Runs API - Paginated List',
    `${API_URL}/api/runs?limit=5&offset=0`
  ));

  await delay(500);

  // Test 19: Runs API - Filter by Success Status
  results.push(await testEndpoint(
    'Runs API - Filter Successful',
    `${API_URL}/api/runs?success=true&limit=10`
  ));

  await delay(500);

  // Test 20: Runs API - Include Details
  results.push(await testEndpoint(
    'Runs API - With Details',
    `${API_URL}/api/runs?includeDetails=true&limit=5`
  ));

  await delay(500);

  // Test 21: Runs API - Invalid Run ID (should return 404)
  results.push(await testEndpoint(
    'Runs API - Non-existent ID (should fail)',
    `${API_URL}/api/runs/00000000-0000-0000-0000-000000000000`,
    {},
    404,
    true
  ));

  await delay(500);

  // ==========================================
  // SECTION 6: TELEMETRY API TESTS
  // ==========================================
  log('\n' + '='.repeat(80), 'magenta');
  log('  SECTION 6: Telemetry API Tests', 'magenta');
  log('='.repeat(80), 'magenta');

  // Test 22: Telemetry API - Query with Scenario ID
  if (createdScenarioId) {
    results.push(await testEndpoint(
      'Telemetry API - Query by Scenario',
      `${API_URL}/api/telemetry?scenarioId=${createdScenarioId}`
    ));
    await delay(500);
  } else {
    log('\n🧪 Testing: Telemetry API - Skipped (no scenario ID)', 'yellow');
    results.push({ success: true, test: 'Telemetry API - Skipped' });
  }

  // Test 23: Telemetry API - Missing Parameters
  results.push(await testEndpoint(
    'Telemetry API - Missing Parameters (should fail)',
    `${API_URL}/api/telemetry`,
    {},
    null,
    true
  ));

  await delay(500);

  // ==========================================
  // SECTION 7: ERROR HANDLING & EDGE CASES
  // ==========================================
  log('\n' + '='.repeat(80), 'magenta');
  log('  SECTION 7: Error Handling & Edge Cases', 'magenta');
  log('='.repeat(80), 'magenta');

  // Test 24: Non-existent Endpoint
  results.push(await testEndpoint(
    'Non-existent Endpoint (should return 404)',
    `${API_URL}/api/nonexistent`,
    {},
    404,
    true
  ));

  await delay(500);

  // Test 25: Malformed JSON
  try {
    log('\n🧪 Testing: Malformed JSON Request', 'blue');
    const response = await fetch(`${API_URL}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not valid json'
    });
    
    if (!response.ok) {
      log('✓ Malformed JSON - PASSED (correctly rejected)', 'green');
      results.push({ success: true, test: 'Malformed JSON Handling' });
    } else {
      log('✗ Malformed JSON - FAILED (should reject)', 'red');
      results.push({ success: false, test: 'Malformed JSON Handling' });
    }
  } catch (error) {
    log('✓ Malformed JSON - PASSED (correctly rejected)', 'green');
    results.push({ success: true, test: 'Malformed JSON Handling' });
  }

  await delay(500);

  // Test 26: Large Payload (Stress Test)
  results.push(await testEndpoint(
    'Large Payload Handling',
    `${API_URL}/api/plan`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        currentLoad: {
          averageKW: 10000, // Large load
          peakKW: 15000,
          currentPUE: 2.0
        },
        constraints: {
          budget: 10000000, // Large budget
          targetRenewableFraction: 0.8
        }
      })
    }
  ));

  // ==========================================
  // TEST SUMMARY & RESULTS
  // ==========================================
  log('\n' + '='.repeat(80), 'blue');
  log('  TEST RESULTS SUMMARY', 'blue');
  log('='.repeat(80), 'blue');

  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  const passRate = ((passed / results.length) * 100).toFixed(1);

  log(`\n✓ Passed: ${passed}`, 'green');
  log(`✗ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`📊 Total Tests: ${results.length}`, 'blue');
  log(`📈 Pass Rate: ${passRate}%`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red');

  // Detailed failure report
  if (failed > 0) {
    log('\n' + '='.repeat(80), 'red');
    log('  FAILED TESTS DETAILS', 'red');
    log('='.repeat(80), 'red');
    
    results.forEach((result, index) => {
      if (!result.success) {
        log(`\n❌ Test ${index + 1}: ${result.test || 'Unknown'}`, 'red');
        log(`   Error: ${result.error}`, 'red');
      }
    });
  }

  // Exit with appropriate code
  log('\n' + '='.repeat(80), 'blue');
  
  if (failed === 0) {
    log('✅ ALL TESTS PASSED - PRODUCTION READY!', 'green');
    process.exit(0);
  } else {
    log(`⚠️  ${failed} TEST(S) FAILED - REVIEW REQUIRED`, 'red');
    process.exit(1);
  }
}

// Run the test suite
runTests().catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
