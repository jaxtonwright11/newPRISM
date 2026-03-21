import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";

export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "ghost-mode");
  if (rateLimited) return rateLimited;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { ghost_mode?: boolean };
    if (typeof body.ghost_mode !== "boolean") {
      return NextResponse.json(
        { error: "ghost_mode must be a boolean" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("users")
      .update({ ghost_mode: body.ghost_mode, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update ghost mode", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ghost_mode: body.ghost_mode });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
