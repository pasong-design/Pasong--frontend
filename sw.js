/* PASONG SERVICE WORKER - FIXED v5
   External API requests are passed through unchanged.
   Do not manufacture HTTP 503 responses when the network fails.
*/

const CACHE_NAME = "pasong-v5";

const APP_SHELL = [
  "/",
  "/index.html",
  "/notification.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/pasong-global-price-controller.js"
];

const CONTROLLER_PATH = "/pasong-global-price-controller.js";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(e => console.log(e))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
  );
  self.clients.claim();
});

function injectController(html) {
  if (html.includes(CONTROLLER_PATH)) return html;
  const script = '<script src="' + CONTROLLER_PATH + '" defer></script>';
  if (/<\/head\s*>/i.test(html)) return html.replace(/<\/head\s*>/i, script + "</head>");
  if (/<\/body\s*>/i.test(html)) return html.replace(/<\/body\s*>/i, script + "</body>");
  return script + html;
}

async function handleRequest(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return fetch(request);
  if (request.method !== "GET") return fetch(request);

  // Don't touch JS, CSS, API, icons, or the price controller.
  if (
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.startsWith("/api/") ||
    url.pathname === CONTROLLER_PATH
  ) {
    return fetch(request);
  }

  // Notification page - load clean, use its cached copy only if available.
  if (url.pathname === "/notification.html" || url.pathname === "/notif") {
    try {
      return await fetch(request);
    } catch (error) {
      const cached = await caches.match("/notification.html");
      if (cached) return cached;
      throw error;
    }
  }

  let response;
  try {
    response = await fetch(request);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }

  const type = response.headers.get("content-type") || "";
  if (!response.ok || !type.includes("text/html")) return response;

  const html = await response.text();
  const newHtml = injectController(html);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("etag");
  headers.set("cache-control", "no-cache");
  const newResp = new Response(newHtml, { status: response.status, headers });

  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, newResp.clone());
  } catch (error) {}

  return newResp;
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // External requests (including the Render API) must never be converted
  // into a synthetic PASONG 503 response by this service worker.
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    handleRequest(event.request).catch(async error => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      // Preserve the real network error; do not invent an HTTP 503.
      throw error;
    })
  );
});
