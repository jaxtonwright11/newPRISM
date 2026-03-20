import { NextResponse } from "next/server";
import { SEED_NOTIFICATIONS } from "@/lib/seed-data";

export async function GET() {
  return NextResponse.json({
    data: SEED_NOTIFICATIONS,
    meta: { total: SEED_NOTIFICATIONS.length, unread: SEED_NOTIFICATIONS.filter((n) => !n.read).length },
  });
}
