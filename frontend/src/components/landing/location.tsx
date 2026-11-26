import { PhoneIcon, PinIcon } from "../icons";
import { bnDigits } from "@/lib/money";

/** Original line-art skyline: flats, a mosque and a mill chimney, the way Savar reads from the road. */
function Skyline() {
  const win = (x: number, y: number, cols: number, rows: number, gap = 14) =>
    Array.from({ length: cols * rows }, (_, i) => (
      <rect key={i} x={x + (i % cols) * gap} y={y + Math.floor(i / cols) * gap} width="6" height="8" rx="1" />
    ));
  return (
    <svg viewBox="0 0 1200 230" className="block h-auto w-full text-primary/35" role="img" aria-label="সাভারের আঁকা শহরচিত্র">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        {/* left low block */}
        <path d="M40 230V150h90v80" />
        <g strokeWidth="1.5">{win(56, 166, 4, 3)}</g>
        {/* tall tower */}
        <path d="M150 230V86h74v144" />
        <path d="M187 86V62" />
        <g strokeWidth="1.5">{win(163, 102, 3, 7)}</g>
        {/* stepped block */}
        <path d="M244 230V128h58v-26h54v128" />
        <g strokeWidth="1.5">{win(260, 144, 2, 5)}</g>
        <g strokeWidth="1.5">{win(316, 120, 2, 7)}</g>
        {/* mosque */}
        <path d="M400 230v-78h120v78" />
        <path d="M460 152c-34 0-46-24-46-38 0-26 22-40 46-40s46 14 46 40c0 14-12 38-46 38Z" />
        <path d="M460 74V54" />
        <path d="M404 152V94m112 58V94" />
        <path d="M404 94a8 8 0 0 1 16 0m80 0a8 8 0 0 1 16 0" />
        <path d="M446 230v-40a14 14 0 0 1 28 0v40" />
        {/* mid rise */}
        <path d="M540 230V110h80v120" />
        <g strokeWidth="1.5">{win(556, 126, 4, 6)}</g>
        {/* mill chimney */}
        <path d="M646 230V96h22v134" />
        <path d="M640 96h34" />
        <path d="M690 230v-74h86v74" />
        <g strokeWidth="1.5">{win(706, 172, 4, 3)}</g>
        {/* right cluster */}
        <path d="M800 230V124h66v106" />
        <g strokeWidth="1.5">{win(816, 140, 3, 5)}</g>
        <path d="M886 230V64h70v166" />
        <path d="M921 64V42" />
        <g strokeWidth="1.5">{win(902, 80, 3, 8)}</g>
        <path d="M976 230v-92h64v92" />
        <g strokeWidth="1.5">{win(992, 154, 3, 4)}</g>
        <path d="M1060 230v-58h100v58" />
        <g strokeWidth="1.5">{win(1078, 188, 5, 2)}</g>
        {/* trees */}
        <path d="M330 230v-26m0 0a16 16 0 1 0 0-32 16 16 0 0 0 0 32" />
        <path d="M1180 230v-22m0 0a14 14 0 1 0 0-28 14 14 0 0 0 0 28" />
        {/* ground */}
        <path d="M0 230h1200" strokeWidth="2.5" />
      </g>
      {/* our pin */}
      <g transform="translate(460 14)">
        <path
          d="M0 44c0 0 18-17 18-28A18 18 0 1 0-18 16c0 11 18 28 18 28Z"
          fill="var(--color-gold)"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cy="15" r="6" fill="var(--color-primary)" />
      </g>
    </svg>
  );
}

export function Location({ address, phone }: { address: string; phone: string }) {
  const q = encodeURIComponent(address ? `${address}, সাভার, ঢাকা` : "সাভার, ঢাকা");
  return (
    <section id="location" aria-labelledby="location-h" className="scroll-mt-24">
      <h2 id="location-h" className="mb-4 text-lg font-bold text-fg">
        আমরা যেখানে আছি
      </h2>
      <div className="overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-primary/5">
        <div className="px-5 pt-6 sm:px-8 sm:pt-8">
          <p className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">সাভার, ঢাকা</p>
          <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
            {address && (
              <p className="flex items-start gap-2">
                <PinIcon className="mt-0.5 h-4 w-4 flex-none text-primary" />
                {address}
              </p>
            )}
            {phone && (
              <p className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 flex-none text-primary" />
                <a href={`tel:${phone}`} className="hover:text-primary">{bnDigits(phone)}</a>
              </p>
            )}
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${q}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-gold transition-colors hover:bg-primary-hover"
          >
            ম্যাপে দেখুন
          </a>
        </div>
        <div className="mt-6 px-2 pb-2 sm:px-4">
          <Skyline />
        </div>
      </div>
    </section>
  );
}
