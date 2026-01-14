/**
 * Auto-Plan Optimization Engine
 * Automatically generates optimal renewable energy deployment plans
 */

export interface OptimizationInput {
  location: string;
  itLoad: number; // kW
  currentPUE: number;
  targetPUE: number;
  budget?: number;
  timeline?: number; // months
}

export interface OptimizationResult {
  solarCapacity: number; // kW
  windCapacity: number; // kW
  batteryCapacity: number; // kWh
  estimatedCost: number; // USD
  annualSavings: number; // USD
  paybackPeriod: number; // months
  co2Reduction: number; // tons/year
  renewablePercentage: number;
  confidence: number; // 0-1
  recommendations: string[];
  timeline: {
    phase: string;
    duration: number; // months
    cost: number;
    description: string;
  }[];
}

// Cost assumptions (USD per kW/kWh)
const COSTS = {
  solar: 1200, // per kW
  wind: 1500, // per kW
  battery: 400, // per kWh
  installation: 0.15, // 15% of equipment cost
  maintenance: 0.02, // 2% annual
};

// Regional renewable potential (capacity factor)
const RENEWABLE_POTENTIAL: Record<string, { solar: number; wind: number }> = {
  Jaipur: { solar: 0.21, wind: 0.15 },
  Bangalore: { solar: 0.18, wind: 0.12 },
  Mumbai: { solar: 0.17, wind: 0.2 },
  Delhi: { solar: 0.19, wind: 0.1 },
  Hyderabad: { solar: 0.2, wind: 0.14 },
  Chennai: { solar: 0.19, wind: 0.25 },
  California: { solar: 0.25, wind: 0.3 },
  Texas: { solar: 0.22, wind: 0.35 },
  Frankfurt: { solar: 0.12, wind: 0.28 },
  Singapore: { solar: 0.15, wind: 0.1 },
};

// Electricity rates (USD per kWh)
const ELECTRICITY_RATES: Record<string, number> = {
  Jaipur: 0.08,
  Bangalore: 0.09,
  Mumbai: 0.1,
  Delhi: 0.08,
  Hyderabad: 0.08,
  Chennai: 0.09,
  California: 0.19,
  Texas: 0.11,
  Frankfurt: 0.32,
  Singapore: 0.2,
};

export function optimizeRenewableDeployment(
  input: OptimizationInput
): OptimizationResult {
  const location = input.location || "Jaipur";
  const potential = RENEWABLE_POTENTIAL[location] || RENEWABLE_POTENTIAL.Jaipur;
  const electricityRate = ELECTRICITY_RATES[location] || 0.08;

  // Calculate annual energy consumption
  const annualEnergyConsumption = input.itLoad * input.currentPUE * 8760; // kWh/year

  // Target energy after PUE improvement
  const targetAnnualEnergy = input.itLoad * input.targetPUE * 8760;

  // Determine optimal mix (prioritize solar in sunny regions, wind in windy regions)
  const solarRatio = potential.solar / (potential.solar + potential.wind);
  const windRatio = 1 - solarRatio;

  // Calculate required renewable capacity to meet 70-80% of demand
  const targetRenewablePercentage = 0.75;
  const renewableTarget = targetAnnualEnergy * targetRenewablePercentage;

  // Size solar capacity
  const solarCapacity = Math.round(
    (renewableTarget * solarRatio) / (potential.solar * 8760)
  );

  // Size wind capacity
  const windCapacity = Math.round(
    (renewableTarget * windRatio) / (potential.wind * 8760)
  );

  // Size battery for 4 hours of storage
  const batteryCapacity = Math.round((solarCapacity + windCapacity) * 4);

  // Calculate costs
  const solarCost = solarCapacity * COSTS.solar;
  const windCost = windCapacity * COSTS.wind;
  const batteryCost = batteryCapacity * COSTS.battery;
  const installationCost =
    (solarCost + windCost + batteryCost) * COSTS.installation;
  const totalCost = solarCost + windCost + batteryCost + installationCost;

  // Calculate savings
  const energySavingsFromPUE =
    (annualEnergyConsumption - targetAnnualEnergy) * electricityRate;
  const renewableEnergy =
    solarCapacity * potential.solar * 8760 +
    windCapacity * potential.wind * 8760;
  const renewableSavings = renewableEnergy * electricityRate;
  const annualSavings = energySavingsFromPUE + renewableSavings;

  // Calculate payback period
  const paybackPeriod = Math.round((totalCost / annualSavings) * 12);

  // Calculate CO2 reduction (0.5 kg CO2 per kWh grid electricity)
  const co2Reduction = Math.round(
    ((annualEnergyConsumption - targetAnnualEnergy + renewableEnergy) * 0.5) /
      1000
  );

  // Calculate actual renewable percentage
  const renewablePercentage = Math.round(
    (renewableEnergy / targetAnnualEnergy) * 100
  );

  // Generate recommendations
  const recommendations = generateRecommendations(
    input,
    potential,
    solarCapacity,
    windCapacity,
    batteryCapacity,
    renewablePercentage
  );

  // Generate timeline
  const timeline = generateTimeline(
    solarCapacity,
    windCapacity,
    batteryCapacity,
    solarCost,
    windCost,
    batteryCost,
    installationCost
  );

  return {
    solarCapacity,
    windCapacity,
    batteryCapacity,
    estimatedCost: Math.round(totalCost),
    annualSavings: Math.round(annualSavings),
    paybackPeriod,
    co2Reduction,
    renewablePercentage,
    confidence: 0.85,
    recommendations,
    timeline,
  };
}

