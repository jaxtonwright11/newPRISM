import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";

const bodySchema = z.object({
  content_type: z.enum(["perspective", "post", "community"]),
  content_id: z.string().uuid(),
  reason: z.enum(["harassment", "misinformation", "spam", "hate_speech", "other"]),
  details: z.string().max(500).trim().optional(),
});

export async function POST(request: NextRequest) {
  const rl = applyRateLimit(request, "reports");
  if (rl) return rl;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { content_type, content_id, reason, details } = parsed.data;

  const { error: insertError } = await supabase.from("reports").upsert(
    {
      reporter_id: user.id,
      content_type,
      content_id,
      reason,
      details,
      status: "pending",
    },
    { onConflict: "reporter_id,content_id" }
  );

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Report submitted" }, { status: 201 });
}
