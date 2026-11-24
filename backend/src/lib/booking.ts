// Customer appointment rules (pure, no database). The shop is open OPEN_HOUR to CLOSE_HOUR Dhaka time
// and books in SLOT_MINUTES steps. A copy of this file lives in frontend/src/lib/booking.ts so the
// booking form shows the same slots; change both together (this one has the tests).

import { dhakaDayStart, shiftDays, todayKey } from "./time";

export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 21; // last slot starts at CLOSE_HOUR - SLOT_MINUTES
export const SLOT_MINUTES = 30;
export const MAX_DAYS_AHEAD = 30;
/** A booking must start at least this long from now. */
export const MIN_LEAD_MS = 30 * 60 * 1000;

export const BOOKING_MSG = {
  badTime: "সঠিক সময় বেছে নিন",
  past: "এই সময় পার হয়ে গেছে, পরের কোনো সময় বেছে নিন",
  tooFar: "সর্বোচ্চ ৩০ দিন আগে বুক করা যায়",
  closed: "এই সময়ে দোকান বন্ধ থাকে",
} as const;

/** Every bookable "HH:MM" of a day, in order. */
export function daySlots(): string[] {
  const out: string[] = [];
  for (let m = OPEN_HOUR * 60; m < CLOSE_HOUR * 60; m += SLOT_MINUTES) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

/**
 * Turns a Dhaka date + "HH:MM" into the start instant, or returns the Bangla reason it is not
 * bookable (not an offered slot, already past, or too far ahead).
 */
export function resolveSlot(date: string, time: string, now: Date = new Date()): { ok: true; startsAt: Date } | { ok: false; error: string } {
  if (!daySlots().includes(time)) return { ok: false, error: BOOKING_MSG.badTime };
  const today = todayKey(now);
  if (date > shiftDays(today, MAX_DAYS_AHEAD)) return { ok: false, error: BOOKING_MSG.tooFar };
  const [h, m] = time.split(":").map(Number);
  const startsAt = new Date(dhakaDayStart(date).getTime() + (h * 60 + m) * 60_000);
  if (startsAt.getTime() < now.getTime() + MIN_LEAD_MS) return { ok: false, error: BOOKING_MSG.past };
  return { ok: true, startsAt };
}
