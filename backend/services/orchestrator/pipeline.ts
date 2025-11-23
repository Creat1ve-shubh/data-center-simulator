/**
 * Pipeline Orchestrator
 *
 * Sequential data flow:
 * [1] Renewable Planner → fetches solar/wind/hydro potential from APIs
 * [2] Auto-Plan Optimizer → determines optimal capacities using MILP
 * [3] PUE Predictor → adjusts load based on weather-dependent cooling
 * [4] VPPA Financial Model → evaluates economics and ROI
 * [5] Sensitivity Analysis → Monte Carlo risk assessment
 *
 * This is the ONLY entry point for full-stack optimization.
 */

import type {
  LocationCoordinates,
  HourlyEnergyData,
  OptimizationRequest,
} from "@/backend/types";
import { fetchAllRenewableData } from "@/backend/services/api/renewables";
import { solveMILP } from "@/backend/services/optimizer/milp";
import { computePUEAdjusted } from "@/backend/services/predictor/pue-model";
import { analyzeVPPAFinancials } from "@/backend/services/financial/vppa-analyzer";
import { runSensitivityAnalysis } from "@/backend/services/sensitivity/monte-carlo";

// ============================================
// Pipeline Stage Interfaces
// ============================================

export interface PipelineInput {
  // Location
  coordinates: LocationCoordinates;

  // Current facility state
  currentLoad: {
    averageKW: number;
    peakKW: number;
    currentPUE: number;
  };

  // Optimization constraints
  constraints: {
    budget: number; // USD
    targetRenewableFraction: number; // 0-1
    maxSolarKW?: number;
    maxWindKW?: number;
    maxBatteryKWh?: number;
  };

  // Pricing assumptions
  pricing: {
    electricityUSDPerKWh: number;
    carbonUSDPerTon: number;
    solarCapexUSDPerKW: number;
    windCapexUSDPerKW: number;
    batteryCapexUSDPerKWh: number;
  };

  // VPPA preferences (optional)
  vppa?: {
    considerVPPA: boolean;
    strikePrice?: number; // USD per MWh
    contractDuration?: number; // years
    forwardCurve?: number[]; // Optional override for regional market price projections
  };

  // Sensitivity analysis (optional)
  sensitivity?: {
    runMonteCarlo: boolean;
    iterations?: number;
    varianceFactors?: {
      priceVolatility?: number;
      loadVariance?: number;
      renewableVariance?: number;
    };
  };
}

// Stage 1: Planner Output
export interface PlannerStageOutput {
  status: "success" | "partial" | "error";
  hourlyData: HourlyEnergyData[];
  dataQuality: {
    solar: { available: boolean; hoursAvailable: number; source: string };
    wind: { available: boolean; hoursAvailable: number; source: string };
    hydro: { available: boolean; hoursAvailable: number; source: string };
    cooling: { available: boolean; hoursAvailable: number; source: string };
  };
  metadata: {
    location: LocationCoordinates;
    fetchTimestamp: string;
    apiResponseTimes: Record<string, number>; // ms
  };
}

// Stage 2: Optimizer Output
export interface OptimizerStageOutput {
  status: "optimal" | "feasible" | "infeasible" | "error";
  optimalCapacities: {
    solar_kw: number;
    wind_kw: number;
    battery_kwh: number;
  };
  hourlyDispatch: {
    hour: number;
    solar_generation_kw: number;
    wind_generation_kw: number;
    battery_charge_kw: number;
    battery_discharge_kw: number;
    battery_soc_kwh: number;
    grid_import_kw: number;
    curtailment_kw: number;
  }[];
  metrics: {
    total_capex: number;
    renewable_fraction: number;
    annual_grid_import_kwh: number;
  };
  solverInfo: {
    solve_time_seconds: number;
    objective_value: number;
  };
}

// Stage 3: PUE Predictor Output
export interface PUEStageOutput {
  status: "success" | "error";
  adjustedLoad: {
    baseline_pue: number;
    adjusted_pue: number;
    pue_improvement_percent: number;
    annual_energy_savings_kwh: number;
  };
  hourlyPUE: {
    hour: number;
    outdoor_temp_c: number;
    pue_factor: number;
    it_load_kw: number;
    total_facility_load_kw: number;
  }[];
  coolingImpact: {
    average_cooling_load_kw: number;
    cooling_cost_savings_usd_year: number;
  };
}

