import { expect, test } from "@playwright/test";
import { adminReady, tk } from "./support/app";
import { resetData, seedSale } from "./support/db";

test.beforeEach(async () => {
  await resetData();
  await seedSale({ barber: "Rahim", items: [{ name: "Hair Cutting" }, { name: "Beard Trimming" }] }); // 250 -> 125/125
  await seedSale({ barber: "Karim", items: [{ name: "Hair Cutting" }] }); // 150 at 40 % -> 60/90
  await seedSale({ barber: "Rahim", items: [{ name: "Hair Wash", qty: 2 }], voided: true }); // never counted
});

test("dashboard totals for today ignore voided sales", async ({ page }) => {
  await adminReady(page);
  const totals = page.locator("tfoot").first();
  await expect(totals).toContainText(tk(400)); // 250 + 150
  await expect(totals).toContainText(tk(185)); // barbers 125 + 60
  await expect(totals).toContainText(tk(215)); // owner 125 + 90
});

test("reports page: today, per barber and per service", async ({ page }) => {
  await adminReady(page);
  await page.goto("/admin/reports");
  await page.getByRole("group", { name: "সময়সীমা" }).getByRole("button", { name: "আজ" }).click();
  const totals = page.locator("tfoot").first();
  await expect(totals).toContainText(tk(400));
  await expect(page.getByRole("row", { name: /Karim/ }).first()).toContainText(tk(60));

  // The per-service view is a separate button next to daily / monthly.
  await page.getByRole("button", { name: "সার্ভিস অনুযায়ী" }).click();
  await expect(page.getByRole("row", { name: /Hair Cutting/ })).toContainText(tk(300)); // 2 x 150
  await expect(page.getByText("Hair Wash")).toHaveCount(0); // only sold in the voided sale
});
