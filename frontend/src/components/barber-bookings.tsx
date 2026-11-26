"use client";

import { useCallback, useEffect, useState } from "react";
import { listBarberAppointments, setBarberAppointmentStatus } from "@/api/appointments";
import { NET_ERR } from "@/lib/messages";
import { bnDigits, taka } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/time";
import type { Appointment } from "@/lib/types";
import { Badge, Button, ErrorText } from "./ui";

/** A Hairdresser's online bookings. They, not the admin, confirm or cancel them; "যে কেউ" bookings go to whoever confirms first. */
export function BarberBookings({ barberId }: { barberId: number }) {
  const [rows, setRows] = useState<Appointment[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let current = true;
    listBarberAppointments(barberId)
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
  }, [barberId, reload]);

  const act = useCallback(
    async (a: Appointment, next: "CONFIRMED" | "CANCELLED" | "DONE") => {
      setBusyId(a.id);
      setError("");
      try {
        const r = await setBarberAppointmentStatus(a.id, barberId, next);
        if (!r.ok) setError(r.error);
        setReload((n) => n + 1);
      } catch {
        setError(NET_ERR);
      } finally {
        setBusyId(null);
      }
    },
    [barberId],
  );

  if (!rows || rows.length === 0) return error ? <ErrorText>{error}</ErrorText> : null;
  const fresh = rows.filter((a) => a.status === "PENDING").length;

  return (
    <section aria-labelledby="bookings-h" className="mb-5 rounded-3xl bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="bookings-h" className="text-base font-bold text-fg">
          অনলাইন বুকিং
        </h2>
        {fresh > 0 && <Badge tone="gold">{bnDigits(fresh)}টি নতুন</Badge>}
      </div>
      <ErrorText>{error}</ErrorText>
      <ul className="divide-y divide-line">
        {rows.map((a) => (
          <li key={a.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
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
              <Badge tone={a.status === "CONFIRMED" ? "green" : "gold"}>{a.status === "CONFIRMED" ? "নিশ্চিত" : "নতুন"}</Badge>
            </div>
            <div className="mt-2 text-sm text-fg">
              {a.services.map((s) => s.name).join(", ")} · <span className="font-semibold">{taka(a.total)}</span>
              {a.barberId == null && <span className="ml-2 text-xs text-subtle">(যে কেউ)</span>}
            </div>
            {a.note && <div className="mt-2 rounded-xl bg-surface-2 p-2.5 text-sm text-muted">{a.note}</div>}
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
          </li>
        ))}
      </ul>
    </section>
  );
}
