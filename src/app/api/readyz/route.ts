import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Validate database connectivity
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error.message || "Database connection error",
      },
      { status: 503 }
    );
  }
}
