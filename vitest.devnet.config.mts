import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/devnet/*.integration.ts"],
    environment: "node",
    testTimeout: 60_000,
  },
});
