import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/localnet/*.integration.ts"],
    environment: "node",
    testTimeout: 45_000,
  },
});
