"use client";

import { useCallback, useEffect, useState } from "react";
import { SEED_USER } from "@/lib/seed-data";

const GHOST_MODE_STORAGE_KEY = "prism_ghost_mode";

function readGhostModeFromStorage(): boolean {
  if (typeof window === "undefined") return SEED_USER.ghost_mode;

  const raw = window.localStorage.getItem(GHOST_MODE_STORAGE_KEY);
  if (raw === null) return SEED_USER.ghost_mode;
  return raw === "true";
}

export function useGhostMode() {
  const [ghostMode, setGhostModeState] = useState<boolean>(() =>
    readGhostModeFromStorage()
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(GHOST_MODE_STORAGE_KEY, String(ghostMode));
  }, [ghostMode]);

  const setGhostMode = useCallback((enabled: boolean) => {
    setGhostModeState(enabled);
  }, []);

  const toggleGhostMode = useCallback(() => {
    setGhostModeState((current) => !current);
  }, []);

  return { ghostMode, setGhostMode, toggleGhostMode };
}
