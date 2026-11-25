"use client";

import { useRef, useState } from "react";
import { Logo } from "./logo";
import { bnDigits, taka } from "@/lib/money";
import { aheadOf, etaMin, finish, isFree, join, MIN_PER_CUT, removeTicket, resetDemo, setPhoto, useQueue, type Lane, type Source } from "@/lib/queue";
import { ServiceArt, ServiceIcon } from "./service-icon";
import { cx } from "./ui";
import { BarberFace, squarePhoto } from "./barber-face";

type Svc = { id: number; name: string; price: number };
const FALLBACK: Svc[] = [
  { id: 1, name: "হেয়ার কাট", price: 150 },
  { id: 2, name: "দাড়ি ট্রিম", price: 80 },
  { id: 3, name: "হেয়ার স্টাইল", price: 200 },
  { id: 4, name: "ফেসিয়াল", price: 400 },
  { id: 5, name: "হেয়ার ওয়াশ", price: 100 },
  { id: 6, name: "গ্রুমিং প্যাকেজ", price: 550 },
];

const SRC: Record<Source, { t: string; dot: string }> = {
  online: { t: "অনলাইন", dot: "bg-success" },
  walkin: { t: "ওয়াক-ইন", dot: "bg-gold" },
  advance: { t: "আগাম", dot: "bg-primary" },
};

type View = "new" | "queue" | "money";
const TABS: { id: View; label: string; icon: string }[] = [
  { id: "new", label: "নতুন সিরিয়াল", icon: "＋" },
  { id: "queue", label: "চলমান কিউ", icon: "☰" },
  { id: "money", label: "আজকের হিসাব", icon: "৳" },
];

/** Shop dashboard. Phone: bottom tab bar. Desktop: tabs in the header.
 *  "নতুন সিরিয়াল": every service is listed first; once a service is picked the barbers appear with full details. */
export function ShopBoard({ services }: { services: Svc[] }) {
  const q = useQueue();
  const svcs = services.length ? services : FALLBACK;
  const [view, setView] = useState<View>("new");
  const [tab, setTab] = useState<number>(1);
  const [preset, setPreset] = useState<number | undefined>();
  const waiting = q.lanes.reduce((n, l) => n + l.waiting.length, 0);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2.5 px-4 sm:px-8">
          <Logo size={30} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] leading-snug font-bold">NIR SMART GENTS PARLOUR</h1>
            <p className="text-[11px] leading-snug text-muted">{bnDigits(waiting)} জন অপেক্ষায়</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-success"><span className="h-2 w-2 animate-pulse rounded-full bg-success" />লাইভ</span>
          <nav className="ml-3 hidden gap-1 lg:flex" aria-label="বিভাগ">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setView(t.id)} aria-current={view === t.id} className={cx("h-10 rounded-full px-4 text-sm font-semibold", view === t.id ? "bg-primary text-white" : "text-muted hover:bg-bg")}>{t.label}</button>
            ))}
          </nav>
        </div>
      </header>
      <div className="pole-bar" aria-hidden="true" />

      <main className="mx-auto max-w-6xl px-4 pt-5 pb-40 sm:px-8 lg:pb-10">
        {view === "new" && (
          <NewSerial key={preset ?? "x"} services={svcs} lanes={q.lanes} preset={preset} onSeeQueue={(id) => { if (id) setTab(id); setView("queue"); }} />
        )}

        {view === "queue" && (
          <>
            <div role="tablist" aria-label="কারিগর" className="mb-4 grid grid-cols-3 gap-2 lg:hidden">
              {q.lanes.map((l) => (
                <button key={l.id} role="tab" aria-selected={tab === l.id} onClick={() => setTab(l.id)}
                  className={cx("flex flex-col items-center gap-1 rounded-2xl border-2 px-1.5 py-2.5 transition-colors", tab === l.id ? "border-primary bg-surface shadow-card" : "border-transparent bg-surface/70")}>
                  <Avatar l={l} size={40} />
                  <span className="w-full truncate text-center text-[13px] leading-snug font-semibold">{l.name}</span>
                  <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold", isFree(l) ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>{isFree(l) ? "ফাঁকা" : `${bnDigits(l.waiting.length)} জন`}</span>
                </button>
              ))}
            </div>
            <div className="grid items-start gap-4 lg:grid-cols-3">
              {q.lanes.map((l) => (
                <div key={l.id} className={cx(tab === l.id ? "block" : "hidden", "lg:block")}>
                  <Lane lane={l} onAdd={() => { setPreset(l.id); setView("new"); }} />
                </div>
              ))}
            </div>
          </>
        )}

        {view === "money" && <Money lanes={q.lanes} />}
        <button onClick={resetDemo} className="mx-auto mt-8 block text-xs text-muted underline">ডেমো ডেটা রিসেট</button>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="বিভাগ">
        <div className="mx-auto grid h-16 max-w-md grid-cols-3">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} aria-current={view === t.id} className={cx("flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold sm:text-xs", view === t.id ? "text-primary" : "text-muted")}>
              <span className={cx("flex h-7 w-12 items-center justify-center rounded-full text-lg leading-none", view === t.id && "bg-primary-soft")}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Avatar({ l, size }: { l: Lane; size: number }) {
  return (
    <span className="relative inline-flex flex-none" style={{ width: size, height: size }}>
      <BarberFace lane={l} size={size} />
      <span className={cx("absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-surface", isFree(l) ? "bg-success" : "bg-gold")} />
    </span>
  );
}

