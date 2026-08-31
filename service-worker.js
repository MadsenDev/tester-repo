importScripts("./app-version.js", "./precache-manifest.js");

const CACHE_PREFIX = "orbital-last-stand-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-${ORBITAL_APP_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${ORBITAL_APP_VERSION}`;
const scopeUrl = (path) => new URL(path, self.registration.scope).toString();

async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.all(
    ORBITAL_PRECACHE.map(async (path) => {
      const request = new Request(scopeUrl(path), { cache: "reload" });
      const response = await fetch(request);
      if (!response.ok) throw new Error(`Unable to precache ${path}: ${response.status}`);
      await cache.put(request, response);
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith(CACHE_PREFIX) && ![SHELL_CACHE, RUNTIME_CACHE].includes(name))
        .map((name) => caches.delete(name)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "GET_VERSION") {
    event.ports?.[0]?.postMessage({ version: ORBITAL_APP_VERSION });
  }
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function shellResponse(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const fallback = await cache.match(scopeUrl("./index.html"), { ignoreSearch: true });
  return fallback || Response.error();
}

async function cacheFirst(request) {
  const shell = await caches.open(SHELL_CACHE);
  const cached = await shell.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const runtime = await caches.open(RUNTIME_CACHE);
  const runtimeHit = await runtime.match(request);
  if (runtimeHit) return runtimeHit;
  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") await runtime.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(shellResponse(event.request));
    return;
  }
  event.respondWith(cacheFirst(event.request));
});

