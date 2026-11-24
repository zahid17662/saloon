"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { bookAppointment, getBookedTimes } from "@/api/appointments";
import { daySlots, MAX_DAYS_AHEAD, MIN_LEAD_MS, resolveSlot } from "@/lib/booking";
import { NET_ERR } from "@/lib/messages";
import { bnDigits, taka } from "@/lib/money";
import { fmtDate, fmtTime, shiftDays, todayKey } from "@/lib/time";
import type { Appointment, PublicMenu } from "@/lib/types";
import { Button, cx, ErrorText, Field } from "../ui";

const ANY = "any";

/** Customer booking form: pick services, a barber, a day and a free time, then leave name and phone. */
export function BookingForm({ menu }: { menu: PublicMenu }) {
  const [picked, setPicked] = useState<number[]>([]);
  const [barber, setBarber] = useState<string>(ANY);
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [taken, setTaken] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Appointment | null>(null);
  const submitting = useRef(false);

  const today = todayKey();
  const total = useMemo(() => menu.services.filter((s) => picked.includes(s.id)).reduce((n, s) => n + s.price, 0), [menu, picked]);

  // Start times already taken for the chosen barber that day (with "any barber" nothing is blocked).
  useEffect(() => {
    if (barber === ANY) return;
    let current = true;
    getBookedTimes({ date, barberId: Number(barber) })
      .then((r) => current && setTaken(r.ok ? r.data : []))
      .catch(() => current && setTaken([]));
    return () => {
      current = false;
    };
  }, [barber, date]);

  const blocked = barber === ANY ? [] : taken;
  const slots = daySlots().map((t) => ({ t, free: resolveSlot(date, t).ok && !blocked.includes(t) }));
  const anyFree = slots.some((s) => s.free);

  function toggle(id: number) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return; // ignore a double tap
    if (picked.length === 0) return setError("কমপক্ষে একটি সেবা বেছে নিন");
    if (!time) return setError("একটি সময় বেছে নিন");
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await bookAppointment({
        customerName: name,
        phone,
        barberId: barber === ANY ? null : Number(barber),
        serviceIds: picked,
        date,
        time,
        note,
      });
      if (r.ok) setDone(r.data);
      else {
        setError(r.error);
        if (barber !== ANY) getBookedTimes({ date, barberId: Number(barber) }).then((x) => x.ok && setTaken(x.data)).catch(() => {});
      }
    } catch {
      setError(NET_ERR);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (done) {
    const barberName = menu.barbers.find((b) => b.id === done.barberId)?.name;
    return (
      <div className="rounded-3xl bg-surface p-6 text-center shadow-card" role="status">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-2xl text-success">✓</div>
        <h3 className="text-lg font-bold text-fg">আপনার বুকিং গ্রহণ করা হয়েছে</h3>
        <p className="mt-1 text-sm text-muted">দোকান নিশ্চিত করলে জানতে পারবেন। দরকার হলে দোকানে ফোন করুন।</p>
        <dl className="mx-auto mt-5 max-w-sm space-y-2 rounded-2xl bg-surface-2 p-4 text-left text-sm">
          <Row k="নাম" v={done.customerName} />
          <Row k="সময়" v={`${fmtDate(done.startsAt)}, ${fmtTime(done.startsAt)}`} />
          <Row k="Barber" v={barberName ?? "যে কেউ"} />
          <Row k="সেবা" v={done.services.map((s) => s.name).join(", ")} />
          <Row k="মোট" v={taka(done.total)} />
        </dl>
        <Button
          variant="secondary"
          className="mt-5"
          onClick={() => {
            setDone(null);
            setPicked([]);
            setTime("");
            setNote("");
          }}
        >
          আরেকটি বুকিং করুন
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl bg-surface p-5 shadow-card sm:p-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted">১. সেবা বেছে নিন</legend>
        <div className="flex flex-wrap gap-2">
          {menu.services.map((s) => {
            const on = picked.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(s.id)}
                className={cx(
                  "min-h-11 rounded-full border px-4 text-sm transition-colors",
                  on ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line-strong bg-surface text-fg hover:bg-surface-2",
                )}
              >
                {s.name} · {taka(s.price)}
              </button>
            );
          })}
        </div>
        {total > 0 && <p className="mt-2 text-sm text-muted">মোট: <span className="font-semibold text-fg">{taka(total)}</span></p>}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted">২. Barber বেছে নিন</legend>
        <div className="flex flex-wrap gap-2">
          {[{ id: ANY, name: "যে কেউ" }, ...menu.barbers.map((b) => ({ id: String(b.id), name: b.name }))].map((b) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={barber === b.id}
              onClick={() => {
                setBarber(b.id);
                setTime("");
                if (b.id === ANY) setTaken([]);
              }}
              className={cx(
                "min-h-11 rounded-full border px-4 text-sm transition-colors",
                barber === b.id ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line-strong bg-surface text-fg hover:bg-surface-2",
              )}
            >
              {b.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted">৩. দিন ও সময়</legend>
        <Field
          label="তারিখ"
          type="date"
          value={date}
          min={today}
          max={shiftDays(today, MAX_DAYS_AHEAD)}
          onChange={(e) => {
            setDate(e.target.value || today);
            setTime("");
          }}
          className="mb-3 max-w-56"
        />
        {anyFree ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {slots.map(({ t, free }) => (
              <button
                key={t}
                type="button"
                disabled={!free}
                aria-pressed={time === t}
                onClick={() => {
                  setTime(t);
                  setError("");
                }}
                className={cx(
                  "min-h-11 rounded-xl border text-sm tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                  time === t ? "border-primary bg-primary text-white" : "border-line-strong bg-surface text-fg hover:bg-surface-2",
                )}
              >
                {bnDigits(t)}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted">এই দিনে আর খালি সময় নেই, অন্য দিন বেছে নিন।</p>
        )}
        <p className="mt-2 text-xs text-subtle">কমপক্ষে {bnDigits(MIN_LEAD_MS / 60000)} মিনিট আগে বুক করতে হবে।</p>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium text-muted">৪. আপনার তথ্য</legend>
        <Field label="নাম" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={60} />
        <Field
          label="মোবাইল নম্বর"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          required
        />
        <Field label="কিছু জানাতে চান? (ঐচ্ছিক)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className="sm:col-span-2" />
      </fieldset>

      <ErrorText>{error}</ErrorText>
      <Button type="submit" size="lg" className="w-full sm:w-auto sm:px-10" disabled={busy}>
        {busy ? "অপেক্ষা করুন…" : "অ্যাপয়েন্টমেন্ট নিশ্চিত করুন"}
      </Button>
    </form>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium text-fg">{v}</dd>
    </div>
  );
}
