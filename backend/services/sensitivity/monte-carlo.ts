/**
 * Sensitivity Analysis & Risk Assessment
 * Monte Carlo simulation for financial risk analysis
 */

export interface SensitivityInput {
  baseCase: {
    npv: number;
    payback_months: number;
    capacities: {
      solar_kw: number;
      wind_kw: number;
      battery_kwh: number;
    };
  };
  varianceFactors: {
    priceVolatility: number; // e.g., 0.15 = ±15%
    loadVariance: number; // e.g., 0.10 = ±10%
    renewableVariance: number; // e.g., 0.12 = ±12%
  };
  iterations: number;
}

export interface SensitivityOutput {
  monteCarlo: {
    iterations: number;
    confidence_95_percent: {
      npv_min: number;
      npv_max: number;
      roi_min_months: number;
      roi_max_months: number;
    };
    risk_metrics: {
      probability_positive_npv: number;
      expected_value: number;
      value_at_risk_95: number;
    };
  };
  tornadoChart: {
    variable: string;
    impact_on_npv: number;
    sensitivity_rank: number;
  }[];
  recommendations: string[];
}

/**
 * Monte Carlo Simulation
 * Randomly samples from distributions to assess risk
 */
export async function runSensitivityAnalysis(
  input: SensitivityInput
): Promise<SensitivityOutput> {
  console.log(
    `[Sensitivity] Running Monte Carlo with ${input.iterations} iterations...`
  );

  const { baseCase, varianceFactors, iterations } = input;

  // Run Monte Carlo simulations
  const npvResults: number[] = [];
  const paybackResults: number[] = [];

  for (let i = 0; i < iterations; i++) {
    // Sample random factors (normal distribution approximation)
    const priceMultiplier =
      1 + randomNormal() * varianceFactors.priceVolatility;
    const loadMultiplier = 1 + randomNormal() * varianceFactors.loadVariance;
    const renewableMultiplier =
      1 + randomNormal() * varianceFactors.renewableVariance;

    // Adjust base case with random factors
    const adjustedNPV = baseCase.npv * priceMultiplier * loadMultiplier;
    const adjustedPayback =
      baseCase.payback_months / (priceMultiplier * renewableMultiplier);

    npvResults.push(adjustedNPV);
    paybackResults.push(adjustedPayback);
  }

  // Sort results for percentile calculations
  npvResults.sort((a, b) => a - b);
  paybackResults.sort((a, b) => a - b);

  // Calculate 95% confidence interval (2.5th to 97.5th percentile)
  const npvMin = npvResults[Math.floor(iterations * 0.025)];
  const npvMax = npvResults[Math.floor(iterations * 0.975)];
  const roiMin = paybackResults[Math.floor(iterations * 0.025)];
  const roiMax = paybackResults[Math.floor(iterations * 0.975)];

  // Risk metrics
  const positiveNPVCount = npvResults.filter((npv) => npv > 0).length;
  const probability_positive_npv = positiveNPVCount / iterations;
  const expected_value =
    npvResults.reduce((sum, npv) => sum + npv, 0) / iterations;
  const value_at_risk_95 = npvResults[Math.floor(iterations * 0.05)]; // 5th percentile (worst 5%)

  console.log(
    `[Sensitivity] Probability of positive NPV: ${(probability_positive_npv * 100).toFixed(1)}%`
  );
  console.log(
    `[Sensitivity] Expected value: $${expected_value.toLocaleString()}`
  );

  // Tornado chart: Sensitivity of NPV to each input variable
  const tornadoChart = [
    {
      variable: "Electricity Price",
      impact_on_npv: Math.abs(
        baseCase.npv * varianceFactors.priceVolatility * 2
      ),
      sensitivity_rank: 1,
    },
    {
      variable: "Renewable Generation",
      impact_on_npv: Math.abs(
        baseCase.npv * varianceFactors.renewableVariance * 1.5
      ),
      sensitivity_rank: 2,
    },
    {
      variable: "IT Load",
      impact_on_npv: Math.abs(
        baseCase.npv * varianceFactors.loadVariance * 1.2
      ),
      sensitivity_rank: 3,
    },
  ];

  // Sort by impact (descending)
  tornadoChart.sort((a, b) => b.impact_on_npv - a.impact_on_npv);
  tornadoChart.forEach((item, idx) => {
    item.sensitivity_rank = idx + 1;
  });

  // Recommendations based on risk profile
  const recommendations: string[] = [];

  if (probability_positive_npv < 0.7) {
    recommendations.push(
      "⚠️ High risk: Less than 70% probability of positive NPV. Consider reducing budget or increasing renewable fraction."
    );
  } else if (probability_positive_npv > 0.9) {
    recommendations.push(
      "✅ Low risk: Over 90% probability of positive NPV. Strong investment case."
    );
  } else {
    recommendations.push(
      "⚡ Moderate risk: 70-90% probability of positive NPV. Acceptable for most scenarios."
    );
  }

  if (roiMax / roiMin > 2) {
    recommendations.push(
      "⚠️ High payback uncertainty: Payback period ranges from " +
        `${roiMin.toFixed(0)} to ${roiMax.toFixed(0)} months. Consider hedging strategies like VPPAs.`
    );
  }

  if (Math.abs(value_at_risk_95) > Math.abs(expected_value) * 0.5) {
    recommendations.push(
      "⚠️ Significant downside risk: Worst-case scenario (5th percentile) is " +
        `$${Math.abs(value_at_risk_95).toLocaleString()} loss. Consider insurance or phased deployment.`
    );
  }

  const topSensitivity = tornadoChart[0];
  recommendations.push(
    `🎯 Most sensitive to: ${topSensitivity.variable}. ` +
      `A ±10% change impacts NPV by $${(topSensitivity.impact_on_npv * 0.1).toLocaleString()}.`
  );

  return {
    monteCarlo: {
      iterations,
      confidence_95_percent: {
        npv_min: Math.round(npvMin),
        npv_max: Math.round(npvMax),
        roi_min_months: Math.round(roiMin),
        roi_max_months: Math.round(roiMax),
      },
      risk_metrics: {
        probability_positive_npv,
        expected_value: Math.round(expected_value),
        value_at_risk_95: Math.round(value_at_risk_95),
      },
    },
    tornadoChart,
    recommendations,
  };
}

/**
 * Generate random number from standard normal distribution (mean=0, stddev=1)
 * Using Box-Muller transform
 */
function randomNormal(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
