/* PASONG SERVICE WORKER - FINAL v4 */

const CACHE_NAME = "pasong-v4";

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

  // Don't touch JS, CSS, API, icons
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.endsWith(".png") || url.pathname.startsWith("/api/") || url.pathname === CONTROLLER_PATH) {
    return fetch(request);
  }

  // Notification page - load clean, no injection
  if (url.pathname === "/notification.html" || url.pathname === "/notif") {
    return fetch(request).catch(() => caches.match("/notification.html"));
  }

  let response;
  try { response = await fetch(request); }
  catch (e) { const c = await caches.match(request); if (c) return c; throw e; }

  const type = response.headers.get("content-type") || "";
  if (!response.ok || !type.includes("text/html")) return response;

  const html = await response.text();
  const newHtml = injectController(html);
  const headers = new Headers(response.headers);
  headers.delete("content-length"); headers.delete("etag");
  headers.set("cache-control", "no-cache");
  const newResp = new Response(newHtml, { status: response.status, headers });
  try { const cache = await caches.open(CACHE_NAME); await cache.put(request, newResp.clone()); } catch(e){}
  return newResp;
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(handleRequest(event.request).catch(async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    return new Response("PASONG is temporarily unavailable.", { status: 503 });
  }));
});