// Stage 4: Financial/VPPA Output
export interface FinancialStageOutput {
  status: "success" | "error";

  // Traditional ownership model
  ownership: {
    total_capex: number;
    annual_opex: number;
    annual_savings: number;
    payback_period_months: number;
    roi_percent: number;
    npv_20yr: number;
    irr_percent: number;
  };

  // VPPA model (if enabled)
  vppa?: {
    contract_value: number;
    strike_price_per_mwh: number;
    annual_cash_flows: {
      year: number;
      market_price: number;
      settlement_amount: number;
      rec_value: number;
      net_cost: number;
      cumulative_savings: number;
    }[];
    hedge_effectiveness_percent: number;
    lcoe_per_mwh: number;
  };

  // Environmental economics
  carbon: {
    co2_reduction_tons_year: number;
    carbon_credit_value_usd_year: number;
    lifetime_co2_reduction_tons: number;
  };
}

// Stage 5: Sensitivity Output
export interface SensitivityStageOutput {
  status: "success" | "error";
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
    impact_on_npv: number; // USD change for +10% variance
    sensitivity_rank: number;
  }[];
  recommendations: string[];
}

// Complete Pipeline Output
export interface PipelineOutput {
  success: boolean;
  executionTimeMs: number;

  // All stage outputs
  stages: {
    planner: PlannerStageOutput;
    optimizer: OptimizerStageOutput;
    pue: PUEStageOutput;
    financial: FinancialStageOutput;
    sensitivity?: SensitivityStageOutput;
  };

  // Unified summary for UI
  summary: {
    optimal_plan: {
      solar_kw: number;
      wind_kw: number;
      battery_kwh: number;
    };
    financial_best_case: {
      model: "ownership" | "vppa";
      total_investment: number;
      annual_savings: number;
      payback_months: number;
      roi_percent: number;
    };
    environmental: {
      renewable_fraction: number;
      co2_reduction_tons_year: number;
      equivalent_cars_removed: number;
    };
    risk_profile: {
      confidence_level: number; // 0-1
      worst_case_payback_months: number;
      best_case_payback_months: number;
    };
  };

  // Errors if any stage failed
  errors?: {
    stage: string;
    message: string;
    recoverable: boolean;
  }[];
}

// ============================================
// Main Pipeline Orchestrator
// ============================================

