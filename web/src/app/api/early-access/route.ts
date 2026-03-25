import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "early-access");
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase
        .from("early_access_emails")
        .upsert({ email: parsed.data.email }, { onConflict: "email" });
    }
  } catch {
    // Table may not exist yet — still return success
  }

  return NextResponse.json({ ok: true });
}
