import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getAdminUser } from "@/lib/admin";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

const createPromptSchema = z.object({
  prompt_text: z.string().min(1).max(500),
  description: z.string().max(500).optional(),
  topic_id: z.string().uuid().optional(),
  active: z.boolean().optional(),
});

const updatePromptSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean().optional(),
});

async function getAdminWithSupabase(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return null;
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = getSupabaseWithAuth(token);
  if (!supabase) return null;
  return { user: admin, supabase };
}

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "admin-prompts");
  if (rateLimitResponse) return rateLimitResponse;

  const admin = await getAdminWithSupabase(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data } = await admin.supabase
    .from("perspective_prompts")
    .select("*, topic:topics(title, slug)")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ prompts: data ?? [] });
}

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "admin-prompts-create");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJsonBody(request, createPromptSchema);
  if (!parsed.success) return parsed.response;

  const admin = await getAdminWithSupabase(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // If setting active, deactivate all others first
  if (parsed.data.active) {
    await admin.supabase
      .from("perspective_prompts")
      .update({ active: false })
      .eq("active", true);
  }

  const { data, error } = await admin.supabase
    .from("perspective_prompts")
    .insert({
      prompt_text: parsed.data.prompt_text,
      description: parsed.data.description ?? null,
      topic_id: parsed.data.topic_id ?? null,
      active: parsed.data.active ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }

  return NextResponse.json({ prompt: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "admin-prompts-update");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJsonBody(request, updatePromptSchema);
  if (!parsed.success) return parsed.response;

  const admin = await getAdminWithSupabase(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (parsed.data.active) {
    await admin.supabase
      .from("perspective_prompts")
      .update({ active: false })
      .eq("active", true);
  }

  const { error } = await admin.supabase
    .from("perspective_prompts")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
