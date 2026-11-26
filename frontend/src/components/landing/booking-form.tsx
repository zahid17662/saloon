"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { bookAppointment, getBookedTimes } from "@/api/appointments";
import { daySlots, MAX_DAYS_AHEAD, MIN_LEAD_MS, resolveSlot } from "@/lib/booking";
import { NET_ERR } from "@/lib/messages";
import { bnDigits, taka } from "@/lib/money";
import { HairdresserPortrait } from "../service-icon";
import { dhakaDateToIso, fmtDate, fmtDateKey, fmtTime, shiftDays, todayKey } from "@/lib/time";
import type { Appointment, PublicMenu } from "@/lib/types";
import { CalendarIcon, ScissorsIcon, UsersIcon } from "../icons";
import { Button, cx, ErrorText, Field } from "../ui";

const ANY = "any";
const DAYS_SHOWN = 10;
const weekdayFmt = new Intl.DateTimeFormat("bn-BD", { timeZone: "Asia/Dhaka", weekday: "short" });
const dayNumFmt = new Intl.DateTimeFormat("bn-BD", { timeZone: "Asia/Dhaka", day: "2-digit" });

/** Customer booking form: pick services, a barber, a day and a free time, then leave name and phone. */
export function BookingForm({ menu, preset }: { menu: PublicMenu; preset?: number }) {
  const [picked, setPicked] = useState<number[]>(preset ? [preset] : []);
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
  const chosenServices = useMemo(() => menu.services.filter((s) => picked.includes(s.id)), [menu, picked]);
  const total = useMemo(() => chosenServices.reduce((n, s) => n + s.price, 0), [chosenServices]);

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
        <legend className="mb-3 text-sm font-medium text-muted">২. Hairdresser বেছে নিন</legend>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {[{ id: ANY, name: "যে কেউ" }, ...menu.barbers.map((b) => ({ id: String(b.id), name: b.name }))].map((b) => {
            const on = barber === b.id;
            return (
              <button
                key={b.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setBarber(b.id);
                  setTime("");
                  if (b.id === ANY) setTaken([]);
                }}
                className="flex w-20 flex-none flex-col items-center gap-2"
              >
                <span className={cx("flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold transition-all", on ? "bg-primary text-gold ring-4 ring-primary/25" : "bg-primary-soft text-primary", !on && b.id !== ANY && "opacity-80")}>
                  {b.id === ANY ? "★" : <HairdresserPortrait id={Number(b.id)} size={64} />}
                </span>
                <span className={cx("w-full truncate text-center text-xs", on ? "font-bold text-primary" : "text-muted")}>{b.name}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted">৩. দিন ও সময়</legend>
        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {Array.from({ length: Math.min(DAYS_SHOWN, MAX_DAYS_AHEAD + 1) }, (_, i) => shiftDays(today, i)).map((key) => {
            const on = date === key;
            const d = new Date(dhakaDateToIso(key));
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setDate(key);
                  setTime("");
                }}
                className={cx(
                  "flex h-[4.25rem] w-16 flex-none flex-col items-center justify-center gap-1 rounded-2xl border transition-colors",
                  on ? "border-primary bg-primary text-gold" : "border-line-strong bg-surface text-fg hover:bg-surface-2",
                )}
              >
                <span className="text-[11px] font-medium opacity-80">{weekdayFmt.format(d)}</span>
                <span className="text-lg leading-none font-bold tabular-nums">{dayNumFmt.format(d)}</span>
              </button>
            );
          })}
        </div>
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
                  "min-h-11 rounded-full border text-sm tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                  time === t ? "border-primary bg-primary font-semibold text-gold" : "border-line-strong bg-surface text-fg hover:bg-surface-2",
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

      {picked.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface-2 p-4">
          <h4 className="mb-3 text-sm font-bold text-fg">অর্ডার সারাংশ</h4>
          <div className="space-y-2.5">
            <SumRow icon={<UsersIcon className="h-4 w-4" />} k="Hairdresser" v={barber === ANY ? "যে কেউ" : (menu.barbers.find((b) => String(b.id) === barber)?.name ?? "—")} />
            <SumRow icon={<ScissorsIcon className="h-4 w-4" />} k="সেবা" v={chosenServices.map((s) => s.name).join(", ")} />
            <SumRow icon={<CalendarIcon className="h-4 w-4" />} k="দিন ও সময়" v={`${fmtDateKey(date)}${time ? `, ${bnDigits(time)}` : ""}`} />
          </div>
          <dl className="mt-4 space-y-1.5 border-t border-dashed border-line-strong pt-3 text-sm">
            {chosenServices.map((s) => (
              <div key={s.id} className="flex justify-between gap-4">
                <dt className="min-w-0 truncate text-muted">{s.name}</dt>
                <dd className="font-medium tabular-nums">{taka(s.price)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-dashed border-line-strong pt-2 text-base">
              <dt className="font-bold text-fg">মোট</dt>
              <dd className="font-bold text-gold-ink tabular-nums">{taka(total)}</dd>
            </div>
          </dl>
        </div>
      )}

      <ErrorText>{error}</ErrorText>
      <Button type="submit" size="lg" className="w-full sm:w-auto sm:px-10" disabled={busy}>
        {busy ? "অপেক্ষা করুন…" : "অ্যাপয়েন্টমেন্ট নিশ্চিত করুন"}
      </Button>
    </form>
  );
}

function SumRow({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-primary-soft text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs text-muted">{k}</span>
        <span className="block truncate text-sm font-semibold text-fg">{v || "—"}</span>
      </span>
    </div>
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
