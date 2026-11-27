import { randomBytes } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";
import { loadE2eEnv } from "./e2e/support/env";

// Refuses to continue unless .env.test points at the dedicated E2E Neon branch (never main / dev).
loadE2eEnv();

const PORT = 3100; // the Next.js web app (Client/)
const API_PORT = 4100; // the API (Server/)
// Fresh shared secret for this run only; both processes get the same value.
const API_KEY = randomBytes(32).toString("base64url");

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
  webServer: [
    {
      // The API talks to the dedicated E2E database (DATABASE_URL and SESSION_SECRET come from
      // Client/.env.test via loadE2eEnv above).
      command: "npm start -w Server",
      url: `http://localhost:${API_PORT}/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: { PORT: String(API_PORT), API_KEY, TRUST_PROXY_HEADERS: "1", NODE_ENV: "production" },
    },
    {
      command: "npm run build -w Client && npm start -w Client",
      url: `http://localhost:${PORT}/unlock`,
      timeout: 300_000,
      reuseExistingServer: false,
      env: { PORT: String(PORT), API_KEY, API_URL: `http://localhost:${API_PORT}`, NODE_ENV: "production" },
    },
  ],
});
