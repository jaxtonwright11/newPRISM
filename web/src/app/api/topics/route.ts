import { NextResponse } from "next/server";
import { SEED_TOPICS } from "@/lib/seed-data";

export async function GET() {
  return NextResponse.json({ topics: SEED_TOPICS });
}
