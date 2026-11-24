export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <g fill="none" stroke="#1E8E4E" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 30 32 10l24 20" strokeWidth="5" />
        <path d="M44 17v-6h6v12" strokeWidth="4" />
        <rect x="26" y="19" width="8" height="8" strokeWidth="2.4" />
        <path d="M12 38c6 14 34 14 40 0" strokeWidth="6" />
      </g>
      <circle cx="32" cy="36" r="4.5" fill="#1E8E4E" />
    </svg>
  );
}
