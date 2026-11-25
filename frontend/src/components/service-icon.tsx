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

const TINT: Record<Kind, string> = {
  cut: "#FFF1BF",
  beard: "#DDF3E6",
  style: "#E6ECFA",
  facial: "#FDE6DF",
  wash: "#DDEEFC",
  package: "#EBE4FA",
};

const ART: Record<Kind, ReactNode> = {
  cut: (
    <>
      <path d="M66 22 42 58M30 22l24 36" stroke="#9FABC9" strokeWidth="8" strokeLinecap="round" />
      <path d="M66 22 42 58M30 22l24 36" stroke="#E3E8F4" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="38" cy="67" r="8" fill="none" stroke="#F5C518" strokeWidth="5" />
      <circle cx="58" cy="67" r="8" fill="none" stroke="#F5C518" strokeWidth="5" />
      <circle cx="48" cy="49" r="3.2" fill="#0B1F4B" />
    </>
  ),
  beard: (
    <>
      <circle cx="30" cy="68" r="8" fill="#fff" stroke="#CBD3E4" strokeWidth="1.5" />
      <circle cx="42" cy="73" r="6" fill="#fff" stroke="#CBD3E4" strokeWidth="1.5" />
      <circle cx="22" cy="76" r="5" fill="#fff" stroke="#CBD3E4" strokeWidth="1.5" />
      <g transform="translate(-2 2) rotate(-28 48 46)">
        <rect x="22" y="40" width="32" height="12" rx="3" fill="#E3E8F4" stroke="#9FABC9" strokeWidth="1.8" />
        <rect x="27" y="44" width="21" height="2.6" rx="1.3" fill="#fff" />
        <rect x="52" y="42" width="24" height="8" rx="4" fill="#0B1F4B" />
        <circle cx="54" cy="46" r="3" fill="#F5C518" />
      </g>
    </>
  ),
  style: (
    <g transform="rotate(-14 48 50)">
      <rect x="20" y="36" width="56" height="14" rx="4.5" fill="#F5C518" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={23.5 + i * 6.4} y="50" width="3.6" height="15" rx="1.8" fill="#0B1F4B" />
      ))}
      <rect x="26" y="40" width="30" height="3" rx="1.5" fill="#fff" opacity=".55" />
    </g>
  ),
  facial: (
    <>
      <circle cx="48" cy="52" r="22" fill="#F3C9A5" />
      <path d="M26 47C28 28 68 28 70 47L70 40C67 22 29 22 26 40Z" fill="#1E8E4E" />
      <path d="M38 53q4 3.2 8 0M50 53q4 3.2 8 0" fill="none" stroke="#0B1F4B" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M42 63q6 5 12 0" fill="none" stroke="#0B1F4B" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="34.5" cy="60" r="3.4" fill="#F29B93" opacity=".6" />
      <circle cx="61.5" cy="60" r="3.4" fill="#F29B93" opacity=".6" />
      <path d="M74 20l2.2 6.3L82.5 28.5 76.2 30.7 74 37l-2.2-6.3-6.3-2.2 6.3-2.2z" fill="#F5C518" />
    </>
  ),
  wash: (
    <>
      <rect x="35" y="41" width="22" height="31" rx="7" fill="#0B1F4B" />
      <rect x="39" y="32" width="14" height="10" rx="2.5" fill="#F5C518" />
      <rect x="42" y="27" width="14" height="5" rx="2.5" fill="#F5C518" />
      <rect x="39.5" y="52" width="13" height="11" rx="3" fill="#fff" opacity=".92" />
      <path d="M70 38c0 0 9 10 9 16a9 9 0 0 1-18 0c0-6 9-16 9-16z" fill="#5B9BE8" />
      <path d="M66 55a4 4 0 0 0 3.5 3.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      <circle cx="26" cy="46" r="4.5" fill="#fff" stroke="#5B9BE8" strokeWidth="1.8" />
      <circle cx="22" cy="60" r="3" fill="#fff" stroke="#5B9BE8" strokeWidth="1.8" />
    </>
  ),
  package: (
    <>
      <path d="M23 66 21 40l14 12 13-19 13 19 14-12-2 26z" fill="#F5C518" stroke="#C99A00" strokeWidth="2" strokeLinejoin="round" />
      <rect x="23" y="66" width="50" height="9" rx="3.5" fill="#0B1F4B" />
      <circle cx="48" cy="57" r="4.2" fill="#1E8E4E" />
      <circle cx="34" cy="61" r="3" fill="#fff" />
      <circle cx="62" cy="61" r="3" fill="#fff" />
      <circle cx="21" cy="37" r="3.4" fill="#F5C518" />
      <circle cx="48" cy="30" r="3.4" fill="#F5C518" />
      <circle cx="75" cy="37" r="3.4" fill="#F5C518" />
    </>
  ),
};

/** Flat illustrated "avatar" for a service: soft coloured backdrop, ground shadow and a two-tone drawing. */
export function ServiceArt({ name, size = 72, className = "" }: { name: string; size?: number; className?: string }) {
  const kind = serviceKind(name);
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true" className={className}>
      <circle cx="48" cy="50" r="39" fill={TINT[kind]} />
      <circle cx="70" cy="24" r="9" fill="#fff" opacity=".55" />
      <ellipse cx="48" cy="82" rx="22" ry="4" fill="#0B1F4B" opacity=".1" />
      {ART[kind]}
    </svg>
  );
}
