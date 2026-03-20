import { NextResponse } from "next/server";
import { applyRateLimit, parseParams, slugSchema } from "@/lib/api";
import { z } from "zod";

const perspectiveIdParamsSchema = z.object({
  id: slugSchema,
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-bookmark-post");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, perspectiveIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  return NextResponse.json(
    { error: "Auth required — Supabase not configured" },
    { status: 401 }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-bookmark-delete");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, perspectiveIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  return NextResponse.json(
    { error: "Auth required — Supabase not configured" },
    { status: 401 }
  );
}
