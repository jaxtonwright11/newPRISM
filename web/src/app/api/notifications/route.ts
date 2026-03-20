import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { SEED_NOTIFICATIONS } from "@/lib/seed-data";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "notifications");
  if (rateLimitResponse) return rateLimitResponse;

  return NextResponse.json({
    data: SEED_NOTIFICATIONS,
    meta: { total: SEED_NOTIFICATIONS.length, unread: SEED_NOTIFICATIONS.filter((n) => !n.read).length },
  });
}
