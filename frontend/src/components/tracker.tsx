"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { bnDigits, taka } from "@/lib/money";
import { cancelMine, etaMin, useQueue } from "@/lib/queue";

/** Customer live tracker: where your serial stands in your barber's queue. */
export function Tracker() {
  const q = useQueue();
  const lane = q.lanes.find((l) => l.id === q.mine?.barberId);
  const serial = q.mine?.serial;
  const mine = lane && serial ? [lane.current, ...lane.waiting].find((t) => t?.serial === serial) : null;

  if (!lane || !serial) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <Logo size={56} />
        <h1 className="text-xl font-bold">আপনার কোনো সক্রিয় সিরিয়াল নেই</h1>
        <Link href="/#book" className="inline-flex h-12 items-center rounded-full bg-primary px-7 font-semibold text-gold">লাইনে যুক্ত হোন</Link>
      </main>
    );
  }

  const serving = lane.current?.serial === serial;
  const idx = lane.waiting.findIndex((t) => t.serial === serial);
  const ahead = serving ? 0 : idx + (lane.current ? 1 : 0);
  const done = !mine;
  const eta = ahead * 25;

  return (
    <main className="mx-auto min-h-dvh max-w-md space-y-4 bg-bg p-5">
      <header className="flex items-center gap-2"><Logo size={36} /><span className="font-bold">NIR SMART GENTS PARLOUR</span></header>
      <section className="rounded-3xl bg-primary p-6 text-center text-white">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gold text-3xl font-bold text-primary">#{bnDigits(serial)}</div>
        <h1 className="mt-4 text-xl font-bold">{done ? "আপনার সার্ভিস শেষ" : serving ? "এখন আপনার পালা!" : `আপনার সামনে আছেন ${bnDigits(ahead)} জন`}</h1>
        {!done && !serving && <p className="mt-1 text-white/70">অনুমানিক অপেক্ষা প্রায় {bnDigits(eta || etaMin(lane))} মিনিট</p>}
        <div className="mt-4 rounded-2xl bg-white/10 p-3 text-sm">
          {lane.name}-এর কাছে এখন চলছে <b className="text-gold">{lane.current ? `#${bnDigits(lane.current.serial)}` : "কেউ নেই"}</b> · আপনার সিরিয়াল #{bnDigits(serial)}
        </div>
      </section>
      {mine && (
        <section className="rounded-3xl bg-surface p-5 shadow-card text-sm">
          <div className="flex justify-between"><span className="text-muted">কারিগর</span><b>{lane.name}</b></div>
          <div className="mt-2 flex justify-between"><span className="text-muted">সার্ভিস</span><b>{mine.service}</b></div>
          <div className="mt-2 flex justify-between"><span className="text-muted">মোট</span><b>{taka(mine.price)}</b></div>
        </section>
      )}
      <p className="rounded-2xl bg-surface-2 p-4 text-sm text-muted">আপনার সামনে ২ জন বাকি থাকলে আমরা নোটিফিকেশন পাঠাব, দোকানের কাছাকাছি থাকুন।</p>
      {!done && !serving && <button onClick={cancelMine} className="h-12 w-full rounded-xl border border-danger font-semibold text-danger">বুকিং বাতিল করুন</button>}
    </main>
  );
}
