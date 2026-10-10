import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: "**/onchain-live.spec.ts",
  timeout: 60_000,
});
