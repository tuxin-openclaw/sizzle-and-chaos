/* Sizzle & Chaos — network-first service worker.
   Keeps the game installable and playable offline after the first visit. */

const CACHE_NAME = "sizzle-chaos-v1";
const SCOPE = self.registration.scope;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.add(new Request(SCOPE, { cache: "reload" }));
      } catch {
        /* the page will be cached on the next navigation */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("sizzle-chaos-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.headers.has("range")) return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response && response.status === 200 && response.type !== "opaque") {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          return (await caches.match(SCOPE)) || Response.error();
        }
        return Response.error();
      }
    })(),
  );
});
