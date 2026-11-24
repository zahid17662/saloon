import { describe, expect, it } from "vitest";
import { daySlots, resolveSlot } from "./booking";

const NOW = new Date("2026-03-10T06:00:00Z"); // 12:00 Dhaka

describe("daySlots", () => {
  it("runs 10:00 to 20:30 in half hours", () => {
    const s = daySlots();
    expect(s[0]).toBe("10:00");
    expect(s.at(-1)).toBe("20:30");
    expect(s).toHaveLength(22);
  });
});

describe("resolveSlot", () => {
  it("converts a Dhaka slot to the right instant", () => {
    const r = resolveSlot("2026-03-11", "15:00", NOW);
    expect(r.ok && r.startsAt.toISOString()).toBe("2026-03-11T09:00:00.000Z");
  });
  it("needs 30 minutes of lead time", () => {
    expect(resolveSlot("2026-03-10", "12:30", NOW).ok).toBe(true);
    expect(resolveSlot("2026-03-10", "12:00", NOW).ok).toBe(false);
  });
  it("allows up to 30 days ahead", () => {
    expect(resolveSlot("2026-04-09", "10:00", NOW).ok).toBe(true);
    expect(resolveSlot("2026-04-10", "10:00", NOW).ok).toBe(false);
  });
  it("only offered slots", () => {
    expect(resolveSlot("2026-03-11", "09:30", NOW).ok).toBe(false);
    expect(resolveSlot("2026-03-11", "21:00", NOW).ok).toBe(false);
    expect(resolveSlot("2026-03-11", "10:15", NOW).ok).toBe(false);
  });
});