export async function runOptimizationPipeline(
  input: PipelineInput
): Promise<PipelineOutput> {
  const startTime = Date.now();
  const errors: PipelineOutput["errors"] = [];

  console.log("[Pipeline] Starting optimization pipeline");
  console.log(
    `[Pipeline] Location: ${input.coordinates.latitude}, ${input.coordinates.longitude}`
  );

  // ========================================
  // STAGE 1: Renewable Planner (Data Fetcher)
  // ========================================
  console.log("[Pipeline] Stage 1: Fetching renewable energy data...");
  const plannerStart = Date.now();

  let plannerOutput: PlannerStageOutput;

  try {
    // Use full signature: (coordinates, startDate, endDate)
    const startDate = new Date(new Date().getFullYear(), 0, 1);
    const endDate = new Date();
    const renewableData = await fetchAllRenewableData(
      input.coordinates,
      startDate,
      endDate
    );

    plannerOutput = {
      status: "success",
      hourlyData: renewableData.data,
      dataQuality: renewableData.quality,
      metadata: {
        location: input.coordinates,
        fetchTimestamp: new Date().toISOString(),
        apiResponseTimes: {
          total: Date.now() - plannerStart,
        },
      },
    };

    console.log(
      `[Pipeline] Stage 1 complete: ${renewableData.data.length} hours of data`
    );
  } catch (error: any) {
    console.error("[Pipeline] Stage 1 FAILED:", error);
    errors.push({
      stage: "planner",
      message: error.message || "Failed to fetch renewable data",
      recoverable: false,
    });

    throw new Error(`Pipeline failed at Stage 1 (Planner): ${error.message}`);
  }

  // ========================================
  // STAGE 2: Auto-Plan Optimizer (MILP)
  // ========================================
  console.log("[Pipeline] Stage 2: Running MILP optimization...");
  const optimizerStart = Date.now();

  let optimizerOutput: OptimizerStageOutput;

  try {
    const milpResult = await solveMILP({
      hourlyData: plannerOutput.hourlyData,
      costs: {
        solar_capex_per_kw: input.pricing.solarCapexUSDPerKW,
        wind_capex_per_kw: input.pricing.windCapexUSDPerKW,
        battery_capex_per_kwh: input.pricing.batteryCapexUSDPerKWh,
        solar_opex_per_kw_year: input.pricing.solarCapexUSDPerKW * 0.01, // 1% annual
        wind_opex_per_kw_year: input.pricing.windCapexUSDPerKW * 0.015, // 1.5% annual
        battery_opex_per_kwh_year: input.pricing.batteryCapexUSDPerKWh * 0.02, // 2% annual
        carbon_cost_per_kg_co2: input.pricing.carbonUSDPerTon / 1000,
      },
      constraints: {
        max_budget: input.constraints.budget,
        max_solar_kw: input.constraints.maxSolarKW,
        max_wind_kw: input.constraints.maxWindKW,
        max_battery_kwh: input.constraints.maxBatteryKWh,
        min_renewable_fraction: input.constraints.targetRenewableFraction,
        battery_efficiency: 0.9, // 90% round-trip
      },
      optimization_params: {
        discount_rate: 0.08,
        project_lifetime_years: 20,
        solve_timeout_seconds: 60,
      },
    });

    optimizerOutput = {
      status: milpResult.status,
      optimalCapacities: {
        solar_kw: milpResult.decision_variables.solar_capacity_kw,
        wind_kw: milpResult.decision_variables.wind_capacity_kw,
        battery_kwh: milpResult.decision_variables.battery_capacity_kwh,
      },
      hourlyDispatch: milpResult.hourly_dispatch,
      metrics: {
        total_capex: milpResult.metrics.total_capex,
        renewable_fraction: milpResult.metrics.renewable_fraction,
        annual_grid_import_kwh: milpResult.hourly_dispatch.reduce(
          (sum, h) => sum + h.grid_import_kw,
          0
        ),
      },
      solverInfo: {
        solve_time_seconds: milpResult.solver_info?.solve_time_seconds || 0,
        objective_value: milpResult.objective_value,
      },
    };

    console.log(
      `[Pipeline] Stage 2 complete: ${optimizerOutput.status} solution`
    );
    console.log(
      `[Pipeline] Optimal: Solar ${optimizerOutput.optimalCapacities.solar_kw} kW, Wind ${optimizerOutput.optimalCapacities.wind_kw} kW`
    );
  } catch (error: any) {
    console.error("[Pipeline] Stage 2 FAILED:", error);
    errors.push({
      stage: "optimizer",
      message: error.message || "MILP optimization failed",
      recoverable: false,
    });

    throw new Error(`Pipeline failed at Stage 2 (Optimizer): ${error.message}`);
  }

  // ========================================
  // STAGE 3: PUE Predictor (Cooling Model)
  // ========================================
  console.log("[Pipeline] Stage 3: Computing PUE adjustments...");

  let pueOutput: PUEStageOutput;

  try {
    const pueResult = await computePUEAdjusted({
      hourlyWeather: plannerOutput.hourlyData.map((h) => ({
        hour: h.hour,
        outdoor_temp_c: h.cooling.outdoor_temp_c,
      })),
      itLoad: {
        average_kw: input.currentLoad.averageKW,
        peak_kw: input.currentLoad.peakKW,
      },
      baseline_pue: input.currentLoad.currentPUE || 1.5,
      renewable_config: {
        solar_kw: optimizerOutput.optimalCapacities.solar_kw,
        wind_kw: optimizerOutput.optimalCapacities.wind_kw,
      },
    });

    pueOutput = {
      status: "success",
      adjustedLoad: pueResult.adjustedLoad,
      hourlyPUE: pueResult.hourlyPUE,
      coolingImpact: pueResult.coolingImpact,
    };

    console.log(
      `[Pipeline] Stage 3 complete: PUE improved from ${pueResult.adjustedLoad.baseline_pue.toFixed(2)} to ${pueResult.adjustedLoad.adjusted_pue.toFixed(2)}`
    );
  } catch (error: any) {
    console.warn("[Pipeline] Stage 3 WARNING:", error.message);
    // PUE is non-critical, use fallback
    pueOutput = {
      status: "error",
      adjustedLoad: {
        baseline_pue: input.currentLoad.currentPUE || 1.5,
        adjusted_pue: input.currentLoad.currentPUE || 1.5,
        pue_improvement_percent: 0,
        annual_energy_savings_kwh: 0,
      },
      hourlyPUE: [],
      coolingImpact: {
        average_cooling_load_kw: 0,
        cooling_cost_savings_usd_year: 0,
      },
    };

    errors.push({
      stage: "pue",
      message: error.message || "PUE prediction failed (using fallback)",
      recoverable: true,
    });
  }

  // ========================================
  // STAGE 4: Financial Analysis (Ownership + VPPA)
  // ========================================
  console.log("[Pipeline] Stage 4: Analyzing financial models...");

  let financialOutput: FinancialStageOutput;

  try {
    const annualEnergy =
      input.currentLoad.averageKW * pueOutput.adjustedLoad.adjusted_pue * 8760;
    const renewableEnergy =
      optimizerOutput.optimalCapacities.solar_kw * 8760 * 0.2 + // Assume 20% CF for simplicity
      optimizerOutput.optimalCapacities.wind_kw * 8760 * 0.3; // Assume 30% CF

    const gridEnergy = Math.max(0, annualEnergy - renewableEnergy);
    const annualSavings =
      renewableEnergy * input.pricing.electricityUSDPerKWh +
      pueOutput.coolingImpact.cooling_cost_savings_usd_year;

    const totalCapex = optimizerOutput.metrics.total_capex;
    const annualOpex = totalCapex * 0.015; // 1.5% of capex

    const paybackMonths = (totalCapex / (annualSavings - annualOpex)) * 12;
    const roi = ((annualSavings - annualOpex) / totalCapex) * 100;

    const npv20yr =
      Array.from({ length: 20 }, (_, i) => {
        const cashFlow = annualSavings - annualOpex;
        return cashFlow / Math.pow(1.08, i + 1);
      }).reduce((a, b) => a + b, 0) - totalCapex;

    const co2ReductionTonsYear = (renewableEnergy * 0.5) / 1000; // 0.5 kg CO2/kWh grid

    financialOutput = {
      status: "success",
      ownership: {
        total_capex: totalCapex,
        annual_opex: annualOpex,
        annual_savings: annualSavings,
        payback_period_months: paybackMonths,
        roi_percent: roi,
        npv_20yr: npv20yr,
        irr_percent: ((annualSavings - annualOpex) / totalCapex) * 100, // Simplified IRR
      },
      carbon: {
        co2_reduction_tons_year: co2ReductionTonsYear,
        carbon_credit_value_usd_year:
          co2ReductionTonsYear * input.pricing.carbonUSDPerTon,
        lifetime_co2_reduction_tons: co2ReductionTonsYear * 20,
      },
    };

    // VPPA analysis if requested
    if (input.vppa?.considerVPPA) {
      try {
        const vppaResult = await analyzeVPPAFinancials({
          contractCapacity:
            optimizerOutput.optimalCapacities.solar_kw +
            optimizerOutput.optimalCapacities.wind_kw,
          strikePrice:
            input.vppa.strikePrice || input.pricing.electricityUSDPerKWh * 1000, // Convert to $/MWh
          contractDuration: input.vppa.contractDuration || 15,
          annualEnergyConsumption: annualEnergy,
          location: input.coordinates,
          forwardCurve: input.vppa.forwardCurve,
        });

        financialOutput.vppa = vppaResult;
      } catch (vppaError: any) {
        console.warn("[Pipeline] VPPA analysis failed:", vppaError.message);
      }
    }

    console.log(
      `[Pipeline] Stage 4 complete: Payback ${paybackMonths.toFixed(0)} months, NPV $${npv20yr.toLocaleString()}`
    );
  } catch (error: any) {
    console.error("[Pipeline] Stage 4 FAILED:", error);
    errors.push({
      stage: "financial",
      message: error.message || "Financial analysis failed",
      recoverable: false,
    });

    throw new Error(`Pipeline failed at Stage 4 (Financial): ${error.message}`);
  }

  // ========================================
  // STAGE 5: Sensitivity Analysis (Monte Carlo)
  // ========================================
  let sensitivityOutput: SensitivityStageOutput | undefined;

  if (input.sensitivity?.runMonteCarlo) {
    console.log("[Pipeline] Stage 5: Running sensitivity analysis...");

    try {
      const varianceFactors = {
        priceVolatility:
          input.sensitivity.varianceFactors?.priceVolatility ?? 0.15,
        loadVariance: input.sensitivity.varianceFactors?.loadVariance ?? 0.1,
        renewableVariance:
          input.sensitivity.varianceFactors?.renewableVariance ?? 0.12,
      };

      const monteCarloResult = await runSensitivityAnalysis({
        baseCase: {
          npv: financialOutput.ownership.npv_20yr,
          payback_months: financialOutput.ownership.payback_period_months,
          capacities: optimizerOutput.optimalCapacities,
        },
        varianceFactors,
        iterations: input.sensitivity.iterations || 300,
      });

      sensitivityOutput = {
        status: "success",
        monteCarlo: monteCarloResult.monteCarlo,
        tornadoChart: monteCarloResult.tornadoChart,
        recommendations: monteCarloResult.recommendations,
      };

      console.log(
        `[Pipeline] Stage 5 complete: Risk analysis with ${monteCarloResult.monteCarlo.iterations} iterations`
      );
    } catch (error: any) {
      console.warn("[Pipeline] Stage 5 WARNING:", error.message);
      errors.push({
        stage: "sensitivity",
        message: error.message || "Sensitivity analysis failed",
        recoverable: true,
      });
    }
  }

  // ========================================
  // Build Unified Summary
  // ========================================
  const executionTimeMs = Date.now() - startTime;

  const output: PipelineOutput = {
    success: errors.filter((e) => !e.recoverable).length === 0,
    executionTimeMs,
    stages: {
      planner: plannerOutput,
      optimizer: optimizerOutput,
      pue: pueOutput,
      financial: financialOutput,
      sensitivity: sensitivityOutput,
    },
    summary: {
      optimal_plan: optimizerOutput.optimalCapacities,
      financial_best_case: {
        model: "ownership",
        total_investment: financialOutput.ownership.total_capex,
        annual_savings: financialOutput.ownership.annual_savings,
        payback_months: financialOutput.ownership.payback_period_months,
        roi_percent: financialOutput.ownership.roi_percent,
      },
      environmental: {
        renewable_fraction: optimizerOutput.metrics.renewable_fraction,
        co2_reduction_tons_year: financialOutput.carbon.co2_reduction_tons_year,
        equivalent_cars_removed:
          financialOutput.carbon.co2_reduction_tons_year / 4.6,
      },
      risk_profile: {
        confidence_level:
          sensitivityOutput?.monteCarlo.risk_metrics.probability_positive_npv ||
          0.85,
        worst_case_payback_months:
          sensitivityOutput?.monteCarlo.confidence_95_percent.roi_max_months ||
          financialOutput.ownership.payback_period_months * 1.3,
        best_case_payback_months:
          sensitivityOutput?.monteCarlo.confidence_95_percent.roi_min_months ||
          financialOutput.ownership.payback_period_months * 0.7,
      },
    },
    errors: errors.length > 0 ? errors : undefined,
  };

  console.log(`[Pipeline] Complete in ${executionTimeMs}ms`);
  console.log(`[Pipeline] Success: ${output.success}`);

  return output;
}
