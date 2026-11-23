import { expect, type Page } from "@playwright/test";
import { adminPin, shopCode } from "./env";

const BN = "০১২৩৪৫৬৭৮৯";
/** 250 -> "২৫০" */
export const bn = (n: number | string) => String(n).replace(/\d/g, (d) => BN[Number(d)]);
/** 250 -> "৳২৫০" (matches taka() for amounts below 1,000) */
export const tk = (n: number) => `৳${bn(n)}`;

/** Dhaka calendar date `offsetDays` from today, as YYYY-MM-DD. */
export function dhakaDate(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

export async function unlockShop(page: Page): Promise<void> {
  await page.goto("/unlock");
  await page.getByLabel("দোকানের কোড").fill(shopCode());
  const go = page.getByRole("button", { name: "চালু করুন" });
  await expect(go).toBeEnabled(); // waits for the form to be ready
  await go.click();
  await expect(page).toHaveURL(/\/$/);
}

export async function pickBarber(page: Page, name: string): Promise<void> {
  await page.getByRole("link", { name }).click();
  await expect(page).toHaveURL(/\/barber\/\d+/);
}

export async function addService(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: new RegExp(`^${name},`) }).click();
}

export async function loginAdmin(page: Page, pin = adminPin()): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel("এডমিন পিন").fill(pin);
  const go = page.getByRole("button", { name: "লগইন" });
  await expect(go).toBeEnabled();
  await go.click();
}

export async function adminReady(page: Page): Promise<void> {
  await loginAdmin(page);
  await expect(page).toHaveURL(/\/admin\/?$/);
}
