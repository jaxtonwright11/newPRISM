import { getSupabaseServer } from "@/lib/supabase";

type NotificationType = "reaction" | "connection_request" | "connection_accepted" | "new_perspective" | "community_milestone";

interface CreateNotificationParams {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, string>;
}

/**
 * Creates a notification using the service role client.
 * Fire-and-forget — errors are swallowed so they don't break the parent operation.
 */
export async function createNotification({
  recipientId,
  type,
  title,
  body,
  metadata = {},
}: CreateNotificationParams): Promise<void> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) return;

    await supabase.from("notifications").insert({
      user_id: recipientId,
      type,
      title,
      body,
      read: false,
      metadata,
    });
  } catch {
    // Notification creation should never break the parent operation
  }
}
