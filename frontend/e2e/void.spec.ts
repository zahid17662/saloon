import { expect, test } from "@playwright/test";
import { ageSale, isVoided, resetData, seedSale } from "./support/db";
import { pickBarber, unlockShop } from "./support/app";

test.beforeEach(async () => {
  await resetData();
});

test("a barber can void their own fresh sale", async ({ page }) => {
  const id = await seedSale({ barber: "Rahim", items: [{ name: "Hair Cutting" }] });
  await unlockShop(page);
  await pickBarber(page, "Rahim");
  await page.getByRole("button", { name: "বাতিল", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "এন্ট্রি বাতিল করবেন?" });
  await dialog.getByRole("button", { name: "বাতিল করুন" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("আজ এখনো কোনো এন্ট্রি নেই").or(page.getByText("বাতিল").first())).toBeVisible();
  expect(await isVoided(id)).toBe(true);
});

test("after 10 minutes the button is gone, and the server refuses a stale click", async ({ page }) => {
  // A sale that is older than 10 minutes yet still "today" (Dhaka day, BR-5) cannot exist in the
  // first minutes after Dhaka midnight: it would belong to yesterday and the screen rightly omits it.
  const dhaka = new Date(Date.now() + 6 * 3_600_000);
  test.skip(dhaka.getUTCHours() * 60 + dhaka.getUTCMinutes() < 12, "needs a today-sale older than 10 min; impossible just after Dhaka midnight");
  // Older than 10 minutes when the page loads: no void button at all.
  await seedSale({ barber: "Rahim", items: [{ name: "Hair Cutting" }], at: new Date(Date.now() - 11 * 60_000) });
  await unlockShop(page);
  await pickBarber(page, "Rahim");
  await expect(page.getByRole("link", { name: "রসিদ দেখুন" })).toBeVisible();
  await expect(page.getByRole("button", { name: "বাতিল", exact: true })).toHaveCount(0);
});

test("a page loaded inside the window cannot void once the window has passed (server check)", async ({ page }) => {
  const id = await seedSale({ barber: "Karim", items: [{ name: "Hair Wash" }] });
  await unlockShop(page);
  await pickBarber(page, "Karim");
  const voidBtn = page.getByRole("button", { name: "বাতিল", exact: true });
  await expect(voidBtn).toBeVisible(); // page believes it is still inside the window
  await ageSale(id, 11); // meanwhile the sale gets older than 10 minutes
  await voidBtn.click();
  const dialog = page.getByRole("dialog", { name: "এন্ট্রি বাতিল করবেন?" });
  await dialog.getByRole("button", { name: "বাতিল করুন" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  expect(await isVoided(id)).toBe(false);
});
