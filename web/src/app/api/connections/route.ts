import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody, slugSchema } from "@/lib/api";
import { z } from "zod";

const connectionCreateBodySchema = z.object({
  target_user_id: slugSchema,
});

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "connections-get");
  if (rateLimitResponse) return rateLimitResponse;

  return NextResponse.json({
    data: [],
    meta: { total: 0 },
    message: "Connections endpoint ready — will connect to Supabase when configured.",
  });
}

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "connections-post");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedBody = await parseJsonBody(request, connectionCreateBodySchema);
  if (!parsedBody.success) return parsedBody.response;

  return NextResponse.json(
    { error: "Auth required — Supabase not configured" },
    { status: 401 }
  );
}
