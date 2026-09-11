import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The derived-value libraries are pure functions with no Firebase in them, so
// they run in plain Node — no jsdom, no emulator, no setup file.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
