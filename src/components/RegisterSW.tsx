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

export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register(buildSwUrl()).catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }, []);

  return null;
}
