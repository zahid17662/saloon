import { useId } from "react";

const NAVY = "#0B1F4B";
const GOLD = "#F5C518";
const SKIN = "#E8B48A";

/** Original flat illustration of the parlour's street front, used as the shop home header.
 *  Drawn bottom-anchored: the sky is the parent's background, the ground strip is part of the art. */
export function ShopScene({ className = "" }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const stripes = Array.from({ length: 19 }, (_, i) => i);
  return (
    <svg viewBox="0 0 390 210" className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${uid}p`}><rect x="112" y="126" width="12" height="48" rx="6" /></clipPath>
        <clipPath id={`${uid}w`}><rect x="200" y="134" width="96" height="48" rx="4" /></clipPath>
      </defs>

      {/* sun, birds, skyline */}
      <circle cx="78" cy="104" r="40" fill={GOLD} opacity=".28" />
      <circle cx="78" cy="104" r="25" fill={GOLD} opacity=".5" />
      <g fill="none" stroke={NAVY} strokeWidth="1.4" strokeLinecap="round" opacity=".32">
        <path d="M196 44q4-5 8 0q4-5 8 0" />
        <path d="M222 58q3-4 6 0q3-4 6 0" />
        <path d="M168 62q3-4 6 0q3-4 6 0" />
      </g>
      <g fill={NAVY} opacity=".07">
        <rect x="4" y="132" width="26" height="60" />
        <rect x="34" y="116" width="22" height="76" />
        <rect x="60" y="138" width="30" height="54" />
        <rect x="318" y="124" width="26" height="68" />
        <rect x="348" y="106" width="22" height="86" />
        <rect x="372" y="134" width="30" height="58" />
      </g>

      {/* ground */}
      <rect y="190" width="390" height="20" fill="#E4DABB" />
      <rect y="190" width="390" height="2.5" fill={NAVY} opacity=".14" />
      <rect x="150" y="199" width="26" height="3" rx="1.5" fill="#fff" opacity=".7" />
      <rect x="196" y="199" width="26" height="3" rx="1.5" fill="#fff" opacity=".7" />

      {/* trees */}
      <g>
        <rect x="46" y="150" width="5" height="42" fill="#8A6A4A" />
        <circle cx="48" cy="136" r="21" fill="#5E9C7A" />
        <circle cx="35" cy="148" r="14" fill="#6FAE8B" />
        <circle cx="62" cy="148" r="14" fill="#4F8D6C" />
        <rect x="334" y="152" width="5" height="40" fill="#8A6A4A" />
        <circle cx="337" cy="140" r="19" fill="#5E9C7A" />
        <circle cx="324" cy="151" r="13" fill="#6FAE8B" />
        <circle cx="350" cy="151" r="13" fill="#4F8D6C" />
      </g>

      {/* shop front */}
      <rect x="118" y="104" width="190" height="86" fill="#fff" />
      <rect x="118" y="104" width="190" height="86" fill="none" stroke={NAVY} strokeOpacity=".1" />
      <rect x="112" y="92" width="202" height="14" rx="2" fill={NAVY} />
      <rect x="112" y="104" width="202" height="2.5" fill={GOLD} />
      {/* sign */}
      <rect x="150" y="62" width="126" height="34" rx="6" fill={NAVY} />
      <rect x="153.500" y="65.500" width="119" height="27" rx="4" fill="none" stroke={GOLD} strokeWidth="1.2" />
      <text x="213" y="78.500" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="2.4" fill={GOLD} style={{ fontFamily: "var(--font-display-latin), var(--font-latin), Arial, sans-serif" }}>NIR SMART</text>
      <text x="213" y="88.500" textAnchor="middle" fontSize="6.500" fontWeight="600" letterSpacing="2.2" fill="#fff" style={{ fontFamily: "var(--font-display-latin), var(--font-latin), Arial, sans-serif" }}>GENTS PARLOUR</text>
      {/* awning */}
      {stripes.map((i) => (
        <g key={i}>
          <rect x={118 + i * 10} y="108" width="10" height="17" fill={i % 2 ? "#fff" : NAVY} />
          <path d={`M${118 + i * 10} 125a5 5 0 0 0 10 0z`} fill={i % 2 ? "#fff" : NAVY} />
        </g>
      ))}
      <rect x="118" y="106.500" width="190" height="3" fill={GOLD} />
      <path d="M118 133h190" stroke={NAVY} strokeOpacity=".08" strokeWidth="3" />

      {/* door */}
      <rect x="140" y="136" width="46" height="54" rx="2" fill={NAVY} />
      <rect x="145" y="141" width="36" height="44" rx="1.500" fill="#CFE0F5" />
      <path d="M145 175l36-26v-8h-12l-24 18z" fill="#fff" opacity=".35" />
      <circle cx="177" cy="166" r="2" fill={GOLD} />
      <rect x="153" y="150" width="20" height="10" rx="1.500" fill="#fff" stroke={GOLD} strokeWidth="1" />
      <text x="163" y="157.500" textAnchor="middle" fontSize="5.500" fontWeight="700" letterSpacing=".6" fill={NAVY} style={{ fontFamily: "var(--font-latin), Arial, sans-serif" }}>OPEN</text>

      {/* window with chair, mirror and a customer being served */}
      <rect x="200" y="134" width="96" height="48" rx="4" fill="#CFE0F5" />
      <g clipPath={`url(#${uid}w)`}>
        <rect x="208" y="140" width="28" height="38" rx="3" fill="#EAF3FF" stroke={NAVY} strokeWidth="1.500" />
        <path d="M212 174l16-24 4 0-16 24z" fill="#fff" opacity=".8" />
        {/* chair */}
        <rect x="252" y="150" width="9" height="22" rx="4" fill={NAVY} />
        <rect x="248" y="168" width="30" height="7" rx="3.500" fill={GOLD} />
        <rect x="261" y="175" width="4" height="10" fill={NAVY} />
        <rect x="252" y="184" width="22" height="3" rx="1.500" fill={NAVY} />
        {/* customer */}
        <circle cx="266" cy="152" r="6.500" fill={SKIN} />
        <path d="M259.500 151a6.500 6.500 0 0 1 13 0c-3-3-9-3-13 0z" fill="#1F1A1A" />
        <path d="M258 160h16l4 14h-24z" fill={GOLD} />
        {/* barber */}
        <circle cx="284" cy="146" r="6" fill={SKIN} />
        <path d="M278 145a6 6 0 0 1 12 0c-3-2.500-9-2.500-12 0z" fill="#1F1A1A" />
        <path d="M277 153h14l2 30h-18z" fill={NAVY} />
        <path d="M280 154l4 8 4-8z" fill="#fff" />
        <path d="M278 160l-6 6" stroke={SKIN} strokeWidth="3" strokeLinecap="round" />
        <path d="M270 164l5-3" stroke="#fff" strokeWidth="1.500" strokeLinecap="round" />
        {/* glare */}
        <path d="M232 134h14l-26 48h-14z" fill="#fff" opacity=".28" />
        <path d="M252 134h6l-26 48h-6z" fill="#fff" opacity=".2" />
      </g>
      <rect x="200" y="134" width="96" height="48" rx="4" fill="none" stroke={NAVY} strokeWidth="3" />
      <rect x="196" y="182" width="104" height="5" rx="2" fill={NAVY} />

      {/* barber pole */}
      <g>
        <rect x="112" y="126" width="12" height="48" rx="6" fill="#fff" />
        <g clipPath={`url(#${uid}p)`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M104 ${128 + i * 10}l28-12v5l-28 12z`} fill={i % 2 ? GOLD : NAVY} />
          ))}
        </g>
        <rect x="112" y="126" width="12" height="48" rx="6" fill="none" stroke={NAVY} strokeWidth="1.200" />
        <rect x="110" y="122" width="16" height="6" rx="3" fill={NAVY} />
        <rect x="110" y="172" width="16" height="6" rx="3" fill={NAVY} />
      </g>

      {/* planter + bench */}
      <rect x="302" y="176" width="14" height="14" rx="2" fill={NAVY} />
      <circle cx="309" cy="170" r="8" fill="#5E9C7A" />
      <circle cx="304" cy="174" r="5" fill="#6FAE8B" />
      <rect x="84" y="176" width="26" height="4" rx="2" fill="#8A6A4A" />
      <rect x="88" y="180" width="3" height="10" fill="#8A6A4A" />
      <rect x="103" y="180" width="3" height="10" fill="#8A6A4A" />
    </svg>
  );
}

/** Small side scenery for wide screens, so the header does not look empty beside the shop front. */
export function SideScenery({ flip = false, className = "" }: { flip?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden="true" focusable="false" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <rect x="55" y="70" width="6" height="80" fill="#8A6A4A" />
      <circle cx="58" cy="56" r="28" fill="#5E9C7A" />
      <circle cx="40" cy="72" r="18" fill="#6FAE8B" />
      <circle cx="78" cy="72" r="18" fill="#4F8D6C" />
      <rect x="100" y="90" width="3" height="60" fill={NAVY} />
      <circle cx="101.500" cy="88" r="6" fill={GOLD} />
    </svg>
  );
}
