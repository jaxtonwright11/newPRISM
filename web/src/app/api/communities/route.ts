import { NextResponse } from "next/server";
import { SEED_COMMUNITIES } from "@/lib/seed-data";

export async function GET() {
  return NextResponse.json({ communities: SEED_COMMUNITIES });
}
