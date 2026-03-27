"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/use-realtime";

/**
 * Returns the count of unread notifications.
 * Subscribes to realtime inserts so the badge updates live.
 */
export function useUnreadCount(): number {
  const { session } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!session?.access_token) {
      setCount(0);
      return;
    }

    fetch("/api/notifications?count_only=true", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (typeof json.unread_count === "number") setCount(json.unread_count);
      })
      .catch(() => {});
  }, [session?.access_token]);

  // Increment on new realtime notification
  useRealtime({
    table: "notifications",
    event: "INSERT",
    onInsert: useCallback(() => {
      setCount((c) => c + 1);
    }, []),
    enabled: !!session,
  });

  return count;
}
