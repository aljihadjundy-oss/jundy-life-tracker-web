import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Falls back to placeholder values so `next build` (static export prerender)
// succeeds even before real Firebase env vars are set — see .env.local.example.
// The placeholders are inert (no such project exists) and get overridden by
// real NEXT_PUBLIC_FIREBASE_* values at build time once you configure them.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
/**
 * Firestore defaults to an in-memory cache, which means every cold start of the
 * PWA refetches every collection over the network before anything renders. With
 * a persistent cache the last synced data is on disk, so reopening the app is
 * instant and only the delta goes over the wire — the difference is most of a
 * second on mobile data.
 *
 * The multi-tab manager is what makes this safe with the app open in more than
 * one tab; without it the second tab silently falls back to memory-only.
 */
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "aljihadjundy@gmail.com";
