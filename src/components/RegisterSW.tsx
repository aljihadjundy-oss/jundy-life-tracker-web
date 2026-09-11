"use client";

import { useEffect } from "react";

// Firebase web config is not secret — it's safe to expose in the service
// worker URL. Passing it this way lets sw.js initialize Firebase Messaging
// without a separate build step just for the service worker file.
function buildSwUrl() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const encoded = btoa(JSON.stringify(config));
  return `/sw.js?firebaseConfig=${encoded}`;
}

/** Don't hammer the network checking for a new worker on every tab switch. */
const UPDATE_THROTTLE_MS = 60_000;

export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // Whether this page was already under a worker's control when it loaded.
    // On a first-ever visit the worker calls clients.claim(), which also fires
    // controllerchange — reloading then would be a pointless flash, so the
    // reload below only runs for a genuine version swap.
    const wasControlled = navigator.serviceWorker.controller !== null;
    let reloading = false;
    let lastUpdateCheck = 0;
    let registration: ServiceWorkerRegistration | null = null;

    function onControllerChange() {
      if (!wasControlled || reloading) return;
      reloading = true;
      window.location.reload();
    }

    /**
     * A worker that finished installing sits in "waiting" until every tab using
     * the old one closes. An app opened from the home screen is effectively one
     * tab that never closes, so we tell it to take over right away.
     */
    function promote(worker: ServiceWorker | null) {
      if (worker && worker.state === "installed" && navigator.serviceWorker.controller) {
        worker.postMessage("SKIP_WAITING");
      }
    }

    function checkForUpdate() {
      if (!registration) return;
      const now = Date.now();
      if (now - lastUpdateCheck < UPDATE_THROTTLE_MS) return;
      lastUpdateCheck = now;
      registration.update().catch(() => {
        // Offline, or the check raced a reload. The next one will pick it up.
      });
    }

    function onVisibility() {
      if (document.visibilityState === "visible") checkForUpdate();
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register(buildSwUrl())
      .then((reg) => {
        registration = reg;
        lastUpdateCheck = Date.now();

        promote(reg.waiting);

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => promote(installing));
        });
      })
      .catch((err) => {
        console.error("Service worker registration failed:", err);
      });

    // Reopening the app from the home screen doesn't reload the page, so
    // without this an installed PWA could sit on an old build for a long time.
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
