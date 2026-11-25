import type { ReactNode } from "react";

type Kind = "cut" | "beard" | "mustache" | "clipper" | "style" | "facial" | "wash" | "package" | "color" | "treatment" | "massage";

/** Pick an icon from the service name (English or Bangla), so new services get a sensible icon without extra data. */
export function serviceKind(name: string): Kind {
  if (/grooming|package|combo|গ্রুমিং|প্যাকেজ|কম্বো/i.test(name)) return "package";
  if (/massage|ম্যাসাজ/i.test(name)) return "massage";
  if (/color|colour|shining|highlight|কালার|শাইনিং|হাইলাইট|রং/i.test(name)) return "color";
  if (/treatment|spa|straight|stret|rebonding|ট্রিটমেন্ট|স্পা|স্ট্রেট|রিবন্ডিং/i.test(name)) return "treatment";
  if (/facial|face|skin|clean|ফেসিয়াল|ফেস|স্কিন|ক্লিন/i.test(name)) return "facial";
  if (/wash|shampoo|ওয়াশ|শ্যাম্পু|ধোয়া/i.test(name)) return "wash";
  if (/mustache|moustache|গোঁফ/i.test(name)) return "mustache";
  if (/trimmer|clipper|machine|ট্রিমার|ক্লিপার|মেশিন|বাজ/i.test(name) && !/beard/i.test(name)) return "clipper";
  if (/beard|shave|razor|দাড়ি|শেভ|রেজর/i.test(name)) return "beard";
  if (/style|setup|dry|স্টাইল|সেটআপ|ড্রাই/i.test(name)) return "style";
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
  // paint brush
  color: <path d="M18 3 9 12l3 3 9-9zM9 12c-3 0-5 2-5 6 0 2 2 3 4 3 3 0 5-2 5-5" />,
  // sparkle
  treatment: <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19 15l.8 2.200L22 18l-2.200.8L19 21l-.8-2.200L16 18l2.200-.8z" />,
  // massage chair
  massage: <path d="M7 3h6a3 3 0 0 1 3 3v8H7zM7 14v4M16 14h3v4M5 21h14" />,
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

const INK = "#171D29";
const GOLD = "#E0A526"; // brass accent
const BLUE = "#3F4C66"; // leather brown
const SKY = "#B9C0CF"; // tan
const MIST = "#E6E8EE";
const sw = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: "round", strokeLinecap: "round" } as const;

/** Flat illustration pieces: soft blob, outlined objects, small sparkles. */
const Sparkle = ({ x, y }: { x: number; y: number }) => (
  <path d={`M${x - 3} ${y}h6M${x} ${y - 3}v6`} stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
);

