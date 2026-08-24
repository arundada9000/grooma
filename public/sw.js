/*
 * Grooma service worker.
 *
 * Deliberately hand-rolled instead of Serwist: Next 16 builds run on
 * Turbopack by default while @serwist/next is webpack-only, and the
 * implementation plan names a minimal custom worker as the sanctioned
 * fallback (AD-23).
 *
 * Strategy:
 *   - navigations: network first; when offline, serve the precached
 *     localized /{locale}/offline shell. Never fake success: booking
 *     requires the network, the offline page says so plainly.
 *   - immutable build output (/_next/static) and icons: cache first,
 *     fill on miss.
 *   - everything else (RSC payloads, API): untouched passthrough so
 *     React's own caching semantics stay intact.
 */
const VERSION = "grooma-v1";
const STATIC_PREFIXES = ["/_next/static/", "/icons/"];
const OFFLINE_SHELLS = {
  en: "/en/offline",
  ne: "/ne/offline",
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(Object.values(OFFLINE_SHELLS)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function offlineShellFor(pathname) {
  const segment = pathname.split("/")[1];
  return OFFLINE_SHELLS[segment] || OFFLINE_SHELLS.en;
}

async function navigate(request, url) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(VERSION);
    return (
      (await cache.match(offlineShellFor(url.pathname))) ||
      (await cache.match(OFFLINE_SHELLS.en)) ||
      new Response("You are offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(VERSION);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(request, url));
    return;
  }

  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(cacheFirst(request));
  }
});
