import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { addService, adminReady, bn, dhakaDate, pickBarber, tk, unlockShop } from "./support/app";
import { shopCode } from "./support/env";
import { addBarber, resetData, seedSale } from "./support/db";

// PRD §12 / §17 journeys that the first e2e suite did not cover. All numbers are worked out by hand
// in the comments, never computed by the code under test.

const tkc = (n: number) => `৳${bn(n.toLocaleString("en-IN"))}`; // 2150 -> ৳২,১৫০ (same grouping as taka())
const rno = (id: number) => `R-${bn(String(id).padStart(6, "0"))}`;
const C = { name: "Hair Cutting" }; // 150
const B = { name: "Beard Trimming" }; // 100
const W = { name: "Hair Wash" }; // 50

test.beforeEach(async () => {
  await resetData();
});

test("a full working day: 3 barbers, 15 sales, 2 voids, 1 payout; every screen matches the hand-calculated numbers", async ({ page }, testInfo) => {
  await addBarber("Salim", 45); // Rahim 50 %, Karim 40 %, Salim 45 % (half-up rounding matters here)

  // One sale goes through the real barber screen (Karim: 150 + 100 + 50 = 300).
  await unlockShop(page);
  await pickBarber(page, "Karim");
  await addService(page, "Hair Cutting");
  await addService(page, "Beard Trimming");
  await addService(page, "Hair Wash");
  await page.getByRole("button", { name: "সেভ", exact: true }).click();
  await expect(page).toHaveURL(/\/receipt\/\d+/);

  // The other 14 are stored as the app would store them.
  // Rahim (50 %):  150 / 250 / 50 (VOID) / 200 / 200
  await seedSale({ barber: "Rahim", items: [C] });
  await seedSale({ barber: "Rahim", items: [C, B] });
  const rahimVoid = await seedSale({ barber: "Rahim", items: [W] });
  await seedSale({ barber: "Rahim", items: [{ ...B, qty: 2 }] });
  await seedSale({ barber: "Rahim", items: [C, W] });
  // Karim (40 %):  150 / 50 / 100 / 300 / (the UI sale, 300)
  await seedSale({ barber: "Karim", items: [C] });
  await seedSale({ barber: "Karim", items: [W] });
  await seedSale({ barber: "Karim", items: [B] });
  await seedSale({ barber: "Karim", items: [{ ...C, qty: 2 }] });
  // Salim (45 %):  150 / 100 / 150 / 250 (VOID) / 50
  await seedSale({ barber: "Salim", items: [C] });
  await seedSale({ barber: "Salim", items: [B] });
  await seedSale({ barber: "Salim", items: [{ ...W, qty: 3 }] });
  const salimVoid = await seedSale({ barber: "Salim", items: [C, B] });
  await seedSale({ barber: "Salim", items: [W] });

  await adminReady(page);

  // Two voids through the admin screen.
  await page.goto("/admin/sales");
  await expect(page.getByText(`${bn(15)}টি এন্ট্রি`)).toBeVisible();
  for (const id of [rahimVoid, salimVoid]) {
    await page.getByRole("row").filter({ hasText: rno(id) }).getByRole("button", { name: "বাতিল", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("কারণ").fill("ভুল এন্ট্রি");
    await dialog.getByRole("button", { name: "বাতিল করুন" }).click();
    await expect(dialog).toBeHidden();
  }
  await expect(page.getByText(/বাতিল \(এডমিন\)/)).toHaveCount(2);
  await expect(page.getByText(`${bn(15)}টি এন্ট্রি`)).toBeVisible(); // voided rows stay in the list...
  await expect(page.getByText(tkc(2150)).first()).toBeVisible(); // ...but not in its live total

  // One payout through the admin screen: Salim, 100.
  await page.goto("/admin/payouts");
  await page.getByRole("button", { name: "Salim-কে টাকা দিন" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("টাকার পরিমাণ (৳)").fill("100");
  await dialog.getByRole("button", { name: "পেমেন্ট সেভ করুন" }).click();
  await expect(dialog).toBeHidden();

  // Hand-calculated live totals (voids excluded):
  //   Rahim  800 sold, 4 customers, 7 services, barber 75+125+100+100 = 400, owner 400
  //   Karim  900 sold, 5 customers, 8 services, barber 60+20+40+120+120 = 360, owner 540
  //   Salim  450 sold, 4 customers, 6 services, barber 68+45+68+23 = 204 (45 % half-up), owner 246
  //   Day    2150 sold, 13 customers, 21 services, barbers 964, owners 1186
  const card = (name: string) => page.getByText(name, { exact: true }).first().locator("xpath=ancestor::div[.//dl][1]");
  await expect(card("Salim")).toContainText(tk(204)); // earned
  await expect(card("Salim")).toContainText(tk(100)); // paid
  await expect(card("Salim")).toContainText(tk(104)); // balance = 204 - 100
  await expect(card("Rahim")).toContainText(tk(400));
  await expect(card("Karim")).toContainText(tk(360));

  await page.goto("/admin");
  const totals = page.locator("tfoot").first();
  await expect(totals).toContainText(tkc(2150));
  await expect(totals).toContainText(tk(964));
  await expect(totals).toContainText(tkc(1186));
  await expect(page.getByText(`মোট ${bn(21)}টি সার্ভিস দেওয়া হয়েছে`)).toBeVisible();
  const perBarber = (name: string) => page.getByRole("row", { name: new RegExp(name) }).first();
  await expect(perBarber("Rahim")).toContainText(tk(800));
  await expect(perBarber("Rahim")).toContainText(tk(400));
  await expect(perBarber("Karim")).toContainText(tk(900));
  await expect(perBarber("Karim")).toContainText(tk(360));
  await expect(perBarber("Karim")).toContainText(tk(540));
  await expect(perBarber("Salim")).toContainText(tk(450));
  await expect(perBarber("Salim")).toContainText(tk(204));
  await expect(perBarber("Salim")).toContainText(tk(246));

  await page.goto("/admin/reports"); // this month, daily
  await expect(page.locator("tfoot").first()).toContainText(tkc(2150));
  await expect(page.locator("tfoot").first()).toContainText(tk(964));
  await expect(page.locator("tfoot").first()).toContainText(tkc(1186));
  await page.getByRole("button", { name: "সার্ভিস অনুযায়ী" }).click();
  // Cutting 8 x 150 = 1200, Beard 6 x 100 = 600, Wash 7 x 50 = 350 (the two voided sales are not counted).
  await expect(page.getByRole("row", { name: /Hair Cutting/ })).toContainText(tkc(1200));
  await expect(page.getByRole("row", { name: /Beard Trimming/ })).toContainText(tk(600));
  await expect(page.getByRole("row", { name: /Hair Wash/ })).toContainText(tk(350));

  // The barber's own screen: today's customers and earnings (payouts do not reduce "earned today").
  await page.goto("/pos");
  await pickBarber(page, "Salim");
  const line = page.getByText(/জন কাস্টমার/).first();
  await expect(line).toContainText(`আজ ${bn(4)} জন`);
  await expect(line).toContainText(tk(204));
});

test("changing the shop code signs a second device out; the old code stops working, the new one works", async ({ page, browser, baseURL }) => {
  const NEW = "7788";
  const old = shopCode();
  const changeCode = async (p: Page, code: string) => {
    await p.goto("/admin/settings");
    await p.getByLabel("নতুন কোড (৪–৮ সংখ্যা)").fill(code);
    p.once("dialog", (d) => void d.accept());
    await p.getByRole("button", { name: "কোড বদলান" }).click();
    await expect(p.getByText("সেভ হয়েছে ✓").last()).toBeVisible();
  };

  const other = await browser.newContext({ baseURL, locale: "bn-BD", timezoneId: "Asia/Dhaka" });
  const second = await other.newPage();
  try {
    await unlockShop(second); // the second device is a barber's phone
    await second.goto("/pos");
    await expect(second).toHaveURL(/\/pos$/);

    await adminReady(page); // the owner's device
    await changeCode(page, NEW);

    await second.goto("/pos"); // the barber's phone is now signed out
    await expect(second).toHaveURL(/\/unlock/);
    await second.goto("/barber/1");
    await expect(second).toHaveURL(/\/unlock/);

    await page.goto("/pos"); // the owner's own device stays unlocked
    await expect(page).toHaveURL(/\/pos$/);

    await second.goto("/unlock");
    await second.getByLabel("দোকানের কোড").fill(old); // the old code no longer works
    await second.getByRole("button", { name: "চালু করুন" }).click();
    // Wait for the real error text (a bare role=alert also matches Next's empty route announcer).
    await expect(second.getByText("কোড ভুল হয়েছে, আবার চেষ্টা করুন")).toBeVisible();
    await expect(second).toHaveURL(/\/unlock/);
    await second.getByLabel("দোকানের কোড").fill(NEW);
    await second.getByRole("button", { name: "চালু করুন" }).click();
    await expect(second).toHaveURL(/\/pos$/);
  } finally {
    await changeCode(page, old); // leave the shared E2E database as the other specs expect it
    await other.close();
  }
});

test("a device that was never unlocked cannot open the barber pages or a receipt (§12-11)", async ({ page }) => {
  const id = await seedSale({ barber: "Rahim", items: [C] });
  for (const path of ["/pos", "/barber/1", `/receipt/${id}`]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/unlock/);
  }
});

test("price change, then reprint of the old receipt: still the old price, and Print works (§12-3)", async ({ page }) => {
  const oldSale = await seedSale({ barber: "Rahim", items: [C] }); // 150
  await page.addInitScript(() => {
    (window as unknown as { __prints: number }).__prints = 0;
    window.print = () => {
      (window as unknown as { __prints: number }).__prints++;
    };
  });
  await unlockShop(page);
  await adminReady(page);

  await page.goto("/admin/services");
  await page.getByRole("listitem").filter({ hasText: "Hair Cutting" }).getByRole("button", { name: "এডিট" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("দাম (৳)").fill("200");
  await dialog.getByRole("button", { name: "সেভ করুন" }).click();
  await expect(dialog).toBeHidden();

  // A new sale uses the new price...
  await page.goto("/pos");
  await pickBarber(page, "Rahim");
  await addService(page, "Hair Cutting");
  await page.getByRole("button", { name: "সেভ", exact: true }).click();
  await expect(page).toHaveURL(/\/receipt\/\d+/);
  await expect(page.getByRole("article")).toContainText(tk(200));

  // ...and the old receipt, opened again from the admin list, still shows 150 and prints.
  await page.goto("/admin/sales");
  await page.getByRole("row").filter({ hasText: rno(oldSale) }).getByRole("link", { name: "রসিদ" }).click();
  await expect(page).toHaveURL(new RegExp(`/receipt/${oldSale}`));
  const article = page.getByRole("article");
  await expect(article).toContainText(rno(oldSale));
  await expect(article).toContainText(tk(150));
  await expect(article).not.toContainText(tk(200));
  await page.getByRole("button", { name: "প্রিন্ট" }).click();
  expect(await page.evaluate(() => (window as unknown as { __prints: number }).__prints)).toBe(1);
});

test("CSV export: UTF-8 with BOM, Bangla headers, the right rows, no voided sale (§12-12)", async ({ page }) => {
  await seedSale({ barber: "Rahim", items: [C, B] }); // 250 -> 125 / 125
  await seedSale({ barber: "Karim", items: [C] }); // 150 at 40 % -> 60 / 90
  await seedSale({ barber: "Rahim", items: [{ ...W, qty: 2 }], voided: true }); // never exported
  await adminReady(page);
  await page.goto("/admin/reports");
  await page.getByRole("group", { name: "সময়সীমা" }).getByRole("button", { name: "আজ" }).click();

  const save = async () => {
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "সিএসভি ডাউনলোড" }).click()]);
    expect(dl.suggestedFilename()).toMatch(/\.csv$/);
    const bytes = await readFile(await dl.path());
    expect([...bytes.subarray(0, 3)], "UTF-8 byte order mark so Excel reads Bangla").toEqual([0xef, 0xbb, 0xbf]);
    return bytes.toString("utf8").replace(/^﻿/, "").split("\r\n");
  };

  const today = dhakaDate(0);
  const daily = await save();
  expect(daily[0]).toBe("তারিখ,নাপিত,কাস্টমার,সার্ভিস,মোট বিক্রি,নাপিতের ভাগ,মালিকের ভাগ");
  expect(daily.slice(1).sort()).toEqual([`${today},Karim,1,1,150,60,90`, `${today},Rahim,1,2,250,125,125`]);

  await page.getByRole("button", { name: "সার্ভিস অনুযায়ী" }).click();
  const byService = await save();
  expect(byService[0]).toBe("সার্ভিস,কতবার,মোট টাকা");
  expect(byService.slice(1).sort()).toEqual(["Beard Trimming,1,100", "Hair Cutting,2,300"]);
  expect(byService.join("\n")).not.toContain("Hair Wash");
});

test("receipt print layout on 58 mm and 80 mm paper: right width, no screen controls, no barber/owner split (§12-13)", async ({ page }) => {
  const id = await seedSale({ barber: "Rahim", items: [C, { ...B, qty: 2 }] }); // 350 -> barber 175, owner 175
  await unlockShop(page);
  await page.goto(`/receipt/${id}`);
  const article = page.getByRole("article");
  await expect(article).toBeVisible();

  for (const [label, mm] of [["৫৮ মিমি", 58], ["৮০ মিমি", 80]] as const) {
    await page.emulateMedia({ media: "screen" });
    await page.getByRole("group", { name: "কাগজের মাপ" }).getByRole("button", { name: label }).click();
    await expect(page.getByRole("group", { name: "কাগজের মাপ" }).getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
    await page.emulateMedia({ media: "print" });

    const box = await article.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { widthMm: (r.width / 96) * 25.4, overflow: el.scrollWidth > el.clientWidth + 1 };
    });
    expect(box.widthMm, `${label} receipt width`).toBeGreaterThan(mm - 0.7);
    expect(box.widthMm, `${label} receipt width`).toBeLessThan(mm + 0.7);
    expect(box.overflow, `${label}: nothing is cut off at the right edge`).toBe(false);

    await expect(page.getByRole("button", { name: "প্রিন্ট" })).toBeHidden(); // screen controls are not printed
    await expect(page.getByRole("link", { name: "নতুন কাস্টমার" })).toBeHidden();
    const body = await page.locator("body").innerText();
    expect(body, "the customer never sees the split").not.toMatch(/ভাগ|কমিশন/);
    expect(body).not.toContain(tk(175));
    await expect(article).toContainText(tk(350));
    await expect(article).toContainText(rno(id));

    // A real print to PDF at this paper width must fit on one page.
    const pdf = await page.pdf({ width: `${mm}mm`, printBackground: true });
    const pages = pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
    expect(pages, `${label}: one page`).toBe(1);
  }
});

