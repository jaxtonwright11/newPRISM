import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getAdminUser } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase";
import { adminPromoteToLevel3 } from "@/lib/verification";
import { z } from "zod";

const promoteSchema = z.object({
  user_id: z.string().uuid(),
  level: z.literal(3),
});

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "admin-promote");
  if (rateLimitResponse) return rateLimitResponse;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseJsonBody(request, promoteSchema);
  if (!parsed.success) return parsed.response;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const result = await adminPromoteToLevel3(supabase, parsed.data.user_id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: `User promoted to Level 3`,
  });
}
