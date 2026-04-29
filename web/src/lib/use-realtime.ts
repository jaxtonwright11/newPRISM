"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import type { SupabaseClient } from "@supabase/supabase-js";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

interface UseRealtimeOptions {
  table: string;
  event?: RealtimeEvent | "*";
  filter?: string;
  onInsert?: (payload: Record<string, unknown>) => void;
  onUpdate?: (payload: Record<string, unknown>) => void;
  onDelete?: (payload: Record<string, unknown>) => void;
  enabled?: boolean;
}

/**
 * Subscribe to Supabase Realtime changes on a table.
 * Automatically manages subscription lifecycle.
 */
export function useRealtime({
  table,
  event = "*",
  filter,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeOptions) {
  const { supabase } = useAuth();
  const channelRef = useRef<ReturnType<SupabaseClient["channel"]> | null>(null);

  useEffect(() => {
    if (!enabled || !supabase) return;

    const channelName = `realtime:${table}:${filter ?? "all"}`;
    const channel = supabase.channel(channelName);

    const subscriptionConfig: {
      event: string;
      schema: string;
      table: string;
      filter?: string;
    } = {
      event,
      schema: "public",
      table,
    };

    if (filter) {
      subscriptionConfig.filter = filter;
    }

    channel
      .on(
        "postgres_changes" as "system",
        subscriptionConfig as unknown as { event: string },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(payload.new);
              break;
            case "UPDATE":
              onUpdate?.(payload.new);
              break;
            case "DELETE":
              onDelete?.(payload.old);
              break;
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [supabase, table, event, filter, onInsert, onUpdate, onDelete, enabled]);
}
