import { NextResponse } from "next/server";
import { SEED_USER } from "@/lib/seed-data";

export async function GET() {
  return NextResponse.json({ data: SEED_USER });
}
