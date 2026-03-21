import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { SEED_NOTIFICATIONS } from "@/lib/seed-data";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "notifications");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const supabase = getSupabaseWithAuth(token);
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!error && data) {
            return NextResponse.json({
              data,
              meta: {
                total: data.length,
                unread: data.filter((n: { read: boolean }) => !n.read).length,
              },
            });
          }
        }
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  return NextResponse.json({
    data: SEED_NOTIFICATIONS,
    meta: {
      total: SEED_NOTIFICATIONS.length,
      unread: SEED_NOTIFICATIONS.filter((n) => !n.read).length,
    },
  });
}
