"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { bnDigits, taka } from "@/lib/money";
import { isFree, type Lane } from "@/lib/queue";
import { BarberFace } from "./barber-face";
import { ReceiptIcon, ScissorsIcon, UsersIcon } from "./icons";
import { Logo } from "./logo";
import { ShopScene, SideScenery } from "./shop-scene";
import { cx } from "./ui";

export const HomeIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </svg>
);

const dhakaHour = () => Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Dhaka" }).format(new Date()));
function greetingNow() {
  const h = dhakaHour();
  if (h >= 5 && h < 12) return "শুভ সকাল";
  if (h >= 12 && h < 16) return "শুভ দুপুর";
  if (h >= 16 && h < 18) return "শুভ বিকাল";
  if (h >= 18 && h < 21) return "শুভ সন্ধ্যা";
  return "শুভ রাত্রি";
}
const noopSubscribe = () => () => {};

/** Shop home: illustrated street-front header, a floating summary card, three big action tiles and the Hairdresser strip. */
export function ShopHome({ lanes, nav, onGo, onLane }: { lanes: Lane[]; nav: ReactNode; onGo: (v: "new" | "queue" | "money") => void; onLane: (id: number) => void }) {
  const greeting = useSyncExternalStore(noopSubscribe, greetingNow, () => "স্বাগতম");
  const [show, setShow] = useState(false);
  const waiting = lanes.reduce((n, l) => n + l.waiting.length, 0);
  const running = lanes.filter((l) => l.current).length;
  const done = lanes.reduce((n, l) => n + l.doneToday, 0);
  const total = lanes.reduce((n, l) => n + l.earned, 0);

  const tiles: { id: "new" | "queue" | "money"; label: string; Icon: typeof ScissorsIcon; badge?: number }[] = [
    { id: "new", label: "নতুন সিরিয়াল", Icon: ScissorsIcon },
    { id: "queue", label: "চলমান কিউ", Icon: UsersIcon, badge: waiting },
    { id: "money", label: "আজকের হিসাব", Icon: ReceiptIcon },
  ];

  return (
    <>
      <div className="relative isolate h-[304px] overflow-hidden lg:h-[330px] bg-gradient-to-b from-[#f2cf5c] via-[#f8e5a2] to-[#fbf3d6] pt-[env(safe-area-inset-top)]">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-5 bg-[#E4DABB]" />
        <SideScenery className="absolute bottom-0 left-[5%] hidden h-44 lg:block" />
        <SideScenery flip className="absolute right-[5%] bottom-0 hidden h-44 lg:block" />
        <ShopScene className="absolute bottom-0 left-1/2 h-[214px] w-auto -translate-x-1/2 lg:h-[252px]" />
        <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 pt-4 sm:px-8">
          <Logo size={48} className="flex-none drop-shadow-[0_6px_10px_rgb(11_31_75/0.25)]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug font-medium text-primary/75">{greeting}</p>
            <h1 className="font-display flex flex-col text-[15px] leading-tight font-semibold tracking-[0.12em] text-primary sm:flex-row sm:gap-2 sm:tracking-[0.14em]"><span>NIR SMART</span><span className="text-[12px] tracking-[0.2em] text-primary/70 sm:text-[15px] sm:tracking-[0.14em] sm:text-primary">GENTS PARLOUR</span></h1>
          </div>
          {nav}
          <span className="flex flex-none items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-gold shadow-card"><span className="h-2 w-2 animate-pulse rounded-full bg-gold" />লাইভ</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-5 max-w-3xl space-y-5 px-4 sm:px-8">
        <section className="rounded-[1.75rem] bg-surface p-4 shadow-lift ring-1 ring-line" aria-label="আজকের সারসংক্ষেপ">
          <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="flex min-h-14 w-full items-center gap-3 rounded-2xl text-left">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-primary text-xl font-bold text-gold shadow-card">৳</span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted">আজকের আয়</span>
              <span className={cx("block truncate font-bold tabular-nums", show ? "text-2xl" : "text-base")}>{show ? taka(total) : "দেখতে ট্যাপ করুন"}</span>
            </span>
            <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">{show ? "লুকান" : "দেখুন"}</span>
          </button>
          <dl className="mt-3 grid grid-cols-3 divide-x divide-line border-t border-line pt-3 text-center">
            {[["অপেক্ষায়", waiting], ["এখন চলছে", running], ["আজ শেষ", done]].map(([k, v]) => (
              <div key={k} className="px-2">
                <dd className="text-xl font-bold tabular-nums">{bnDigits(Number(v))}</dd>
                <dt className="text-xs text-muted">{k}</dt>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid grid-cols-3 gap-3" aria-label="কাজ বেছে নিন">
          {tiles.map(({ id, label, Icon, badge }) => (
            <button key={id} type="button" onClick={() => onGo(id)} className="flex min-h-[8.5rem] flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-surface px-2 py-4 shadow-card ring-1 ring-line transition active:scale-[0.97]">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gold/25 text-primary">
                <Icon className="h-8 w-8" />
                {!!badge && <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-gold ring-2 ring-surface">{bnDigits(badge)}</span>}
              </span>
              <span className="text-center text-[13px] leading-snug font-semibold">{label}</span>
            </button>
          ))}
        </section>

        <section aria-label="Hairdresser">
          <h2 className="mb-3 px-1 text-sm font-semibold text-muted">Hairdresser এখন</h2>
          <div className="grid grid-cols-3 gap-3">
            {lanes.map((l) => (
              <button key={l.id} type="button" onClick={() => onLane(l.id)} className="flex flex-col items-center gap-2 rounded-[1.5rem] bg-surface px-2 py-4 shadow-card ring-1 ring-line transition active:scale-[0.97]">
                <span className="relative inline-flex">
                  <BarberFace lane={l} size={56} />
                  <span className={cx("absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface", isFree(l) ? "bg-success" : "bg-gold")} />
                </span>
                <span className="w-full truncate text-center text-[13px] leading-snug font-semibold">{l.name}</span>
                <span className={cx("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", isFree(l) ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>{isFree(l) ? "ফাঁকা" : `${bnDigits(l.waiting.length)} জন অপেক্ষায়`}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
