"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { SEED_USER } from "@/lib/seed-data";

const GHOST_MODE_STORAGE_KEY = "prism_ghost_mode";

function readGhostModeFromStorage(): boolean {
  if (typeof window === "undefined") return SEED_USER.ghost_mode;

  const raw = window.localStorage.getItem(GHOST_MODE_STORAGE_KEY);
  if (raw === null) return SEED_USER.ghost_mode;
  return raw === "true";
}

export function useGhostMode() {
  const { session } = useAuth();
  const [ghostMode, setGhostModeState] = useState<boolean>(() =>
    readGhostModeFromStorage()
  );
  const syncingRef = useRef(false);

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(GHOST_MODE_STORAGE_KEY, String(ghostMode));
  }, [ghostMode]);

  // Sync to Supabase users.ghost_mode when authenticated
  useEffect(() => {
    if (!session?.access_token || syncingRef.current) return;

    const syncToDb = async () => {
      syncingRef.current = true;
      try {
        await fetch("/api/user/ghost-mode", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ ghost_mode: ghostMode }),
        });
      } catch {
        // silent fail — localStorage is the source of truth for UX
      } finally {
        syncingRef.current = false;
      }
    };

    syncToDb();
  }, [ghostMode, session?.access_token]);

  const setGhostMode = useCallback((enabled: boolean) => {
    setGhostModeState(enabled);
  }, []);

  const toggleGhostMode = useCallback(() => {
    setGhostModeState((current) => !current);
  }, []);

  return { ghostMode, setGhostMode, toggleGhostMode };
}
