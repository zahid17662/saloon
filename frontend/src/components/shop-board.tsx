"use client";

import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { bnDigits, taka } from "@/lib/money";
import { aheadOf, etaMin, finish, isFree, join, resetDemo, useQueue, type Lane, type Source } from "@/lib/queue";
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

type View = "queue" | "money";

/** Shop dashboard. Phone: app layout (top bar, barber switcher, one lane, bottom tab bar with a + button).
 *  Desktop: three lanes side by side. */
export function ShopBoard({ services }: { services: Svc[] }) {
  const q = useQueue();
  const svcs = services.length ? services : FALLBACK;
  const [view, setView] = useState<View>("queue");
  const [tab, setTab] = useState<number>(1);
  const [sheet, setSheet] = useState<{ barberId?: number } | null>(null);
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
            <TabBtn on={view === "queue"} onClick={() => setView("queue")}>কিউ</TabBtn>
            <TabBtn on={view === "money"} onClick={() => setView("money")}>আজকের হিসাব</TabBtn>
          </nav>
          <button onClick={() => setSheet({})} className="ml-2 hidden h-10 rounded-full bg-primary px-5 text-sm font-semibold text-white lg:block">+ নতুন কাস্টমার</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-4 pb-28 sm:px-8 lg:pb-10">
        {view === "queue" ? (
          <>
            {/* Phone: barber switcher */}
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
                  <Lane lane={l} onAdd={() => setSheet({ barberId: l.id })} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <Money lanes={q.lanes} />
        )}
        <button onClick={resetDemo} className="mx-auto mt-6 block text-xs text-muted underline">ডেমো ডেটা রিসেট</button>
      </main>

      {/* Phone bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="বিভাগ">
        <div className="mx-auto grid h-16 max-w-md grid-cols-3 items-center">
          <BarBtn on={view === "queue"} onClick={() => setView("queue")} label="কিউ" icon="☰" />
          <button onClick={() => setSheet({})} aria-label="নতুন কাস্টমার" className="mx-auto -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-3xl font-medium text-primary shadow-pop">+</button>
          <BarBtn on={view === "money"} onClick={() => setView("money")} label="হিসাব" icon="৳" />
        </div>
      </nav>

      {sheet && <NewCustomer services={svcs} lanes={q.lanes} preset={sheet.barberId} onClose={() => setSheet(null)} onDone={(id) => { setTab(id); setView("queue"); setSheet(null); }} />}
    </div>
  );
}

function TabBtn({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={cx("h-10 rounded-full px-4 text-sm font-semibold", on ? "bg-primary-soft text-primary" : "text-muted hover:bg-bg")}>{children}</button>;
}
function BarBtn({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button onClick={onClick} aria-current={on} className={cx("flex h-full flex-col items-center justify-center gap-0.5 text-xs font-semibold", on ? "text-primary" : "text-muted")}>
      <span className="text-lg leading-none">{icon}</span>{label}
    </button>
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

/** Step 1: choose service(s). Step 2: choose barber (a free one serves right away). Bottom sheet on mobile. */
function NewCustomer({ services, lanes, preset, onClose, onDone }: { services: Svc[]; lanes: Lane[]; preset?: number; onClose: () => void; onDone: (barberId: number) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [picked, setPicked] = useState<number[]>([]);
  const [barber, setBarber] = useState<number | "any" | null>(preset ?? null);
  const [name, setName] = useState("");
  const chosen = services.filter((s) => picked.includes(s.id));
  const price = chosen.reduce((n, s) => n + s.price, 0);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function confirm() {
    if (!chosen.length || barber === null) return;
    const r = join(barber, { name: name.trim() || "ওয়াক-ইন কাস্টমার", service: chosen.map((s) => s.name).join(" + "), price, source: "walkin" });
    onDone(r.barberId);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose} role="dialog" aria-modal="true" aria-label="নতুন কাস্টমার">
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-surface sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <div className="text-xs font-semibold text-muted">ধাপ {bnDigits(step)} / ২</div>
            <h3 className="text-lg font-bold">{step === 1 ? "কী সার্ভিস নেবেন?" : "কোন কারিগর?"}</h3>
          </div>
          <button onClick={onClose} aria-label="বন্ধ করুন" className="h-11 w-11 rounded-full bg-bg text-xl">×</button>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-5">
          {step === 1 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {services.map((s) => {
                const on = picked.includes(s.id);
                return (
                  <button key={s.id} aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                    className={cx("flex min-h-20 flex-col items-start justify-between rounded-2xl border-2 p-3 text-left transition-colors", on ? "border-primary bg-primary-soft" : "border-line-strong")}>
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-sm font-bold text-gold-ink">{taka(s.price)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              {lanes.map((l) => (
                <button key={l.id} aria-pressed={barber === l.id} onClick={() => setBarber(l.id)}
                  className={cx("flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left", barber === l.id ? "border-primary bg-primary-soft" : "border-line-strong")}>
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary font-bold text-gold">{l.initial}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{l.name}</span>
                    <span className="block text-sm text-muted">{isFree(l) ? "ফাঁকা, এখনই শুরু" : `সামনে ${bnDigits(aheadOf(l))} জন · প্রায় ${bnDigits(etaMin(l))} মিনিট`}</span>
                  </span>
                  <span className={cx("rounded-full px-3 py-1.5 text-xs font-bold", isFree(l) ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>{isFree(l) ? "এখনই" : "ব্যস্ত"}</span>
                </button>
              ))}
              <button aria-pressed={barber === "any"} onClick={() => setBarber("any")} className={cx("w-full rounded-2xl border-2 border-dashed p-3 text-left font-semibold", barber === "any" ? "border-primary bg-primary-soft" : "border-line-strong")}>যে কেউ, যিনি আগে ফাঁকা হবেন</button>
              <label className="mt-2 grid gap-1 text-sm font-medium">কাস্টমারের নাম (ঐচ্ছিক)
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="h-12 rounded-xl border border-line-strong px-3 text-base" />
              </label>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0 flex-1 text-sm"><div className="text-muted">{bnDigits(chosen.length)}টি সার্ভিস</div><div className="text-lg font-bold">{taka(price)}</div></div>
          {step === 2 && <button onClick={() => setStep(1)} className="h-12 rounded-xl border border-line-strong px-4 font-semibold">পিছনে</button>}
          {step === 1 ? (
            <button disabled={!chosen.length} onClick={() => setStep(2)} className="h-12 rounded-xl bg-primary px-6 font-bold text-gold disabled:opacity-40">পরের ধাপ</button>
          ) : (
            <button disabled={barber === null} onClick={confirm} className="h-12 rounded-xl bg-primary px-6 font-bold text-gold disabled:opacity-40">সিরিয়াল দিন</button>
          )}
        </div>
      </div>
    </div>
  );
}