function generateRecommendations(
  input: OptimizationInput,
  potential: { solar: number; wind: number },
  solarCapacity: number,
  windCapacity: number,
  batteryCapacity: number,
  renewablePercentage: number
): string[] {
  const recommendations: string[] = [];

  // PUE recommendations
  if (input.currentPUE > 1.6) {
    recommendations.push(
      "🌡️ High PUE detected: Prioritize hot/cold aisle containment and airflow optimization"
    );
  }
  if (input.currentPUE > 1.4 && input.currentPUE <= 1.6) {
    recommendations.push(
      "💨 Implement free cooling to reduce mechanical cooling load by 30-40%"
    );
  }

  // Renewable mix recommendations
  if (potential.solar > 0.2) {
    recommendations.push(
      `☀️ Excellent solar potential: Deploy ${solarCapacity} kW of rooftop solar panels`
    );
  }
  if (potential.wind > 0.25) {
    recommendations.push(
      `💨 Strong wind resources: Consider ${windCapacity} kW wind turbines or sign a wind PPA`
    );
  }

  // Battery recommendations
  if (renewablePercentage > 60) {
    recommendations.push(
      `🔋 High renewable penetration: ${batteryCapacity} kWh battery storage is critical for grid stability`
    );
  }

  // Financial recommendations
  if (input.budget && input.budget < solarCapacity * COSTS.solar * 0.5) {
    recommendations.push(
      "💰 Consider a Virtual PPA or lease model to reduce upfront capital expenditure"
    );
  }

  // Efficiency recommendations
  recommendations.push(
    "📊 Install real-time monitoring to track PUE, carbon intensity, and renewable usage"
  );

  if (renewablePercentage < 50) {
    recommendations.push(
      "🌱 Supplement on-site renewables with RECs or PPAs to reach 100% renewable energy"
    );
  }

  return recommendations;
}

function generateTimeline(
  solarCapacity: number,
  windCapacity: number,
  batteryCapacity: number,
  solarCost: number,
  windCost: number,
  batteryCost: number,
  installationCost: number
): OptimizationResult["timeline"] {
  const timeline: OptimizationResult["timeline"] = [];

  // Phase 1: Assessment and Design
  timeline.push({
    phase: "Assessment & Design",
    duration: 2,
    cost: Math.round((solarCost + windCost + batteryCost) * 0.05),
    description:
      "Site assessment, energy audit, engineering design, permitting",
  });

  // Phase 2: Infrastructure Upgrades
  timeline.push({
    phase: "Infrastructure Upgrades",
    duration: 3,
    cost: Math.round(installationCost * 0.4),
    description:
      "Cooling system optimization, power distribution upgrades, monitoring setup",
  });

  // Phase 3: Solar Deployment
  if (solarCapacity > 0) {
    timeline.push({
      phase: "Solar Installation",
      duration: 4,
      cost: Math.round(solarCost + installationCost * 0.3),
      description: `Install ${solarCapacity} kW rooftop solar panels and inverters`,
    });
  }

  // Phase 4: Wind/Battery Deployment
  if (windCapacity > 0 || batteryCapacity > 0) {
    timeline.push({
      phase: "Wind & Storage",
      duration: 5,
      cost: Math.round(windCost + batteryCost + installationCost * 0.3),
      description: `Deploy ${windCapacity} kW wind capacity and ${batteryCapacity} kWh battery storage`,
    });
  }

  // Phase 5: Testing and Commissioning
  timeline.push({
    phase: "Testing & Commissioning",
    duration: 1,
    cost: Math.round((solarCost + windCost + batteryCost) * 0.02),
    description:
      "System integration testing, performance validation, staff training",
  });

  return timeline;
}

export function compareScenarios(
  baseInput: OptimizationInput,
  scenarios: Partial<OptimizationInput>[]
): Array<OptimizationResult & { scenario: string }> {
  return scenarios.map((scenario, index) => {
    const input = { ...baseInput, ...scenario };
    const result = optimizeRenewableDeployment(input);
    return {
      ...result,
      scenario: `Scenario ${index + 1}`,
    };
  });
}

// Alias for backward compatibility
export const optimizeEnergyMix = optimizeRenewableDeployment;
