import { useId } from "react";

const NAVY = "#0B1F4B";
const GOLD = "#F5C518";

/**
 * Shop mark: a navy badge with a gold double ring and crossed scissors.
 * From 80px up the shop name runs around the ring: NIR SMART on top, GENTS PARLOUR below.
 */
export function Logo({ size = 40, className = "", detail }: { size?: number; className?: string; detail?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const full = detail ?? size >= 80;
  const font = { fontFamily: "var(--font-display-latin), var(--font-latin), Arial, sans-serif" };
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="NIR SMART GENTS PARLOUR" className={className}>
      <circle cx="100" cy="100" r="98" fill={NAVY} />
      <circle cx="100" cy="100" r={full ? 92 : 88} fill="none" stroke={GOLD} strokeWidth={full ? 2.5 : 5} />
      {full && (
        <>
          <circle cx="100" cy="100" r="63" fill="none" stroke={GOLD} strokeWidth="1.5" strokeOpacity=".8" />
          <defs>
            <path id={`${uid}t`} d="M27 100A73 73 0 0 1 173 100" />
            <path id={`${uid}b`} d="M15 100A85 85 0 0 0 185 100" />
          </defs>
          <text fontSize="13" fontWeight="700" letterSpacing="3.2" fill="#fff" textAnchor="middle" style={font}>
            <textPath href={`#${uid}t`} startOffset="50%">NIR SMART</textPath>
          </text>
          <text fontSize="13" fontWeight="700" letterSpacing="3.2" fill={GOLD} textAnchor="middle" style={font}>
            <textPath href={`#${uid}b`} startOffset="50%">GENTS PARLOUR</textPath>
          </text>
          <path d="M22 100l4-4 4 4-4 4zM170 100l4-4 4 4-4 4z" fill={GOLD} />
        </>
      )}
      <g transform={full ? "translate(100 103)" : "translate(100 106) scale(1.55)"} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-16 20 14-34M16 20-14-34" stroke="#fff" strokeWidth="5.500" />
        <circle cx="-19" cy="31" r="9.500" stroke={GOLD} strokeWidth="5" />
        <circle cx="19" cy="31" r="9.500" stroke={GOLD} strokeWidth="5" />
        <circle cx="0" cy="-9" r="3.200" fill={GOLD} stroke="none" />
        {full && <path d="M0-52 2-46 8-44 2-42 0-36-2-42-8-44-2-46z" fill={GOLD} stroke="none" />}
      </g>
    </svg>
  );
}
