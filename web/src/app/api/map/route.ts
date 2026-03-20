import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { SEED_MAP_PINS } from "@/lib/seed-data";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "map");
  if (rateLimitResponse) return rateLimitResponse;

  return NextResponse.json({ pins: SEED_MAP_PINS });
}
