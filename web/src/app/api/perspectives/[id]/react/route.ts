import { NextResponse } from "next/server";
import {
  applyRateLimit,
  parseJsonBody,
  parseParams,
  slugSchema,
} from "@/lib/api";
import { z } from "zod";

const perspectiveIdParamsSchema = z.object({
  id: slugSchema,
});

const reactionBodySchema = z.object({
  reaction_type: z.enum(["i_see_this", "i_didnt_know_this", "i_agree"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-react-post");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, perspectiveIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  const parsedBody = await parseJsonBody(request, reactionBodySchema);
  if (!parsedBody.success) return parsedBody.response;

  return NextResponse.json(
    { error: "Auth required — Supabase not configured" },
    { status: 401 }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-react-delete");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, perspectiveIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  return NextResponse.json(
    { error: "Auth required — Supabase not configured" },
    { status: 401 }
  );
}
