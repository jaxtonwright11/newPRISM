import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [],
    meta: { total: 0 },
    message: "Connections endpoint ready — will connect to Supabase when configured.",
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  return NextResponse.json(
    { error: "Auth required — Supabase not configured" },
    { status: 401 }
  );
}
