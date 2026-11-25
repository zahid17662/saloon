import type { ReactNode } from "react";

type Kind = "cut" | "beard" | "mustache" | "clipper" | "style" | "facial" | "wash" | "package";

/** Pick an icon from the Bangla service name, so new services get a sensible icon without extra data. */
export function serviceKind(name: string): Kind {
  if (/গ্রুমিং|প্যাকেজ|কম্বো/.test(name)) return "package";
  if (/ফেসিয়াল|ফেস|স্কিন|ক্লিন/.test(name)) return "facial";
  if (/ওয়াশ|শ্যাম্পু|ধোয়া/.test(name)) return "wash";
  if (/গোঁফ/.test(name)) return "mustache";
  if (/ট্রিমার|ক্লিপার|মেশিন|বাজ/.test(name)) return "clipper";
  if (/দাড়ি|শেভ|রেজর/.test(name)) return "beard";
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
  // mustache
  mustache: <path d="M12 11c-2-2.4-6-2.6-8.5-.8-1 .8-1 2 0 2.6 2.4-1.4 5-.8 7 1.8.6.8 1.4.8 2 0 2-2.6 4.6-3.2 7-1.8 1-.6 1-1.8 0-2.6C18 8.4 14 8.6 12 11z" />,
  // clipper
  clipper: (
    <>
      <rect x="8" y="7" width="8" height="15" rx="2.5" />
      <path d="M8.5 7V3.5h7V7M10.5 3.5v3M13.5 3.5v3M12 14v2" />
    </>
  ),
  // shaving brush
  facial: (
    <>
      <path d="M7 11C6 6 9 3 12 3s6 3 5 8zM8 11h8v2.5H8zM9.5 13.5 10.5 21h3l1-7.5" />
    </>
  ),
  // shampoo bottle
  wash: (
    <>
      <rect x="7" y="9" width="10" height="12" rx="3" />
      <path d="M10 9V6h4v3M10 3.5h5v2.5" />
    </>
  ),
  // barber pole
  package: (
    <>
      <rect x="8" y="5" width="8" height="14" rx="2" />
      <path d="M8 9l8 3M8 13l8 3M9 3h6M9 21h6" />
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

const G = "#F5C518";
const W = "#F4F2EA";

const ART: Record<Kind, ReactNode> = {
  // scissors
  cut: (
    <>
      <path d="M37 56 61 22M59 56 35 22" stroke={G} strokeWidth="7" strokeLinecap="round" />
      <circle cx="35" cy="68" r="8.5" fill="none" stroke={G} strokeWidth="6" />
      <circle cx="61" cy="68" r="8.5" fill="none" stroke={G} strokeWidth="6" />
      <circle cx="48" cy="40" r="3.2" fill="#0B1F4B" />
    </>
  ),
  // straight razor
  beard: (
    <g transform="rotate(-32 48 48)">
      <path d="M12 38h40a4 4 0 0 1 4 4v8H12z" fill={W} />
      <rect x="12" y="38" width="44" height="4" rx="2" fill={G} />
      <rect x="54" y="42" width="30" height="9" rx="4.5" fill={G} />
      <circle cx="58" cy="46.5" r="2.6" fill="#0B1F4B" />
    </g>
  ),
  mustache: (
    <path
      d="M48 50C42 41 30 39 20 45c-4 2.600-4 7 0 9 8-4 17-2 23 6 2 2.800 8 2.800 10 0 6-8 15-10 23-6 4-2 4-6.400 0-9-10-6-22-4-28 5z"
      fill={G}
    />
  ),
  clipper: (
    <>
      <rect x="35" y="30" width="26" height="46" rx="9" fill={G} />
      <rect x="32" y="18" width="32" height="14" rx="3" fill={W} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={35 + i * 5} y="18" width="2.6" height="9" rx="1" fill="#0B1F4B" />
      ))}
      <rect x="44" y="40" width="8" height="14" rx="4" fill="#0B1F4B" />
      <circle cx="48" cy="66" r="3" fill="#0B1F4B" />
    </>
  ),
  // comb
  style: (
    <g transform="rotate(-12 48 50)">
      <rect x="16" y="32" width="64" height="16" rx="6" fill={G} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <rect key={i} x={19 + i * 6.6} y="48" width="3.8" height="20" rx="1.9" fill={G} />
      ))}
      <rect x="22" y="37" width="30" height="3" rx="1.5" fill="#0B1F4B" opacity=".25" />
    </g>
  ),
  // shaving brush
  facial: (
    <>
      <path d="M35 52C30 33 38 20 48 20s18 13 13 32z" fill={W} />
      <path d="M41 28c-2 7-2 14-1 22M48 24v26M55 28c2 7 2 14 1 22" stroke="#0B1F4B" strokeWidth="1.6" opacity=".18" fill="none" />
      <rect x="33" y="51" width="30" height="9" rx="3" fill={G} />
      <path d="M39 60h18l-3 18H42z" fill={G} />
    </>
  ),
  // shampoo bottle
  wash: (
    <>
      <rect x="32" y="38" width="32" height="40" rx="10" fill={G} />
      <rect x="38" y="26" width="20" height="14" rx="3" fill={W} />
      <rect x="42" y="18" width="20" height="8" rx="3" fill={W} />
      <rect x="38" y="50" width="20" height="16" rx="4" fill="#0B1F4B" opacity=".85" />
      <path d="M48 53s5 5 5 8a5 5 0 0 1-10 0c0-3 5-8 5-8z" fill={G} />
    </>
  ),
  // barber pole
  package: (
    <>
      <clipPath id="poleClip">
        <rect x="37" y="26" width="22" height="46" rx="6" />
      </clipPath>
      <rect x="37" y="26" width="22" height="46" rx="6" fill={W} />
      <g clipPath="url(#poleClip)">
        <path d="M30 28l36 14v10L30 38zM30 48l36 14v10L30 58z" fill={G} />
        <path d="M30 38l36 14v6L30 44zM30 58l36 14v6L30 64z" fill="#5B9BE8" />
      </g>
      <rect x="33" y="19" width="30" height="9" rx="3.500" fill={G} />
      <rect x="33" y="70" width="30" height="9" rx="3.500" fill={G} />
    </>
  ),
};

/** Solid barbershop glyph: gold on a dark navy tile with a thin gold keyline. */
export function ServiceArt({ name, size = 72, className = "" }: { name: string; size?: number; className?: string }) {
  const kind = serviceKind(name);
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="tileBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#16347F" />
          <stop offset="1" stopColor="#081638" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="88" height="88" rx="22" fill="url(#tileBg)" />
      <rect x="9" y="9" width="78" height="78" rx="18" fill="none" stroke={G} strokeOpacity=".35" strokeWidth="1.5" />
      {ART[kind]}
    </svg>
  );
}
