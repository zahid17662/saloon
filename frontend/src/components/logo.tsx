const INK = "#0C5C45";
const BLUE = "#EF7722";

/**
 * Shop mark drawn in the site's line-art style: crossed scissors in a ring.
 * At 96px and up it adds the NIR wordmark and the full shop name.
 */
export function Logo({ size = 40, className = "", detail }: { size?: number; className?: string; detail?: boolean }) {
  const full = detail ?? size >= 96;
  const font = { fontFamily: "var(--font-latin), Arial, sans-serif" };
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="NIR SMART GENTS PARLOUR" className={className}>
      <circle cx="100" cy="100" r="95" fill="#fff" stroke={INK} strokeWidth="7" />
      <g transform={full ? "translate(60 16) scale(.46)" : "translate(26 24) scale(.72)"} fill="none" strokeLinecap="round">
        <path d="M74 128 126 46M126 128 74 46" stroke={INK} strokeWidth="9" />
        <circle cx="68" cy="142" r="15" stroke={BLUE} strokeWidth="9" />
        <circle cx="132" cy="142" r="15" stroke={BLUE} strokeWidth="9" />
        <circle cx="100" cy="88" r="5" fill={INK} stroke="none" />
      </g>
      {full && (
        <>
          <text x="100" y="142" textAnchor="middle" fontSize="38" fontWeight="700" letterSpacing="5" fill={INK} style={font}>NIR</text>
          <path d="M66 152h68" stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
          <text x="100" y="170" textAnchor="middle" fontSize="8" fontWeight="600" letterSpacing="0.600" fill="#B4601A" style={font}>SMART GENTS PARLOUR</text>
        </>
      )}
    </svg>
  );
}
