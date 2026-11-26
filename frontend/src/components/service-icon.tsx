import type { ReactNode } from "react";

export type Kind = "cut" | "beard" | "mustache" | "clipper" | "style" | "facial" | "wash" | "package" | "color" | "shine" | "treatment" | "straight" | "massage";

/** Pick an icon from the service name (English or Bangla), so new services get a sensible icon without extra data. */
export function serviceKind(name: string): Kind {
  if (/grooming|package|combo|গ্রুমিং|প্যাকেজ|কম্বো/i.test(name)) return "package";
  if (/massage|ম্যাসাজ/i.test(name)) return "massage";
  if (/shining|shine|শাইনিং/i.test(name)) return "shine";
  if (/color|colour|highlight|কালার|হাইলাইট|রং/i.test(name)) return "color";
  if (/straight|stret|rebonding|smoothing|স্ট্রেট|রিবন্ডিং/i.test(name)) return "straight";
  if (/treatment|spa|ট্রিটমেন্ট|স্পা/i.test(name)) return "treatment";
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
      <path d="M6 9c0-3.500 2.700-6 6-6s6 2.500 6 6v3c0 4-2.700 8-6 8s-6-4-6-8z" />
      <path d="M6 12c2 1.200 3.500 1.500 6 1.500s4-.3 6-1.500M10 16.500c1.200.8 2.800.8 4 0" />
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
  // face with sparkle
  facial: (
    <>
      <path d="M5 11a6 7 0 0 1 12 0c0 4-2.500 8-6 8s-6-4-6-8z" />
      <path d="M9 11h.01M13 11h.01M9.500 15c.8.8 2.200.8 3 0" />
      <path d="M19 3l.8 2.200L22 6l-2.200.8L19 9l-.8-2.200L16 6l2.200-.8z" />
    </>
  ),
  // paint brush
  color: <path d="M18 3 9 12l3 3 9-9zM9 12c-3 0-5 2-5 6 0 2 2 3 4 3 3 0 5-2 5-5" />,
  // droplet
  treatment: <path d="M12 3s6 6.500 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11z" />,
  // sparkle
  shine: <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19 15l.8 2.200L22 18l-2.200.8L19 21l-.8-2.200L16 18l2.200-.8z" />,
  // flat iron
  straight: <path d="M8 3h8v11H8zM10 14v7h4v-7M12 6v5" />,
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

const SKIN = "#E7AD86";
const SKIN_D = "#CF9068";
const HAIR = "#24171A";
const NAVY = "#0B1F4B";
const SHIRT = "#1E3F8F";
const SHIRT_L = "#3B5FB8";
const GOLD = "#F5C518";
const ORANGE = "#F29A4A";
const ORANGE_D = "#DC8238";
const STEEL = "#D3DCEC";
const STEEL_D = "#8EA0C0";
const DARK = "#3C4258";
const RED = "#E4574B";
const GREEN = "#7DBE8F";
const WATER = "#7FB6F2";

/** Hair or mask colour read from the service name, so "Hair Color Brown" really shows brown hair. */
function tintFor(name: string): string {
  if (/black/i.test(name)) return "#14141C";
  if (/brown/i.test(name)) return "#8B5A3C";
  if (/begin|beige/i.test(name)) return "#C99A4B";
  if (/gold/i.test(name)) return "#F3D36B";
  if (/silver/i.test(name)) return "#D5DBE6";
  if (/diamond/i.test(name)) return "#CFE6FF";
  if (/fruit/i.test(name)) return "#FFC58A";
  if (/acme/i.test(name)) return "#BFE3C6";
  if (/hydra/i.test(name)) return "#BFE8FF";
  if (/highlight/i.test(name)) return "#E0A526";
  return "#F6EFE0";
}

const Star = ({ x, y, s = 1, fill = GOLD }: { x: number; y: number; s?: number; fill?: string }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0-5 1.500-1.500 5 0 1.500 1.500 0 5-1.500 1.500-5 0-1.500-1.500z" fill={fill} />
);

/** A forearm and fist coming in from the right. Draw tools towards -x from the origin, then rotate the group. */
function Hand() {
  return (
    <g>
      <rect x="-2" y="-6" width="40" height="12" rx="6" fill={SKIN} />
      <rect x="-7" y="-8" width="17" height="16" rx="7" fill={SKIN} />
      <path d="M-6-3h9M-6 1h9M-6 5h7" stroke={SKIN_D} strokeWidth="1.500" strokeLinecap="round" />
    </g>
  );
}

type PersonProps = {
  hair?: "short" | "quiff" | "long" | "none";
  hairFill?: string;
  beard?: boolean;
  stache?: boolean | "big";
  closed?: boolean;
  shirt?: string;
  behind?: ReactNode;
  front?: ReactNode;
};

/** Head and shoulders in flat colour, no outlines. Everything else is layered on top. */
function Person({ hair = "short", hairFill = HAIR, beard, stache, closed, shirt = SHIRT, behind, front }: PersonProps) {
  return (
    <g>
      {behind}
      {hair === "long" && <path d="M25 52C17 24 33 11 48 11c16 0 27 13 22 41l4 34H21z" fill={hairFill} />}
      <rect x="39" y="58" width="14" height="20" fill={SKIN_D} />
      <path d="M6 96C6 80 22 72 46 72s40 8 40 24z" fill={shirt} />
      <path d="M39 72l7 10 7-10z" fill={SKIN} />
      <circle cx="28.500" cy="48" r="4" fill={SKIN_D} />
      <circle cx="63.500" cy="48" r="4" fill={SKIN_D} />
      <ellipse cx="46" cy="46" rx="17" ry="20" fill={SKIN} />
      {hair === "short" && <path d="M28 45C25 25 37 15 50 17c13 2 18 14 14 28-2-8-6-12-14-12-8 0-16 1-22 12z" fill={hairFill} />}
      {hair === "quiff" && <path d="M27 45C19 27 27 11 46 11c16-4 31 10 19 34-2-9-6-15-14-16-8-1-16 2-24 16z" fill={hairFill} />}
      {hair === "long" && (
        <>
          <path d="M28 45C25 25 37 15 50 17c13 2 18 14 14 28-2-8-6-12-14-12-8 0-16 1-22 12z" fill={hairFill} />
          <path d="M26 46 22 84h12l2-36zM66 46l4 38H58l-2-36z" fill={hairFill} />
        </>
      )}
      {beard && <path d="M29 48c0 15 7 24 17 24s17-9 17-24c-3 8-9 10-17 10s-14-2-17-10z" fill={hairFill} />}
      {stache === true && <path d="M46 56c-3-4-10-4-14 0 4 5 10 4 14 1 4 3 10 4 14-1-4-4-11-4-14 0z" fill={hairFill} />}
      {stache === "big" && <path d="M46 55c-4-5-12-5-16 1-2 3 1 6 4 4 4-2 8-2 12-1 4-1 8-1 12 1 3 2 6-1 4-4-4-6-12-6-16-1z" fill={hairFill} />}
      {closed ? (
        <path d="M35 46q4 3 8 0M49 46q4 3 8 0" fill="none" stroke={HAIR} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="39" cy="45" r="2" fill={HAIR} />
          <circle cx="53" cy="45" r="2" fill={HAIR} />
          <path d="M34 39.500h9M49 39.500h9" stroke={hair === "none" ? HAIR : hairFill === "#14141C" ? HAIR : HAIR} strokeWidth="2.200" strokeLinecap="round" />
        </>
      )}
      <path d="M46 47q-3.500 7 1.500 8" fill="none" stroke={SKIN_D} strokeWidth="1.600" strokeLinecap="round" />
      <path d="M40 62q6 4 12 0" fill="none" stroke={beard ? SKIN : HAIR} strokeWidth="2" strokeLinecap="round" />
      {front}
    </g>
  );
}

const Sheen = () => <path d="M33 28q11-8 26-3" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="3" strokeLinecap="round" />;

function art(kind: Kind, name: string): ReactNode {
  const tint = tintFor(name);
  switch (kind) {
    case "cut":
      return (
        <>
          <Person />
          <g transform="translate(86 46) rotate(28)">
            <g fill="none" strokeLinecap="round">
              <path d="M-8 2-38-4M-8-2-38 4" stroke={STEEL_D} strokeWidth="4" />
              <path d="M-8 2-38-4M-8-2-38 4" stroke={STEEL} strokeWidth="2" />
              <circle cx="0" cy="-7" r="5" stroke={GOLD} strokeWidth="3" />
              <circle cx="0" cy="7" r="5" stroke={GOLD} strokeWidth="3" />
            </g>
            <Hand />
          </g>
        </>
      );
    case "clipper":
      return (
        <>
          <Person />
          <g transform="translate(88 46) rotate(24)">
            <rect x="-32" y="-9" width="30" height="18" rx="6" fill={DARK} />
            <rect x="-26" y="-5" width="11" height="6" rx="3" fill="#5A6280" />
            <path d="M-40-8h8v16h-8z" fill={STEEL} />
            <path d="M-38-8v16M-35-8v16" stroke={STEEL_D} strokeWidth="1.200" />
            <circle cx="-8" cy="4" r="2" fill={RED} />
            <Hand />
          </g>
        </>
      );
    case "beard":
      return (
        <>
          <Person beard stache />
          <g transform="translate(88 66) rotate(-8)">
            <rect x="-26" y="-6" width="24" height="12" rx="5" fill={DARK} />
            <rect x="-24" y="-1" width="12" height="3" rx="1.500" fill={GOLD} />
            <path d="M-33-5h7v10h-7z" fill={STEEL} />
            <Hand />
          </g>
          <Star x={20} y={30} s={1.200} />
        </>
      );
    case "mustache":
      return (
        <>
          <Person stache="big" />
          <g transform="translate(88 64) rotate(-10)">
            <rect x="-32" y="-4.500" width="30" height="9" rx="2.500" fill={GOLD} />
            {[-30, -26, -22, -18, -14, -10, -6].map((x) => <rect key={x} x={x} y="4" width="2" height="6" rx="1" fill={DARK} />)}
            <Hand />
          </g>
          <Star x={18} y={30} s={1.200} />
        </>
      );
    case "wash":
      return (
        <>
          <Person
            hair="none"
            closed
            front={
              <g fill="#fff">
                <circle cx="33" cy="30" r="8" /><circle cx="46" cy="23" r="10" /><circle cx="59" cy="30" r="8" />
                <circle cx="39" cy="37" r="7" /><circle cx="53" cy="37" r="7" /><circle cx="28" cy="40" r="5" /><circle cx="64" cy="40" r="5" />
                <circle cx="46" cy="32" r="3.500" fill="#E7F0FF" />
              </g>
            }
          />
          <g>
            <rect x="60" y="6" width="26" height="8" rx="4" fill={STEEL_D} transform="rotate(14 73 10)" />
            <path d="M84 8 96 2" stroke={STEEL_D} strokeWidth="4" strokeLinecap="round" />
            {[[64, 22], [72, 26], [80, 21], [68, 33], [77, 36], [84, 30]].map(([dx, dy]) => (
              <path key={`${dx}-${dy}`} transform={`translate(${dx} ${dy})`} d="M0-3.500Q3.500 0.500 0 3.500-3.500 0.500 0-3.500z" fill={WATER} />
            ))}
          </g>
        </>
      );
    case "style":
      return (
        <>
          <Person hair="quiff" />
          <g transform="translate(90 40) rotate(12)">
            <rect x="-26" y="-9" width="22" height="14" rx="6" fill={ORANGE} />
            <path d="M-26-9-33-12v20l7-3z" fill={DARK} />
            <rect x="-9" y="0" width="11" height="14" rx="4" fill={DARK} />
            <path d="M-38-5h-9M-38 0h-11M-38 5h-9" stroke={STEEL_D} strokeWidth="2" strokeLinecap="round" />
            <Hand />
          </g>
        </>
      );
    case "color":
      return (
        <>
          <Person
            hairFill={tint}
            front={
              /highlight/i.test(name) ? <path d="M36 21l-3 11M44 18l-2 14M52 20l1 12M59 24l3 9" stroke="#F5C518" strokeWidth="3" strokeLinecap="round" /> : <Sheen />
            }
          />
          <g transform="translate(88 50) rotate(28)">
            <rect x="-24" y="-2" width="22" height="4" rx="2" fill={DARK} />
            <rect x="-28" y="-4" width="5" height="8" fill={STEEL_D} />
            <path d="M-40-6h12v12h-12z" fill="#fff" />
            <path d="M-40-6h6v12h-6z" fill={tint} />
            <Hand />
          </g>
          <Star x={18} y={28} s={1.200} />
        </>
      );
    case "shine":
      return (
        <>
          <Person hair="quiff" front={<Sheen />} />
          <Star x={20} y={22} s={1.600} />
          <Star x={76} y={18} s={1.200} />
          <Star x={74} y={42} s={1} fill="#fff" />
        </>
      );
    case "facial":
      return (
        <>
          <Person
            hair="none"
            closed
            shirt="#fff"
            front={
              <g>
                <path d="M28 43C26 21 38 12 50 14c13 2 18 14 14 29-6-9-28-9-36 0z" fill="#fff" />
                <path d="M33 22q13-8 28 0" fill="none" stroke="#E4EAF6" strokeWidth="2.500" strokeLinecap="round" />
                <path d="M31 46c0 12 6 19 15 19s15-7 15-19c-4-3-9-3-15-3s-11 0-15 3z" fill={tint} />
                <circle cx="39" cy="45" r="5.500" fill={GREEN} /><circle cx="53" cy="45" r="5.500" fill={GREEN} />
                <circle cx="39" cy="45" r="3" fill="#BDE5C8" /><circle cx="53" cy="45" r="3" fill="#BDE5C8" />
                <path d="M40 60q6 3.500 12 0" fill="none" stroke={SKIN_D} strokeWidth="1.800" strokeLinecap="round" />
              </g>
            }
          />
          <path d="M16 80h64" stroke="#E4EAF6" strokeWidth="3" />
          <Star x={20} y={30} s={1.400} />
          <Star x={74} y={24} s={1.200} />
          {/hydra/i.test(name) && [[78, 50], [84, 60], [72, 62]].map(([dx, dy]) => <path key={`${dx}-${dy}`} transform={`translate(${dx} ${dy})`} d="M0-4Q4 1 0 4-4 1 0-4z" fill={WATER} />)}
        </>
      );
    case "treatment":
      return (
        <>
          <Person hair="quiff" front={<Sheen />} />
          <g transform="translate(70 6)">
            <rect x="-3" y="-2" width="6" height="8" rx="2" fill={DARK} />
            <rect x="-9" y="6" width="18" height="20" rx="5" fill={GOLD} />
            <rect x="-6" y="11" width="12" height="9" rx="2" fill="#fff" opacity=".7" />
            <g transform="translate(14 14)"><Hand /></g>
          </g>
          <path transform="translate(70 34)" d="M0-4Q4 1 0 4-4 1 0-4z" fill={GOLD} />
          <Star x={20} y={26} s={1.400} />
          <Star x={78} y={50} s={1} />
        </>
      );
    case "straight":
      return (
        <>
          <Person hair="long" />
          <g transform="translate(92 64)">
            <rect x="-40" y="-8" width="34" height="7" rx="3" fill={DARK} />
            <rect x="-40" y="1" width="34" height="7" rx="3" fill="#5A6280" />
            <rect x="-36" y="-6.500" width="22" height="2" rx="1" fill={STEEL} />
            <Hand />
          </g>
        </>
      );
    case "massage":
      return (
        <>
          <rect x="12" y="34" width="70" height="70" rx="16" fill={ORANGE_D} />
          <Person closed />
          <g>
            <rect x="-2" y="72" width="22" height="12" rx="6" fill={SHIRT_L} />
            <rect x="16" y="68" width="18" height="13" rx="6.500" fill={SKIN} transform="rotate(-18 25 75)" />
            <rect x="76" y="72" width="22" height="12" rx="6" fill={SHIRT_L} />
            <rect x="58" y="68" width="18" height="13" rx="6.500" fill={SKIN} transform="rotate(18 67 75)" />
          </g>
          <circle cx="80" cy="18" r="12" fill={GOLD} />
          <text x="80" y="23" textAnchor="middle" fontSize="13" fontWeight="700" fill={NAVY}>{name.match(/(\d+)/)?.[1] ?? "30"}</text>
        </>
      );
    case "package":
      return (
        <>
          <Person hair="quiff" beard stache shirt="#fff" front={<Sheen />} />
          <path d="M16 84h64" stroke="#E4EAF6" strokeWidth="3" />
          <g transform="translate(15 20) rotate(-20) scale(.8)">
            <g fill="none" strokeLinecap="round">
              <path d="M-4 2-24-3M-4-2-24 3" stroke={STEEL_D} strokeWidth="4" /><path d="M-4 2-24-3M-4-2-24 3" stroke={STEEL} strokeWidth="2" />
              <circle cx="3" cy="-6" r="4.500" stroke={GOLD} strokeWidth="3" /><circle cx="3" cy="6" r="4.500" stroke={GOLD} strokeWidth="3" />
            </g>
          </g>
          <g transform="translate(70 16) rotate(18)">
            <rect x="0" y="-4" width="24" height="8" rx="2.500" fill={GOLD} />
            {[3, 7, 11, 15, 19].map((x) => <rect key={x} x={x} y="3" width="2" height="6" rx="1" fill={DARK} />)}
          </g>
          <Star x={50} y={8} s={1.200} />
        </>
      );
  }
}

/** Flat head-and-shoulders illustration matched to the service name. Parents supply the tinted tile behind it. */
export function ServiceArt({ name, size = 72, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true" className={className}>
      {art(serviceKind(name), name)}
    </svg>
  );
}