test("the Dhaka day boundary: 23:50 on the 30th and 00:10 on the 31st land on different days, both in the month (§12-7)", async ({ page }) => {
  // 00:10 Dhaka on the 31st is still the 30th in UTC; it must count as the 31st.
  await seedSale({ barber: "Rahim", items: [C], at: new Date("2026-03-30T23:50:00+06:00") }); // 150
  await seedSale({ barber: "Rahim", items: [B], at: new Date("2026-03-31T00:10:00+06:00") }); // 100
  await adminReady(page);
  await page.goto("/admin/reports");
  await page.getByRole("group", { name: "সময়সীমা" }).getByRole("button", { name: "কাস্টম" }).click();
  const from = page.getByLabel("শুরুর তারিখ");
  const to = page.getByLabel("শেষ তারিখ");

  // Always keep from <= to while typing: an inverted range replaces the whole page with an error
  // (BUGS.md CP-11), so a later start date is entered after its end date.
  let cur = dhakaDate(0).slice(0, 7) + "-30"; // the picker starts on this month; any value >= every target works
  const day = async (d: string) => {
    if (d > cur) {
      await to.fill(d);
      await from.fill(d);
    } else {
      await from.fill(d);
      await to.fill(d);
    }
    cur = d;
  };
  await day("2026-03-30");
  await expect(page.locator("tfoot").first()).toContainText(tk(150));
  await expect(page.locator("tfoot").first()).not.toContainText(tk(100));
  await day("2026-03-31");
  await expect(page.locator("tfoot").first()).toContainText(tk(100));
  await expect(page.locator("tfoot").first()).not.toContainText(tk(150));
  await day("2026-03-29");
  await expect(page.getByText("এই সময়ে কোনো বিক্রি নেই")).toBeVisible();
  await from.fill("2026-03-01");
  await to.fill("2026-03-31");
  await page.getByRole("button", { name: "মাসিক" }).click();
  await expect(page.locator("tfoot").first()).toContainText(tk(250));
});

test("no admin page is wider than the screen (no sideways page scroll on a phone)", async ({ page }) => {
  await seedSale({ barber: "Rahim", items: [C, B] });
  await seedSale({ barber: "Karim", items: [W] });
  await adminReady(page);
  const screenW = page.viewportSize()!.width;
  const wide: string[] = [];
  for (const path of ["/admin", "/admin/reports", "/admin/sales", "/admin/payouts", "/admin/barbers", "/admin/services", "/admin/settings"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    if (w > screenW) wide.push(`${path}: ${w}px on a ${screenW}px screen`);
  }
  expect(wide).toEqual([]);
});

test("typing a start date after the end date keeps the date pickers on screen so it can be corrected", async ({ page }) => {
  await adminReady(page);
  await page.goto("/admin/reports");
  await page.getByRole("group", { name: "সময়সীমা" }).getByRole("button", { name: "কাস্টম" }).click();
  await page.getByLabel("শুরুর তারিখ").fill("2099-01-01"); // after the end date
  await expect(page.getByText("তারিখের সীমা সঠিক নয়")).toBeVisible();
  await expect(page.getByLabel("শুরুর তারিখ")).toBeVisible(); // still there, so the owner can fix it
});
