import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseServer, getSupabaseWithAuth } from "@/lib/supabase";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

const COMMUNITY_TYPES: CommunityType[] = [
  "civic",
  "diaspora",
  "rural",
  "policy",
  "academic",
  "cultural",
];

const applySchema = z.object({
  name: z
    .string()
    .min(2, "Community name must be at least 2 characters")
    .max(100, "Community name must be under 100 characters")
    .trim(),
  region: z
    .string()
    .min(2, "Region must be at least 2 characters")
    .max(100, "Region must be under 100 characters")
    .trim(),
  country: z.string().min(2).max(50).trim().default("US"),
  community_type: z.enum(COMMUNITY_TYPES as [string, ...string[]]),
  description: z
    .string()
    .min(20, "Tell us more — at least 20 characters")
    .max(500, "Description must be under 500 characters")
    .trim(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "community-apply");
  if (rateLimited) return rateLimited;

  // Require auth
  const token = request.headers
    .get("authorization")
    ?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Sign in to apply for a community" },
      { status: 401 }
    );
  }

  const authClient = getSupabaseWithAuth(token);
  if (!authClient) {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const serverClient = getSupabaseServer();
  if (!serverClient) {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }

  // Check for duplicate community name
  const { data: existing } = await serverClient
    .from("communities")
    .select("id")
    .ilike("name", parsed.data.name)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "A community with this name already exists" },
      { status: 409 }
    );
  }

  // Assign color based on community type
  const colorHex =
    COMMUNITY_COLORS[parsed.data.community_type as CommunityType] ?? "#3B82F6";

  // Insert community as inactive (pending review)
  const { data: community, error: insertError } = await serverClient
    .from("communities")
    .insert({
      name: parsed.data.name,
      region: parsed.data.region,
      country: parsed.data.country,
      community_type: parsed.data.community_type,
      color_hex: colorHex,
      description: parsed.data.description,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      verified: false,
      active: false,
    })
    .select("id, name")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message: "Application submitted",
      community: { id: community.id, name: community.name },
    },
    { status: 201 }
  );
}
