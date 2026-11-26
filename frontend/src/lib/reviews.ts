export type Review = {
  /** The customer's name, as they gave it. */
  name: string;
  /** ISO date (YYYY-MM-DD) the review was left. */
  date: string;
  /** 1–5. */
  rating: number;
  /** What they wrote, in their own words. */
  text: string;
  /** The service they took, if known. */
  service?: string;
};

/**
 * Real customer reviews only. The section on the home page hides itself while this is empty,
 * so the site never shows a review nobody wrote. Add entries like:
 *
 *   { name: "রাকিব হাসান", date: "2026-11-20", rating: 5, text: "…", service: "Hair Cutting" },
 */
export const REVIEWS: Review[] = [];
