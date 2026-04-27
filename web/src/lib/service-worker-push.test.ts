import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { describe, expect, it, vi } from "vitest";

type ServiceWorkerHandlers = {
  push?: (event: PushEventStub) => void;
  notificationclick?: (event: NotificationClickEventStub) => void;
};

type PushEventStub = {
  data?: {
    json: () => unknown;
    text: () => string;
  };
  waitUntil: (promise: Promise<unknown>) => void;
};

type NotificationClickEventStub = {
  notification: {
    close: () => void;
    data?: {
      url?: string;
    };
  };
  waitUntil: (promise: Promise<unknown>) => void;
};

function loadServiceWorker() {
  const handlers: ServiceWorkerHandlers = {};
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const openWindow = vi.fn().mockResolvedValue(undefined);
  const matchAll = vi.fn().mockResolvedValue([]);
  const addEventListener = vi.fn((eventName: string, handler: unknown) => {
    if (eventName === "push") {
      handlers.push = handler as ServiceWorkerHandlers["push"];
      return;
    }

    if (eventName === "notificationclick") {
      handlers.notificationclick = handler as ServiceWorkerHandlers["notificationclick"];
    }
  });

  const sandbox = {
    self: {
      addEventListener,
      registration: {
        showNotification,
      },
      clients: {
        matchAll,
        openWindow,
        claim: vi.fn(),
      },
      location: {
        origin: "https://prism.example",
      },
      skipWaiting: vi.fn(),
    },
    caches: {
      open: vi.fn(),
      keys: vi.fn(),
      delete: vi.fn(),
      match: vi.fn(),
    },
    fetch: vi.fn(),
    Response,
  };

  const serviceWorkerSource = readFileSync(
    new URL("../../public/sw.js", import.meta.url),
    "utf8"
  );

  new Script(serviceWorkerSource).runInNewContext(sandbox);

  return {
    handlers,
    showNotification,
    openWindow,
    matchAll,
  };
}

describe("service worker push notifications", () => {
  it("stores a top-level push url in notification data for click deep links", async () => {
    const { handlers, showNotification } = loadServiceWorker();
    const waitUntil = vi.fn();

    handlers.push?.({
      data: {
        json: () => ({
          title: "New local perspectives",
          body: "Two communities are weighing in.",
          url: "/compare/transit-funding",
          icon: "/icons/icon-192.svg",
        }),
        text: () => "",
      },
      waitUntil,
    });

    await waitUntil.mock.calls[0]?.[0];

    expect(showNotification).toHaveBeenCalledWith(
      "New local perspectives",
      expect.objectContaining({
        data: expect.objectContaining({
          url: "/compare/transit-funding",
        }),
      })
    );
  });

  it("opens the notification data url when no PRISM tab is already open", async () => {
    const { handlers, openWindow } = loadServiceWorker();
    const waitUntil = vi.fn();

    handlers.notificationclick?.({
      notification: {
        close: vi.fn(),
        data: {
          url: "/compare/daily-prompt",
        },
      },
      waitUntil,
    });

    await waitUntil.mock.calls[0]?.[0];

    expect(openWindow).toHaveBeenCalledWith("/compare/daily-prompt");
  });
});
