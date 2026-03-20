import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody, slugSchema } from "@/lib/api";
import { z } from "zod";

const postCreateBodySchema = z.object({
  content: z.string().trim().min(1).max(1000),
  topic_id: slugSchema.optional().nullable(),
  community_id: slugSchema.optional(),
  post_type: z.enum(["permanent", "story"]).optional(),
});

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "posts-get");
  if (rateLimitResponse) return rateLimitResponse;

  return NextResponse.json({
    data: [],
    meta: { total: 0, page: 1, limit: 20 },
    message: "Posts endpoint ready — will connect to Supabase when configured.",
  });
}

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "posts-post");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedBody = await parseJsonBody(request, postCreateBodySchema);
  if (!parsedBody.success) return parsedBody.response;

  return NextResponse.json(
    { error: "Auth required — Supabase not configured" },
    { status: 401 }
  );
}
