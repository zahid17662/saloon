import { readFile } from "node:fs/promises";
import { expect, test, type Page, type Request } from "@playwright/test";
import { addService, adminReady, pickBarber, unlockShop } from "./support/app";
import { adminPin, shopCode } from "./support/env";
import { resetData, saleCount } from "./support/db";

// Click-path audit (docs/BUGS.md, "Click-path audit"). Each test states what the USER should get.
// `test.fail()` marks a CONFIRMED, logged bug: the test passes while the bug exists and turns red
// the day it is fixed (then delete the `test.fail()` line). Network faults are injected in the
// browser (offline, a lost reply, a 500, a slow reply); the database is the dedicated E2E branch.

const NET = "সংযোগে সমস্যা হয়েছে";
const isAction = (r: Request) => r.method() === "POST" && !!r.headers()["next-action"];
// Logs in on the CURRENT page (the shared loginAdmin helper navigates to /admin/login and drops ?next=).
async function logInHere(page: Page) {
  await page.getByLabel("এডমিন পিন").fill(adminPin());
  const go = page.getByRole("button", { name: "লগইন" });
  await expect(go).toBeEnabled();
  await go.click();
}
const saveBtn = (page: Page) => page.getByRole("button", { name: "সেভ", exact: true });

test.beforeEach(async () => {
  await resetData();
});

// ---------- login and unlock ----------

test("unlock with the connection lost: a Bangla message on the form, not the crash page", async ({ page, context }) => {
  await page.goto("/unlock");
  await page.getByLabel("দোকানের কোড").fill(shopCode());
  const go = page.getByRole("button", { name: "চালু করুন" });
  await expect(go).toBeEnabled();
  await context.setOffline(true);
  await go.click();
  await expect(page.getByText(NET)).toBeVisible();
});

test("admin login with the connection lost: a Bangla message on the form, not the crash page", async ({ page, context }) => {
  await page.goto("/admin/login");
  await page.getByLabel("এডমিন পিন").fill(adminPin());
  const go = page.getByRole("button", { name: "লগইন" });
  await expect(go).toBeEnabled();
  await context.setOffline(true);
  await go.click();
  await expect(page.getByText(NET)).toBeVisible();
});

test("a protected admin link sends you to login and back to that page; the next= parameter cannot leave the site", async ({ page }) => {
  await page.goto("/admin/sales");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fsales/);
  await logInHere(page);
  await expect(page).toHaveURL(/\/admin\/sales$/);

  await page.context().clearCookies();
  await page.goto("/admin/login?next=//evil.example/x");
  await logInHere(page);
  await expect(page).toHaveURL(/\/admin\/?$/);
  expect(page.url()).not.toContain("evil.example");
});

// ---------- selling: slow, lost and failed networks must not lose or duplicate a sale ----------

test("save while offline: error shown, cart kept, nothing saved; back online the same tap saves exactly one sale", async ({ page, context }) => {
  await unlockShop(page);
  await pickBarber(page, "Rahim");
  await addService(page, "Hair Cutting");
  const before = await saleCount();
  await context.setOffline(true);
  await saveBtn(page).click();
  await expect(page.getByText(NET)).toBeVisible();
  expect(await saleCount()).toBe(before);
  await context.setOffline(false);
  await saveBtn(page).click(); // the cart was kept, so the button is still enabled
  await expect(page).toHaveURL(/\/receipt\/\d+/);
  expect(await saleCount()).toBe(before + 1);
});

test("the reply is lost AFTER the server saved: the retry returns the same sale, never a second one", async ({ page }) => {
  await unlockShop(page);
  await pickBarber(page, "Rahim");
  await addService(page, "Hair Cutting");
  const before = await saleCount();
  let dropped = false;
  await page.route("**/*", async (route) => {
    if (!dropped && isAction(route.request())) {
      dropped = true;
      await route.fetch(); // the server processes and commits it...
      await route.abort("failed"); // ...but the browser never sees the answer
      return;
    }
    await route.continue();
  });
  await saveBtn(page).click();
  await expect(page.getByText(NET)).toBeVisible();
  expect(await saleCount()).toBe(before + 1); // it really was saved
  await saveBtn(page).click(); // the barber retries
  await expect(page).toHaveURL(/\/receipt\/\d+/);
  expect(await saleCount()).toBe(before + 1); // still one
});

test("a double tap on a slow connection creates exactly one sale", async ({ page }) => {
  await unlockShop(page);
  await pickBarber(page, "Rahim");
  await addService(page, "Hair Cutting");
  const before = await saleCount();
  await page.route("**/*", async (route) => {
    if (isAction(route.request())) await new Promise((r) => setTimeout(r, 1500)); // slow network
    await route.continue();
  });
  await saveBtn(page).dblclick();
  await expect(page).toHaveURL(/\/receipt\/\d+/, { timeout: 20_000 });
  expect(await saleCount()).toBe(before + 1);
});

