import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — this app is fully client-rendered (Firebase Auth/Firestore
  // client SDK), so it deploys as plain static files to Firebase Hosting
  // (Spark plan friendly, no Cloud Functions/Cloud Run needed).
  output: "export",
  images: {
    unoptimized: true,
  },
  env: {
    // Stamped in at build time and shown at the bottom of Pengaturan, so
    // "did my phone actually get the new version?" is a question you can
    // answer by looking instead of guessing.
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
