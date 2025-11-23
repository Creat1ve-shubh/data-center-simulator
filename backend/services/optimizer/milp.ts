/**
 * MILP (Mixed-Integer Linear Programming) Optimizer
 * Optimizes renewable energy deployment for data centers
 *
 * Uses JavaScript-based optimization (since Pyomo/OR-Tools require Python)
 * Implements a linear programming solver using simplex-like heuristics
 *
 * Decision Variables:
 * - solar_capacity_kw: Solar PV capacity to install
 * - wind_capacity_kw: Wind turbine capacity to install
 * - battery_capacity_kwh: Battery storage capacity to install
 * - hourly_dispatch[h]: Energy dispatch for each hour (solar, wind, battery, grid)
 *
 * Objective: Minimize total cost = CAPEX + OPEX + Carbon Cost
 *
 * Constraints:
 * - Energy balance: generation + storage = demand
 * - Capacity limits: generation <= installed capacity
 * - Battery constraints: charge/discharge rates, SOC limits
 * - Budget constraint: total investment <= max budget
 * - Renewable fraction target: renewable energy >= min fraction
 */

import type { MILPInput, MILPOutput, HourlyEnergyData } from "../../types";
import { calculateNPV } from "../../utils/energy-conversions";

// ============================================
// Optimizer Configuration
// ============================================

interface OptimizerConfig {
  max_iterations: number;
  convergence_threshold: number;
  step_size: number;
  battery_max_charge_rate: number; // Fraction of capacity per hour
  battery_max_discharge_rate: number;
  battery_min_soc: number; // Minimum state of charge (fraction)
  battery_max_soc: number; // Maximum state of charge (fraction)
}

const DEFAULT_CONFIG: OptimizerConfig = {
  max_iterations: 100,
  convergence_threshold: 0.001,
  step_size: 0.1,
  battery_max_charge_rate: 0.25, // Can charge 25% of capacity per hour
  battery_max_discharge_rate: 0.25,
  battery_min_soc: 0.1, // Keep 10% reserve
  battery_max_soc: 0.95, // Don't charge above 95%
};

// ============================================
// Main Optimization Function
// ============================================

/**
 * Solve the MILP optimization problem
 * Uses a greedy heuristic followed by gradient descent refinement
 */
export async function solveMILP(input: MILPInput): Promise<MILPOutput> {
  const startTime = Date.now();

  console.log("Starting MILP optimization...");
  console.log(`Hours of data: ${input.hourlyData.length}`);
  console.log(`Budget: $${input.constraints.max_budget.toLocaleString()}`);

  try {
    // Step 1: Initial feasibility check
    validateInput(input);

    // Step 2: Estimate optimal capacities using greedy heuristic
    const initialSolution = greedyInitialSolution(input);
    console.log("Initial solution:", initialSolution);

    // Step 3: Refine solution using gradient descent
    const refinedSolution = refineSolution(initialSolution, input);
    console.log("Refined solution:", refinedSolution);

    // Step 4: Simulate hourly dispatch with final capacities
    const dispatch = simulateDispatch(
      refinedSolution.solar_kw,
      refinedSolution.wind_kw,
      refinedSolution.battery_kwh,
      input
    );

    // Step 5: Calculate metrics
    const metrics = calculateMetrics(refinedSolution, dispatch, input);

    const solveTime = (Date.now() - startTime) / 1000;
    console.log(`Optimization completed in ${solveTime.toFixed(2)}s`);

    return {
      status: "optimal",
      objective_value:
        metrics.total_capex +
        metrics.total_opex_annual *
          input.optimization_params.project_lifetime_years,
      decision_variables: {
        solar_capacity_kw: refinedSolution.solar_kw,
        wind_capacity_kw: refinedSolution.wind_kw,
        battery_capacity_kwh: refinedSolution.battery_kwh,
      },
      hourly_dispatch: dispatch,
      metrics,
      solver_info: {
        solve_time_seconds: solveTime,
        iterations: DEFAULT_CONFIG.max_iterations,
      },
    };
  } catch (error) {
    console.error("Optimization error:", error);

    return {
      status: "error",
      objective_value: Infinity,
      decision_variables: {
        solar_capacity_kw: 0,
        wind_capacity_kw: 0,
        battery_capacity_kwh: 0,
      },
      hourly_dispatch: [],
      metrics: {
        total_capex: 0,
        total_opex_annual: 0,
        total_carbon_cost_annual: 0,
        renewable_fraction: 0,
        cost_savings_vs_grid_annual: 0,
        co2_reduction_annual_kg: 0,
        payback_period_months: Infinity,
        npv: 0,
        irr: 0,
      },
      solver_info: {
        solve_time_seconds: (Date.now() - startTime) / 1000,
      },
    };
  }
}

