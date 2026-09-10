import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — this app is fully client-rendered (Firebase Auth/Firestore
  // client SDK), so it deploys as plain static files to Firebase Hosting
  // (Spark plan friendly, no Cloud Functions/Cloud Run needed).
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
