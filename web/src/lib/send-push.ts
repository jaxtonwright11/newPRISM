import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

let vapidConfigured = false;
try {
  if (VAPID_PUBLIC && VAPID_PRIVATE) {
    webpush.setVapidDetails(
      "mailto:hello@prism-app.com",
      VAPID_PUBLIC,
      VAPID_PRIVATE
    );
    vapidConfigured = true;
  }
} catch {
  // VAPID keys missing or invalid — push notifications disabled
}

function getServiceSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  data?: Record<string, unknown>;
}

const DEFAULT_CLICK_URL = "/feed";

function normalizeClickUrl(url: unknown): string {
  if (typeof url !== "string") return DEFAULT_CLICK_URL;

  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("//")) return DEFAULT_CLICK_URL;

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) return DEFAULT_CLICK_URL;

    const siteOrigin = new URL(siteUrl).origin;
    const parsed = new URL(trimmed);
    if (parsed.origin !== siteOrigin) return DEFAULT_CLICK_URL;

    return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
  } catch {
    return DEFAULT_CLICK_URL;
  }
}

export function buildWebPushPayload(payload: PushPayload): PushPayload & { data: Record<string, unknown> & { url: string } } {
  const clickUrl = normalizeClickUrl(payload.url ?? payload.data?.url);

  return {
    ...payload,
    url: clickUrl,
    data: {
      ...(payload.data ?? {}),
      url: clickUrl,
    },
  };
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const supabase = getServiceSupabase();
  if (!supabase || !vapidConfigured) return 0;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, keys_p256dh, keys_auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return 0;

  let sent = 0;
  const notificationPayload = JSON.stringify(buildWebPushPayload(payload));
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
        },
        notificationPayload
      );
      sent++;
    } catch (err: unknown) {
      // 410 Gone = subscription expired, clean up
      if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint)
          .eq("user_id", userId);
      }
    }
  }
  return sent;
}

/**
 * Send push notification to all users (broadcast)
 */
export async function sendPushBroadcast(payload: PushPayload): Promise<number> {
  const supabase = getServiceSupabase();
  if (!supabase || !vapidConfigured) return 0;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, keys_p256dh, keys_auth");

  if (!subscriptions || subscriptions.length === 0) return 0;

  let sent = 0;
  const notificationPayload = JSON.stringify(buildWebPushPayload(payload));
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
        },
        notificationPayload
      );
      sent++;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
    }
  }
  return sent;
}

/**
 * Send push to users who follow a specific community
 */
export async function sendPushToCommunityFollowers(
  communityId: string,
  payload: PushPayload
): Promise<number> {
  const supabase = getServiceSupabase();
  if (!supabase || !vapidConfigured) return 0;

  // Get followers who have push_community_activity enabled
  const { data: followers } = await supabase
    .from("community_follows")
    .select("user_id")
    .eq("community_id", communityId);

  if (!followers || followers.length === 0) return 0;

  const userIds = followers.map((f) => f.user_id);

  // Check notification preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("user_id")
    .in("user_id", userIds)
    .eq("push_community_activity", false);

  const optedOut = new Set((prefs ?? []).map((p) => p.user_id));
  const eligibleIds = userIds.filter((id) => !optedOut.has(id));

  let sent = 0;
  for (const userId of eligibleIds) {
    sent += await sendPushToUser(userId, payload);
  }
  return sent;
}
