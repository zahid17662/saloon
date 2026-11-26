/**
 * Flat line-art scene drawn for this project: a barber with scissors behind a seated customer,
 * a round mirror and a tool shelf. Ink outlines, white fills, one blue, soft blue blobs.
 */
const INK = "#10332A";
const BLUE = "#0C5C45";
const SKY = "#9CC3AF";
const PALE = "#E4EFE9";
const DEEP = "#FBE3B0";
const GOLD = "#EF7722";

const line = { fill: "none", stroke: INK, strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const solid = { fill: "#fff", stroke: INK, strokeWidth: 3, strokeLinejoin: "round" } as const;

export function BarbershopScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label="সেলুনের দৃশ্য: আয়নার সামনে বসা কাস্টমার আর কাঁচি হাতে বারবার" className={className}>
      {/* soft background blobs */}
      <path d="M44 96C44 44 92 14 158 14c72 0 118 24 140 66 20 38 8 96-34 122-44 28-124 34-180 8C34 188 44 140 44 96z" fill={PALE} />
      <path d="M250 150c30-22 88-18 114 10 22 24 16 72-14 90-32 18-104 16-128-10-20-24-4-70 28-90z" fill={DEEP} />

      {/* tools above the mirror */}
      <g transform="translate(58 18)">
        <g transform="rotate(-16)" {...line} strokeWidth="2.600">
          <path d="M0 6 18 34M18 6 0 34" stroke={INK} />
          <circle cx="-2" cy="40" r="6" stroke={GOLD} strokeWidth="3.400" />
          <circle cx="20" cy="40" r="6" stroke={GOLD} strokeWidth="3.400" />
        </g>
        <g transform="translate(36 0)">
          <rect x="0" y="4" width="13" height="42" rx="2.500" fill={GOLD} />
          {[10, 17, 24, 31, 38].map((y) => <path key={y} d={`M4 ${y}h9`} stroke="#fff" strokeWidth="2.200" strokeLinecap="round" />)}
        </g>
        <g transform="translate(60 2)">
          <rect x="0" y="14" width="18" height="32" rx="4" {...solid} fill={SKY} />
          <path d="M5 14V6h10M15 6l6 4" {...line} strokeWidth="2.600" />
        </g>
      </g>

      {/* mirror */}
      <circle cx="132" cy="112" r="68" fill="#fff" stroke={INK} strokeWidth="3.500" />
      <path d="M96 84l26-22M108 96l16-14" stroke={SKY} strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* decorative marks */}
      <path d="M236 42c22-14 44-8 52 10" stroke={INK} strokeOpacity=".45" strokeWidth="2.400" strokeDasharray="5 7" strokeLinecap="round" fill="none" />
      <path d="M46 196l10 10M56 196l-10 10" stroke={INK} strokeWidth="2.400" strokeLinecap="round" />
      <circle cx="228" cy="26" r="4" fill={GOLD} />
      <circle cx="40" cy="146" r="4" fill={SKY} />

      {/* customer */}
      <path d="M112 258c0-54 18-86 58-86s58 32 58 86z" fill={BLUE} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M152 254c-4-34 1-56 11-68M194 254c4-32-1-54-9-66" stroke="#3E8F70" strokeWidth="3.500" strokeLinecap="round" fill="none" />
      <path d="M160 152h20v22h-20z" {...solid} />
      <ellipse cx="171" cy="130" rx="26" ry="30" {...solid} />
      <path d="M145 126c-4-28 10-40 28-40s30 12 26 40c-5-15-13-21-27-21s-23 6-27 21z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="147" cy="134" r="5" {...solid} strokeWidth="2.600" />
      <circle cx="183" cy="128" r="2.800" fill={INK} />
      <path d="M178 118q6-3 11 0" {...line} strokeWidth="2.400" />
      <path d="M193 128l6 10-6 2" {...line} strokeWidth="2.600" />
      <path d="M181 146q7 4 12-2" {...line} strokeWidth="2.600" />

      {/* barber: trousers, shirt, apron */}
      <path d="M270 258l2-90h56l6 90z" fill={INK} />
      <path d="M262 174c-2-50 10-78 38-78s40 28 38 78z" {...solid} />
      <path d="M286 106h28l3 22c14 6 21 17 21 31v99h-76v-99c0-14 7-25 21-31z" fill={INK} />
      <path d="M288 106l-14-8M312 106l14-8" {...line} />
      {/* arms: ink stroke outline with a white stroke on top */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M274 122c-22-14-50-26-78-34" stroke={INK} strokeWidth="24" />
        <path d="M330 132c-16 14-44 22-74 26" stroke={INK} strokeWidth="24" />
        <path d="M274 122c-22-14-50-26-78-34" stroke="#fff" strokeWidth="18" />
        <path d="M330 132c-16 14-44 22-74 26" stroke="#fff" strokeWidth="18" />
      </g>
      <circle cx="196" cy="88" r="11" {...solid} strokeWidth="2.800" />
      <circle cx="256" cy="158" r="11" {...solid} strokeWidth="2.800" />
      <g transform="translate(189 74)">
        <path d="M0 14 14 40M14 14 0 40" stroke={INK} strokeWidth="3.500" strokeLinecap="round" fill="none" />
        <circle cx="-1" cy="9" r="6" fill={GOLD} stroke={INK} strokeWidth="2.600" />
        <circle cx="15" cy="9" r="6" fill={GOLD} stroke={INK} strokeWidth="2.600" />
      </g>
      <g transform="translate(232 148) rotate(-16)">
        <rect x="0" y="0" width="30" height="11" rx="2.500" fill={GOLD} stroke={INK} strokeWidth="2.600" />
        {[6, 12, 18, 24].map((x) => <path key={x} d={`M${x} 3v5`} stroke={INK} strokeWidth="2.200" strokeLinecap="round" />)}
      </g>
      {/* head */}
      <path d="M292 72h18v26h-18z" {...solid} />
      <ellipse cx="300" cy="48" rx="21" ry="25" {...solid} />
      <path d="M279 46c-4-26 10-36 24-36s24 10 21 30c-6-12-14-16-25-16s-17 8-20 22z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M281 54c-2 12 4 22 14 22" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="290" cy="48" r="6.500" {...line} strokeWidth="2.400" />
      <path d="M296.500 46h8" {...line} strokeWidth="2.400" />
      <path d="M284 66q7 5 13 0" {...line} strokeWidth="2.400" />
    </svg>
  );
}
