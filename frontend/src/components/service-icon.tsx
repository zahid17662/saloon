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

/** Fist, wrist, white cuff and navy sleeve coming in from the right. Tools are drawn towards -x from the origin. */
function Hand() {
  return (
    <g>
      <rect x="12" y="-6.500" width="18" height="13" fill={SKIN} />
      <rect x="28" y="-9" width="6" height="18" rx="1" fill="#fff" />
      <rect x="33" y="-8.500" width="30" height="17" rx="3" fill={NAVY} />
      <rect x="-8" y="-8.500" width="25" height="17" rx="8" fill={SKIN} />
      <path d="M-4-3.500h9M-4 .5h9M-4 4.500h7" stroke={SKIN_D} strokeWidth="1.500" strokeLinecap="round" />
    </g>
  );
}

/** Open scissors, rings at the right, tips towards -x. */
function Scissors({ s = 1 }: { s?: number }) {
  return (
    <g transform={`scale(${s})`} strokeLinejoin="round" strokeLinecap="round">
      <path d="M-5-1-36-14l1.500 4L-3 2z" fill={STEEL} stroke={STEEL_D} strokeWidth="1.200" />
      <path d="M-5 1-36 14l1.500-4L-3-2z" fill={STEEL} stroke={STEEL_D} strokeWidth="1.200" />
      <path d="M-4-1 3-7M-4 1 3 7" stroke={GOLD} strokeWidth="4.500" />
      <circle cx="5" cy="-9" r="6.500" fill="none" stroke={GOLD} strokeWidth="4.500" />
      <circle cx="5" cy="9" r="6.500" fill="none" stroke={GOLD} strokeWidth="4.500" />
      <circle cx="-5" cy="0" r="2.200" fill={DARK} />
    </g>
  );
}

function Comb({ w = 30 }: { w?: number }) {
  const teeth = Array.from({ length: Math.floor(w / 4) }, (_, i) => -w + 3 + i * 4);
  return (
    <g>
      <rect x={-w} y="-4" width={w} height="8" rx="2.500" fill={GOLD} />
      {teeth.map((x) => <rect key={x} x={x} y="3" width="2.200" height="8" rx="1.100" fill={GOLD} />)}
    </g>
  );
}

