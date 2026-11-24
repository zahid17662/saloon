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

const SRC: Record<Source, { t: string; c: string }> = {
  online: { t: "অনলাইন", c: "bg-success-soft text-success" },
  walkin: { t: "ওয়াক-ইন", c: "bg-warning-soft text-warning" },
  advance: { t: "আগাম", c: "bg-primary-soft text-primary" },
};

/** Shared shop dashboard. Mobile: one barber at a time via tabs + a "new customer" button. Desktop: all three columns. */
export function ShopBoard({ services }: { services: Svc[] }) {
  const q = useQueue();
  const svcs = services.length ? services : FALLBACK;
  const [tab, setTab] = useState<number>(1);
  const [sheet, setSheet] = useState<{ barberId?: number } | null>(null);
  const waiting = q.lanes.reduce((n, l) => n + l.waiting.length, 0);
  const total = q.lanes.reduce((n, l) => n + l.earned, 0);

  return (
    <div className="min-h-dvh bg-bg pb-28 text-fg lg:pb-10">
      <header className="sticky top-0 z-30 bg-primary px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white"><Logo size={30} /></span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate font-bold text-white">দোকান ড্যাশবোর্ড</div>
            <div className="truncate text-[11px] tracking-widest text-gold/80">NIR SMART GENTS PARLOUR</div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"><span className="h-2 w-2 rounded-full bg-green-400" />লাইভ</span>
          <button onClick={() => setSheet({})} className="hidden h-11 rounded-xl bg-gold px-5 font-bold text-primary lg:block">+ নতুন কাস্টমার</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 pt-4 sm:px-8">
        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="অপেক্ষায়" value={`${bnDigits(waiting)} জন`} />
          <Stat label="আজ আয়" value={taka(total)} />
          <Stat label="মালিকের ভাগ" value={taka(Math.round(total / 2))} />
        </div>

        {/* Barber tabs: mobile only */}
        <div role="tablist" aria-label="কারিগর" className="grid grid-cols-3 gap-2 lg:hidden">
          {q.lanes.map((l) => (
            <button key={l.id} role="tab" aria-selected={tab === l.id} onClick={() => setTab(l.id)}
              className={cx("relative flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-1 py-2 text-center transition-colors", tab === l.id ? "border-primary bg-surface" : "border-transparent bg-surface/60")}>
              <span className="flex items-center gap-1.5 text-sm font-bold"><span className={cx("h-2 w-2 rounded-full", isFree(l) ? "bg-success" : "bg-gold")} />{l.name}</span>
              <span className="text-[11px] text-muted">{isFree(l) ? "ফাঁকা" : `লাইনে ${bnDigits(l.waiting.length)} জন`}</span>
            </button>
          ))}
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-3">
          {q.lanes.map((l) => (
            <div key={l.id} className={cx(tab === l.id ? "block" : "hidden", "lg:block")}>
              <LaneCard lane={l} onAdd={() => setSheet({ barberId: l.id })} />
            </div>
          ))}
        </div>

        <button onClick={resetDemo} className="mx-auto block pt-2 text-xs text-muted underline">ডেমো ডেটা রিসেট</button>
      </main>

      {/* Mobile bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <button onClick={() => setSheet({})} className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-gold">+ নতুন কাস্টমার</button>
      </div>

      {sheet && <NewCustomer services={svcs} lanes={q.lanes} preset={sheet.barberId} onClose={() => setSheet(null)} onDone={(id) => { setTab(id); setSheet(null); }} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface p-3 text-center shadow-card">
      <div className="truncate text-base font-bold sm:text-lg">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}

function LaneCard({ lane: l, onAdd }: { lane: Lane; onAdd: () => void }) {
  return (
    <section className="space-y-3.5 rounded-3xl border border-line bg-surface p-4 sm:p-5">
      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-primary text-xl font-bold text-gold">{l.initial}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold">{l.name}</h2>
          <p className="text-xs text-muted">{l.current ? `এখন #${bnDigits(l.current.serial)} · ` : ""}শেষ সিরিয়াল #{bnDigits(l.lastSerial)}</p>
        </div>
        <span className={cx("rounded-full px-3 py-1.5 text-xs font-bold", isFree(l) ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>{isFree(l) ? "ফাঁকা" : "ব্যস্ত"}</span>
      </header>

      {l.current ? (
        <div className="space-y-3 rounded-2xl bg-primary p-4 text-white">
          <div className="flex items-baseline justify-between"><span className="text-3xl font-semibold text-gold">#{bnDigits(l.current.serial)}</span><span className="text-xs text-white/60">এখন চলছে</span></div>
          <div>
            <div className="font-semibold">{l.current.name}</div>
            <div className="text-sm text-white/70">{l.current.service} · {taka(l.current.price)}</div>
          </div>
          <button onClick={() => finish(l.id)} className="h-14 w-full rounded-xl bg-gold text-base font-bold text-primary active:scale-[0.99]">শেষ করুন{l.waiting[0] ? ` · পরের #${bnDigits(l.waiting[0].serial)}` : ""}</button>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-line-strong p-6 text-center">
          <div className="font-bold">এখন কেউ নেই</div>
          <div className="mt-1 text-sm text-muted">নতুন কাস্টমার এলে সরাসরি এঁর কাছে বসবে</div>
        </div>
      )}

      <button onClick={onAdd} className="h-12 w-full rounded-xl border border-line-strong text-sm font-semibold hover:bg-bg">+ {l.name}-এর জন্য কাস্টমার যোগ করুন</button>

      {l.waiting.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted">অপেক্ষায় {bnDigits(l.waiting.length)} জন</p>
          {l.waiting.map((w) => (
            <div key={w.serial} className="flex items-center gap-3 rounded-xl bg-bg p-3">
              <span className="min-w-9 font-semibold">#{bnDigits(w.serial)}</span>
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{w.name}</div><div className="truncate text-xs text-muted">{w.service}</div></div>
              <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-bold", SRC[w.source].c)}>{SRC[w.source].t}</span>
            </div>
          ))}
        </div>
      )}

      <footer className="flex justify-between border-t border-dashed border-line-strong pt-3 text-sm text-muted">
        <span>আজ {bnDigits(l.doneToday)}টি · {taka(l.earned)}</span>
        <span className="font-bold text-fg">ভাগ {taka(Math.round(l.earned / 2))}</span>
      </footer>
    </section>
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
