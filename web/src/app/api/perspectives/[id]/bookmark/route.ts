import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Auth required — Supabase not configured" },
    { status: 401 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Auth required — Supabase not configured" },
    { status: 401 }
  );
}
