/** Flat illustration of the shop: chair, mirror, counter with tools, shelf. Drawn for this project (no outlines, navy / periwinkle / coral / cream). */
const C = { ink: "#121F30", navy: "#243B7D", mid: "#4A5FAE", sky: "#8BAEDD", mist: "#BECFE9", top: "#6F97D0", coral: "#E0705F", coralDark: "#C04B44", cream: "#F5F4E8" };

export function BarbershopScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 240" role="img" aria-label="নীড় সেলুনের চেয়ার, আয়না ও সরঞ্জামের ছবি" className={className}>
      {/* back wall, window, floor */}
      <rect width="400" height="240" fill={C.mist} />
      <rect x="64" width="8" height="190" fill={C.sky} />
      <rect x="150" width="8" height="190" fill={C.sky} />
      <path d="M0 32c10-10 22-12 34-6 10-4 22-2 30 4H4z" fill={C.cream} />
      <path d="M168 66c8-8 20-10 30-4 8-2 14 0 18 4z" fill={C.cream} />
      <path d="M0 178 200 160V240H0z" fill={C.sky} />
      {/* right wall */}
      <rect x="196" width="204" height="240" fill={C.navy} />
      {/* mirror */}
      <rect x="222" y="14" width="118" height="104" fill={C.ink} />
      <rect x="228" y="20" width="106" height="92" fill={C.cream} />
      <rect x="236" y="62" width="26" height="40" fill={C.mist} />
      <rect x="270" y="74" width="22" height="30" fill={C.mist} />
      <path d="M304 52h30v60h-30z" fill="#E0A096" />
      <path d="M296 80h38v32h-38z" fill="#D9877B" />
      {/* shelf unit */}
      <rect x="352" width="48" height="150" fill={C.mid} />
      <rect x="358" y="6" width="42" height="40" fill={C.ink} />
      <rect x="358" y="52" width="42" height="40" fill={C.ink} />
      <rect x="358" y="98" width="42" height="46" fill={C.ink} />
      <rect x="364" y="22" width="9" height="22" rx="1" fill={C.top} />
      <rect x="378" y="14" width="14" height="30" rx="2" fill={C.mid} />
      <rect x="366" y="70" width="10" height="22" rx="2" fill={C.top} />
      <path d="M382 70l-3-12M386 70l1-14M390 70l5-10M394 70l5-8" stroke={C.mist} strokeWidth="2" />
      <rect x="380" y="70" width="14" height="22" rx="2" fill={C.sky} />
      {/* counter */}
      <path d="M180 172 400 142V240H180z" fill={C.ink} />
      <path d="M180 156 400 124v22L180 178z" fill={C.top} />
      <path d="M180 170 400 140v8L180 180z" fill={C.mid} />
      {/* tools on the counter */}
      <path d="M206 150l38-5 2 9-38 6z" fill={C.mid} />
      <path d="M240 145l8-1 1 4-8 1z" fill={C.ink} />
      <path d="M254 158l30-6M254 161l30-3" stroke={C.mid} strokeWidth="3" strokeLinecap="round" />
      <circle cx="256" cy="160" r="3.500" fill="none" stroke={C.mid} strokeWidth="2.500" />
      <path d="M288 156l24-4 1 5-24 4zM294 163l24-4 1 5-24 4z" fill={C.mid} />
      <rect x="326" y="112" width="22" height="40" rx="7" fill={C.mid} />
      <rect x="332" y="98" width="10" height="16" fill={C.mid} />
      <path d="M328 96h16l5 4-5 4h-16z" fill={C.mid} />
      <path d="M327 98l-7 10 3 3 6-9z" fill={C.coral} />
      <rect x="331" y="128" width="12" height="14" rx="2" fill={C.top} />
      {/* towel */}
      <path d="M366 128 400 124v70l-6 5-6-4-5 6-8-4-9 2z" fill={C.cream} />
      {/* chair */}
      <path d="M30 70 74 66l18 84-48 8z" fill={C.ink} />
      <path d="M28 48 68 46l4 22-40 2z" fill={C.coralDark} />
      <path d="M28 42h40l2 5-44 2z" fill={C.ink} />
      <path d="M50 152 132 146l2 20-78 10z" fill={C.coral} />
      <path d="M56 176l78-10 2 8-78 12z" fill={C.coralDark} />
      <path d="M82 118l52-6 2 12-54 8z" fill={C.coral} />
      <path d="M82 130l54-6 0 6-54 8z" fill={C.ink} />
      <path d="M92 186l12 28-14 4-12-32z" fill={C.mid} />
      <path d="M66 214l50 2 2 8-54-2z" fill={C.ink} />
    </svg>
  );
}
