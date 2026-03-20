import { NextResponse } from "next/server";
import { SEED_MAP_PINS } from "@/lib/seed-data";

export async function GET() {
  return NextResponse.json({ pins: SEED_MAP_PINS });
}
