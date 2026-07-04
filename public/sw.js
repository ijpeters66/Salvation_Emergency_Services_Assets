const SHELL_CACHE = "saes-shell-v1";
const DATA_CACHE = "saes-data-v1";
const APP_SHELL_URLS = ["/login", "/health", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![SHELL_CACHE, DATA_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (!isSameOrigin) {
    return;
  }

  if (requestUrl.pathname === "/api/offline/bootstrap") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          void caches.open(DATA_CACHE).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          return cachedResponse ?? Response.json({ referenceData: {}, generatedAt: null }, { status: 200 });
        }),
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/login")));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            void caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, responseClone));
          }

          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse ?? networkFetch;
    }),
  );
});
