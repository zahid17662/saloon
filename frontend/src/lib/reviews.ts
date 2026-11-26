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
 * Real customer reviews. The section on the home page hides itself while this is empty, so the
 * live site never shows a review nobody wrote. Add entries like:
 *
 *   { name: "রাকিব হাসান", date: "2026-11-20", rating: 5, text: "…", service: "Hair Cutting" },
 */
export const REVIEWS: Review[] = [];

/**
 * Made-up reviews for the demo build only (PREVIEW_MODE=1), shown with a "ডেমো" label so nobody
 * reads them as real customers. They are never used once the shop runs on its own backend.
 */
export const DEMO_REVIEWS: Review[] = [
  {
    name: "রাকিব হাসান",
    date: "2026-11-22",
    rating: 5,
    text: "সিরিয়াল নিয়ে আর দাঁড়িয়ে থাকতে হয় না। ফোন থেকেই দেখে নিই কতক্ষণ বাকি, তারপর গিয়ে বসি। কাটাও খুব যত্ন নিয়ে করে।",
    service: "Hair Cutting",
  },
  {
    name: "সাব্বির আহমেদ",
    date: "2026-11-20",
    rating: 5,
    text: "দাড়ি ট্রিম আর ফেসিয়াল একসঙ্গে করিয়েছি। দাম আগেই অ্যাপে দেখা ছিল, বাড়তি কিছু নেয়নি। পরিষ্কার-পরিচ্ছন্ন জায়গা।",
    service: "Brightening Facial",
  },
  {
    name: "তানভীর ইসলাম",
    date: "2026-11-17",
    rating: 4,
    text: "বিকেলে ভিড় থাকে, তবে আগাম বুক করলে সময়মতোই বসিয়ে দেয়। হেয়ার কালারটা ভালো হয়েছে।",
    service: "Hair Shining",
  },
  {
    name: "মেহেদী হাসান",
    date: "2026-11-14",
    rating: 5,
    text: "অনেক দিন ধরে এখানেই কাটাই। নতুন সিরিয়াল সিস্টেমটা হওয়ার পর আর ঝামেলা হয় না।",
    service: "Beard Trimming",
  },
];
