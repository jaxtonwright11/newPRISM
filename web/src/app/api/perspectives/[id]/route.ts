import { NextResponse } from "next/server";
import { applyRateLimit, parseParams, slugSchema } from "@/lib/api";
import { SEED_PERSPECTIVES } from "@/lib/seed-data";
import { z } from "zod";

const perspectiveIdParamsSchema = z.object({
  id: slugSchema,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-by-id");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, perspectiveIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  const { id } = parsedParams.data;
  const perspective = SEED_PERSPECTIVES.find((p) => p.id === id);

  if (!perspective) {
    return NextResponse.json({ error: "Perspective not found" }, { status: 404 });
  }

  return NextResponse.json({ data: perspective });
}
