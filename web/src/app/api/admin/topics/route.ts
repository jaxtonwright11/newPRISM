import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase";
import { applyRateLimit } from "@/lib/api";

// GET: List all topics
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "admin-topics");
  if (rateLimited) return rateLimited;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json({ topics: data });
}

const createSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be under 120 characters")
    .trim(),
  summary: z
    .string()
    .max(300, "Summary must be under 300 characters")
    .trim()
    .optional(),
  status: z.enum(["active", "trending", "hot", "cooling", "archived"]).default("active"),
});

// POST: Create a new topic
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "admin-topics");
  if (rateLimited) return rateLimited;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Generate slug from title
  const slug = parsed.data.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

  // Check for duplicate slug
  const { data: existing } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "A topic with this name already exists" },
      { status: 409 }
    );
  }

  const { data: topic, error: insertError } = await supabase
    .from("topics")
    .insert({
      title: parsed.data.title,
      slug,
      summary: parsed.data.summary ?? null,
      status: parsed.data.status,
      perspective_count: 0,
      community_count: 0,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }

  return NextResponse.json({ topic }, { status: 201 });
}

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "trending", "hot", "cooling", "archived"]).optional(),
  summary: z.string().max(300).trim().optional(),
});

// PATCH: Update a topic
export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "admin-topics");
  if (rateLimited) return rateLimited;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.summary !== undefined) updates.summary = parsed.data.summary;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("topics")
    .update(updates)
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ message: "Topic updated" });
}
