const INK = "#0B0F1A";
const BLUE = "#5479F5";
const SKY = "#9AB5FF";

function Scissors() {
  return (
    <g fill="none" strokeLinecap="round">
      <path d="M78 134 122 52M122 134 78 52" stroke="#fff" strokeWidth="7" />
      <circle cx="72" cy="146" r="14" stroke={BLUE} strokeWidth="7" />
      <circle cx="128" cy="146" r="14" stroke={BLUE} strokeWidth="7" />
      <circle cx="100" cy="93" r="4.500" fill={INK} stroke="none" />
    </g>
  );
}

/**
 * Shop mark: crossed scissors on an ink badge. At 96px and up it adds the NIR wordmark and the full name.
 * Plain geometry only, so it stays crisp from favicon size to a signboard.
 */
export function Logo({ size = 40, className = "", detail }: { size?: number; className?: string; detail?: boolean }) {
  const full = detail ?? size >= 96;
  const font = { fontFamily: "var(--font-latin), Arial, sans-serif" };
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="NIR SMART GENTS PARLOUR" className={className}>
      <circle cx="100" cy="100" r="100" fill={INK} />
      <circle cx="100" cy="100" r="93" fill="none" stroke={SKY} strokeOpacity=".45" strokeWidth="2" />
      {full ? (
        <>
          <g transform="translate(40 14) scale(.6)"><Scissors /></g>
          <text x="100" y="140" textAnchor="middle" fontSize="40" fontWeight="700" letterSpacing="6" fill="#fff" style={font}>NIR</text>
          <path d="M62 150h76" stroke={BLUE} strokeWidth="2.500" strokeLinecap="round" />
          <text x="100" y="168" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="1" fill={SKY} style={font}>SMART GENTS PARLOUR</text>
        </>
      ) : (
        <g transform="translate(24 20) scale(.76)"><Scissors /></g>
      )}
    </svg>
  );
}