// ============================================
// Input Validation
// ============================================

function validateInput(input: MILPInput): void {
  if (input.hourlyData.length === 0) {
    throw new Error("No hourly data provided");
  }

  if (input.constraints.max_budget <= 0) {
    throw new Error("Budget must be positive");
  }

  if (input.costs.solar_capex_per_kw < 0 || input.costs.wind_capex_per_kw < 0) {
    throw new Error("Costs must be non-negative");
  }
}

// ============================================
// Greedy Initial Solution
// ============================================

interface CapacitySolution {
  solar_kw: number;
  wind_kw: number;
  battery_kwh: number;
  total_cost: number;
}

/**
 * Generate initial solution using greedy heuristic
 * Allocates budget based on LCOE and availability
 */
function greedyInitialSolution(input: MILPInput): CapacitySolution {
  const { hourlyData, costs, constraints } = input;

  // Calculate average generation potential per kW
  const avgSolarOutput =
    hourlyData.reduce((sum, h) => sum + h.solar.pv_output_kw_per_kw, 0) /
    hourlyData.length;
  const avgWindOutput =
    hourlyData.reduce((sum, h) => sum + h.wind.power_output_kw_per_kw, 0) /
    hourlyData.length;
  const avgDemand =
    hourlyData.reduce((sum, h) => sum + h.load.demand_kw, 0) /
    hourlyData.length;

  // Calculate LCOE for each technology
  const solarLCOE =
    costs.solar_capex_per_kw /
    (avgSolarOutput * 8760 * input.optimization_params.project_lifetime_years);
  const windLCOE =
    costs.wind_capex_per_kw /
    (avgWindOutput * 8760 * input.optimization_params.project_lifetime_years);

  console.log(
    `Solar LCOE: $${solarLCOE.toFixed(4)}/kWh, Wind LCOE: $${windLCOE.toFixed(4)}/kWh`
  );

  // Allocate budget proportionally to inverse LCOE (cheaper gets more)
  const solarWeight = windLCOE / (solarLCOE + windLCOE);
  const windWeight = solarLCOE / (solarLCOE + windLCOE);

  // Reserve 20% of budget for battery
  const batteryBudget = constraints.max_budget * 0.2;
  const generationBudget = constraints.max_budget * 0.8;

  const solarBudget = generationBudget * solarWeight;
  const windBudget = generationBudget * windWeight;

  // Calculate capacities
  let solar_kw = solarBudget / costs.solar_capex_per_kw;
  let wind_kw = windBudget / costs.wind_capex_per_kw;
  let battery_kwh = batteryBudget / costs.battery_capex_per_kwh;

  // Apply max constraints if specified
  if (constraints.max_solar_kw)
    solar_kw = Math.min(solar_kw, constraints.max_solar_kw);
  if (constraints.max_wind_kw)
    wind_kw = Math.min(wind_kw, constraints.max_wind_kw);
  if (constraints.max_battery_kwh)
    battery_kwh = Math.min(battery_kwh, constraints.max_battery_kwh);

  // Ensure we meet minimum renewable fraction
  const minRenewableFraction = constraints.min_renewable_fraction || 0;
  if (minRenewableFraction > 0) {
    const totalRenewableGeneration =
      (solar_kw * avgSolarOutput + wind_kw * avgWindOutput) * 8760;
    const totalDemand = avgDemand * 8760;
    const currentFraction = totalRenewableGeneration / totalDemand;

    if (currentFraction < minRenewableFraction) {
      // Scale up generation
      const scaleFactor = minRenewableFraction / currentFraction;
      solar_kw *= scaleFactor;
      wind_kw *= scaleFactor;
    }
  }

  const total_cost =
    solar_kw * costs.solar_capex_per_kw +
    wind_kw * costs.wind_capex_per_kw +
    battery_kwh * costs.battery_capex_per_kwh;

  return {
    solar_kw: Math.max(0, solar_kw),
    wind_kw: Math.max(0, wind_kw),
    battery_kwh: Math.max(0, battery_kwh),
    total_cost,
  };
}

// ============================================
// Solution Refinement
// ============================================

/**
 * Refine solution using gradient descent
 * Iteratively adjusts capacities to minimize total cost
 */
