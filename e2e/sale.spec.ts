import { expect, test } from "@playwright/test";
import { addService, pickBarber, tk, unlockShop } from "./support/app";
import { latestSale, resetData, saleCount } from "./support/db";

test.beforeEach(async () => {
  await resetData();
});

test("unlock, pick services, save: receipt shows total, split is half and half", async ({ page }) => {
  await unlockShop(page);
  await pickBarber(page, "Rahim");
  await addService(page, "Hair Cutting"); // 150
  await addService(page, "Beard Trimming"); // 100

  // The cart shows the total and this barber's 50 % share before saving.
  const cart = page.getByRole("complementary", { name: "কাস্টমারের সার্ভিস" });
  await expect(cart).toContainText(tk(250));
  await expect(cart).toContainText(`${tk(125)}`);

  await page.getByRole("button", { name: "সেভ", exact: true }).click();
  await expect(page).toHaveURL(/\/receipt\/\d+/);
  const receipt = page.getByRole("article");
  await expect(receipt).toContainText("Rahim");
  await expect(receipt).toContainText("Hair Cutting");
  await expect(receipt).toContainText("Beard Trimming");
  await expect(receipt).toContainText(tk(250));

  const sale = await latestSale();
  expect(sale).toMatchObject({ total: 250, barber_share: 125, owner_share: 125 });
});

test("a double tap on save creates only one sale", async ({ page }) => {
  await unlockShop(page);
  await pickBarber(page, "Karim");
  await addService(page, "Hair Wash");
  const save = page.getByRole("button", { name: "সেভ", exact: true });
  await save.click({ clickCount: 2, delay: 0 });
  await expect(page).toHaveURL(/\/receipt\/\d+/);
  expect(await saleCount()).toBe(1);
});
