"use client";

import { useState } from "react";
import { useLiveStore } from "../gates";
import { Badge, Button, Card, Empty, ErrorText, Field, Modal, PageTitle, Select } from "../ui";
import { errMsg, TableWrap, td, tdNum, th, thNum } from "./common";
import { addPayout, canDeletePayout, deletePayout } from "@/lib/store";
import { barberBalance } from "@/lib/reports";
import { bnDigits, parseIntInput, taka } from "@/lib/money";
import { dhakaDateToIso, fmtDate, todayKey } from "@/lib/time";
import type { Barber } from "@/lib/types";

export function Payouts() {
  const s = useLiveStore();
  const [payTo, setPayTo] = useState<Barber | null>(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  const cards = s.db.barbers
    .map((b) => ({ barber: b, ...barberBalance(b.id, s.db.sales, s.db.payouts) }))
    .filter((c) => c.barber.active || c.balance !== 0)
    .sort((a, z) => a.barber.sortOrder - z.barber.sortOrder);
  const totalOwed = cards.reduce((n, c) => n + Math.max(0, c.balance), 0);

  const history = s.db.payouts
    .filter((p) => filter === "all" || p.barberId === Number(filter))
    .sort((a, z) => (a.paidAt < z.paidAt ? 1 : a.paidAt > z.paidAt ? -1 : z.id - a.id));

  return (
    <>
      <PageTitle title="নাপিতের পেমেন্ট" sub={`মোট পাওনা ${taka(totalOwed)}`} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ barber, earned, paid, balance }) => (
          <Card key={barber.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-fg">{barber.name}</div>
                {!barber.active && <Badge>নিষ্ক্রিয়</Badge>}
              </div>
              <Button size="sm" onClick={() => setPayTo(barber)}>
                টাকা দিন
              </Button>
            </div>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">মোট আয়</dt>
                <dd className="tabular-nums">{taka(earned)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">দেওয়া হয়েছে</dt>
                <dd className="tabular-nums">{taka(paid)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                <dt>{balance < 0 ? "অগ্রিম" : "বাকি"}</dt>
                <dd className={balance < 0 ? "text-danger tabular-nums" : "text-primary tabular-nums"}>
                  {taka(Math.abs(balance))}
                </dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>

      <div className="mt-8 mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold text-fg">পেমেন্টের ইতিহাস</h2>
        <Select label="নাপিত" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40">
          <option value="all">সবাই</option>
          {s.db.barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </div>
      <ErrorText>{error}</ErrorText>
      {history.length === 0 ? (
        <Empty>এখনো কোনো পেমেন্ট দেওয়া হয়নি</Empty>
      ) : (
        <TableWrap>
          <thead className="border-b border-line">
            <tr>
              <th className={th}>তারিখ</th>
              <th className={th}>নাপিত</th>
              <th className={thNum}>টাকা</th>
              <th className={th}>নোট</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {history.map((p) => (
              <tr key={p.id}>
                <td className={`${td} whitespace-nowrap`}>{fmtDate(p.paidAt)}</td>
                <td className={td}>{s.db.barbers.find((b) => b.id === p.barberId)?.name}</td>
                <td className={tdNum}>{taka(p.amount)}</td>
                <td className={`${td} text-muted`}>{p.note || "—"}</td>
                <td className={`${td} text-right`}>
                  {canDeletePayout(p) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!window.confirm(`${taka(p.amount)} এর পেমেন্টটি মুছবেন?`)) return;
                        try {
                          deletePayout(p.id);
                          setError("");
                        } catch (e) {
                          setError(errMsg(e));
                        }
                      }}
                    >
                      মুছুন
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal open={!!payTo} title={`${payTo?.name ?? ""}-কে টাকা দিন`} onClose={() => setPayTo(null)}>
        {payTo && (
          <PayoutForm
            key={payTo.id}
            barber={payTo}
            suggested={Math.max(0, barberBalance(payTo.id, s.db.sales, s.db.payouts).balance)}
            onDone={() => setPayTo(null)}
          />
        )}
      </Modal>
    </>
  );
}

function PayoutForm({ barber, suggested, onDone }: { barber: Barber; suggested: number; onDone: () => void }) {
  const [amount, setAmount] = useState(suggested > 0 ? String(suggested) : "");
  const [date, setDate] = useState(todayKey());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const value = parseIntInput(amount);
        if (value === null || value <= 0) return setError("টাকার পরিমাণ সঠিক নয়");
        try {
          addPayout(barber.id, value, dhakaDateToIso(date), note);
          onDone();
        } catch (err) {
          setError(errMsg(err));
        }
      }}
    >
      <p className="text-sm text-muted">
        বর্তমান বাকি: <span className="text-primary">{taka(suggested)}</span>
        {suggested > 0 && ` (${bnDigits(barber.commissionPct)}% হারে)`}
      </p>
      <Field label="টাকার পরিমাণ (৳)" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
      <Field label="তারিখ" type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} required />
      <Field label="নোট (ঐচ্ছিক)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="যেমন: সাপ্তাহিক পেমেন্ট" />
      <ErrorText>{error}</ErrorText>
      <Button type="submit" className="w-full">
        পেমেন্ট সেভ করুন
      </Button>
    </form>
  );
}
