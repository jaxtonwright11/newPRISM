import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.reaction_type) {
    return NextResponse.json({ error: "reaction_type required" }, { status: 400 });
  }

  const validTypes = ["i_see_this", "i_didnt_know_this", "i_agree"];
  if (!validTypes.includes(body.reaction_type)) {
    return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
  }

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