/** Customer bust: cape, neck, head, short black hair. Props add beard, moustache, foam or a different hair shape. */
function Person({ beard, stache, foam, calm, hair = "short", hairFill = INK, cape = BLUE }: { beard?: boolean; stache?: boolean; foam?: boolean; calm?: boolean; hair?: "short" | "none" | "foam"; hairFill?: string; cape?: string }) {
  return (
    <g>
      <rect x="42" y="56" width="12" height="14" fill="#fff" {...sw} />
      <path d="M14 96C15 76 30 68 48 68s33 8 34 28z" fill={cape} {...sw} />
      <path d="M40 70c3 4 13 4 16 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <circle cx="33" cy="44" r="3.500" fill="#fff" {...sw} />
      <circle cx="63" cy="44" r="3.500" fill="#fff" {...sw} />
      <ellipse cx="48" cy="42" rx="15" ry="18" fill="#fff" {...sw} />
      {hair === "short" && <path d="M32 40C30 22 41 14 49 14s19 8 16 26c-3-9-9-13-17-13s-14 4-16 13z" fill={hairFill} stroke={INK} strokeWidth="2" strokeLinejoin="round" />}
      {hair === "foam" && (
        <g fill="#fff" {...sw} strokeWidth="2">
          <circle cx="38" cy="22" r="7" /><circle cx="49" cy="17" r="8" /><circle cx="60" cy="22" r="7" /><circle cx="44" cy="27" r="5" /><circle cx="55" cy="27" r="5" />
        </g>
      )}
      {beard && <path d="M33 44c0 10 4 20 15 20s15-10 15-20c-3 7-8 9-15 9s-12-2-15-9z" fill={INK} stroke={INK} strokeWidth="2" strokeLinejoin="round" />}
      {foam && (
        <g fill="#fff" {...sw} strokeWidth="2">
          <circle cx="38" cy="52" r="5" /><circle cx="45" cy="57" r="5" /><circle cx="58" cy="52" r="5" /><circle cx="51" cy="57" r="5" />
        </g>
      )}
      {calm ? (
        <path d="M39 41q3 3 6 0M51 41q3 3 6 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="42" cy="41" r="1.8" fill={INK} />
          <circle cx="54" cy="41" r="1.8" fill={INK} />
        </>
      )}
      {stache ? (
        <path d="M48 48c-3-3-8-3-11-1 3 5 8 4 11 2 3 2 8 3 11-2-3-2-8-2-11 1z" fill={INK} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      ) : (
        !beard && !foam && <path d="M43 50q5 4 10 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      )}
    </g>
  );
}

const ART: Record<Kind, ReactNode> = {
  // haircut: scissors at the hair
  cut: (
    <>
      <Person />
      <g transform="translate(79 22) rotate(18) scale(.85)">
        <path d="M-6 -14 L6 8 M6 -14 L-6 8" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <path d="M-6 -14 L6 8 M6 -14 L-6 8" fill="none" stroke={SKY} strokeWidth="2" strokeLinecap="round" />
        <circle cx="-7" cy="14" r="5.500" fill={GOLD} {...sw} strokeWidth="2.200" />
        <circle cx="7" cy="14" r="5.500" fill={GOLD} {...sw} strokeWidth="2.200" />
      </g>
    </>
  ),
  // beard trim: razor at the cheek
  beard: (
    <>
      <Person beard />
      <g transform="translate(70 54) rotate(-55)">
        <path d="M-12 -3h18a2 2 0 0 1 2 2v5h-20z" fill="#fff" {...sw} strokeWidth="2" />
        <rect x="8" y="-2" width="16" height="6" rx="3" fill={GOLD} {...sw} strokeWidth="2" />
      </g>
    </>
  ),
  // moustache
  mustache: (
    <>
      <Person stache />
      <Sparkle x={74} y={46} />
    </>
  ),
  // clipper on the side of the head
  clipper: (
    <>
      <Person />
      <g transform="translate(70 30) rotate(25)">
        <rect x="-7" y="-4" width="14" height="30" rx="6" fill={BLUE} {...sw} strokeWidth="2.200" />
        <rect x="-8" y="-12" width="16" height="9" rx="2" fill="#fff" {...sw} strokeWidth="2.200" />
        <circle cx="0" cy="16" r="2.200" fill={GOLD} />
      </g>
    </>
  ),
  // styling: comb in the hair and a spray bottle
  style: (
    <>
      <Person />
      <g transform="translate(60 17) rotate(-20)">
        <rect x="-14" y="-4" width="28" height="7" rx="2.500" fill={SKY} {...sw} strokeWidth="2" />
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${-10 + i * 5} 3v6`} stroke={INK} strokeWidth="1.800" strokeLinecap="round" />)}
      </g>
      <g transform="translate(78 62)">
        <rect x="-6" y="0" width="12" height="20" rx="4" fill={BLUE} {...sw} strokeWidth="2" />
        <path d="M-5 0v-5h9l3 2" fill="none" {...sw} strokeWidth="2" />
      </g>
    </>
  ),
  // facial: foam on the cheeks and a brush
  facial: (
    <>
      <Person foam hair="short" />
      <g transform="translate(72 50) rotate(-35)">
        <path d="M-5 0C-6-9 0-14 5-14s9 5 8 14z" fill="#fff" {...sw} strokeWidth="2" />
        <rect x="-5" y="0" width="13" height="5" rx="2" fill={GOLD} {...sw} strokeWidth="2" />
        <path d="M-2 5h8l-1.500 13h-5z" fill={BLUE} {...sw} strokeWidth="2" />
      </g>
    </>
  ),
  // hair wash: foam on the head and water drops
  wash: (
    <>
      <Person hair="foam" />
      <path d="M76 30s4 4 4 7a4 4 0 0 1-8 0c0-3 4-7 4-7z" fill={SKY} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M20 34s3 3 3 5.500a3 3 0 0 1-6 0c0-2.500 3-5.500 3-5.500z" fill={SKY} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
    </>
  ),
  // hair colour: gold hair and a colour brush
  color: (
    <>
      <Person hairFill={GOLD} />
      <g transform="translate(74 52) rotate(-35)">
        <path d="M-4 0C-5-8 0-13 4-13s8 5 7 13z" fill={GOLD} {...sw} strokeWidth="2" />
        <rect x="-4" y="0" width="12" height="5" rx="2" fill="#fff" {...sw} strokeWidth="2" />
        <path d="M-1.500 5h7l-1.500 14h-4z" fill={BLUE} {...sw} strokeWidth="2" />
      </g>
    </>
  ),
  // hair treatment / spa / straightening: shine and a drop
  treatment: (
    <>
      <Person />
      <path d="M72 22l2.500 7 7 2.500-7 2.500-2.500 7-2.500-7-7-2.500 7-2.500z" fill={GOLD} {...sw} strokeWidth="2" />
      <path d="M20 30l1.500 4 4 1.500-4 1.500-1.500 4-1.500-4-4-1.500 4-1.500z" fill={SKY} {...sw} strokeWidth="1.600" />
    </>
  ),
  // body massage chair: relaxed face on a chair back, vibration lines
  massage: (
    <>
      <rect x="22" y="26" width="52" height="70" rx="16" fill={SKY} {...sw} />
      <Person calm />
      <path d="M12 44q-3 6 0 12M7 40q-5 10 0 20M84 44q3 6 0 12M89 40q5 10 0 20" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // grooming package: barber in an apron next to a pole
  package: (
    <>
      <clipPath id="poleClip">
        <rect x="62" y="22" width="16" height="46" rx="5" />
      </clipPath>
      <rect x="62" y="22" width="16" height="46" rx="5" fill="#fff" />
      <g clipPath="url(#poleClip)">
        <path d="M58 26l24 10v8L58 34zM58 46l24 10v8L58 54z" fill={BLUE} />
        <path d="M58 36l24 10v4L58 40zM58 56l24 10v4L58 60z" fill={GOLD} />
      </g>
      <rect x="62" y="22" width="16" height="46" rx="5" fill="none" {...sw} strokeWidth="2.200" />
      <rect x="60" y="16" width="20" height="8" rx="3" fill={SKY} {...sw} strokeWidth="2.200" />
      <rect x="60" y="66" width="20" height="8" rx="3" fill={SKY} {...sw} strokeWidth="2.200" />
      <g transform="translate(-12 0)">
        <Person cape="#fff" />
        <path d="M32 96V74l16 6 16-6v22z" fill={INK} />
        <path d="M44 62l4 8 4-8z" fill={GOLD} stroke={INK} strokeWidth="1.500" strokeLinejoin="round" />
      </g>
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
