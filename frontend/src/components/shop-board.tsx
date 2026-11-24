"use client";

import { Logo } from "./logo";
import { bnDigits, taka } from "@/lib/money";
import { aheadOf, finish, isFree, join, resetDemo, useQueue, type Lane, type Source } from "@/lib/queue";
import { cx } from "./ui";

const SRC: Record<Source, { t: string; c: string }> = {
  online: { t: "অনলাইন", c: "bg-success-soft text-success" },
  walkin: { t: "ওয়াক-ইন", c: "bg-warning-soft text-warning" },
  advance: { t: "আগাম", c: "bg-primary-soft text-primary" },
};

/** The one shared shop dashboard: three barber columns side by side, each barber runs his own column. */
export function ShopBoard() {
  const q = useQueue();
  const waiting = q.lanes.reduce((n, l) => n + l.waiting.length, 0);
  const walkIn = (l: Lane) => join(l.id, { name: "ওয়াক-ইন কাস্টমার", service: "হেয়ার কাট", price: 150, source: "walkin" });

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-primary px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white"><Logo size={32} /></span>
          <div className="leading-tight">
            <div className="text-lg font-bold text-white">দোকান ড্যাশবোর্ড</div>
            <div className="text-xs tracking-widest text-gold/80">NIR SMART GENTS PARLOUR</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white"><span className="h-2 w-2 rounded-full bg-green-400" />লাইভ</span>
          <button onClick={resetDemo} className="h-11 rounded-xl border border-white/30 px-4 text-sm font-semibold text-white">ডেমো রিসেট</button>
        </div>
      </div>

      <main className="space-y-5 p-5 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold">আজকের কিউ</h1>
          <span className="text-sm text-muted">প্রতিজন নিজের কলাম থেকে কাজ চালাবেন · মোট অপেক্ষায় {bnDigits(waiting)} জন</span>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-3">
          {q.lanes.map((l) => (
            <section key={l.id} className="space-y-3.5 rounded-3xl border border-line bg-surface p-5">
              <header className="flex items-center gap-3">
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-primary text-xl font-bold text-gold">{l.initial}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">{l.name}</h2>
                  <p className="text-xs text-muted">{l.current ? `এখন #${bnDigits(l.current.serial)} · ` : ""}শেষ সিরিয়াল #{bnDigits(l.lastSerial)}</p>
                </div>
                <span className={cx("rounded-full px-3 py-1.5 text-xs font-bold", isFree(l) ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>{isFree(l) ? "ফাঁকা" : "ব্যস্ত"}</span>
              </header>

              {l.current ? (
                <div className="space-y-3 rounded-2xl bg-primary p-4 text-white">
                  <div className="text-2xl font-semibold text-gold">#{bnDigits(l.current.serial)}</div>
                  <div>
                    <div className="font-semibold">{l.current.name}</div>
                    <div className="text-sm text-white/70">{l.current.service} · {taka(l.current.price)}</div>
                  </div>
                  <button onClick={() => finish(l.id)} className="h-12 w-full rounded-xl bg-gold text-base font-bold text-primary">শেষ করুন</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border-2 border-dashed border-line-strong p-6 text-center">
                    <div className="font-bold">এখন কেউ নেই</div>
                    <div className="mt-1 text-sm text-muted">নতুন কাস্টমার এলে সরাসরি এঁর কাছে আসবে</div>
                  </div>
                  <button onClick={() => walkIn(l)} className="h-12 w-full rounded-xl bg-primary font-bold text-gold">ওয়াক-ইন কাস্টমার শুরু করুন</button>
                </div>
              )}

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
                  {!isFree(l) && <button onClick={() => walkIn(l)} className="h-10 w-full rounded-xl border border-line-strong text-sm font-semibold">+ ওয়াক-ইন যোগ করুন ({bnDigits(aheadOf(l))} জনের পরে)</button>}
                </div>
              )}

              <footer className="flex justify-between border-t border-dashed border-line-strong pt-3 text-sm text-muted">
                <span>আজ {bnDigits(l.doneToday)}টি সার্ভিস · {taka(l.earned)}</span>
                <span className="font-bold text-fg">ভাগ {taka(Math.round(l.earned / 2))}</span>
              </footer>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
