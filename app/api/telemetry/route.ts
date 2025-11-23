/**
 * API Route: /api/telemetry
 * Upload and store data center telemetry data
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { scenarioId, data } = body;

    if (!scenarioId) {
      return NextResponse.json(
        { error: "scenarioId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "data must be a non-empty array of telemetry records" },
        { status: 400 }
      );
    }

    // Verify scenario exists
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 }
      );
    }

    // Bulk insert telemetry data
    const created = await prisma.telemetryData.createMany({
      data: data.map((record: any) => ({
        scenarioId,
        timestamp: new Date(record.timestamp),
        facilityEnergyKWh: record.facilityEnergyKWh,
        itLoadKW: record.itLoadKW,
        coolingLoadKW: record.coolingLoadKW,
        pue: record.pue,
        solarGenKW: record.solarGenKW,
        windGenKW: record.windGenKW,
        batterySOC: record.batterySOC,
        gridImportKW: record.gridImportKW,
        outdoorTempC: record.outdoorTempC,
        carbonIntensity: record.carbonIntensity,
      })),
      skipDuplicates: true,
    });

    console.log(
      `[Telemetry] Uploaded ${created.count} records for scenario ${scenarioId}`
    );

    return NextResponse.json(
      {
        success: true,
        recordsInserted: created.count,
        scenarioId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Telemetry] Upload error:", error);

    return NextResponse.json(
      {
        error: "Failed to upload telemetry data",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get("scenarioId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "1000");

    if (!scenarioId) {
      return NextResponse.json(
        { error: "scenarioId query parameter is required" },
        { status: 400 }
      );
    }

    const where: any = { scenarioId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const telemetry = await prisma.telemetryData.findMany({
      where,
      orderBy: { timestamp: "asc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      count: telemetry.length,
      data: telemetry,
    });
  } catch (error: any) {
    console.error("[Telemetry] Fetch error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch telemetry data",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