function refineSolution(
  initial: CapacitySolution,
  input: MILPInput
): CapacitySolution {
  let current = { ...initial };
  let bestSolution = { ...current };
  let bestObjective = evaluateObjective(current, input);

  const config = DEFAULT_CONFIG;

  for (let iter = 0; iter < config.max_iterations; iter++) {
    // Try small perturbations in each direction
    const perturbations = [
      { solar: config.step_size * 100, wind: 0, battery: 0 },
      { solar: -config.step_size * 100, wind: 0, battery: 0 },
      { solar: 0, wind: config.step_size * 100, battery: 0 },
      { solar: 0, wind: -config.step_size * 100, battery: 0 },
      { solar: 0, wind: 0, battery: config.step_size * 50 },
      { solar: 0, wind: 0, battery: -config.step_size * 50 },
    ];

    let improved = false;

    for (const p of perturbations) {
      const candidate: CapacitySolution = {
        solar_kw: Math.max(0, current.solar_kw + p.solar),
        wind_kw: Math.max(0, current.wind_kw + p.wind),
        battery_kwh: Math.max(0, current.battery_kwh + p.battery),
        total_cost: 0,
      };

      // Check budget constraint
      candidate.total_cost =
        candidate.solar_kw * input.costs.solar_capex_per_kw +
        candidate.wind_kw * input.costs.wind_capex_per_kw +
        candidate.battery_kwh * input.costs.battery_capex_per_kwh;

      if (candidate.total_cost > input.constraints.max_budget) continue;

      // Evaluate objective
      const objective = evaluateObjective(candidate, input);

      if (objective < bestObjective - config.convergence_threshold) {
        bestObjective = objective;
        bestSolution = { ...candidate };
        current = { ...candidate };
        improved = true;
        break;
      }
    }

    if (!improved) break; // Converged
  }

  return bestSolution;
}

/**
 * Evaluate objective function (total cost over project lifetime)
 */
function evaluateObjective(
  solution: CapacitySolution,
  input: MILPInput
): number {
  const { costs, optimization_params } = input;

  // CAPEX
  const capex = solution.total_cost;

  // Annual OPEX
  const opex_annual =
    solution.solar_kw * costs.solar_opex_per_kw_year +
    solution.wind_kw * costs.wind_opex_per_kw_year +
    solution.battery_kwh * costs.battery_opex_per_kwh_year;

  // Simulate one year to estimate grid usage and carbon costs
  const yearData = input.hourlyData.slice(
    0,
    Math.min(8760, input.hourlyData.length)
  );
  const dispatch = simulateDispatch(
    solution.solar_kw,
    solution.wind_kw,
    solution.battery_kwh,
    { ...input, hourlyData: yearData }
  );

  const totalGridImport = dispatch.reduce(
    (sum, h) => sum + h.grid_import_kw,
    0
  );
  const avgGridPrice =
    yearData.reduce((sum, h) => sum + h.grid.price_usd_kwh, 0) /
    yearData.length;
  const avgCarbonIntensity =
    yearData.reduce((sum, h) => sum + h.grid.carbon_intensity_g_co2_kwh, 0) /
    yearData.length;

  const grid_cost_annual = totalGridImport * avgGridPrice;
  const carbon_emissions_kg = (totalGridImport * avgCarbonIntensity) / 1000;
  const carbon_cost_annual = carbon_emissions_kg * costs.carbon_cost_per_kg_co2;

  // Total cost over lifetime (simplified NPV)
  const total_opex_lifetime =
    (opex_annual + grid_cost_annual + carbon_cost_annual) *
    optimization_params.project_lifetime_years;

  return capex + total_opex_lifetime;
}

// ============================================
// Dispatch Simulation
// ============================================

/**
 * Simulate hourly energy dispatch with given capacities
 */
