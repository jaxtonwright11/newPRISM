import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";
import { randomBytes } from "crypto";

const createInviteSchema = z.object({
  community_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "invites");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJsonBody(request, createInviteSchema);
  if (!parsed.success) return parsed.response;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const code = randomBytes(6).toString("hex");

  const { data, error } = await supabase
    .from("invite_links")
    .insert({
      community_id: parsed.data.community_id ?? null,
      created_by: user.id,
      code,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://web-liard-psi-12.vercel.app";

  return NextResponse.json({
    invite: data,
    url: `${siteUrl}/invite/${code}`,
  }, { status: 201 });
}
