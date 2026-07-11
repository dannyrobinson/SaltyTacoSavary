// Service worker for Dave's app: receives "are you still open?" pushes.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title || "🌮 Are you still open?", {
      body: data.body || "A customer is asking if the truck is still open. Tap to answer.",
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
      tag: data.tag || "still-open",
      renotify: true,
      data: { url: data.url || "./index.html?ask=1" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "./index.html?ask=1", self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.startsWith(self.registration.scope)) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
