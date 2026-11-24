"use client";

import { useCallback, useEffect, useState } from "react";
import { listAppointments, setAppointmentStatus } from "@/api/appointments";
import { NET_ERR } from "@/lib/messages";
import { bnDigits, taka } from "@/lib/money";
import { fmtDate, fmtTime, shiftDays, todayKey } from "@/lib/time";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { useCatalog } from "../catalog-context";
import { Badge, Button, Empty, ErrorText, Field, LoadingScreen, PageTitle, Select } from "../ui";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "নতুন",
  CONFIRMED: "নিশ্চিত",
  CANCELLED: "বাতিল",
  DONE: "সম্পন্ন",
};
const STATUS_TONE: Record<AppointmentStatus, "gold" | "green" | "red" | "neutral"> = {
  PENDING: "gold",
  CONFIRMED: "green",
  CANCELLED: "red",
  DONE: "neutral",
};

/** Admin: customer bookings, soonest first. New ones need a confirm or cancel. */
export function AppointmentsList() {
  const catalog = useCatalog();
  const [from, setFrom] = useState(todayKey());
  const [to, setTo] = useState(shiftDays(todayKey(), 30));
  const [status, setStatus] = useState<"all" | AppointmentStatus>("all");
  const [rows, setRows] = useState<Appointment[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let current = true; // ignore a slow reply that a newer filter has overtaken
    listAppointments({ from, to, status })
      .then((r) => {
        if (!current) return;
        setRows(r.ok ? r.data : []);
        setError(r.ok ? "" : r.error);
      })
      .catch(() => {
        if (!current) return;
        setRows([]);
        setError(NET_ERR);
      });
    return () => {
      current = false;
    };
  }, [from, to, status, reload]);

  const act = useCallback(async (a: Appointment, next: Exclude<AppointmentStatus, "PENDING">) => {
    setBusyId(a.id);
    setError("");
    try {
      const r = await setAppointmentStatus(a.id, next);
      if (!r.ok) setError(r.error);
      else setReload((n) => n + 1);
    } catch {
      setError(NET_ERR);
    } finally {
      setBusyId(null);
    }
  }, []);

  if (!catalog || rows === null) return <LoadingScreen />;
  const barberName = (id: number | null) => (id == null ? "যে কেউ" : (catalog.barbers.find((b) => b.id === id)?.name ?? "-"));
  const fresh = rows.filter((a) => a.status === "PENDING").length;

  return (
    <>
      <PageTitle title="অ্যাপয়েন্টমেন্ট" sub={`${bnDigits(rows.length)}টি বুকিং${fresh ? ` · ${bnDigits(fresh)}টি নতুন` : ""}`} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="থেকে" type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} className="w-44" />
        <Field label="পর্যন্ত" type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} className="w-44" />
        <Select label="অবস্থা" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-36">
          <option value="all">সব</option>
          {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>
      <ErrorText>{error}</ErrorText>

      {rows.length === 0 ? (
        <Empty>এই সময়ে কোনো বুকিং নেই</Empty>
      ) : (
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} className={`rounded-3xl bg-surface p-4 shadow-card sm:p-5 ${a.status === "CANCELLED" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-fg">
                    {fmtDate(a.startsAt)}, {fmtTime(a.startsAt)}
                  </div>
                  <div className="mt-0.5 text-sm text-muted">
                    {a.customerName} ·{" "}
                    <a href={`tel:${a.phone}`} className="text-primary hover:underline">
                      {bnDigits(a.phone)}
                    </a>
                  </div>
                </div>
                <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
              </div>
              <div className="mt-3 text-sm text-fg">
                {a.services.map((s) => s.name).join(", ")} · <span className="font-semibold">{taka(a.total)}</span>
              </div>
              <div className="mt-1 text-xs text-subtle">Barber: {barberName(a.barberId)}</div>
              {a.note && <div className="mt-2 rounded-xl bg-surface-2 p-2.5 text-sm text-muted">{a.note}</div>}
              {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {a.status === "PENDING" && (
                    <Button size="sm" disabled={busyId === a.id} onClick={() => act(a, "CONFIRMED")}>
                      নিশ্চিত করুন
                    </Button>
                  )}
                  {a.status === "CONFIRMED" && (
                    <Button size="sm" variant="secondary" disabled={busyId === a.id} onClick={() => act(a, "DONE")}>
                      সম্পন্ন
                    </Button>
                  )}
                  <Button size="sm" variant="danger" disabled={busyId === a.id} onClick={() => act(a, "CANCELLED")}>
                    বাতিল করুন
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
