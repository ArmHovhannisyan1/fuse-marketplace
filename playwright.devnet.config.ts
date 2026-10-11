import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: "**/devnet-live.spec.ts",
  timeout: 120_000,
  expect: { timeout: 30_000 },
});