function Lane({ lane: l, onAdd }: { lane: Lane; onAdd: () => void }) {
  const cur = l.current;
  const next = l.waiting[0];
  return (
    <section className="space-y-3" aria-label={l.name}>
      <div className="flex items-center gap-3 px-1">
        <label className="relative cursor-pointer" title="প্রোফাইল ছবি বদলান">
          <BarberFace lane={l} size={52} />
          <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-bg bg-primary text-[11px] text-gold" aria-hidden="true">📷</span>
          <input type="file" accept="image/*" className="sr-only" aria-label={`${l.name}-এর ছবি দিন`}
            onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { try { setPhoto(l.id, await squarePhoto(f)); } catch { window.alert("ছবি নেওয়া যায়নি, আবার চেষ্টা করুন।"); } } }} />
        </label>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold">{l.name}</h2>
          <p className="text-xs text-muted">{l.photo ? "ছবি বদলাতে ক্যামেরায় ট্যাপ করুন" : "ছবি যোগ করতে ক্যামেরায় ট্যাপ করুন"}</p>
        </div>
        {l.photo && <button onClick={() => setPhoto(l.id, undefined)} className="h-9 rounded-full px-3 text-xs text-muted hover:bg-bg">সরান</button>}
      </div>

      {cur ? (
        <div className="bg-barber overflow-hidden rounded-3xl p-5 text-white shadow-card">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold text-primary"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />এখন চলছে</span>
          </div>
          <div className="mt-4 flex items-end gap-4">
            <div>
              <p className="text-6xl leading-none font-extrabold text-gold tabular-nums">{bnDigits(cur.serial)}</p>
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className="truncate text-xl leading-snug font-bold">{cur.name}</p>
              <p className="text-sm leading-snug text-white/75">{cur.service}</p>
            </div>
          </div>
          {(cur.phone || cur.note) && (
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {cur.phone && <a href={`tel:${cur.phone}`} className="inline-flex min-h-9 items-center rounded-full bg-white/10 px-3 font-medium">📞 {bnDigits(cur.phone)}</a>}
              {cur.note && <span className="inline-flex items-center rounded-full bg-gold/20 px-3 py-1.5 text-gold">📝 {cur.note}</span>}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3">
            <span className="text-sm text-white/70">মোট বিল</span>
            <span className="text-2xl font-bold tabular-nums">{taka(cur.price)}</span>
          </div>
          <button onClick={() => finish(l.id)} className="mt-4 h-14 w-full rounded-2xl bg-gold text-base font-bold text-primary active:opacity-90">
            ✓ সম্পন্ন{next ? ` · পরের জন ${bnDigits(next.serial)} নম্বর` : ""}
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-line-strong bg-surface p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-xl text-success">✓</span>
          <p className="mt-3 text-lg font-bold text-success">কারিগর ফাঁকা আছেন</p>
          <p className="mt-0.5 text-sm text-muted">নতুন কাস্টমার এলে সরাসরি বসবে</p>
        </div>
      )}

      <div className="rounded-3xl border border-line bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">অপেক্ষায় <span className="text-muted">({bnDigits(l.waiting.length)})</span></h3>
        </div>
        {l.waiting.length === 0 ? (
          <p className="py-5 text-center text-sm text-muted">কেউ অপেক্ষায় নেই</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {l.waiting.map((w, i) => (
              <li key={w.serial} className="flex items-start gap-3 py-3">
                <span className={cx("flex h-10 w-10 flex-none items-center justify-center rounded-full text-base font-bold tabular-nums", i === 0 ? "bg-primary text-gold" : "bg-bg text-fg")}>{bnDigits(w.serial)}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 leading-snug font-semibold"><span className="truncate">{w.name}</span>{i === 0 && <span className="flex-none rounded-full bg-gold/25 px-2 py-0.5 text-[10px] font-bold text-gold-ink">পরের জন</span>}</p>
                  <p className="text-xs leading-snug text-muted">{w.service} · {taka(w.price)}</p>
                  {(w.phone || w.note) && <p className="mt-0.5 text-xs leading-snug text-gold-ink">{w.phone ? `📞 ${bnDigits(w.phone)}` : ""}{w.phone && w.note ? " · " : ""}{w.note ? `📝 ${w.note}` : ""}</p>}
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted"><span className={cx("h-1.5 w-1.5 rounded-full", SRC[w.source].dot)} />{SRC[w.source].t} · ~{bnDigits((i + (cur ? 1 : 0)) * MIN_PER_CUT)} মিনিট</p>
                </div>
                <button onClick={() => { if (window.confirm(`${w.name} (${bnDigits(w.serial)} নম্বর) বাদ দেবেন?`)) removeTicket(l.id, w.serial); }} aria-label={`${bnDigits(w.serial)} নম্বর বাদ দিন`} className="flex h-9 flex-none items-center rounded-full px-3 text-xs font-medium text-danger hover:bg-bg">বাদ</button>
              </li>
            ))}
          </ul>
        )}
        <button onClick={onAdd} className="mt-3 h-12 w-full rounded-2xl border-2 border-primary text-[15px] font-bold text-primary active:bg-primary-soft">+ কাস্টমার যোগ করুন</button>
      </div>
    </section>
  );
}

