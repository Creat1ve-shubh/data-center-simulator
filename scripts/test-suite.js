/**
 * Comprehensive API test suite for CI/CD pipeline
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Color output for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test utilities
async function testEndpoint(name, url, options = {}) {
  try {
    log(`\n🧪 Testing: ${name}`, 'blue');
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
    
    log(`✓ ${name} - PASSED`, 'green');
    return { success: true, data };
  } catch (error) {
    log(`✗ ${name} - FAILED: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test suite
async function runTests() {
  log('='.repeat(60), 'blue');
  log('  DATA CENTER SIMULATOR - API TEST SUITE', 'blue');
  log('='.repeat(60), 'blue');
  log(`\n🎯 Target API: ${API_URL}\n`);

  const results = [];

  // Test 1: Health Check
  results.push(await testEndpoint(
    'Health Check',
    `${API_URL}/api/health`
  ));

  // Test 2: Plan API - Basic Request
  results.push(await testEndpoint(
    'Plan API - Basic Scenario',
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

  // Test 3: Scenarios API - List
  results.push(await testEndpoint(
    'Scenarios API - List',
    `${API_URL}/api/scenarios`
  ));

  // Test 4: Telemetry API - List (skip if no scenarios exist)
  const telemetryTest = await testEndpoint(
    'Telemetry API - Health Check',
    `${API_URL}/api/telemetry?limit=1`
  );
  results.push(telemetryTest);

  // Test 5: Plan API - Invalid Input
  const invalidTest = await testEndpoint(
    'Plan API - Invalid Input (should fail gracefully)',
    `${API_URL}/api/plan`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required coordinates
        currentLoad: {
          averageKW: -1000, // Invalid value
          peakKW: 1200,
          currentPUE: 1.5
        }
      })
    }
  );
  // For this test, we expect it to fail
  if (!invalidTest.success) {
    log(`✓ Plan API - Invalid Input - PASSED (correctly rejected)`, 'green');
    results.push({ success: true, test: 'Invalid Input Validation' });
  } else {
    log(`✗ Plan API - Invalid Input - FAILED (should reject invalid data)`, 'red');
    results.push({ success: false, test: 'Invalid Input Validation' });
  }

  // Test 6: Orchestrator API - Complex Scenario
  results.push(await testEndpoint(
    'Orchestrator API - Complex Scenario',
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
        analysisType: 'comparison'
      })
    }
  ));

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('  TEST RESULTS', 'blue');
  log('='.repeat(60), 'blue');

  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;

  log(`\n✓ Passed: ${passed}`, 'green');
  log(`✗ Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
  log(`📊 Total: ${results.length}`, 'blue');

  // Exit with appropriate code
  if (failed > 0) {
    log('\n❌ Some tests failed. Please review the errors above.', 'red');
    process.exit(1);
  } else {
    log('\n✅ All tests passed successfully!', 'green');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed with error: ${error.message}`, 'red');
  process.exit(1);
});
