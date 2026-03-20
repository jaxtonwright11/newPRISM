import { NextResponse } from "next/server";
import { SEED_PERSPECTIVES } from "@/lib/seed-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const perspective = SEED_PERSPECTIVES.find((p) => p.id === id);

  if (!perspective) {
    return NextResponse.json({ error: "Perspective not found" }, { status: 404 });
  }

  return NextResponse.json({ data: perspective });
}
