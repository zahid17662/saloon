const GOLD = "#E0A526";
const SLATE = "#232B3B";

/**
 * Shop emblem, redrawn as vector from the signboard logo: bearded profile in a ring, barber poles on the
 * sides, scissors on top, "BARBER SHOP" ribbon above and the shop name below. Gold on dark slate.
 * With `detail={false}` (small sizes) only the profile in the ring is drawn.
 */
export function Logo({ size = 40, className = "", detail }: { size?: number; className?: string; detail?: boolean }) {
  const full = detail ?? size >= 96;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="NIR SMART GENTS PARLOUR" className={className}>
      <defs>
        <path id="logoTop" d="M46 76A60 60 0 0 1 154 76" />
        <path id="logoBottom" d="M38 124A66 66 0 0 0 162 124" />
      </defs>
      <circle cx="100" cy="100" r="98" fill={SLATE} />
      <circle cx="100" cy="100" r="94" fill="none" stroke={GOLD} strokeOpacity=".5" strokeWidth="1.5" />

      {full && (
        <>
          {/* scissors */}
          <g stroke={GOLD} strokeWidth="2.600" strokeLinecap="round" fill="none">
            <path d="M94 10l12 18M106 10 94 28" />
            <circle cx="92" cy="31" r="3.500" />
            <circle cx="108" cy="31" r="3.500" />
          </g>
          {/* flourishes */}
          <g stroke={GOLD} strokeWidth="2.200" strokeLinecap="round" fill="none">
            <path d="M84 30c-8-8-22-8-28 2-4 7 2 13 8 11-4-3-2-8 3-8M116 30c8-8 22-8 28 2 4 7-2 13-8 11 4-3 2-8-3-8" />
          </g>
          {/* ribbons */}
          <path d="M40 80A66 66 0 0 1 160 80l-6 12A56 56 0 0 0 46 92z" fill="none" stroke={GOLD} strokeWidth="2" />
          <text fontSize="11" fontWeight="600" letterSpacing="3" fill={GOLD} style={{ fontFamily: "var(--font-latin), sans-serif" }}>
            <textPath xlinkHref="#logoTop" startOffset="50%" textAnchor="middle">BARBER SHOP</textPath>
          </text>
          <text fontSize="8.500" fontWeight="600" letterSpacing="1.500" fill={GOLD} style={{ fontFamily: "var(--font-latin), sans-serif" }}>
            <textPath xlinkHref="#logoBottom" startOffset="50%" textAnchor="middle">NIR SMART GENTS PARLOUR</textPath>
          </text>
          {/* barber poles */}
          {[22, 168].map((x) => (
            <g key={x}>
              <rect x={x} y="86" width="10" height="40" rx="5" fill="none" stroke={GOLD} strokeWidth="2" />
              {[94, 102, 110, 118].map((y) => <path key={y} d={`M${x} ${y + 6}l10-6`} stroke={GOLD} strokeWidth="2.500" />)}
            </g>
          ))}
        </>
      )}

      {/* bearded profile, facing right */}
      <g transform={full ? "translate(0 4) scale(.92) translate(8 6)" : "translate(-2 -8) scale(1.12)"}>
        <path
          d="M72 112C66 92 70 68 92 60c18-8 36 0 38 12 2 8-4 14-4 16l8 12-7 4 1 6c2 10-4 24-16 32-8 4-16-2-18-10l-2 20H72z"
          fill={GOLD}
          transform={full ? "" : "translate(0 0)"}
        />
        <path d="M84 82c8-14 24-18 38-12M96 118c8 6 18 4 28-2" fill="none" stroke={SLATE} strokeWidth="2.600" strokeLinecap="round" />
        <ellipse cx="116" cy="92" rx="2.800" ry="2" fill={SLATE} />
        <path d="M114 106c3 2 7 2 10 0" fill="none" stroke={SLATE} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
