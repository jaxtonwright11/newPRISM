import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

type WaitableEvent = {
  waitUntil: (promise: Promise<unknown>) => void;
};

type PushEvent = WaitableEvent & {
  data: {
    json: () => unknown;
    text: () => string;
  };
};

type NotificationClickEvent = WaitableEvent & {
  notification: {
    close: () => void;
    data?: {
      url?: string;
    };
  };
};

type ServiceWorkerEvent = WaitableEvent | PushEvent | NotificationClickEvent;
type ServiceWorkerListener = (event: ServiceWorkerEvent) => void;

function loadServiceWorker(windowClients: unknown[] = []) {
  const listeners = new Map<string, ServiceWorkerListener>();
  const showNotification =
    vi.fn<(title: string, options: Record<string, unknown>) => Promise<void>>().mockResolvedValue(
      undefined
    );
  const openWindow = vi.fn<(url: string) => Promise<unknown>>().mockResolvedValue({});

  const script = readFileSync(
    fileURLToPath(new URL("../../public/sw.js", import.meta.url)),
    "utf8"
  );

  vm.runInNewContext(script, {
    self: {
      addEventListener: (eventName: string, listener: ServiceWorkerListener) => {
        listeners.set(eventName, listener);
      },
      skipWaiting: vi.fn(),
      clients: {
        claim: vi.fn(),
        matchAll: vi.fn((): Promise<unknown[]> => Promise.resolve(windowClients)),
        openWindow,
      },
      location: {
        origin: "https://prism.example",
      },
      registration: {
        showNotification,
      },
    },
    caches: {
      open: vi.fn(() =>
        Promise.resolve({
          addAll: vi.fn(),
          put: vi.fn(),
        })
      ),
      keys: vi.fn((): Promise<string[]> => Promise.resolve([])),
      delete: vi.fn(),
      match: vi.fn(),
    },
    fetch: vi.fn(),
    Promise,
    Response,
    URL,
  });

  return { listeners, showNotification, openWindow };
}

async function dispatchPush(
  listener: ServiceWorkerListener,
  payload: Record<string, unknown>
): Promise<void> {
  let pending = Promise.resolve();

  listener({
    data: {
      json: () => payload,
      text: () => JSON.stringify(payload),
    },
    waitUntil: (promise: Promise<unknown>) => {
      pending = promise.then(() => undefined);
    },
  });

  await pending;
}

async function dispatchNotificationClick(
  listener: ServiceWorkerListener,
  url: string
): Promise<void> {
  let pending = Promise.resolve();

  listener({
    notification: {
      close: vi.fn(),
      data: { url },
    },
    waitUntil: (promise: Promise<unknown>) => {
      pending = promise.then(() => undefined);
    },
  });

  await pending;
}

describe("push service worker", () => {
  it("places top-level payload URLs in notification data for click navigation", async () => {
    const { listeners, showNotification } = loadServiceWorker();
    const pushListener = listeners.get("push");
    if (!pushListener) {
      throw new Error("Expected service worker push listener to be registered");
    }

    await dispatchPush(pushListener, {
      title: "New perspective on climate",
      body: "A verified community shared a perspective.",
      url: "/compare/climate-resilience",
    });

    expect(showNotification).toHaveBeenCalledWith(
      "New perspective on climate",
      expect.objectContaining({
        data: {
          url: "/compare/climate-resilience",
        },
      })
    );
  });

  it("preserves custom notification data while adding the click-through URL", async () => {
    const { listeners, showNotification } = loadServiceWorker();
    const pushListener = listeners.get("push");
    if (!pushListener) {
      throw new Error("Expected service worker push listener to be registered");
    }

    await dispatchPush(pushListener, {
      title: "Daily perspective prompt",
      body: "Communities are posting right now.",
      url: "/compare/housing-costs",
      data: {
        source: "daily-prompt",
      },
    });

    expect(showNotification).toHaveBeenCalledWith(
      "Daily perspective prompt",
      expect.objectContaining({
        data: {
          source: "daily-prompt",
          url: "/compare/housing-costs",
        },
      })
    );
  });

  it("falls back to the feed for cross-origin payload URLs", async () => {
    const { listeners, showNotification } = loadServiceWorker();
    const pushListener = listeners.get("push");
    if (!pushListener) {
      throw new Error("Expected service worker push listener to be registered");
    }

    await dispatchPush(pushListener, {
      title: "Daily perspective prompt",
      body: "Communities are posting right now.",
      url: "https://malicious.example/compare/housing-costs",
    });

    expect(showNotification).toHaveBeenCalledWith(
      "Daily perspective prompt",
      expect.objectContaining({
        data: {
          url: "/feed",
        },
      })
    );
  });

  it("opens the URL stored on notification data when clicked", async () => {
    const { listeners, openWindow } = loadServiceWorker();
    const clickListener = listeners.get("notificationclick");
    if (!clickListener) {
      throw new Error("Expected service worker notificationclick listener to be registered");
    }

    await dispatchNotificationClick(clickListener, "/compare/climate-resilience");

    expect(openWindow).toHaveBeenCalledWith("/compare/climate-resilience");
  });

  it("sanitizes notification data URLs before navigating existing clients", async () => {
    const existingClient = {
      url: "https://prism.example/feed",
      navigate: vi.fn(),
      focus: vi.fn((): Promise<void> => Promise.resolve()),
    };
    const { listeners, openWindow } = loadServiceWorker([existingClient]);
    const clickListener = listeners.get("notificationclick");
    if (!clickListener) {
      throw new Error("Expected service worker notificationclick listener to be registered");
    }

    await dispatchNotificationClick(clickListener, "javascript:alert(1)");

    expect(existingClient.navigate).toHaveBeenCalledWith("/feed");
    expect(openWindow).not.toHaveBeenCalled();
  });
});
