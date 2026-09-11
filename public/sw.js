// Bump this whenever the caching rules below change. Everything cached under an
// older name is deleted on activate, which is the only way a phone that already
// installed the app gets rid of a stale shell.
const CACHE_VERSION = "v2";
const CACHE_NAME = `life-tracker-${CACHE_VERSION}`;

// --- Firebase Cloud Messaging (push notifications) ---
// Config arrives via the registration URL's query string (see
// components/RegisterSW.tsx) since this static file has no build-time env
// substitution. Firebase web config is public, not secret, so this is safe.
(function setupMessaging() {
  const params = new URLSearchParams(self.location.search);
  const encoded = params.get("firebaseConfig");
  if (!encoded) return;

  let firebaseConfig;
  try {
    firebaseConfig = JSON.parse(atob(encoded));
  } catch {
    return;
  }
  if (!firebaseConfig.apiKey) return;

  importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? "Life Tracker";
    const options = {
      body: payload.notification?.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    };
    self.registration.showNotification(title, options);
  });
})();

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

// The page posts this when it spots a waiting worker, so an update never sits
// idle until every tab is closed.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache Firebase/Firestore/Auth calls — always go to network.
  if (url.pathname.startsWith("/__/") || url.hostname.includes("firestore") || url.hostname.includes("googleapis")) {
    return;
  }

  // Navigation requests: network-first, falling back to the cached shell when
  // offline.
  //
  // `cache: "no-store"` matters more than it looks. A plain fetch() here still
  // goes through the browser's HTTP cache, so a deploy would keep serving the
  // previous HTML — and with it the previous JS bundle — until that entry
  // expired. On desktop a hard reload hides the problem; an installed PWA has
  // no hard reload, so the phone just stays on the old version.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request.url, { cache: "no-store", credentials: "same-origin" })
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Static assets (Next build output, icons, fonts): cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }
});
