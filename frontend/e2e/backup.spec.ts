import { expect, test } from "@playwright/test";
import { adminReady } from "./support/app";
import { resetData, seedSale } from "./support/db";

test.beforeEach(async () => {
  await resetData();
});

test("the backup download needs an admin session", async ({ request }) => {
  const res = await request.get("/admin/backup", { maxRedirects: 0 });
  expect([307, 308, 401]).toContain(res.status()); // proxy redirect to login, or the handler's 401
});

test("admin backup contains the data and never a PIN or shop-code hash", async ({ page }) => {
  const id = await seedSale({ barber: "Rahim", items: [{ name: "Hair Cutting" }] });
  await adminReady(page);
  const res = await page.request.get("/admin/backup");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-disposition"]).toContain("salon-backup-");
  const text = await res.text();
  expect(text).not.toMatch(/pinhash|codehash/i);
  const data = JSON.parse(text);
  expect(data.sales.map((s: { id: number }) => s.id)).toContain(id);
  expect(data.barbers.length).toBe(2);
});