/** Today's money: each barber collects the cash, so the owner's 50% is what the barber owes the shop. */
/** Demo history until the backend exists: [income, services done, same day last week]. Oldest first, today is added live. */
const HISTORY: [number, number, number][] = [
  [2900, 11, 2600],
  [3450, 13, 3300],
  [2100, 8, 2500],
  [4100, 15, 3700],
  [3800, 14, 3600],
  [2650, 10, 3000],
];

function dayLabel(back: number) {
  const d = new Date(Date.now() - back * 86400000);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("bn-BD", { timeZone: "Asia/Dhaka", ...o }).format(d);
  return { week: back === 0 ? "আজ" : back === 1 ? "গতকাল" : f({ weekday: "long" }), date: f({ day: "numeric", month: "long" }) };
}

/** One stable card stack (newest on top). Swipe the top card away to reveal the older day beneath; undo brings it back (LIFO). */
const TOP_SVC = ["হেয়ার কাট", "দাড়ি ট্রিম", "হেয়ার কাট", "ফেসিয়াল", "হেয়ার স্টাইল", "হেয়ার কাট", "গ্রুমিং প্যাকেজ"];
const PEAK = ["সন্ধ্যা ৬–৮টা", "বিকাল ৪–৬টা", "সন্ধ্যা ৭–৯টা", "দুপুর ১২–২টা", "সন্ধ্যা ৬–৮টা", "বিকাল ৫–৭টা", "সন্ধ্যা ৭–৯টা"];

