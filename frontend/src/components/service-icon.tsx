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

const INK = "#0B1F4B";
const GOLD = "#F5C518";
const BLUE = "#4B6EF5";
const SKY = "#A9C0FF";
const MIST = "#DCE6FF";
const sw = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: "round", strokeLinecap: "round" } as const;

/** Flat illustration pieces: soft blob, outlined objects, small sparkles. */
const Sparkle = ({ x, y }: { x: number; y: number }) => (
  <path d={`M${x - 3} ${y}h6M${x} ${y - 3}v6`} stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
);

const ART: Record<Kind, ReactNode> = {
  // scissors + comb
  cut: (
    <>
      <path d="M33 56 58 20M55 56 30 20" fill="none" {...sw} strokeWidth="7" />
      <path d="M33 56 58 20M55 56 30 20" fill="none" stroke={SKY} strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="66" r="8" fill={GOLD} {...sw} />
      <circle cx="58" cy="66" r="8" fill={GOLD} {...sw} />
      <circle cx="44" cy="40" r="2.4" fill={INK} />
    </>
  ),
  // straight razor
  beard: (
    <g transform="translate(-2 4) rotate(-28 48 50) scale(1.1)">
      <path d="M14 40h38a4 4 0 0 1 4 4v6H14z" fill="#fff" {...sw} />
      <path d="M18 44h30" stroke={SKY} strokeWidth="2" strokeLinecap="round" />
      <rect x="54" y="42" width="28" height="9" rx="4.5" fill={BLUE} {...sw} />
      <circle cx="59" cy="46.5" r="2" fill={GOLD} stroke={INK} strokeWidth="1.5" />
    </g>
  ),
  // moustache
  mustache: (
    <>
      <path d="M48 52C42 42 30 40 20 46c-4 2.600-4 7 0 9 8-4 17-2 23 6 2 2.800 8 2.800 10 0 6-8 15-10 23-6 4-2 4-6.400 0-9-10-6-22-4-28 6z" fill={INK} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M26 49c5-2 10-1 14 3M70 49c-5-2-10-1-14 3" stroke={SKY} strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  // hair clipper
  clipper: (
    <>
      <rect x="34" y="30" width="28" height="48" rx="10" fill={BLUE} {...sw} />
      <rect x="31" y="16" width="34" height="16" rx="3" fill="#fff" {...sw} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${37 + i * 6} 16v9`} stroke={INK} strokeWidth="2" strokeLinecap="round" />
      ))}
      <rect x="43" y="40" width="10" height="16" rx="5" fill={SKY} {...sw} />
      <circle cx="48" cy="67" r="3.500" fill={GOLD} stroke={INK} strokeWidth="2" />
    </>
  ),
  // comb + spray bottle
  style: (
    <>
      <g transform="translate(6 0) rotate(-14 44 52) scale(.92)">
        <rect x="14" y="36" width="62" height="14" rx="5" fill={SKY} {...sw} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} d={`M${20 + i * 7.5} 50v16`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
        ))}
      </g>
      <rect x="66" y="40" width="16" height="30" rx="5" fill={BLUE} {...sw} />
      <path d="M68 40v-6h10l4 3" fill="none" {...sw} />
      <circle cx="74" cy="56" r="3" fill={GOLD} stroke={INK} strokeWidth="1.5" />
    </>
  ),
  // shaving brush
  facial: (
    <>
      <path d="M34 50C29 32 37 18 48 18s19 14 14 32z" fill="#fff" {...sw} />
      <path d="M42 26c-2 6-2 13-1 20M50 22v26M56 28c1 6 1 12 0 18" stroke={SKY} strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect x="32" y="49" width="32" height="9" rx="3" fill={GOLD} {...sw} />
      <path d="M38 58h20l-3 20H41z" fill={BLUE} {...sw} />
    </>
  ),
  // shampoo bottle
  wash: (
    <>
      <rect x="31" y="38" width="34" height="42" rx="11" fill={BLUE} {...sw} />
      <rect x="38" y="26" width="20" height="13" rx="3" fill="#fff" {...sw} />
      <path d="M42 26v-8h14l3 5" fill="none" {...sw} />
      <rect x="37" y="50" width="22" height="18" rx="5" fill="#fff" {...sw} />
      <path d="M48 53s5 5 5 8a5 5 0 0 1-10 0c0-3 5-8 5-8z" fill={GOLD} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
    </>
  ),
  // barber pole
  package: (
    <>
      <clipPath id="poleClip">
        <rect x="36" y="26" width="24" height="46" rx="7" />
      </clipPath>
      <rect x="36" y="26" width="24" height="46" rx="7" fill="#fff" />
      <g clipPath="url(#poleClip)">
        <path d="M30 28l36 14v10L30 38zM30 50l36 14v10L30 60z" fill={BLUE} />
        <path d="M30 38l36 14v5L30 43zM30 60l36 14v5L30 65z" fill={GOLD} />
      </g>
      <rect x="36" y="26" width="24" height="46" rx="7" fill="none" {...sw} />
      <rect x="32" y="17" width="32" height="10" rx="3.500" fill={SKY} {...sw} />
      <rect x="32" y="71" width="32" height="10" rx="3.500" fill={SKY} {...sw} />
    </>
  ),
};

/** Flat illustration: soft blue blob, bold navy outlines, blue and gold fills. */
export function ServiceArt({ name, size = 72, className = "" }: { name: string; size?: number; className?: string }) {
  const kind = serviceKind(name);
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true" className={className}>
      <path d="M14 52C8 30 26 8 50 9s38 20 32 42-26 36-46 34S20 72 14 52z" fill={MIST} />
      <path d="M22 20c8-7 20-10 30-8" stroke={INK} strokeOpacity=".35" strokeWidth="1.6" strokeDasharray="3 4" strokeLinecap="round" fill="none" />
      <Sparkle x={80} y={22} />
      <Sparkle x={16} y={78} />
      <circle cx="84" cy="70" r="2" fill={SKY} />
      {ART[kind]}
    </svg>
  );
}
