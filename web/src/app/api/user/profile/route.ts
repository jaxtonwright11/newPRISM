import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { SEED_USER } from "@/lib/seed-data";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "user-profile");
  if (rateLimitResponse) return rateLimitResponse;

  return NextResponse.json({ data: SEED_USER });
}
