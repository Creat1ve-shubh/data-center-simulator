/**
 * API Route: /api/scenarios
 * Manage data center scenarios
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      description,
      latitude,
      longitude,
      constraints,
      pricing,
      currentLoad,
      userId,
    } = body;

    if (
      !name ||
      !latitude ||
      !longitude ||
      !constraints ||
      !pricing ||
      !currentLoad
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, latitude, longitude, constraints, pricing, currentLoad",
        },
        { status: 400 }
      );
    }

    const scenario = await prisma.scenario.create({
      data: {
        name,
        description,
        latitude,
        longitude,
        constraints,
        pricing,
        currentLoad,
        userId,
      },
    });

    console.log(
      `[Scenarios] Created scenario ${scenario.id}: ${scenario.name}`
    );

    return NextResponse.json(scenario, { status: 201 });
  } catch (error: any) {
    console.error("[Scenarios] Create error:", error);

    return NextResponse.json(
      {
        error: "Failed to create scenario",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where = userId ? { userId } : {};

    const [scenarios, total] = await Promise.all([
      prisma.scenario.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: {
              runs: true,
              telemetry: true,
            },
          },
        },
      }),
      prisma.scenario.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      limit,
      offset,
      data: scenarios,
    });
  } catch (error: any) {
    console.error("[Scenarios] List error:", error);

    return NextResponse.json(
      {
        error: "Failed to list scenarios",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
