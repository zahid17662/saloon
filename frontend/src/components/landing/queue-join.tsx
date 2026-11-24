"use client";

import Link from "next/link";
import { useState } from "react";
import { bnDigits, taka } from "@/lib/money";
import { aheadOf, etaMin, isFree, join, useQueue } from "@/lib/queue";
import type { PublicMenu } from "@/lib/types";
import { cx } from "../ui";

/** "Join the line now": pick a service and a barber; a free barber serves you directly, otherwise you join his queue. */
export function QueueJoin({ menu }: { menu: PublicMenu }) {
  const q = useQueue();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState(menu.services[0]?.id ?? 0);
  const [chosen, setChosen] = useState<number | "any" | null>(null);
  const [error, setError] = useState("");
  const [res, setRes] = useState<{ barberId: number; serial: number; direct: boolean } | null>(null);

  const free = q.lanes.find(isFree);
  const sel = chosen ?? free?.id ?? "any";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const svc = menu.services.find((s) => s.id === serviceId);
    if (!svc) return setError("একটি সার্ভিস বেছে নিন");
    if (name.trim().length < 2) return setError("আপনার নাম লিখুন");
    if (!/^01\d{9}$/.test(phone.replace(/\D/g, ""))) return setError("সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)");
    setError("");
    setRes(join(sel, { name: name.trim(), service: svc.name, price: svc.price, source: "online" }));
  }

  if (res) {
    const lane = q.lanes.find((l) => l.id === res.barberId)!;
    return (
      <div className="rounded-3xl bg-surface p-6 text-center shadow-card" role="status">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary font-bold text-gold text-2xl">#{bnDigits(res.serial)}</div>
        <h3 className="mt-3 text-lg font-bold text-fg">{res.direct ? "আপনি সরাসরি চেয়ারে" : "আপনি লাইনে আছেন"}</h3>
        <p className="mt-1 text-sm text-muted">
          {lane.name}{res.direct ? "-এর কাছে এখনই বসুন" : ` -এর সামনে আছেন ${bnDigits(aheadOf(lane) - 1)} জন, প্রায় ${bnDigits(etaMin(lane) - 25)} মিনিট`}
        </p>
        <Link href="/track" className="mt-5 inline-flex h-12 items-center rounded-full bg-primary px-7 font-semibold text-gold">লাইভ ট্র্যাক করুন</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl bg-surface p-5 shadow-card sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">নাম
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" className="h-12 rounded-xl border border-line-strong px-3 text-base" />
        </label>
        <label className="grid gap-1 text-sm font-medium">মোবাইল নম্বর
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="01XXXXXXXXX" autoComplete="tel" className="h-12 rounded-xl border border-line-strong px-3 text-base" />
        </label>
        <label className="grid gap-1 text-sm font-medium sm:col-span-2">সার্ভিস
          <select value={serviceId} onChange={(e) => setServiceId(Number(e.target.value))} className="h-12 rounded-xl border border-line-strong bg-surface px-3 text-base">
            {menu.services.map((s) => <option key={s.id} value={s.id}>{s.name} · {taka(s.price)}</option>)}
          </select>
        </label>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">কারিগর বেছে নিন</legend>
        {q.lanes.map((l) => {
          const on = sel === l.id;
          const f = isFree(l);
          return (
            <button type="button" key={l.id} aria-pressed={on} onClick={() => setChosen(l.id)}
              className={cx("flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors", on ? "border-primary bg-surface-2" : "border-line-strong bg-surface")}>
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary font-bold text-gold">{l.initial}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-fg">{l.name}</span>
                <span className="block text-sm text-muted">{f ? "এখন ফাঁকা, সরাসরি কাটবেন" : `সামনে ${bnDigits(aheadOf(l))} জন, প্রায় ${bnDigits(etaMin(l))} মিনিট`}</span>
                <span className="block text-xs text-muted">{l.current ? `এখন #${bnDigits(l.current.serial)} · ` : ""}শেষ সিরিয়াল #{bnDigits(l.lastSerial)}</span>
              </span>
              <span className={cx("rounded-full px-3 py-1.5 text-xs font-bold", f ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>{f ? "এখনই" : "ব্যস্ত"}</span>
            </button>
          );
        })}
        <button type="button" aria-pressed={sel === "any"} onClick={() => setChosen("any")}
          className={cx("rounded-2xl border-2 border-dashed p-3 text-left font-semibold", sel === "any" ? "border-primary bg-surface-2" : "border-line-strong")}>
          যে কেউ, যিনি আগে ফাঁকা হবেন
        </button>
      </fieldset>

      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      <button type="submit" className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-gold hover:opacity-95 sm:w-auto sm:px-10">লাইনে যুক্ত হোন</button>
    </form>
  );
}
