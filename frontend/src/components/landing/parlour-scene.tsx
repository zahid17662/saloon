import { useId } from "react";

const NAVY = "#0B1F4B";
const GOLD = "#F5C518";
const SKIN = "#E8B48A";
const HAIR = "#1F1A1A";
const WALL = "#F7F1DC";
const FLOOR = "#E4DABB";
const GREEN = "#5E9C7A";
const LEATHER = "#3A5CAB";

function Chair({ cx }: { cx: number }) {
  return (
    <g>
      <ellipse cx={cx} cy="327" rx="34" ry="6" fill={NAVY} opacity=".12" />
      <ellipse cx={cx} cy="322" rx="24" ry="5.500" fill={NAVY} />
      <rect x={cx - 4} y="296" width="8" height="27" fill="#9AA6C0" />
      <path d={`M${cx + 12} 300l24 18h-30z`} fill={GOLD} stroke={NAVY} strokeWidth="2" strokeLinejoin="round" />
      <rect x={cx - 28} y="270" width="56" height="28" rx="11" fill={LEATHER} stroke={NAVY} strokeWidth="2" />
      <rect x={cx - 24} y="212" width="48" height="66" rx="15" fill={LEATHER} stroke={NAVY} strokeWidth="2" />
      <rect x={cx - 14} y="198" width="28" height="18" rx="8" fill={LEATHER} stroke={NAVY} strokeWidth="2" />
      <rect x={cx - 34} y="262" width="14" height="7" rx="3.500" fill={GOLD} />
      <rect x={cx - 17} y="224" width="34" height="3" rx="1.500" fill={GOLD} opacity=".75" />
    </g>
  );
}

/** Original flat illustration of the parlour floor for the home hero: arched mirrors, pendant lamps,
 *  a chair being worked on, an empty chair and a waiting bench. Navy + gold + ivory only. */
