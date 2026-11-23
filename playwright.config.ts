import { defineConfig, devices } from "@playwright/test";
import { loadE2eEnv } from "./e2e/support/env";

// Refuses to continue unless .env.test points at the dedicated E2E Neon branch (never main / dev).
loadE2eEnv();

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  // One shared database: tests reset it, so they must not overlap.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  globalSetup: "./e2e/support/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "bn-BD",
    timezoneId: "Asia/Dhaka",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  expect: { timeout: 10_000 },
  projects: [
    { name: "mobile-375", use: { ...devices["Pixel 5"], viewport: { width: 375, height: 812 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: "npm run build && npm start",
    url: `http://localhost:${PORT}/unlock`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: { PORT: String(PORT), TRUST_PROXY_HEADERS: "1", NODE_ENV: "production" },
  },
});
