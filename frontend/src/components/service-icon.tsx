import type { ReactNode } from "react";

type Kind = "cut" | "beard" | "style" | "facial" | "wash" | "package";

/** Pick an icon from the Bangla service name, so new services get a sensible icon without extra data. */
export function serviceKind(name: string): Kind {
  if (/গ্রুমিং|প্যাকেজ|কম্বো/.test(name)) return "package";
  if (/ফেসিয়াল|ফেস|স্কিন|ক্লিন/.test(name)) return "facial";
  if (/ওয়াশ|শ্যাম্পু|ধোয়া/.test(name)) return "wash";
  if (/দাড়ি|শেভ|গোঁফ/.test(name)) return "beard";
  if (/স্টাইল|রং|কালার|ড্রাই/.test(name)) return "style";
  return "cut";
}

const PATHS: Record<Kind, ReactNode> = {
  // scissors
  cut: (
    <>
      <circle cx="6" cy="6" r="2.6" />
      <circle cx="6" cy="18" r="2.6" />
      <path d="M8 7.6 20 17M8 16.4 20 7" />
    </>
  ),
  // razor
  beard: (
    <>
      <path d="M4 9h13a3 3 0 0 1 3 3v0H4z" />
      <path d="M4 9V6.5A1.5 1.5 0 0 1 5.5 5H15" />
      <path d="M7 12v4M11 12v4M15 12v4" />
    </>
  ),
  // comb
  style: (
    <>
      <rect x="3" y="7" width="18" height="5" rx="1.5" />
      <path d="M6 12v5M9.5 12v5M13 12v5M16.5 12v5" />
    </>
  ),
  // sparkle on a face
  facial: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M9 10.5h.01M15 10.5h.01" />
      <path d="M9 15c1 1 2 1.4 3 1.4s2-.4 3-1.4" />
      <path d="M19 3v3M17.5 4.5h3" />
    </>
  ),
  // water drops
  wash: (
    <>
      <path d="M12 3s5 5.3 5 9a5 5 0 0 1-10 0c0-3.7 5-9 5-9z" />
      <path d="M10 13.5a2.2 2.2 0 0 0 2 2" />
    </>
  ),
  // premium crown
  package: (
    <>
      <path d="M4 17 3 7l5 4 4-6 4 6 5-4-1 10z" />
      <path d="M4 20h16" />
    </>
  ),
};

export function ServiceIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {PATHS[serviceKind(name)]}
    </svg>
  );
}
