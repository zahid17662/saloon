import { expect, test } from "@playwright/test";
import { adminReady, loginAdmin } from "./support/app";
import { resetData } from "./support/db";

// Each project gets its own client IP so the two never share a rate-limit bucket.
test.use({ extraHTTPHeaders: { "x-real-ip": "203.0.113.77" } });

test.beforeEach(async () => {
  await resetData(); // also clears login_attempts
});

test("admin logs in with the right PIN", async ({ page }) => {
  await adminReady(page);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
});

test("a wrong PIN is refused, and repeated wrong PINs are rate limited", async ({ page }) => {
  await loginAdmin(page, "9999");
  await expect(page.getByText("পিন ভুল হয়েছে")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);

  // The form clears the PIN box when a reply arrives; waiting for that avoids racing the reply.
  const pin = page.getByLabel("এডমিন পিন");
  const attempt = async (value: string) => {
    await pin.fill(value);
    await page.getByRole("button", { name: "লগইন" }).click();
    await expect(pin).toHaveValue("");
  };
  // Failures 2..5 are plain wrong-PIN answers; the 6th inside 15 minutes is blocked.
  for (let i = 0; i < 4; i++) await attempt("9999");
  await attempt("9999");
  await expect(page.getByText(/অনেকবার ভুল হয়েছে/)).toBeVisible();

  // Even the right PIN is refused while blocked.
  await attempt("0000");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("admin pages redirect to login without a session", async ({ page }) => {
  await page.goto("/admin/payouts");
  await expect(page).toHaveURL(/\/admin\/login/);
});
