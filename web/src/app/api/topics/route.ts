import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { SEED_TOPICS } from "@/lib/seed-data";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "topics");
  if (rateLimitResponse) return rateLimitResponse;

  return NextResponse.json({ topics: SEED_TOPICS });
}
