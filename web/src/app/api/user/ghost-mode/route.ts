import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

const ghostModeSchema = z.object({
  ghost_mode: z.boolean(),
});

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

  const parsed = await parseJsonBody(request, ghostModeSchema);
  if (!parsed.success) return parsed.response;

  const { error } = await supabase
    .from("users")
    .update({ ghost_mode: parsed.data.ghost_mode, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update ghost mode" }, { status: 500 });
  }

  return NextResponse.json({ ghost_mode: parsed.data.ghost_mode });
}