function DayStack({ todayTotal, todayDone }: { todayTotal: number; todayDone: number }) {
  const days: [number, number, number][] = [[todayTotal, todayDone, 3100], ...[...HISTORY].reverse()];
  const [gone, setGone] = useState(0);
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const start = useRef(0);

  const last = days.length - 1;
  const dismiss = (dir: 1 | -1) => {
    setDrag(false);
    setDx(dir * 520);
    window.setTimeout(() => { setGone((g) => (g >= last ? 0 : g + 1)); setDx(0); }, 220);
  };
  const undo = () => { if (gone > 0) setGone((g) => g - 1); };

  const visible = [gone, gone + 1, gone + 2].filter((i) => i <= last);
  return (
    <section aria-label="দিন অনুযায়ী আয়">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-muted">দিনের হিসাব</h2>
        <div className="flex gap-2">
          <button aria-label="আগের কার্ড ফিরিয়ে আনুন" disabled={gone === 0} onClick={undo} className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-primary disabled:opacity-40">‹</button>
          <button aria-label="কার্ড সরিয়ে পুরনো দিন দেখুন" onClick={() => dismiss(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-primary disabled:opacity-40">›</button>
        </div>
      </div>
      <div className="relative mx-auto h-[380px] max-w-md">
        {[...visible].reverse().map((i) => {
          const depth = i - gone;
          const [inc, done, prev] = days[i];
          const l = dayLabel(i);
          const pct = prev ? Math.min(100, Math.round((inc / prev) * 100)) : 0;
          const diff = inc - prev;
          const owner = Math.round(inc / 2);
          const top = depth === 0;
          const style = top
            ? { transform: `translateX(${dx}px) rotate(${dx / 24}deg)`, transition: drag ? "none" : "transform 220ms ease-out", touchAction: "pan-y" as const }
            : { transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.05})`, transition: "transform 220ms ease-out", opacity: 1 - depth * 0.12 };
          return (
            <article
              key={i}
              style={style}
              onPointerDown={top ? (e) => { start.current = e.clientX; setDrag(true); e.currentTarget.setPointerCapture(e.pointerId); } : undefined}
              onPointerMove={top ? (e) => { if (drag) setDx(e.clientX - start.current); } : undefined}
              onPointerUp={top ? () => { setDrag(false); if (Math.abs(dx) > 80) dismiss(dx > 0 ? 1 : -1); else setDx(0); } : undefined}
              onPointerCancel={top ? () => { setDrag(false); setDx(0); } : undefined}
              className={cx("absolute inset-x-0 top-0 h-[350px] select-none rounded-3xl p-5 shadow-card motion-reduce:transition-none", i === 0 ? "bg-barber text-white" : "border border-line bg-surface")}
            >
              {(() => {
                const dark = i === 0;
                const mute = dark ? "text-white/65" : "text-muted";
                return (
                  <>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-lg font-bold">{l.week}</h3>
                      <span className={cx("text-sm", mute)}>· {l.date}</span>
                      {top && <span className={cx("ml-auto text-[11px]", mute)}>সোয়াইপ করুন ⇄</span>}
                    </div>
                    <p className={cx("mt-2 text-xs", mute)}>মোট আয়</p>
                    <p className={cx("text-4xl font-bold tabular-nums", dark && "text-gold")}>{taka(inc)}</p>
                    <div className={cx("mt-3 h-2 overflow-hidden rounded-full", dark ? "bg-white/15" : "bg-bg")} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="গত সপ্তাহের একই দিনের তুলনায়">
                      <div className={cx("h-full rounded-full", dark ? "bg-gold" : "bg-primary")} style={{ width: `${pct}%` }} />
                    </div>
                    <div className={cx("mt-2 flex items-center justify-between gap-2 text-xs", mute)}>
                      <span>{bnDigits(done)}টি সার্ভিস · গত সপ্তাহের তুলনায়</span>
                      <span className={cx("font-semibold", diff >= 0 ? (dark ? "text-gold" : "text-success") : dark ? "text-white" : "text-warning")}>{diff >= 0 ? "▲" : "▼"} {taka(Math.abs(diff))}</span>
                    </div>
                    <div className={cx("mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-sm", dark ? "border-white/15" : "border-line")}>
                      <div><p className={mute}>মালিকের ভাগ (৫০%)</p><p className={cx("text-lg font-bold", dark && "text-gold")}>{taka(owner)}</p></div>
                      <div><p className={mute}>কারিগরদের ভাগ (৫০%)</p><p className="text-lg font-bold">{taka(inc - owner)}</p></div>
                    </div>
                    <div className={cx("mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs", dark ? "border-white/15" : "border-line")}>
                      <div><p className={mute}>গড় / কাস্টমার</p><p className="mt-0.5 text-sm font-bold">{taka(done ? Math.round(inc / done) : 0)}</p></div>
                      <div><p className={mute}>সেরা সার্ভিস</p><p className="mt-0.5 truncate text-sm font-bold">{TOP_SVC[i % TOP_SVC.length]}</p></div>
                      <div><p className={mute}>ব্যস্ত সময়</p><p className="mt-0.5 truncate text-sm font-bold">{PEAK[i % PEAK.length]}</p></div>
                    </div>
                  </>
                );
              })()}
            </article>
          );
        })}
      </div>
      <div className="mt-1 flex justify-center gap-1.5" aria-hidden="true">
        {days.map((_, i) => (
          <span key={i} className={cx("h-1.5 rounded-full transition-all", i === gone ? "w-5 bg-primary" : "w-1.5 bg-line-strong")} />
        ))}
      </div>
    </section>
  );
}

function Money({ lanes }: { lanes: Lane[] }) {
  const total = lanes.reduce((n, l) => n + l.earned, 0);
  const done = lanes.reduce((n, l) => n + l.doneToday, 0);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <DayStack todayTotal={total} todayDone={done} />
      <section className="rounded-3xl border border-line bg-surface p-2 shadow-card">
        <h2 className="px-3 pt-3 pb-1 text-sm font-semibold text-muted">কারিগর অনুযায়ী</h2>
        <ul className="divide-y divide-line">
          {lanes.map((l) => (
            <li key={l.id} className="flex items-center gap-3 p-3">
              <Avatar l={l} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{l.name}</p>
                <p className="text-xs text-muted">{bnDigits(l.doneToday)}টি সার্ভিস · আয় {taka(l.earned)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted">দোকানে জমা দেবেন</p>
                <p className="font-bold tabular-nums">{taka(Math.round(l.earned / 2))}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StepHead({ n, title, hint }: { n: string; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary text-sm font-bold text-gold shadow-card">{n}</span>
      <div className="min-w-0">
        <h2 className="text-xl leading-snug font-bold">{title}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

/** Step 1: all services (always visible). Step 2: barbers with details, shown once a service is picked. Step 3: name + confirm. */
function NewSerial({ services, lanes, preset, onSeeQueue }: { services: Svc[]; lanes: Lane[]; preset?: number; onSeeQueue: (barberId?: number) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const [barber, setBarber] = useState<number | "any" | null>(preset ?? null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState<{ barberId: number; serial: number; direct: boolean } | null>(null);

  const chosen = services.filter((s) => picked.includes(s.id));
  const price = chosen.reduce((n, s) => n + s.price, 0);
  const shortest = [...lanes].sort((a, b) => aheadOf(a) - aheadOf(b))[0];
  const target = barber === "any" ? shortest : lanes.find((l) => l.id === barber);

  const phoneDigits = phone.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/\D/g, "");
  const phoneBad = phoneDigits.length > 0 && !/^01\d{9}$/.test(phoneDigits);

  function confirm() {
    if (!chosen.length || !target || phoneBad) return;
    const r = join(barber as number | "any", { name: name.trim() || "ওয়াক-ইন কাস্টমার", service: chosen.map((s) => s.name).join(" + "), price, source: "walkin", phone: phoneDigits || undefined, note: note.trim() || undefined });
    setDone(r);
  }
  function again() {
    setPicked([]); setBarber(null); setName(""); setPhone(""); setNote(""); setDone(null);
  }

  if (done) {
    const l = lanes.find((x) => x.id === done.barberId);
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-line bg-surface p-6 text-center shadow-card" role="status">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-3xl font-bold tabular-nums text-success">#{bnDigits(done.serial)}</div>
        <h2 className="mt-4 text-lg font-bold">{done.direct ? "সরাসরি চেয়ারে বসানো হয়েছে" : "লাইনে যুক্ত করা হয়েছে"}</h2>
        <p className="mt-1 text-sm text-muted">{l?.name}{done.direct ? "-এর কাছে এখনই শুরু" : `-এর সারিতে, সামনে ${bnDigits(Math.max(0, (l ? aheadOf(l) : 1) - 1))} জন`}</p>
        <div className="mt-5 grid gap-2.5">
          <button onClick={again} className="h-12 rounded-xl bg-primary font-semibold text-white">+ আরেকজন যোগ করুন</button>
          <button onClick={() => onSeeQueue(done.barberId)} className="h-12 rounded-xl border border-line-strong font-semibold">কিউ দেখুন</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section aria-labelledby="svc-h">
        <div className="flex items-start justify-between gap-3">
          <StepHead n="১" title="কী সার্ভিস নেবেন?" hint="এক বা একাধিক সার্ভিস বেছে নিন" />
          {chosen.length > 0 && <button onClick={() => { setPicked([]); setBarber(null); }} className="mt-1.5 rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-muted">মুছে ফেলুন</button>}
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {services.map((s) => {
            const on = picked.includes(s.id);
            return (
              <button key={s.id} aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                className={cx("relative flex min-h-36 min-w-0 flex-col justify-between gap-2 rounded-2xl border-2 p-3 text-left transition-colors sm:p-3.5", on ? "border-primary bg-surface shadow-card" : "border-transparent bg-surface hover:border-line-strong")}>
                <ServiceArt name={s.name} size={76} className="-mt-1 -mr-1 h-[76px] w-[76px] flex-none self-end sm:h-20 sm:w-20" />
                <span className="min-w-0">
                  <span className="block text-[15px] leading-snug font-semibold break-words">{s.name}</span>
                  <span className="mt-0.5 block text-base font-bold text-gold-ink">{taka(s.price)}</span>
                </span>
                {on && <span className="absolute top-2.5 left-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">✓</span>}
              </button>
            );
          })}
        </div>
        {chosen.length > 0 && (
          <p className="mt-3 text-sm text-muted">{bnDigits(chosen.length)}টি সার্ভিস · মোট <b className="text-fg">{taka(price)}</b></p>
        )}
      </section>

      {chosen.length > 0 && (
        <section id="bar" aria-labelledby="bar-h" className="scroll-mt-20">
          <StepHead n="২" title="কোন কারিগর?" hint="প্রথমে 'যে কেউ', অথবা পছন্দের কারিগর" />
          <button aria-pressed={barber === "any"} onClick={() => setBarber("any")}
            className={cx("mb-4 flex w-full items-center gap-3 rounded-2xl border-2 border-dashed bg-surface p-4 text-left transition-colors", barber === "any" ? "border-primary shadow-card" : "border-line-strong")}>
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary-soft text-lg text-primary">⇄</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">যে কেউ (দ্রুততম)</span>
              <span className="block text-xs text-muted">এখন যিনি আগে ফাঁকা হবেন: {shortest.name} ({isFree(shortest) ? "ফাঁকা" : `~${bnDigits(etaMin(shortest))} মিনিট`})</span>
            </span>
            <span className={cx("flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 text-xs", barber === "any" ? "border-primary bg-primary text-gold" : "border-line-strong text-transparent")}>✓</span>
          </button>
          <div className="grid gap-4 lg:grid-cols-3">
            {lanes.map((l) => {
              const on = barber === l.id;
              const free = isFree(l);
              const line = [l.current, ...l.waiting].filter((t): t is NonNullable<typeof t> => !!t);
              const shown = line.slice(0, 4);
              return (
                <button key={l.id} aria-pressed={on} onClick={() => setBarber(l.id)}
                  className={cx("group relative flex flex-col overflow-hidden rounded-[28px] bg-surface text-left ring-1 transition-all", on ? "-translate-y-0.5 shadow-[0_18px_40px_-14px_rgb(11_31_75/0.45)] ring-2 ring-primary" : "ring-line shadow-card hover:ring-line-strong")}>
                  {/* navy header */}
                  <span className="relative flex items-center gap-3 overflow-hidden bg-[linear-gradient(135deg,#0B1F4B_0%,#17347a_100%)] px-4 py-4">
                    <svg aria-hidden="true" viewBox="0 0 120 120" className="pointer-events-none absolute -top-10 -right-8 h-36 w-36 text-gold opacity-[0.16]"><circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="60" cy="60" r="38" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="60" cy="60" r="20" fill="currentColor" /></svg>
                    <BarberFace lane={l} size={56} className="ring-2 ring-gold/70" />
                    <span className="relative min-w-0 flex-1">
                      <span className="block truncate text-lg leading-snug font-bold text-white">{l.name}</span>
                      <span className="mt-0.5 block text-xs text-white/65">আজ {bnDigits(l.doneToday)}টি সম্পন্ন · শেষ সিরিয়াল #{bnDigits(l.lastSerial)}</span>
                    </span>
                    <span className={cx("relative flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", free ? "bg-success/90 text-white" : "bg-gold text-primary")}>
                      <span className={cx("h-1.5 w-1.5 rounded-full", free ? "bg-white" : "bg-primary")} />{free ? "ফাঁকা" : "ব্যস্ত"}
                    </span>
                  </span>

                  {/* body */}
                  <span className="flex flex-1 flex-col gap-4 p-4">
                    <span>
                      <span className="mb-2 block text-[11px] font-semibold tracking-wide text-muted">সিরিয়ালের অবস্থা</span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        {free ? (
                          <span className="rounded-full bg-bg px-3 py-1.5 text-xs font-medium text-muted">চেয়ার ফাঁকা, কেউ অপেক্ষায় নেই</span>
                        ) : (
                          shown.map((t, i) => (
                            <span key={t.serial} className={cx("rounded-full px-2.5 py-1.5 text-xs font-bold tabular-nums", i === 0 ? "bg-gold text-primary ring-4 ring-gold/25" : "bg-bg text-muted")}>#{bnDigits(t.serial)}</span>
                          ))
                        )}
                        {line.length > shown.length && <span className="text-xs font-medium text-muted">+{bnDigits(line.length - shown.length)}</span>}
                        <span aria-hidden="true" className="px-0.5 text-muted">›</span>
                        <span className={cx("rounded-full px-3 py-1.5 text-xs font-bold tabular-nums", on ? "bg-primary text-gold" : "border border-dashed border-primary/50 text-primary")}>আপনি #{bnDigits(l.lastSerial + 1)}</span>
                      </span>
                    </span>

                    <span className="grid grid-cols-2 divide-x divide-line rounded-2xl bg-[#F8F6EE] py-3">
                      <span className="px-4">
                        <span className="block text-[11px] text-muted">সামনে আছেন</span>
                        <span className="block text-2xl leading-snug font-bold tabular-nums">{bnDigits(aheadOf(l))}<span className="ml-1 text-sm font-semibold text-muted">জন</span></span>
                      </span>
                      <span className="px-4">
                        <span className="block text-[11px] text-muted">আনুমানিক অপেক্ষা</span>
                        <span className="block text-2xl leading-snug font-bold tabular-nums">{free ? "এখনই" : <>~{bnDigits(etaMin(l))}<span className="ml-1 text-sm font-semibold text-muted">মিনিট</span></>}</span>
                      </span>
                    </span>

                    {l.current && (
                      <span className="flex items-center gap-2.5 text-xs text-muted">
                        <ServiceIcon name={l.current.service} className="h-4 w-4 flex-none text-gold-ink" />
                        <span className="min-w-0 truncate">এখন করছেন: <b className="font-semibold text-fg">{l.current.service}</b></span>
                      </span>
                    )}
                  </span>

                  {/* footer */}
                  <span className={cx("flex items-center justify-between gap-3 px-4 py-3.5 text-sm font-bold transition-colors", on ? "bg-primary text-gold" : free ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
                    <span>{free ? "সরাসরি শুরু" : "লাইনে যুক্ত হবে"} · সিরিয়াল #{bnDigits(l.lastSerial + 1)}</span>
                    <span className={cx("flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs", on ? "bg-gold text-primary" : "border border-current/40")}>{on ? "✓" : ""}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {chosen.length > 0 && target && (
        <section id="ok" aria-labelledby="ok-h" className="scroll-mt-20 rounded-[28px] border border-line bg-surface p-4 shadow-card sm:p-5">
          <StepHead n="৩" title="নিশ্চিত করুন" hint="নাম, ফোন ও নোট ঐচ্ছিক" />
          <label className="grid gap-1 text-sm font-medium">কাস্টমারের নাম (ঐচ্ছিক)
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="h-12 rounded-xl border border-line-strong px-3 text-base" />
          </label>
          <label className="mt-3 grid gap-1 text-sm font-medium">ফোন নম্বর (ঐচ্ছিক)
            <input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={14} placeholder="০১XXXXXXXXX" aria-invalid={phoneBad} className={cx("h-12 rounded-xl border px-3 text-base", phoneBad ? "border-red-500" : "border-line-strong")} />
            {phoneBad && <span className="text-xs font-normal text-red-600">১১ সংখ্যার নম্বর দিন, যেমন ০১৭XXXXXXXX</span>}
          </label>
          <label className="mt-3 grid gap-1 text-sm font-medium">নোট (ঐচ্ছিক)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} rows={2} placeholder="যেমন: সাইড ছোট, দাড়ি হালকা" className="rounded-xl border border-line-strong px-3 py-2.5 text-base" />
          </label>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">সার্ভিস</dt><dd className="flex flex-wrap justify-end gap-1.5">{chosen.map((s) => <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary"><ServiceIcon name={s.name} className="h-3.5 w-3.5" />{s.name}</span>)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">কারিগর</dt><dd className="font-medium">{target.name}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">সিরিয়াল</dt><dd className="font-medium">#{bnDigits(target.lastSerial + 1)} · {isFree(target) ? "সরাসরি শুরু" : `প্রায় ${bnDigits(etaMin(target))} মিনিট পরে`}</dd></div>
            <div className="flex justify-between gap-4 border-t border-dashed border-line-strong pt-2"><dt className="font-semibold">মোট</dt><dd className="text-lg font-bold">{taka(price)}</dd></div>
          </dl>
          <button onClick={confirm} disabled={phoneBad} className="mt-4 h-14 disabled:opacity-50 w-full rounded-2xl bg-primary text-base font-bold text-white active:opacity-90 sm:w-auto sm:px-12">সিরিয়াল দিন</button>
        </section>
      )}

      {chosen.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-surface/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="min-w-0 flex-1 text-sm"><div className="truncate text-muted">{bnDigits(chosen.length)}টি সার্ভিস{target ? ` · ${target.name}` : ""}</div><div className="font-bold">{taka(price)}</div></div>
            {target ? (
              <button onClick={() => document.getElementById("ok")?.scrollIntoView({ behavior: "smooth" })} className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white">নিশ্চিত করুন ↓</button>
            ) : (
              <button onClick={() => document.getElementById("bar")?.scrollIntoView({ behavior: "smooth" })} className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white">কারিগর বাছুন ↓</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