export function ParlourScene({ className = "" }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 400 340" className={className} role="img" aria-label="NIR SMART GENTS PARLOUR-এর ভেতরের ছবি">
      <defs>
        <pattern id={`${uid}f`} width="44" height="24" patternUnits="userSpaceOnUse">
          <path d="M22 0l22 12-22 12L0 12z" fill={NAVY} opacity=".06" />
        </pattern>
      </defs>

      {/* wall + floor */}
      <rect width="400" height="340" fill={WALL} />
      <rect y="252" width="400" height="88" fill={FLOOR} />
      <rect y="252" width="400" height="88" fill={`url(#${uid}f)`} />
      <rect y="248" width="400" height="6" fill={NAVY} />

      {/* pendant lamps */}
      {[98, 200, 302].map((x) => (
        <g key={x}>
          <circle cx={x} cy="42" r="30" fill={GOLD} opacity=".18" />
          <path d={`M${x} 0v20`} stroke={NAVY} strokeWidth="1.500" />
          <path d={`M${x - 16} 36a16 16 0 0 1 32 0z`} fill={GOLD} stroke={NAVY} strokeWidth="1.500" />
          <circle cx={x} cy="39" r="3.500" fill="#fff" />
        </g>
      ))}

      {/* arched mirrors */}
      {[48, 252].map((x) => (
        <g key={x}>
          <path d={`M${x} 190V94a50 50 0 0 1 100 0v96z`} fill="#CFE0F5" stroke={GOLD} strokeWidth="6" strokeLinejoin="round" />
          <path d={`M${x + 14} 184l22 0 34-84-22 0z`} fill="#fff" opacity=".45" />
          <path d={`M${x + 52} 184l9 0 30-76-9 0z`} fill="#fff" opacity=".3" />
        </g>
      ))}

      {/* clock */}
      <circle cx="200" cy="96" r="22" fill="#fff" stroke={NAVY} strokeWidth="4" />
      {[0, 90, 180, 270].map((a) => (
        <rect key={a} x="198.500" y="78" width="3" height="5" rx="1" fill={GOLD} transform={`rotate(${a} 200 96)`} />
      ))}
      <path d="M200 96V84M200 96l8 5" stroke={NAVY} strokeWidth="2.500" strokeLinecap="round" />

      {/* counter + shelf items */}
      <rect x="0" y="196" width="400" height="52" fill={NAVY} />
      <rect x="0" y="193" width="400" height="5" fill={GOLD} />
      <path d="M40 206v34M120 206v34M200 206v34M280 206v34M360 206v34" stroke="#fff" strokeOpacity=".12" strokeWidth="2" />
      <rect x="14" y="166" width="11" height="27" rx="2.500" fill={NAVY} />
      <rect x="15.500" y="161" width="8" height="6" rx="1.500" fill={GOLD} />
      <rect x="30" y="173" width="10" height="20" rx="2.500" fill="#fff" stroke={NAVY} strokeWidth="1.500" />
      <rect x="168" y="177" width="16" height="16" rx="3" fill="#CFE0F5" stroke={NAVY} strokeWidth="1.500" />
      <path d="M172 177l-1-9M176 177v-11M180 177l2-9" stroke={NAVY} strokeWidth="1.500" strokeLinecap="round" />
      <rect x="216" y="182" width="28" height="11" rx="2" fill="#fff" stroke={NAVY} strokeWidth="1.200" />
      <rect x="218" y="174" width="24" height="9" rx="2" fill={GOLD} />
      <rect x="372" y="168" width="11" height="25" rx="2.500" fill={GOLD} stroke={NAVY} strokeWidth="1.500" />

      {/* plant */}
      <rect x="6" y="300" width="30" height="24" rx="4" fill={GOLD} />
      <ellipse cx="14" cy="288" rx="6" ry="16" fill={GREEN} transform="rotate(-24 14 288)" />
      <ellipse cx="22" cy="284" rx="6" ry="18" fill="#6FAE8B" />
      <ellipse cx="30" cy="289" rx="6" ry="15" fill="#4F8D6C" transform="rotate(24 30 289)" />

      {/* chair with customer and barber */}
      <Chair cx={112} />
      <path d="M86 212h52l7 74H79z" fill={GOLD} />
      <path d="M96 218l-2 66M112 216v68M128 218l2 66" stroke={NAVY} strokeOpacity=".12" strokeWidth="2" />
      <circle cx="112" cy="194" r="14" fill={SKIN} />
      <path d="M98 192a14 14 0 0 1 28 0c-7-6-21-6-28 0z" fill={HAIR} />
      <path d="M105 197h4M115 197h4" stroke={HAIR} strokeWidth="1.800" strokeLinecap="round" />
      <path d="M106 203q6 4 12 0" fill="none" stroke="#A8593D" strokeWidth="1.600" strokeLinecap="round" />
      <rect x="99" y="286" width="12" height="36" rx="5" fill="#1C2A52" />
      <rect x="114" y="286" width="12" height="36" rx="5" fill="#1C2A52" />
      <ellipse cx="105" cy="324" rx="9" ry="4" fill={HAIR} />
      <ellipse cx="120" cy="324" rx="9" ry="4" fill={HAIR} />
      {/* barber */}
      <rect x="160" y="284" width="11" height="40" rx="5" fill="#1C2A52" />
      <rect x="174" y="284" width="11" height="40" rx="5" fill="#1C2A52" />
      <ellipse cx="165" cy="325" rx="9" ry="4" fill={HAIR} />
      <ellipse cx="180" cy="325" rx="9" ry="4" fill={HAIR} />
      <rect x="154" y="222" width="36" height="68" rx="13" fill="#fff" stroke={NAVY} strokeOpacity=".15" />
      <path d="M160 232h24l3 58h-30z" fill={NAVY} />
      <path d="M168 224l4 10 4-10z" fill={GOLD} />
      <circle cx="172" cy="206" r="13" fill={SKIN} />
      <path d="M159 204a13 13 0 0 1 26 0c-7-5-19-5-26 0z" fill={HAIR} />
      <path d="M166 212q6 3 12 0" fill="none" stroke={HAIR} strokeWidth="2.200" strokeLinecap="round" />
      <path d="M159 236l-26-20" stroke="#fff" strokeWidth="11" strokeLinecap="round" />
      <path d="M135 218l-8-8" stroke={SKIN} strokeWidth="6" strokeLinecap="round" />
      <path d="M126 206l-5-6M126 206l-8-1" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />

      {/* empty chair */}
      <Chair cx={262} />
      <path d="M247 228h30l2 24h-34z" fill="#fff" />
      <path d="M247 236h32" stroke={GOLD} strokeWidth="3" />

      {/* waiting bench + customer */}
      <rect x="326" y="290" width="68" height="9" rx="4.500" fill={GOLD} stroke={NAVY} strokeWidth="1.500" />
      <rect x="332" y="299" width="5" height="24" fill={NAVY} />
      <rect x="384" y="299" width="5" height="24" fill={NAVY} />
      <rect x="342" y="256" width="30" height="38" rx="12" fill={NAVY} />
      <rect x="352" y="283" width="40" height="11" rx="5" fill="#2A3F7A" />
      <rect x="383" y="286" width="10" height="36" rx="5" fill="#2A3F7A" />
      <ellipse cx="388" cy="325" rx="10" ry="4" fill={HAIR} />
      <circle cx="358" cy="246" r="12" fill={SKIN} />
      <path d="M346 244a12 12 0 0 1 24 0c-6-5-18-5-24 0z" fill={HAIR} />
      <rect x="364" y="268" width="14" height="22" rx="3" fill="#fff" stroke={NAVY} strokeWidth="1.500" transform="rotate(-14 371 279)" />
    </svg>
  );
}