/** Dark hair clippings falling away from the cut. */
function Flecks({ at }: { at: [number, number][] }) {
  return (
    <g fill={HAIR}>
      {at.map(([x, y], i) => <rect key={i} x={x} y={y} width="6" height="2.600" rx="1.300" transform={`rotate(${(i * 47) % 70 - 25} ${x + 3} ${y + 1})`} />)}
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

/** Friendly head and shoulders in flat colour, no outlines: navy jacket, gold collar, white shirt, a real smile. */
function Person({ hair = "short", hairFill = HAIR, beard, stache, closed, shirt = NAVY, behind, front }: PersonProps) {
  const jacket = shirt === "#fff";
  return (
    <g>
      {behind}
      {hair === "long" && <path d="M25 52C17 24 33 11 48 11c16 0 27 13 22 41l4 34H21z" fill={hairFill} />}
      <rect x="39" y="58" width="14" height="20" fill={SKIN_D} />
      <path d="M4 96C4 79 22 71 46 71s42 8 42 25z" fill={shirt} />
      {!jacket && (
        <>
          <path d="M33 74.500l5-3 8 14-4.500 3z" fill={GOLD} />
          <path d="M59 74.500 54 71.500 46 85.500l4.500 3z" fill={GOLD} />
          <circle cx="72" cy="84" r="2" fill={ORANGE} />
        </>
      )}
      <path d="M38 72l8 13 8-13z" fill={jacket ? SKIN : "#fff"} />
      {!jacket && <path d="M38.500 72 46 82l7.500-10z" fill={SKIN} />}
      <circle cx="28.500" cy="48" r="4.500" fill={SKIN_D} />
      <circle cx="63.500" cy="48" r="4.500" fill={SKIN_D} />
      <ellipse cx="46" cy="46" rx="17" ry="20" fill={SKIN} />
      {hair === "short" && <path d="M28 47C23 27 32 13 48 13c15 0 23 14 17 34-1-8-4-13-8.500-16-8 3-17 3.500-25 5-2 3-3 7-3.500 11z" fill={hairFill} />}
      {hair === "quiff" && (
        <>
          <path d="M27 47C17 28 26 7 46 8c17-3 31 15 19 39-1-8-4-14-9-17-8 3-17 3-25 5-2 3-3 7-4 12z" fill={hairFill} />
          <path d="M35 17q11-8 23-2" fill="none" stroke={hairFill === HAIR ? GOLD : "#fff"} strokeOpacity={hairFill === HAIR ? 1 : 0.6} strokeWidth="3.200" strokeLinecap="round" />
        </>
      )}
      {hair === "long" && (
        <>
          <path d="M28 47C23 27 32 13 48 13c15 0 23 14 17 34-1-8-4-13-8.500-16-8 3-17 3.500-25 5-2 3-3 7-3.500 11z" fill={hairFill} />
          <path d="M26 46 22 84h12l2-36zM66 46l4 38H58l-2-36z" fill={hairFill} />
        </>
      )}
      {beard && <path d="M29 48c0 16 7 25 17 25s17-9 17-25c-3 8-9 11-17 11s-14-3-17-11z" fill={hairFill} />}
      {stache === true && <path d="M46 55c-3-4-10-4-14 0 4 5 10 4 14 1 4 3 10 4 14-1-4-4-11-4-14 0z" fill={hairFill} />}
      {stache === "big" && <path d="M46 54c-4-5-12-5-16 1-2 3 1 6 4 4 4-2 8-2 12-1 4-1 8-1 12 1 3 2 6-1 4-4-4-6-12-6-16-1z" fill={hairFill} />}
      {closed ? (
        <>
          <path d="M34.500 45q4.500 3.500 9 0M48.500 45q4.500 3.500 9 0" fill="none" stroke={HAIR} strokeWidth="2.200" strokeLinecap="round" />
          <path d="M40 60q6 4.500 12 0" fill="none" stroke={beard ? SKIN : HAIR} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="39" cy="45" rx="2.300" ry="2.800" fill={HAIR} />
          <ellipse cx="53" cy="45" rx="2.300" ry="2.800" fill={HAIR} />
          <circle cx="39.800" cy="44" r=".8" fill="#fff" />
          <circle cx="53.800" cy="44" r=".8" fill="#fff" />
          <path d="M34 39q4.500-2.500 9 0M49 39q4.500-2.500 9 0" fill="none" stroke={HAIR} strokeWidth="2.200" strokeLinecap="round" />
          <path d="M39 59.500q7 8.500 14 0z" fill="#fff" stroke={beard ? HAIR : HAIR} strokeWidth="1.600" strokeLinejoin="round" />
        </>
      )}
      <path d="M46 47q-3.500 6 1.500 7.500" fill="none" stroke={SKIN_D} strokeWidth="1.600" strokeLinecap="round" />
      <circle cx="34" cy="53" r="3" fill={ORANGE} opacity=".22" />
      <circle cx="58" cy="53" r="3" fill={ORANGE} opacity=".22" />
      {front}
    </g>
  );
}

const Sheen = () => <path d="M34 24q11-7 25-2" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" />;

function art(kind: Kind, name: string): ReactNode {
  const tint = tintFor(name);
  switch (kind) {
    case "cut":
      return (
        <>
          <Person />
          <Flecks at={[[70, 62], [78, 70], [72, 80], [82, 58]]} />
          <g transform="translate(82 36) rotate(32)">
            <Scissors s={0.85} />
            <Hand />
          </g>
          <Star x={14} y={26} s={1.300} />
        </>
      );
    case "clipper":
      return (
        <>
          <Person />
          <Flecks at={[[68, 66], [77, 60], [74, 78], [83, 70]]} />
          <g transform="translate(83 40) rotate(28)">
            <g transform="scale(.82)">
            <rect x="-36" y="-11" width="32" height="22" rx="7" fill={DARK} />
            <rect x="-30" y="-6" width="12" height="7" rx="3.500" fill="#5A6280" />
            <rect x="-45" y="-10" width="10" height="20" rx="1.500" fill={STEEL} />
            {[-43, -40, -37].map((x) => <path key={x} d={`M${x}-10v20`} stroke={STEEL_D} strokeWidth="1.400" />)}
            <circle cx="-10" cy="4" r="2.400" fill={RED} />
            </g>
            <Hand />
          </g>
          <Star x={14} y={26} s={1.300} />
        </>
      );
    case "beard":
      return (
        <>
          <Person beard stache />
          <Flecks at={[[66, 78], [74, 72], [70, 86], [80, 80]]} />
          <g transform="translate(80 68) rotate(-10)">
            <rect x="-30" y="-8" width="28" height="16" rx="6" fill={DARK} />
            <rect x="-27" y="-2" width="14" height="4" rx="2" fill={GOLD} />
            <rect x="-39" y="-7" width="10" height="14" rx="1.500" fill={STEEL} />
            {[-37, -34, -31].map((x) => <path key={x} d={`M${x}-7v14`} stroke={STEEL_D} strokeWidth="1.400" />)}
            <Hand />
          </g>
          <Star x={14} y={28} s={1.300} />
        </>
      );
    case "mustache":
      return (
        <>
          <Person stache="big" />
          <Flecks at={[[68, 70], [76, 76], [72, 86]]} />
          <g transform="translate(82 62) rotate(-6)">
            <Scissors s={0.95} />
            <Hand />
          </g>
          <g transform="translate(26 80) rotate(-12)"><Comb w={22} /></g>
          <Star x={14} y={28} s={1.300} />
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
            <rect x="58" y="5" width="28" height="9" rx="4.500" fill={STEEL_D} transform="rotate(14 72 10)" />
            <path d="M84 8 96 2" stroke={STEEL_D} strokeWidth="4.500" strokeLinecap="round" />
            {[[64, 22], [72, 26], [80, 21], [68, 33], [77, 36], [84, 30]].map(([dx, dy]) => (
              <path key={`${dx}-${dy}`} transform={`translate(${dx} ${dy})`} d="M0-4Q4 .5 0 4-4 .5 0-4z" fill={WATER} />
            ))}
          </g>
        </>
      );
    case "style":
      return (
        <>
          <Person hair="quiff" />
          <g transform="translate(84 36) rotate(14)">
            <rect x="-30" y="-12" width="26" height="17" rx="7" fill={ORANGE} />
            <path d="M-30-12-39-16v26l9-4z" fill={DARK} />
            <rect x="-10" y="0" width="13" height="16" rx="4.500" fill={DARK} />
            <path d="M-44-7h-12M-44 0h-15M-44 7h-12" stroke={STEEL_D} strokeWidth="2.400" strokeLinecap="round" />
            <Hand />
          </g>
          <Star x={14} y={34} s={1.300} />
        </>
      );
    case "color":
      return (
        <>
          <Person
            hairFill={tint}
            front={
              /highlight/i.test(name) ? <path d="M36 20l-3 12M44 16l-2 15M52 18l1 13M59 23l3 10" stroke="#F5C518" strokeWidth="3.200" strokeLinecap="round" /> : <Sheen />
            }
          />
          <g transform="translate(82 46) rotate(30)">
            <rect x="-28" y="-2.500" width="26" height="5" rx="2.500" fill={DARK} />
            <rect x="-33" y="-5" width="6" height="10" fill={STEEL_D} />
            <path d="M-48-7h15v14h-15z" fill="#fff" />
            <path d="M-48-7h8v14h-8z" fill={tint} />
            <Hand />
          </g>
          <g transform="translate(18 78)">
            <ellipse cx="0" cy="6" rx="14" ry="6" fill={STEEL_D} />
            <path d="M-14 6c0-12 28-12 28 0z" fill={tint} />
            <ellipse cx="0" cy="6" rx="14" ry="6" fill="none" stroke={STEEL} strokeWidth="2" />
          </g>
        </>
      );
    case "shine":
      return (
        <>
          <Person hair="quiff" front={<Sheen />} />
          <Star x={17} y={20} s={1.800} />
          <Star x={77} y={16} s={1.400} />
          <Star x={76} y={44} s={1.100} fill="#fff" />
          <Star x={14} y={50} s={1} fill="#fff" />
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
                <circle cx="39" cy="45" r="6" fill={GREEN} /><circle cx="53" cy="45" r="6" fill={GREEN} />
                <circle cx="39" cy="45" r="3.200" fill="#BDE5C8" /><circle cx="53" cy="45" r="3.200" fill="#BDE5C8" />
                <path d="M40 60q6 3.500 12 0" fill="none" stroke={SKIN_D} strokeWidth="1.800" strokeLinecap="round" />
              </g>
            }
          />
          <path d="M16 80h64" stroke="#E4EAF6" strokeWidth="3" />
          <Star x={17} y={30} s={1.500} />
          <Star x={76} y={22} s={1.300} />
          {/hydra/i.test(name) && [[78, 50], [84, 60], [72, 62]].map(([dx, dy]) => <path key={`${dx}-${dy}`} transform={`translate(${dx} ${dy})`} d="M0-4Q4 1 0 4-4 1 0-4z" fill={WATER} />)}
        </>
      );
    case "treatment":
      return (
        <>
          <Person hair="quiff" front={<Sheen />} />
          <g transform="translate(68 4)">
            <rect x="-3.500" y="-3" width="7" height="9" rx="2" fill={DARK} />
            <rect x="-10" y="6" width="20" height="24" rx="6" fill={GOLD} />
            <rect x="-6.500" y="12" width="13" height="10" rx="2" fill="#fff" opacity=".75" />
            <g transform="translate(13 16)"><Hand /></g>
          </g>
          <path transform="translate(68 40)" d="M0-5Q5 1 0 5-5 1 0-5z" fill={GOLD} />
          <path transform="translate(64 50)" d="M0-4Q4 .5 0 4-4 .5 0-4z" fill={GOLD} />
          <Star x={16} y={24} s={1.500} />
        </>
      );
    case "straight":
      return (
        <>
          <Person hair="long" />
          <g transform="translate(88 66)">
            <rect x="-46" y="-10" width="40" height="9" rx="4" fill={DARK} />
            <rect x="-46" y="1" width="40" height="9" rx="4" fill="#5A6280" />
            <rect x="-42" y="-8" width="26" height="2.600" rx="1.300" fill={STEEL} />
            <Hand />
          </g>
          <Star x={14} y={30} s={1.300} />
        </>
      );
    case "massage":
      return (
        <>
          <rect x="10" y="32" width="74" height="72" rx="18" fill={ORANGE_D} />
          <Person closed shirt="#fff" />
          <g>
            <rect x="-2" y="72" width="24" height="13" rx="6.500" fill={SHIRT_L} />
            <rect x="16" y="67" width="19" height="14" rx="7" fill={SKIN} transform="rotate(-18 25 74)" />
            <rect x="74" y="72" width="24" height="13" rx="6.500" fill={SHIRT_L} />
            <rect x="57" y="67" width="19" height="14" rx="7" fill={SKIN} transform="rotate(18 67 74)" />
          </g>
          <circle cx="80" cy="18" r="13" fill={GOLD} />
          <text x="80" y="23.500" textAnchor="middle" fontSize="14" fontWeight="700" fill={NAVY}>{name.match(/(\d+)/)?.[1] ?? "30"}</text>
        </>
      );
    case "package":
      return (
        <>
          <Person hair="quiff" beard stache shirt="#fff" front={<Sheen />} />
          <path d="M16 84h64" stroke="#E4EAF6" strokeWidth="3" />
          <g transform="translate(22 22) rotate(-24) scale(.7)"><Scissors /></g>
          <g transform="translate(88 20) rotate(14)"><Comb w={26} /></g>
          <Star x={50} y={6} s={1.300} />
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

const LOOKS: { bg: string; hair: PersonProps["hair"]; hairFill: string; beard?: boolean; stache?: boolean | "big"; shirt: string }[] = [
  { bg: "#DCE4F7", hair: "quiff", hairFill: HAIR, stache: true, shirt: NAVY },
  { bg: "#FBEFB5", hair: "short", hairFill: "#3A2A22", beard: true, stache: true, shirt: "#1E3F8F" },
  { bg: "#FCE3D2", hair: "short", hairFill: "#1B1B24", shirt: NAVY },
];

/** Round demo portrait of a Hairdresser. Three distinct looks, picked from the id, until a real photo is added. */
export function HairdresserPortrait({ id, size = 48, className = "" }: { id: number; size?: number; className?: string }) {
  const v = LOOKS[Math.abs(id) % LOOKS.length];
  return (
    <svg width={size} height={size} viewBox="6 4 80 80" aria-hidden="true" style={{ width: size, height: size }} className={`flex-none rounded-full ${className}`}>
      <rect x="0" y="0" width="100" height="100" fill={v.bg} />
      <Person hair={v.hair} hairFill={v.hairFill} beard={v.beard} stache={v.stache} shirt={v.shirt} />
    </svg>
  );
}
