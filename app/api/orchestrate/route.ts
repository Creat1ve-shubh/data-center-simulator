/**
 * API Route: /api/orchestrate
 * Runs the complete optimization pipeline and saves results to database
 */

import { NextRequest, NextResponse } from "next/server";
import {
  runOptimizationPipeline,
  type PipelineInput,
} from "@/backend/services/orchestrator/pipeline";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body: PipelineInput & { scenarioId?: string } = await request.json();

    // Validation
    if (
      !body.coordinates ||
      typeof body.coordinates.latitude !== "number" ||
      typeof body.coordinates.longitude !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid coordinates. Provide latitude and longitude as numbers.",
        },
        { status: 400 }
      );
    }

    if (body.coordinates.latitude < -90 || body.coordinates.latitude > 90) {
      return NextResponse.json(
        { error: "Latitude must be between -90 and 90" },
        { status: 400 }
      );
    }

    if (body.coordinates.longitude < -180 || body.coordinates.longitude > 180) {
      return NextResponse.json(
        { error: "Longitude must be between -180 and 180" },
        { status: 400 }
      );
    }

    if (!body.currentLoad || !body.constraints || !body.pricing) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: currentLoad, constraints, or pricing",
        },
        { status: 400 }
      );
    }

    console.log(
      "[API] Received optimization request for coordinates:",
      body.coordinates
    );

    // Run the full pipeline
    const startTime = Date.now();
    const result = await runOptimizationPipeline(body);
    const duration = Date.now() - startTime;

    console.log(
      `[API] Pipeline completed in ${duration}ms, success: ${result.success}`
    );

    // Save results to database if scenarioId provided
    let pipelineRunId: string | undefined;

    if (body.scenarioId) {
      try {
        const pipelineRun = await prisma.pipelineRun.create({
          data: {
            scenarioId: body.scenarioId,
            success: result.success,
            executionMs: result.executionTimeMs,
            errorMessage: result.errors?.map((e) => e.message).join("; "),
            inputSnapshot: body as any,
            solarKw: result.summary.optimal_plan.solar_kw,
            windKw: result.summary.optimal_plan.wind_kw,
            batteryKwh: result.summary.optimal_plan.battery_kwh,
            totalCapex: result.summary.financial_best_case.total_investment,
            paybackMonths: result.summary.financial_best_case.payback_months,
            npv20yr: result.stages.financial.ownership.npv_20yr,
            roiPercent: result.summary.financial_best_case.roi_percent,
            renewableFraction: result.summary.environmental.renewable_fraction,
            co2ReductionTonYear:
              result.summary.environmental.co2_reduction_tons_year,
            stages: {
              create: [
                {
                  stageName: "planner",
                  status: result.stages.planner.status,
                  output: result.stages.planner as any,
                },
                {
                  stageName: "optimizer",
                  status: result.stages.optimizer.status,
                  output: result.stages.optimizer as any,
                },
                {
                  stageName: "pue",
                  status: result.stages.pue.status,
                  output: result.stages.pue as any,
                },
                {
                  stageName: "financial",
                  status: result.stages.financial.status,
                  output: result.stages.financial as any,
                },
              ],
            },
            ...(result.stages.financial.vppa && {
              vppa: {
                create: {
                  strikePriceMwh:
                    result.stages.financial.vppa.strike_price_per_mwh,
                  contractDuration: body.vppa?.contractDuration || 15,
                  forwardCurve: body.vppa?.forwardCurve as any,
                  contractValue: result.stages.financial.vppa.contract_value,
                  hedgeEffectiveness:
                    result.stages.financial.vppa.hedge_effectiveness_percent,
                  lcoeMwh: result.stages.financial.vppa.lcoe_per_mwh,
                  annualCashFlows: result.stages.financial.vppa
                    .annual_cash_flows as any,
                },
              },
            }),
            ...(result.stages.sensitivity && {
              sensitivity: {
                create: {
                  iterations: result.stages.sensitivity.monteCarlo.iterations,
                  confidence95: result.stages.sensitivity.monteCarlo
                    .confidence_95_percent as any,
                  riskMetrics: result.stages.sensitivity.monteCarlo
                    .risk_metrics as any,
                  tornadoChart: result.stages.sensitivity.tornadoChart as any,
                },
              },
            }),
          },
          include: {
            stages: true,
            vppa: true,
            sensitivity: true,
          },
        });

        pipelineRunId = pipelineRun.id;
        console.log(`[API] Saved pipeline run ${pipelineRunId} to database`);
      } catch (dbError: any) {
        console.error("[API] Failed to save pipeline results:", dbError);
        // Continue even if DB save fails
      }
    }

    if (!result.success) {
      const criticalErrors = result.errors?.filter((e) => !e.recoverable);
      return NextResponse.json(
        {
          error: "Pipeline failed",
          details: criticalErrors,
          partial_results: result,
          pipelineRunId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ...result, pipelineRunId }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Pipeline error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "Unknown error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Orchestrator API endpoint",
    usage: "POST /api/orchestrate with PipelineInput JSON body",
    pipeline_stages: [
      "1. Renewable Planner - Fetches solar/wind/hydro data from APIs",
      "2. Auto-Plan Optimizer - MILP optimization for capacity sizing",
      "3. PUE Predictor - Weather-dependent cooling model",
      "4. VPPA Financial - Ownership vs PPA economics",
      "5. Sensitivity Analysis - Monte Carlo risk assessment",
    ],
    documentation: "See backend/services/orchestrator/pipeline.ts for types",
  });
}
