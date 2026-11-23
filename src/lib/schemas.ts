// zod schemas for every Server Action input (CLAUDE.md: validate all input with zod).
// Messages are Bangla because they are shown to the user as-is. Objects are strict: unknown keys
// (id, createdAt, secret setting names, ...) are rejected instead of silently ignored.

import { z } from "zod";

const M = {
  barberName: "নাম লিখুন",
  pct: "কমিশন ০ থেকে ১০০ এর মধ্যে হবে",
  categoryName: "ক্যাটাগরির নাম লিখুন",
  serviceName: "সার্ভিসের নাম লিখুন",
  price: "দাম ০ এর বেশি পূর্ণ সংখ্যা হবে",
  shopName: "দোকানের নাম লিখুন",
  id: "ভুল তথ্য পাঠানো হয়েছে",
  tooLong: "লেখাটি অনেক বড়",
} as const;

export const MAX_PRICE = 1_000_000;

export const idSchema = z.number({ error: M.id }).int(M.id).positive(M.id);

const sortOrder = z.number({ error: M.id }).int(M.id).min(0, M.id).max(10_000, M.id);

const requiredName = (msg: string, max = 60) =>
  z.string({ error: msg }).trim().min(1, msg).max(max, M.tooLong);

const commissionPct = z.number({ error: M.pct }).int(M.pct).min(0, M.pct).max(100, M.pct);
const price = z.number({ error: M.price }).int(M.price).positive(M.price).max(MAX_PRICE, M.price);

// ---------- barbers ----------
export const barberInput = z.strictObject({
  name: requiredName(M.barberName),
  commissionPct,
});
export const barberPatch = z
  .strictObject({
    name: requiredName(M.barberName),
    commissionPct,
    sortOrder,
    active: z.boolean({ error: M.id }),
  })
  .partial();

// ---------- categories ----------
export const categoryInput = z.strictObject({ name: requiredName(M.categoryName) });
export const categoryPatch = z
  .strictObject({
    name: requiredName(M.categoryName),
    sortOrder,
    active: z.boolean({ error: M.id }),
  })
  .partial();

// ---------- services ----------
export const serviceInput = z.strictObject({
  categoryId: idSchema,
  name: requiredName(M.serviceName, 80),
  price,
});
export const servicePatch = z
  .strictObject({
    categoryId: idSchema,
    name: requiredName(M.serviceName, 80),
    price,
    sortOrder,
    active: z.boolean({ error: M.id }),
  })
  .partial();

// ---------- settings (public ones only; PIN / shop-code hashes go through the auth actions) ----------
export const settingsPatch = z
  .strictObject({
    shopName: requiredName(M.shopName, 80),
    shopAddress: z.string({ error: M.id }).trim().max(200, M.tooLong),
    shopPhone: z.string({ error: M.id }).trim().max(40, M.tooLong),
    receiptFooter: z.string({ error: M.id }).trim().max(200, M.tooLong),
    paperWidth: z.enum(["58", "80", "A4"], { error: M.id }),
  })
  .partial();

export type BarberInput = z.infer<typeof barberInput>;
export type BarberPatch = z.infer<typeof barberPatch>;
export type CategoryInput = z.infer<typeof categoryInput>;
export type CategoryPatch = z.infer<typeof categoryPatch>;
export type ServiceInput = z.infer<typeof serviceInput>;
export type ServicePatch = z.infer<typeof servicePatch>;
export type SettingsPatch = z.infer<typeof settingsPatch>;
