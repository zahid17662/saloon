import { expect, test } from "@playwright/test";
import { adminReady, tk } from "./support/app";
import { agePayouts, payoutCount, resetData, seedPayout, seedSale } from "./support/db";

test.beforeEach(async () => {
  await resetData();
  await seedSale({ barber: "Rahim", items: [{ name: "Hair Cutting" }, { name: "Beard Trimming" }] }); // earns 125
});

test("pay a barber, the balance drops, and the payout can be deleted within 24 hours", async ({ page }) => {
  await adminReady(page);
  await page.goto("/admin/payouts");
  // Rahim is the first card: earned 125, nothing paid yet.
  await expect(page.getByText("মোট আয়").first().locator("xpath=..")).toContainText(tk(125));

  await page.getByRole("button", { name: "টাকা দিন" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("টাকার পরিমাণ (৳)").fill("100");
  await dialog.getByRole("button", { name: "পেমেন্ট সেভ করুন" }).click();
  await expect(dialog).toBeHidden();

  await expect(page.getByText("দেওয়া হয়েছে").first().locator("xpath=..")).toContainText(tk(100));
  await expect(page.getByText("বাকি").first().locator("xpath=..")).toContainText(tk(25));
  await expect(page.getByRole("row", { name: /Rahim/ })).toContainText(tk(100));

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "মুছুন" }).click();
  await expect(page.getByText("এখনো কোনো পেমেন্ট দেওয়া হয়নি")).toBeVisible();
  expect(await payoutCount()).toBe(0);
});

test("a payout older than 24 hours cannot be deleted", async ({ page }) => {
  await seedPayout("Rahim", 50);
  await agePayouts(25);
  await adminReady(page);
  await page.goto("/admin/payouts");
  await expect(page.getByRole("row", { name: /Rahim/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "মুছুন" })).toHaveCount(0);
  expect(await payoutCount()).toBe(1);
});
