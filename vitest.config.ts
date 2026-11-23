import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@content-auto/shared": path.resolve(__dirname, "packages/shared/src/index.ts"),
      "@content-auto/content": path.resolve(__dirname, "packages/content/src/index.ts"),
      "@content-auto/design-engine": path.resolve(
        __dirname,
        "packages/design-engine/src/index.ts",
      ),
      "@content-auto/ai": path.resolve(__dirname, "packages/ai/src/index.ts"),
      "@content-auto/storage": path.resolve(__dirname, "packages/storage/src/index.ts"),
      "@content-auto/workflows": path.resolve(__dirname, "packages/workflows/src/index.ts"),
    },
  },
});
