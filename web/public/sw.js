const CACHE_NAME = "prism-v2";
const PRECACHE_URLS = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Network-first for everything except precached URLs
  // This prevents stale JS/CSS chunks after deploys
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((r) => {
          if (r) return r;
          if (event.request.mode === "navigate") return caches.match("/offline");
          return new Response("", { status: 503 });
        })
      )
  );
});

// ─── Push Notifications ────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "PRISM",
      body: event.data.text(),
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
    };
  }

  const { title = "PRISM", body, icon, badge, data, tag, url } = payload;
  const notificationData = { ...(data || {}) };
  if (url) {
    notificationData.url = url;
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || "/icons/icon-192.svg",
      badge: badge || "/icons/icon-192.svg",
      tag: tag || "prism-default",
      renotify: !!tag,
      data: notificationData,
      actions: payload.actions || [],
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/feed";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing PRISM tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new tab
      return self.clients.openWindow(url);
    })
  );
});
