"use client";

import { useCallback, useEffect, useState } from "react";
import { SEED_USER } from "@/lib/seed-data";

const GHOST_MODE_STORAGE_KEY = "prism_ghost_mode";
const GHOST_MODE_EVENT_KEY = "prism:ghost-mode-change";

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

  const writeGhostMode = useCallback((enabled: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(GHOST_MODE_STORAGE_KEY, String(enabled));
    window.dispatchEvent(
      new CustomEvent<boolean>(GHOST_MODE_EVENT_KEY, { detail: enabled })
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== GHOST_MODE_STORAGE_KEY) return;
      if (event.newValue === null) return;
      setGhostModeState(event.newValue === "true");
    };

    const onGhostModeEvent = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setGhostModeState(customEvent.detail);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(
      GHOST_MODE_EVENT_KEY,
      onGhostModeEvent as EventListener
    );

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        GHOST_MODE_EVENT_KEY,
        onGhostModeEvent as EventListener
      );
    };
  }, []);

  const setGhostMode = useCallback((enabled: boolean) => {
    setGhostModeState(enabled);
    writeGhostMode(enabled);
  }, [writeGhostMode]);

  const toggleGhostMode = useCallback(() => {
    setGhostModeState((current) => {
      const next = !current;
      writeGhostMode(next);
      return next;
    });
  }, [writeGhostMode]);

  return { ghostMode, setGhostMode, toggleGhostMode };
}
