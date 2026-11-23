import { expect, test } from "@playwright/test";
import { adminReady, addService, pickBarber, tk, unlockShop } from "./support/app";
import { resetData, saleItemsOf, seedSale, serviceExists } from "./support/db";

test.beforeEach(async () => {
  await resetData();
});

test("add a barber and a service, then use both on the barber screen", async ({ page, browser }) => {
  await adminReady(page);

  await page.goto("/admin/barbers");
  await page.getByRole("button", { name: "নতুন নাপিত" }).click();
  let dialog = page.getByRole("dialog", { name: "নতুন নাপিত" });
  await dialog.getByLabel("নাম").fill("Salim");
  await dialog.getByLabel("কমিশন (%)").fill("30");
  await dialog.getByRole("button", { name: "সেভ করুন" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Salim")).toBeVisible();

  await page.goto("/admin/services");
  await page.getByRole("button", { name: "সার্ভিস" }).first().click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("সার্ভিসের নাম").fill("Facial");
  await dialog.getByLabel("দাম (৳)").fill("300");
  await dialog.getByRole("button", { name: "সেভ করুন" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Facial")).toBeVisible();
  expect(await serviceExists("Facial")).toBe(true);

  // A separate browser context stands in for the shop tablet.
  const tablet = await browser.newContext({ extraHTTPHeaders: { "x-real-ip": "203.0.113.88" } });
  const shop = await tablet.newPage();
  await unlockShop(shop);
  await pickBarber(shop, "Salim");
  await addService(shop, "Facial");
  await expect(shop.getByRole("complementary", { name: "কাস্টমারের সার্ভিস" })).toContainText(tk(300));
  await tablet.close();
});

test("changing a price never changes an old sale", async ({ page }) => {
  const oldSale = await seedSale({ barber: "Rahim", items: [{ name: "Hair Cutting" }] }); // 150
  await adminReady(page);

  await page.goto("/admin/services");
  await page.getByRole("listitem").filter({ hasText: "Hair Cutting" }).getByRole("button", { name: "এডিট" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("দাম (৳)").fill("200");
  await dialog.getByRole("button", { name: "সেভ করুন" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("listitem").filter({ hasText: "Hair Cutting" })).toContainText(tk(200));

  // The old receipt and the stored line still say 150.
  await page.goto(`/receipt/${oldSale}?from=admin`);
  await expect(page.getByRole("article")).toContainText(tk(150));
  expect(await saleItemsOf(oldSale)).toEqual([{ name_snapshot: "Hair Cutting", price_snapshot: 150 }]);
});
