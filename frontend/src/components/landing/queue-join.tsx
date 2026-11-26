"use client";

import Link from "next/link";
import { BarberFace } from "../barber-face";
import { useState } from "react";
import { bnDigits, taka } from "@/lib/money";
import { aheadOf, etaMin, isFree, join, useQueue } from "@/lib/queue";
import type { PublicMenu } from "@/lib/types";
import { cx } from "../ui";

/** "Join the line now": pick a service and a barber; a free barber serves you directly, otherwise you join his queue. */
export function QueueJoin({ menu, preset }: { menu: PublicMenu; preset?: number }) {
  const q = useQueue();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState(preset ?? menu.services[0]?.id ?? 0);
  const [chosen, setChosen] = useState<number | "any" | null>(null);
  const [error, setError] = useState("");
  const [res, setRes] = useState<{ barberId: number; serial: number; direct: boolean } | null>(null);
  const sel = chosen ?? "any";
  const soonest = q.lanes.reduce((a, b) => (aheadOf(a) <= aheadOf(b) ? a : b), q.lanes[0]);

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

  const svc = menu.services.find((x) => x.id === serviceId);

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl bg-surface p-5 shadow-card sm:p-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-fg">১. সার্ভিস</legend>
        <select
          aria-label="সার্ভিস"
          value={serviceId}
          onChange={(e) => setServiceId(Number(e.target.value))}
          className="h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-base"
        >
          {menu.services.map((s) => (
            <option key={s.id} value={s.id}>{s.name} · {taka(s.price)}</option>
          ))}
        </select>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-semibold text-fg">২. Hairdresser</legend>
        <button
          type="button"
          aria-pressed={sel === "any"}
          onClick={() => setChosen("any")}
          className={cx(
            "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors",
            sel === "any" ? "border-primary bg-primary-soft" : "border-line-strong bg-surface",
          )}
        >
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary text-lg text-gold">★</span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-fg">যে কেউ</span>
            <span className="block text-sm text-muted">
              {!soonest
                ? "যিনি আগে ফাঁকা হবেন"
                : isFree(soonest)
                  ? `${soonest.name} এখন ফাঁকা, সরাসরি কাটবেন`
                  : `যিনি আগে ফাঁকা হবেন — ${soonest.name}, প্রায় ${bnDigits(etaMin(soonest))} মিনিট`}
            </span>
          </span>
          <span className="flex-none rounded-full bg-success-soft px-3 py-1.5 text-xs font-bold text-success">সুপারিশ</span>
        </button>

        {q.lanes.map((l) => {
          const on = sel === l.id;
          const f = isFree(l);
          return (
            <button
              type="button"
              key={l.id}
              aria-pressed={on}
              onClick={() => setChosen(l.id)}
              className={cx(
                "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors",
                on ? "border-primary bg-primary-soft" : "border-line-strong bg-surface",
              )}
            >
              <BarberFace lane={l} size={44} />
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-fg">{l.name}</span>
                <span className="block text-sm text-muted">
                  {f ? "এখন ফাঁকা, সরাসরি কাটবেন" : `সামনে ${bnDigits(aheadOf(l))} জন, প্রায় ${bnDigits(etaMin(l))} মিনিট`}
                </span>
              </span>
              <span className={cx("flex-none rounded-full px-3 py-1.5 text-xs font-bold", f ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
                {f ? "এখনই" : "ব্যস্ত"}
              </span>
            </button>
          );
        })}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-fg">৩. আপনার তথ্য</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">নাম
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" className="h-12 rounded-xl border border-line-strong px-3 text-base" />
          </label>
          <label className="grid gap-1 text-sm font-medium">মোবাইল নম্বর
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="01XXXXXXXXX" autoComplete="tel" className="h-12 rounded-xl border border-line-strong px-3 text-base" />
          </label>
        </div>
      </fieldset>

      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-sm text-muted">মোট <b className="text-base text-gold-ink tabular-nums">{svc ? taka(svc.price) : "—"}</b></p>
        <button type="submit" className="h-14 flex-1 rounded-2xl bg-primary text-base font-bold text-gold hover:opacity-95 sm:flex-none sm:px-10">লাইনে যুক্ত হোন</button>
      </div>
    </form>
  );
}
