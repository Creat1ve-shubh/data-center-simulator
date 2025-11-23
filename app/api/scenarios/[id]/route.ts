/**
 * API Route: /api/scenarios/[id]
 * Get specific scenario details with runs and telemetry
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scenario = await prisma.scenario.findUnique({
      where: { id: params.id },
      include: {
        runs: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            stages: true,
            vppa: true,
            sensitivity: true,
          },
        },
        _count: {
          select: {
            telemetry: true,
          },
        },
      },
    });

    if (!scenario) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(scenario);
  } catch (error: any) {
    console.error("[Scenarios] Get error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch scenario",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.scenario.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Scenarios] Delete error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete scenario",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