test("the server answers with an error page (database down): a Bangla message, the cart is kept, nothing is saved", async ({ page }) => {
  await unlockShop(page);
  await pickBarber(page, "Rahim");
  await addService(page, "Hair Cutting");
  const before = await saleCount();
  await page.route("**/*", (route) =>
    isAction(route.request()) ? route.fulfill({ status: 500, contentType: "text/plain", body: "boom" }) : route.continue(),
  );
  await saveBtn(page).click();
  await expect(page.getByText(NET)).toBeVisible();
  await expect(saveBtn(page)).toBeEnabled();
  expect(await saleCount()).toBe(before);
});

test("device no longer unlocked while a cart is open: the barber is sent to unlock, not told to enter the ADMIN pin", async ({ page, context }) => {
  await unlockShop(page);
  await pickBarber(page, "Rahim");
  await addService(page, "Hair Cutting");
  await context.clearCookies(); // e.g. the owner changed the shop code
  await saveBtn(page).click();
  await expect(page).toHaveURL(/\/unlock/, { timeout: 8_000 });
});

// ---------- admin forms ----------

test("PIN change with the connection lost: the admin sees a Bangla message", async ({ page, context }) => {
  await adminReady(page);
  await page.getByRole("link", { name: "সেটিংস" }).first().click();
  await page.getByLabel("বর্তমান পিন").fill(adminPin());
  await page.getByLabel("নতুন পিন").fill("5555");
  await page.getByLabel("আবার লিখুন").fill("5555");
  await context.setOffline(true); // offline: the PIN can never really change in this test
  await page.getByRole("button", { name: "পিন বদলান" }).click();
  await expect(page.getByText(NET)).toBeVisible();
});

test("an expired admin session in a form says to log in again, not a 'connection problem'", async ({ page, context }) => {
  await adminReady(page);
  await page.getByRole("link", { name: "নাপিত", exact: true }).first().click();
  await page.getByRole("button", { name: "নতুন নাপিত" }).click();
  await page.getByLabel("নাম").fill("Temp Barber");
  await context.clearCookies(); // the session expires while the dialog is open
  await page.getByRole("button", { name: "সেভ করুন" }).click();
  await expect(page.getByText("আবার এডমিন পিন দিয়ে ঢুকুন")).toBeVisible({ timeout: 8_000 });
});

test("backup download with an expired admin session must not save a login page as the backup", async ({ page, context }) => {
  await adminReady(page);
  await page.getByRole("link", { name: "সেটিংস" }).first().click();
  const button = page.getByRole("button", { name: "ব্যাকআপ ডাউনলোড" });
  await expect(button).toBeVisible();
  await context.clearCookies();
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 8_000 }).catch(() => null), button.click()]);
  if (dl) {
    const body = await readFile(await dl.path(), "utf8");
    expect(body.trimStart().startsWith("{"), "the downloaded file is not JSON, it is a web page").toBe(true);
  }
});

// ---------- logout and the back button ----------

test("after logout the back button does not show the admin panel", async ({ page }) => {
  await adminReady(page);
  await page.getByRole("link", { name: "সেটিংস" }).first().click();
  await expect(page.getByRole("heading", { name: "সেটিংস" })).toBeVisible();
  await page.getByRole("button", { name: "লগআউট" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goBack();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "সেটিংস" })).toBeHidden();
  await expect(page.getByLabel("দোকানের নাম")).toBeHidden(); // no editable shop settings on screen
});

test("logout leaves the device unlocked for barbers, and the admin area asks for the PIN again", async ({ page }) => {
  await adminReady(page);
  await page.getByRole("button", { name: "লগআউট" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/pos");
  await expect(page).toHaveURL(/\/pos$/); // not bounced to /unlock: the device is still unlocked
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

// ---------- dead links ----------

test("every internal link on the barber and admin screens leads to a real page", async ({ page }) => {
  await unlockShop(page);
  const hrefs = new Set<string>(["/pos"]);
  const collect = async () => {
    for (const h of await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!))) {
      hrefs.add(h);
    }
  };
  await collect();
  await adminReady(page);
  for (const path of ["/admin", "/admin/reports", "/admin/sales", "/admin/payouts", "/admin/barbers", "/admin/services", "/admin/settings"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await collect();
  }
  const bad: string[] = [];
  for (const h of hrefs) {
    if (h.startsWith("/barber/") || h.startsWith("/receipt/")) continue; // need an id that exists; covered by sale.spec
    const res = await page.request.get(h);
    if (res.status() >= 400) bad.push(`${h} -> ${res.status()}`);
  }
  expect(bad).toEqual([]);
});
