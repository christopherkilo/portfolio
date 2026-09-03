import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/infrastructure/**",
      "**/taskflow-angular/**",
      "**/e2e/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "test/server-only-stub.ts"),
    },
  },
});
