import { expect, test, type Page } from "@playwright/test";
import { adminReady, dhakaDate, tk } from "./support/app";
import { adminEnteredSales, resetData, saleCount } from "./support/db";

test.beforeEach(async () => {
  await resetData();
});

async function openForm(page: Page) {
  await adminReady(page);
  await page.goto("/admin/sales");
  await page.getByRole("button", { name: "পুরনো বিক্রি যোগ করুন" }).click();
  return page.getByRole("dialog", { name: "পুরনো বিক্রি যোগ করুন" });
}

async function fillAndSave(dialog: ReturnType<Page["getByRole"]>, date: string, time: string) {
  await dialog.getByLabel("তারিখ").fill(date);
  await dialog.getByLabel("সময়").fill(time);
  await dialog.getByLabel("নাপিত").selectOption({ label: "Rahim" });
  await dialog.getByRole("button", { name: "Hair Cutting বাড়ান" }).click();
  await dialog.getByRole("button", { name: "সেভ করুন" }).click();
}

test("FR-22: admin adds a sale for a past Dhaka date", async ({ page }) => {
  const dialog = await openForm(page);
  const day = dhakaDate(-3);
  await fillAndSave(dialog, day, "14:30");
  await expect(dialog).toBeHidden();

  const [row] = await adminEnteredSales();
  expect(row.total).toBe(150);
  // 14:30 in Dhaka (UTC+6) is 08:30 UTC on that date.
  expect(new Date(row.created_at).toISOString()).toBe(`${day}T08:30:00.000Z`);

  // It shows up under that day, flagged as an old entry.
  await page.getByRole("group", { name: "সময়সীমা" }).getByRole("button", { name: "কাস্টম" }).click();
  await page.getByLabel("শুরুর তারিখ").fill(day);
  await page.getByLabel("শেষ তারিখ").fill(day);
  await expect(page.getByText("পুরনো এন্ট্রি")).toBeVisible();
  await expect(page.getByRole("row", { name: /Rahim/ })).toContainText(tk(150));
});

test("FR-22: a future date does not create a sale", async ({ page }) => {
  const dialog = await openForm(page);
  await fillAndSave(dialog, dhakaDate(1), "10:00");
  await expect(dialog).toBeVisible(); // still open: refused, not saved
  expect(await saleCount()).toBe(0);
});

test("FR-22: more than 60 days back is refused", async ({ page }) => {
  const dialog = await openForm(page);
  await fillAndSave(dialog, dhakaDate(-61), "10:00");
  await expect(dialog).toBeVisible();
  expect(await saleCount()).toBe(0);
});
