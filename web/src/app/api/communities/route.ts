import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { SEED_COMMUNITIES } from "@/lib/seed-data";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "communities");
  if (rateLimitResponse) return rateLimitResponse;

  return NextResponse.json({ communities: SEED_COMMUNITIES });
}