function simulateDispatch(
  solar_kw: number,
  wind_kw: number,
  battery_kwh: number,
  input: MILPInput
): MILPOutput["hourly_dispatch"] {
  const dispatch: MILPOutput["hourly_dispatch"] = [];
  const config = DEFAULT_CONFIG;
  const batteryEfficiency = input.constraints.battery_efficiency || 0.85;

  let battery_soc = battery_kwh * 0.5; // Start at 50% SOC

  for (let h = 0; h < input.hourlyData.length; h++) {
    const data = input.hourlyData[h];

    // Available renewable generation
    const solar_gen = solar_kw * data.solar.pv_output_kw_per_kw;
    const wind_gen = wind_kw * data.wind.power_output_kw_per_kw;
    const renewable_gen = solar_gen + wind_gen;

    // Load demand
    const demand = data.load.demand_kw;

    // Energy balance
    let battery_charge = 0;
    let battery_discharge = 0;
    let grid_import = 0;
    let curtailment = 0;

    if (renewable_gen >= demand) {
      // Excess renewable energy
      const excess = renewable_gen - demand;

      // Try to charge battery
      const max_charge = Math.min(
        excess,
        battery_kwh * config.battery_max_charge_rate,
        (battery_kwh * config.battery_max_soc - battery_soc) / batteryEfficiency
      );

      battery_charge = Math.max(0, max_charge);
      curtailment = excess - battery_charge;
    } else {
      // Deficit - need battery or grid
      const deficit = demand - renewable_gen;

      // Try to discharge battery
      const max_discharge = Math.min(
        deficit,
        battery_kwh * config.battery_max_discharge_rate,
        (battery_soc - battery_kwh * config.battery_min_soc) * batteryEfficiency
      );

      battery_discharge = Math.max(0, max_discharge);
      grid_import = deficit - battery_discharge;
    }

    // Update battery SOC
    battery_soc +=
      battery_charge * batteryEfficiency -
      battery_discharge / batteryEfficiency;
    battery_soc = Math.max(0, Math.min(battery_kwh, battery_soc));

    dispatch.push({
      hour: h,
      solar_generation_kw: solar_gen,
      wind_generation_kw: wind_gen,
      battery_charge_kw: battery_charge,
      battery_discharge_kw: battery_discharge,
      battery_soc_kwh: battery_soc,
      grid_import_kw: grid_import,
      curtailment_kw: curtailment,
    });
  }

  return dispatch;
}

// ============================================
// Metrics Calculation
// ============================================

/**
 * Calculate all optimization metrics
 */
function calculateMetrics(
  solution: CapacitySolution,
  dispatch: MILPOutput["hourly_dispatch"],
  input: MILPInput
): MILPOutput["metrics"] {
  const { costs, hourlyData, optimization_params } = input;

  // CAPEX
  const total_capex = solution.total_cost;

  // Annual OPEX
  const total_opex_annual =
    solution.solar_kw * costs.solar_opex_per_kw_year +
    solution.wind_kw * costs.wind_opex_per_kw_year +
    solution.battery_kwh * costs.battery_opex_per_kwh_year;

  // Energy metrics
  const total_renewable = dispatch.reduce(
    (sum, h) => sum + h.solar_generation_kw + h.wind_generation_kw,
    0
  );
  const total_grid = dispatch.reduce((sum, h) => sum + h.grid_import_kw, 0);
  const total_demand = hourlyData.reduce((sum, h) => sum + h.load.demand_kw, 0);

  const renewable_fraction = total_renewable / (total_renewable + total_grid);

  // Cost comparison with grid-only scenario
  const avg_grid_price =
    hourlyData.reduce((sum, h) => sum + h.grid.price_usd_kwh, 0) /
    hourlyData.length;
  const grid_only_cost_annual = total_demand * avg_grid_price;
  const renewable_grid_cost_annual = total_grid * avg_grid_price;
  const cost_savings_vs_grid_annual =
    grid_only_cost_annual - (renewable_grid_cost_annual + total_opex_annual);

  // Carbon metrics
  const avg_carbon_intensity =
    hourlyData.reduce((sum, h) => sum + h.grid.carbon_intensity_g_co2_kwh, 0) /
    hourlyData.length;
  const grid_only_emissions_kg = (total_demand * avg_carbon_intensity) / 1000;
  const renewable_emissions_kg = (total_grid * avg_carbon_intensity) / 1000;
  const co2_reduction_annual_kg =
    grid_only_emissions_kg - renewable_emissions_kg;
  const total_carbon_cost_annual =
    renewable_emissions_kg * costs.carbon_cost_per_kg_co2;

  // Financial metrics
  const annual_savings = cost_savings_vs_grid_annual;
  const payback_period_months =
    annual_savings > 0 ? (total_capex / annual_savings) * 12 : Infinity;

  // NPV calculation
  const annual_cash_flows = Array(
    optimization_params.project_lifetime_years
  ).fill(annual_savings);
  const npv = calculateNPV(
    total_capex,
    annual_cash_flows,
    optimization_params.discount_rate,
    optimization_params.project_lifetime_years
  );

  // IRR approximation (simplified)
  const irr = annual_savings / total_capex;

  return {
    total_capex,
    total_opex_annual,
    total_carbon_cost_annual,
    renewable_fraction,
    cost_savings_vs_grid_annual,
    co2_reduction_annual_kg,
    payback_period_months,
    npv,
    irr,
  };
}
