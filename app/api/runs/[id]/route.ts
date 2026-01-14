/**
 * API Route: /api/runs/[id]
 * Get or delete a specific pipeline run
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const run = await prisma.pipelineRun.findUnique({
      where: { id: params.id },
      include: {
        scenario: true,
        stages: {
          orderBy: { stageName: "asc" },
        },
        vppa: true,
        sensitivity: true,
      },
    });

    if (!run) {
      return NextResponse.json(
        { error: "Pipeline run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(run);
  } catch (error: any) {
    console.error("[API] Failed to fetch run:", error);
    
    // Check if it's a "not found" error from Prisma
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Pipeline run not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch pipeline run", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.pipelineRun.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Pipeline run deleted" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Pipeline run not found" },
        { status: 404 }
      );
    }

    console.error("[API] Failed to delete run:", error);
    return NextResponse.json(
      { error: "Failed to delete pipeline run", details: error.message },
      { status: 500 }
    );
  }
}
