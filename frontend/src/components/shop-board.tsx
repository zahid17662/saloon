"use client";

import { useState } from "react";
import { Logo } from "./logo";
import { bnDigits, taka } from "@/lib/money";
import { aheadOf, etaMin, finish, isFree, join, resetDemo, useQueue, type Lane, type Source } from "@/lib/queue";
import { ServiceIcon } from "./service-icon";
import { cx } from "./ui";

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
            <h1 className="truncate text-[15px] leading-tight font-bold">নীড় স্মার্ট জেন্টস পার্লার</h1>
            <p className="text-[11px] leading-tight text-muted">{bnDigits(waiting)} জন অপেক্ষায়</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-success"><span className="h-2 w-2 animate-pulse rounded-full bg-success" />লাইভ</span>
          <nav className="ml-3 hidden gap-1 lg:flex" aria-label="বিভাগ">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setView(t.id)} aria-current={view === t.id} className={cx("h-10 rounded-full px-4 text-sm font-semibold", view === t.id ? "bg-primary text-white" : "text-muted hover:bg-bg")}>{t.label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5 pb-40 sm:px-8 lg:pb-10">
        {view === "new" && (
          <NewSerial key={preset ?? "x"} services={svcs} lanes={q.lanes} preset={preset} onSeeQueue={(id) => { if (id) setTab(id); setView("queue"); }} />
        )}

        {view === "queue" && (
          <>
            <div role="tablist" aria-label="কারিগর" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
              {q.lanes.map((l) => (
                <button key={l.id} role="tab" aria-selected={tab === l.id} onClick={() => setTab(l.id)}
                  className={cx("flex min-w-[8.5rem] flex-1 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-colors", tab === l.id ? "border-primary bg-surface shadow-card" : "border-line bg-surface/60")}>
                  <Avatar l={l} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{l.name}</span>
                    <span className={cx("block text-[11px] font-medium", isFree(l) ? "text-success" : "text-muted")}>{isFree(l) ? "ফাঁকা" : `${bnDigits(l.waiting.length)} জন অপেক্ষায়`}</span>
                  </span>
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
    <span style={{ width: size, height: size }} className="relative flex flex-none items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
      {l.initial}
      <span className={cx("absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-surface", isFree(l) ? "bg-success" : "bg-gold")} />
    </span>
  );
}

function Lane({ lane: l, onAdd }: { lane: Lane; onAdd: () => void }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
      <header className="flex items-center gap-3 px-4 pt-4">
        <Avatar l={l} size={44} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold">{l.name}</h2>
          <p className="text-xs text-muted">শেষ সিরিয়াল #{bnDigits(l.lastSerial)} · আজ {bnDigits(l.doneToday)}টি সম্পন্ন</p>
        </div>
        <button onClick={onAdd} aria-label={`${l.name}-এর জন্য কাস্টমার যোগ`} className="flex h-10 w-10 items-center justify-center rounded-full bg-bg text-xl text-primary hover:bg-line">+</button>
      </header>

      <div className="p-4">
        {l.current ? (
          <div className="rounded-2xl border border-line bg-surface-2 p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-gold/25 px-2.5 py-1 text-[11px] font-bold text-gold-ink">এখন চলছে</span>
              <span className="text-2xl font-bold tabular-nums">#{bnDigits(l.current.serial)}</span>
            </div>
            <p className="mt-3 truncate text-base font-semibold">{l.current.name}</p>
            <p className="truncate text-sm text-muted">{l.current.service}</p>
            <p className="mt-1 text-lg font-bold">{taka(l.current.price)}</p>
            <button onClick={() => finish(l.id)} className="mt-3 h-12 w-full rounded-xl bg-primary text-[15px] font-semibold text-white active:opacity-90">
              ✓ সম্পন্ন{l.waiting[0] ? `, পরের জন #${bnDigits(l.waiting[0].serial)}` : ""}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line-strong p-5 text-center">
            <p className="font-semibold text-success">কারিগর ফাঁকা আছেন</p>
            <p className="mt-0.5 text-sm text-muted">নতুন কাস্টমার এলে সরাসরি বসবে</p>
            <button onClick={onAdd} className="mt-3 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white">+ কাস্টমার যোগ করুন</button>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">অপেক্ষায়</h3>
          <span className="text-xs text-muted">{bnDigits(l.waiting.length)} জন{l.waiting.length ? ` · প্রায় ${bnDigits(etaMin(l))} মিনিট` : ""}</span>
        </div>
        {l.waiting.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">কেউ অপেক্ষায় নেই</p>
        ) : (
          <ul className="mt-1 divide-y divide-line">
            {l.waiting.map((w) => (
              <li key={w.serial} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-bg text-sm font-bold tabular-nums">{bnDigits(w.serial)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{w.name}</p>
                  <p className="truncate text-xs text-muted">{w.service} · {taka(w.price)}</p>
                </div>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted"><span className={cx("h-1.5 w-1.5 rounded-full", SRC[w.source].dot)} />{SRC[w.source].t}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Today's money: each barber collects the cash, so the owner's 50% is what the barber owes the shop. */
function Money({ lanes }: { lanes: Lane[] }) {
  const total = lanes.reduce((n, l) => n + l.earned, 0);
  const owner = Math.round(total / 2);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="rounded-3xl bg-primary p-5 text-white">
        <p className="text-sm text-white/70">আজকের মোট আয়</p>
        <p className="mt-1 text-4xl font-bold tabular-nums">{taka(total)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-sm">
          <div><p className="text-white/60">মালিকের ভাগ (৫০%)</p><p className="text-lg font-bold text-gold">{taka(owner)}</p></div>
          <div><p className="text-white/60">কারিগরদের ভাগ (৫০%)</p><p className="text-lg font-bold">{taka(total - owner)}</p></div>
        </div>
      </section>
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

/** Step 1: all services (always visible). Step 2: barbers with details, shown once a service is picked. Step 3: name + confirm. */
function NewSerial({ services, lanes, preset, onSeeQueue }: { services: Svc[]; lanes: Lane[]; preset?: number; onSeeQueue: (barberId?: number) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const [barber, setBarber] = useState<number | "any" | null>(preset ?? null);
  const [name, setName] = useState("");
  const [done, setDone] = useState<{ barberId: number; serial: number; direct: boolean } | null>(null);

  const chosen = services.filter((s) => picked.includes(s.id));
  const price = chosen.reduce((n, s) => n + s.price, 0);
  const shortest = [...lanes].sort((a, b) => aheadOf(a) - aheadOf(b))[0];
  const target = barber === "any" ? shortest : lanes.find((l) => l.id === barber);

  function confirm() {
    if (!chosen.length || !target) return;
    const r = join(barber as number | "any", { name: name.trim() || "ওয়াক-ইন কাস্টমার", service: chosen.map((s) => s.name).join(" + "), price, source: "walkin" });
    setDone(r);
  }
  function again() {
    setPicked([]); setBarber(null); setName(""); setDone(null);
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
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gold-ink">ধাপ ১</p>
            <h2 id="svc-h" className="text-xl font-bold">কী সার্ভিস নেবেন?</h2>
          </div>
          {chosen.length > 0 && <button onClick={() => { setPicked([]); setBarber(null); }} className="text-sm font-medium text-muted underline">মুছে ফেলুন</button>}
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {services.map((s) => {
            const on = picked.includes(s.id);
            return (
              <button key={s.id} aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                className={cx("relative flex min-h-28 min-w-0 flex-col justify-between gap-3 rounded-2xl border-2 p-3 text-left transition-colors sm:p-3.5", on ? "border-primary bg-surface shadow-card" : "border-transparent bg-surface hover:border-line-strong")}>
                <span className={cx("flex h-10 w-10 items-center justify-center rounded-xl", on ? "bg-primary text-gold" : "bg-primary-soft text-primary")}>
                  <ServiceIcon name={s.name} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] leading-snug font-semibold break-words">{s.name}</span>
                  <span className="mt-0.5 block text-base font-bold text-gold-ink">{taka(s.price)}</span>
                </span>
                {on && <span className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">✓</span>}
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
          <p className="text-xs font-semibold text-gold-ink">ধাপ ২</p>
          <h2 id="bar-h" className="mb-3 text-xl font-bold">কোন কারিগর?</h2>
          <div className="grid gap-3 lg:grid-cols-3">
            {lanes.map((l) => {
              const on = barber === l.id;
              const free = isFree(l);
              return (
                <button key={l.id} aria-pressed={on} onClick={() => setBarber(l.id)}
                  className={cx("rounded-3xl border-2 bg-surface p-4 text-left transition-colors", on ? "border-primary shadow-card" : "border-transparent hover:border-line-strong")}>
                  <div className="flex items-center gap-3">
                    <Avatar l={l} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold">{l.name}</p>
                      <p className={cx("text-xs font-semibold", free ? "text-success" : "text-warning")}>{free ? "ফাঁকা, এখনই শুরু করতে পারবেন" : "এখন ব্যস্ত"}</p>
                    </div>
                    <span className={cx("flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs", on ? "border-primary bg-primary text-white" : "border-line-strong text-transparent")}>✓</span>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-bg px-1 py-2"><dd className="text-sm font-bold tabular-nums sm:text-base">{l.current ? `#${bnDigits(l.current.serial)}` : "—"}</dd><dt className="text-[10px] text-muted sm:text-[11px]">এখন চলছে</dt></div>
                    <div className="rounded-xl bg-bg px-1 py-2"><dd className="text-sm font-bold tabular-nums sm:text-base">{bnDigits(aheadOf(l))} জন</dd><dt className="text-[10px] text-muted sm:text-[11px]">সামনে</dt></div>
                    <div className="rounded-xl bg-bg px-1 py-2"><dd className="text-sm font-bold tabular-nums sm:text-base">{free ? "এখনই" : `~${bnDigits(etaMin(l))} মি.`}</dd><dt className="text-[10px] text-muted sm:text-[11px]">অপেক্ষা</dt></div>
                  </dl>

                  <ul className="mt-3 space-y-1 text-xs text-muted">
                    {l.current && <li>চলছে: <span className="font-medium text-fg">{l.current.service}</span></li>}
                    <li>শেষ সিরিয়াল #{bnDigits(l.lastSerial)} · আজ {bnDigits(l.doneToday)}টি সম্পন্ন</li>
                  </ul>
                  <p className={cx("mt-3 rounded-xl px-3 py-2 text-sm font-semibold", free ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
                    {free ? `সরাসরি শুরু, সিরিয়াল #${bnDigits(l.lastSerial + 1)}` : `লাইনে যুক্ত হবে, সিরিয়াল #${bnDigits(l.lastSerial + 1)}`}
                  </p>
                </button>
              );
            })}
          </div>
          <button aria-pressed={barber === "any"} onClick={() => setBarber("any")}
            className={cx("mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-dashed p-3.5 text-left", barber === "any" ? "border-primary bg-surface" : "border-line-strong")}>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">যে কেউ, যিনি আগে ফাঁকা হবেন</span>
              <span className="block text-xs text-muted">এখন সবচেয়ে কম অপেক্ষা: {shortest.name} ({isFree(shortest) ? "ফাঁকা" : `~${bnDigits(etaMin(shortest))} মিনিট`})</span>
            </span>
            <span className={cx("flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 text-xs", barber === "any" ? "border-primary bg-primary text-white" : "border-line-strong text-transparent")}>✓</span>
          </button>
        </section>
      )}

      {chosen.length > 0 && target && (
        <section id="ok" aria-labelledby="ok-h" className="scroll-mt-20 rounded-3xl border border-line bg-surface p-4 sm:p-5">
          <p className="text-xs font-semibold text-gold-ink">ধাপ ৩</p>
          <h2 id="ok-h" className="mb-3 text-xl font-bold">নিশ্চিত করুন</h2>
          <label className="grid gap-1 text-sm font-medium">কাস্টমারের নাম (ঐচ্ছিক)
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="h-12 rounded-xl border border-line-strong px-3 text-base" />
          </label>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">সার্ভিস</dt><dd className="flex flex-wrap justify-end gap-1.5">{chosen.map((s) => <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary"><ServiceIcon name={s.name} className="h-3.5 w-3.5" />{s.name}</span>)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">কারিগর</dt><dd className="font-medium">{target.name}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">সিরিয়াল</dt><dd className="font-medium">#{bnDigits(target.lastSerial + 1)} · {isFree(target) ? "সরাসরি শুরু" : `প্রায় ${bnDigits(etaMin(target))} মিনিট পরে`}</dd></div>
            <div className="flex justify-between gap-4 border-t border-dashed border-line-strong pt-2"><dt className="font-semibold">মোট</dt><dd className="text-lg font-bold">{taka(price)}</dd></div>
          </dl>
          <button onClick={confirm} className="mt-4 h-14 w-full rounded-2xl bg-primary text-base font-bold text-white active:opacity-90 sm:w-auto sm:px-12">সিরিয়াল দিন</button>
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
