/**
 * API Route: /api/runs
 * Fetch saved pipeline execution results
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check if Prisma is initialized
    if (!prisma) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Query parameters
    const scenarioId = searchParams.get("scenarioId");
    const success = searchParams.get("success");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const includeDetails = searchParams.get("includeDetails") === "true";

    // Build where clause
    const where: any = {};
    if (scenarioId) {
      where.scenarioId = scenarioId;
    }
    if (success !== null) {
      where.success = success === "true";
    }

    // Fetch runs
    const [runs, total] = await Promise.all([
      prisma.pipelineRun.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: includeDetails
          ? {
              scenario: true,
              stages: true,
              vppa: true,
              sensitivity: true,
            }
          : {
              scenario: {
                select: { id: true, name: true, description: true },
              },
            },
      }),
      prisma.pipelineRun.count({ where }),
    ]);

    return NextResponse.json({
      runs,
      total,
      limit,
      offset,
      hasMore: offset + runs.length < total,
    });
  } catch (error: any) {
    console.error("[API] Failed to fetch runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline runs", details: error.message },
      { status: 500 }
    );
  }
}
