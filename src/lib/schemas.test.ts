import { describe, expect, it } from "vitest";
import {
  barberInput,
  barberPatch,
  categoryInput,
  categoryPatch,
  idSchema,
  serviceInput,
  servicePatch,
  settingsPatch,
} from "./schemas";

const msg = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? "" : (r.error?.issues[0]?.message ?? "");

describe("barber schemas", () => {
  it("accepts a valid barber and trims the name", () => {
    expect(barberInput.parse({ name: "  রহিম ", commissionPct: 50 })).toEqual({ name: "রহিম", commissionPct: 50 });
  });
  it("rejects an empty name with a Bangla message", () => {
    expect(msg(barberInput.safeParse({ name: "  ", commissionPct: 50 }))).toBe("নাম লিখুন");
  });
  it.each([-1, 101, 50.5, "50", null])("rejects commission %j", (v) => {
    expect(barberInput.safeParse({ name: "রহিম", commissionPct: v }).success).toBe(false);
  });
  it("gives the commission range message", () => {
    expect(msg(barberInput.safeParse({ name: "রহিম", commissionPct: 101 }))).toBe("কমিশন ০ থেকে ১০০ এর মধ্যে হবে");
  });
  it("patch is partial but strict: unknown fields such as id or createdAt are rejected", () => {
    expect(barberPatch.safeParse({ active: false }).success).toBe(true);
    expect(barberPatch.safeParse({ id: 5 }).success).toBe(false);
    expect(barberPatch.safeParse({ createdAt: "2020-01-01" }).success).toBe(false);
  });
});

describe("category and service schemas", () => {
  it("requires a category name", () => {
    expect(msg(categoryInput.safeParse({ name: "" }))).toBe("ক্যাটাগরির নাম লিখুন");
    expect(categoryPatch.safeParse({ name: " " }).success).toBe(false);
  });
  it("requires a positive whole-taka price", () => {
    expect(serviceInput.safeParse({ categoryId: 1, name: "কাটিং", price: 150 }).success).toBe(true);
    for (const price of [0, -5, 12.5, "150", 1_000_001]) {
      expect(serviceInput.safeParse({ categoryId: 1, name: "কাটিং", price }).success).toBe(false);
    }
    expect(msg(serviceInput.safeParse({ categoryId: 1, name: "কাটিং", price: 0 }))).toBe("দাম ০ এর বেশি পূর্ণ সংখ্যা হবে");
  });
  it("requires a service name", () => {
    expect(msg(serviceInput.safeParse({ categoryId: 1, name: "", price: 100 }))).toBe("সার্ভিসের নাম লিখুন");
  });
  it("service patch is strict", () => {
    expect(servicePatch.safeParse({ price: 200 }).success).toBe(true);
    expect(servicePatch.safeParse({ id: 2 }).success).toBe(false);
  });
});

describe("settings patch", () => {
  it("accepts the five public settings", () => {
    const p = { shopName: "সেলুন", shopAddress: "ঢাকা", shopPhone: "০১৭", receiptFooter: "ধন্যবাদ", paperWidth: "58" };
    expect(settingsPatch.safeParse(p).success).toBe(true);
  });
  it("never accepts secret or internal keys", () => {
    for (const k of ["adminPinHash", "shopCodeHash", "shopCodeVersion", "adminPin"]) {
      expect(settingsPatch.safeParse({ [k]: "x" }).success).toBe(false);
    }
  });
  it("rejects an empty shop name and an unknown paper width", () => {
    expect(msg(settingsPatch.safeParse({ shopName: " " }))).toBe("দোকানের নাম লিখুন");
    expect(settingsPatch.safeParse({ paperWidth: "100" }).success).toBe(false);
  });
});

describe("idSchema", () => {
  it("accepts positive integers only", () => {
    expect(idSchema.safeParse(3).success).toBe(true);
    for (const v of [0, -1, 1.5, "1", NaN, null]) expect(idSchema.safeParse(v).success).toBe(false);
  });
});
