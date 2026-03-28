import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase";
import { z } from "zod";

const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

const newTopicSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).optional(),
  webhook_secret: z.string().min(1),
});

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "n8n-new-topic");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJsonBody(request, newTopicSchema);
  if (!parsed.success) return parsed.response;

  // Validate webhook secret
  if (!N8N_SECRET || parsed.data.webhook_secret !== N8N_SECRET) {
    return NextResponse.json({ error: "Invalid webhook secret" }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { title, description } = parsed.data;

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 120);

  // Create the topic
  const { data: topic, error } = await supabase
    .from("topics")
    .insert({
      title,
      slug,
      summary: description ?? null,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create topic", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ topic }, { status: 201 });
}
