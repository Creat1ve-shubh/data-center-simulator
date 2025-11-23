/**
 * Next.js API Route: /api/plan
 * Production endpoint for renewable energy optimization
 *
 * POST /api/plan
 * Request body: OptimizationRequest
 * Response: OptimizationResponse
 */

import { NextRequest, NextResponse } from "next/server";
import type {
  OptimizationRequest,
  OptimizationResponse,
  HourlyDispatch,
  MILPInput,
  APIError,
} from "../../../backend/types";
import { fetchAllRenewableData } from "../../../backend/services/api/renewables";
import { solveMILP } from "../../../backend/services/optimizer/milp";
import { validateCoordinates } from "../../../backend/utils/energy-conversions";

// ============================================
// API Route Handler
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: OptimizationRequest = await request.json();

    // Validate request
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json(
        createErrorResponse("VALIDATION_ERROR", validationError),
        { status: 400 }
      );
    }

    console.log("Optimization request received:", {
      coordinates: body.coordinates,
      budget: body.constraints.budget,
      load: body.currentLoad.averageKW,
    });

    // Step 1: Fetch renewable energy data from APIs
    console.log("Fetching renewable data from APIs...");
    const { data: hourlyData, quality } = await fetchAllRenewableData(
      body.coordinates,
      new Date(new Date().getFullYear(), 0, 1), // Start of year
      new Date() // Current date
    );

    if (hourlyData.length === 0) {
      return NextResponse.json(
        createErrorResponse(
          "NO_DATA",
          "No renewable energy data available for this location"
        ),
        { status: 404 }
      );
    }

    console.log(`Fetched ${hourlyData.length} hours of data`);
    console.log("Data quality:", quality);

    // Step 2: Adjust load in hourly data to match user's load profile
    const adjustedHourlyData = hourlyData.map((h) => ({
      ...h,
      load: { demand_kw: body.currentLoad.averageKW },
    }));

    // Step 3: Prepare MILP input
    // Optional pricing block (not present in strict type)
    const pricing: any = (body as any).pricing || {};

    const milpInput: MILPInput = {
      hourlyData: adjustedHourlyData,
      costs: {
        // Use pricing from request when available (fallbacks kept)
        solar_capex_per_kw: pricing.solarCapexUSDPerKW ?? 1200,
        wind_capex_per_kw: pricing.windCapexUSDPerKW ?? 1500,
        battery_capex_per_kwh: pricing.batteryCapexUSDPerKWh ?? 300,
        solar_opex_per_kw_year: (pricing.solarCapexUSDPerKW ?? 1200) * 0.01,
        wind_opex_per_kw_year: (pricing.windCapexUSDPerKW ?? 1500) * 0.015,
        battery_opex_per_kwh_year:
          (pricing.batteryCapexUSDPerKWh ?? 300) * 0.02,
        carbon_cost_per_kg_co2: (pricing.carbonUSDPerTon ?? 50) / 1000, // $/kg
      },
      constraints: {
        max_budget: body.constraints.budget,
        min_renewable_fraction:
          (body as any).constraints?.targetRenewableFraction ??
          body.constraints.minRenewableFraction,
        battery_efficiency: 0.85,
      },
      optimization_params: {
        discount_rate: 0.05,
        project_lifetime_years: 25,
        solve_timeout_seconds: 60,
      },
    };

    // Step 4: Run MILP optimization
    console.log("Running MILP optimization...");
    const milpOutput = await solveMILP(milpInput);

    if (milpOutput.status === "error" || milpOutput.status === "infeasible") {
      return NextResponse.json(
        createErrorResponse(
          "OPTIMIZATION_FAILED",
          "Failed to find optimal solution. Try adjusting constraints."
        ),
        { status: 500 }
      );
    }

    console.log("Optimization completed:", milpOutput.decision_variables);

    // Step 5: Convert MILP output to API response format
    const hourly_dispatch: HourlyDispatch[] = milpOutput.hourly_dispatch.map(
      (h, i) => {
        const originalData = adjustedHourlyData[i];
        const renewable_kw = h.solar_generation_kw + h.wind_generation_kw;
        const total_supply =
          renewable_kw + h.battery_discharge_kw + h.grid_import_kw;

        return {
          hour: h.hour,
          timestamp: originalData.timestamp,
          load_kw: originalData.load.demand_kw,
          solar_kw: h.solar_generation_kw,
          wind_kw: h.wind_generation_kw,
          battery_discharge_kw: h.battery_discharge_kw,
          battery_charge_kw: h.battery_charge_kw,
          grid_import_kw: h.grid_import_kw,
          battery_soc_kwh: h.battery_soc_kwh,
          renewable_fraction:
            total_supply > 0 ? renewable_kw / total_supply : 0,
        };
      }
    );

    // Step 6: Build response
    const response: OptimizationResponse = {
      optimal_plan: {
        solar_kw: milpOutput.decision_variables.solar_capacity_kw,
        wind_kw: milpOutput.decision_variables.wind_capacity_kw,
        battery_kwh: milpOutput.decision_variables.battery_capacity_kwh,
      },
      renewable_fraction: milpOutput.metrics.renewable_fraction,
      roi_months: milpOutput.metrics.payback_period_months,
      co2_reduction: milpOutput.metrics.co2_reduction_annual_kg,
      cost_savings: milpOutput.metrics.cost_savings_vs_grid_annual,
      hourly_dispatch,
      metadata: {
        location: body.coordinates,
        timestamp: new Date().toISOString(),
        dataQuality: quality,
      },
    };

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`Total request time: ${totalTime.toFixed(2)}s`);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", errorMessage, errorDetails),
      { status: 500 }
    );
  }
}

// ============================================
// GET handler for API info
// ============================================

export async function GET() {
  return NextResponse.json({
    name: "Renewable Energy Optimization API",
    version: "1.0.0",
    description: "Optimizes data center renewable energy deployment",
    endpoints: {
      POST: {
        path: "/api/plan",
        description: "Generate optimal renewable energy plan",
        required_fields: [
          "coordinates.latitude",
          "coordinates.longitude",
          "currentLoad.averageKW",
          "constraints.budget",
        ],
      },
    },
    data_sources: {
      solar: "NREL NSRDB API",
      wind: "Open-Meteo API",
      hydro: "Open-Meteo Hydrology API",
      temperature: "NASA POWER API",
    },
  });
}

// ============================================
// Validation
// ============================================

function validateRequest(body: OptimizationRequest): string | null {
  if (!body.coordinates) {
    return "Missing required field: coordinates";
  }

  if (
    !validateCoordinates(body.coordinates.latitude, body.coordinates.longitude)
  ) {
    return "Invalid coordinates. Latitude must be -90 to 90, longitude -180 to 180";
  }

  if (!body.currentLoad || !body.currentLoad.averageKW) {
    return "Missing required field: currentLoad.averageKW";
  }

  if (body.currentLoad.averageKW <= 0) {
    return "currentLoad.averageKW must be positive";
  }

  if (!body.constraints || !body.constraints.budget) {
    return "Missing required field: constraints.budget";
  }

  if (body.constraints.budget <= 0) {
    return "constraints.budget must be positive";
  }

  if (body.constraints.minRenewableFraction !== undefined) {
    if (
      body.constraints.minRenewableFraction < 0 ||
      body.constraints.minRenewableFraction > 1
    ) {
      return "constraints.minRenewableFraction must be between 0 and 1";
    }
  }

  return null;
}

// ============================================
// Error Response Helper
// ============================================

function createErrorResponse(
  code: string,
  message: string,
  details?: any
): APIError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
  };
}
