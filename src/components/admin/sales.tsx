"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveStore } from "../gates";
import { RangeFilter, useDateRange } from "../range-filter";
import { Badge, Button, Empty, ErrorText, Field, Modal, PageTitle, Select } from "../ui";
import { errMsg, rangeLabel, TableWrap, td, tdNum, th, thNum } from "./common";
import { voidSale } from "@/lib/store";
import { inRange } from "@/lib/time";
import { bnDigits, receiptNo, taka } from "@/lib/money";
import { fmtDateTime } from "@/lib/time";
import { PAYMENT_LABELS, type Sale } from "@/lib/types";

const PAGE = 30;

export function SalesList() {
  const s = useLiveStore();
  const r = useDateRange("today");
  const [barberId, setBarberId] = useState("all");
  const [status, setStatus] = useState<"all" | "live" | "void">("all");
  const [limit, setLimit] = useState(PAGE);
  const [voidTarget, setVoidTarget] = useState<Sale | null>(null);

  const filtered = s.db.sales
    .filter(
      (x) =>
        inRange(x.createdAt, r.range) &&
        (barberId === "all" || x.barberId === Number(barberId)) &&
        (status === "all" || (status === "void" ? !!x.voidedAt : !x.voidedAt)),
    )
    .sort((a, z) => z.id - a.id);
  const liveTotal = filtered.filter((x) => !x.voidedAt).reduce((n, x) => n + x.total, 0);
  const barberName = (id: number) => s.db.barbers.find((b) => b.id === id)?.name ?? "—";

  return (
    <>
      <PageTitle
        title="বিক্রির তালিকা"
        sub={`${rangeLabel(r.range)} · ${bnDigits(filtered.length)}টি এন্ট্রি · ${taka(liveTotal)}`}
      />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <RangeFilter state={r} />
        <Select label="নাপিত" value={barberId} onChange={(e) => setBarberId(e.target.value)} className="w-40">
          <option value="all">সবাই</option>
          {s.db.barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {!b.active ? " (নিষ্ক্রিয়)" : ""}
            </option>
          ))}
        </Select>
        <Select
          label="অবস্থা"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="w-36"
        >
          <option value="all">সব</option>
          <option value="live">চালু</option>
          <option value="void">বাতিল</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Empty>কোনো এন্ট্রি পাওয়া যায়নি</Empty>
      ) : (
        <>
          <TableWrap>
            <thead className="border-b border-line">
              <tr>
                <th className={th}>রসিদ</th>
                <th className={th}>সময়</th>
                <th className={th}>নাপিত</th>
                <th className={th}>সার্ভিস</th>
                <th className={thNum}>মোট</th>
                <th className={th}>পেমেন্ট</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.slice(0, limit).map((x) => (
                <tr key={x.id} className={x.voidedAt ? "opacity-60" : ""}>
                  <td className={td}>
                    <span className="font-mono text-xs">{receiptNo(x.id)}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap text-muted`}>{fmtDateTime(x.createdAt)}</td>
                  <td className={td}>{barberName(x.barberId)}</td>
                  <td className={`${td} max-w-64`}>
                    <span className={x.voidedAt ? "line-through" : ""}>
                      {x.items.map((i) => (i.qty > 1 ? `${i.nameSnapshot} ×${bnDigits(i.qty)}` : i.nameSnapshot)).join(", ")}
                    </span>
                    {x.voidedAt && (
                      <div className="mt-1 text-xs text-danger">
                        বাতিল ({x.voidedBy === "ADMIN" ? "এডমিন" : "নাপিত"}): {x.voidReason}
                      </div>
                    )}
                  </td>
                  <td className={tdNum}>{taka(x.total)}</td>
                  <td className={td}>
                    {x.voidedAt ? <Badge tone="red">বাতিল</Badge> : <Badge>{PAYMENT_LABELS[x.paymentMethod]}</Badge>}
                  </td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <Link
                      href={`/receipt/${x.id}?from=admin`}
                      className="mr-2 text-sm text-primary hover:underline"
                    >
                      রসিদ
                    </Link>
                    {!x.voidedAt && (
                      <Button variant="danger" size="sm" onClick={() => setVoidTarget(x)}>
                        বাতিল
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {filtered.length > limit && (
            <div className="mt-4 text-center">
              <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
                আরো দেখুন ({bnDigits(filtered.length - limit)})
              </Button>
            </div>
          )}
        </>
      )}

      <Modal open={!!voidTarget} title="বিক্রি বাতিল" onClose={() => setVoidTarget(null)}>
        {voidTarget && <VoidForm key={voidTarget.id} sale={voidTarget} onDone={() => setVoidTarget(null)} />}
      </Modal>
    </>
  );
}

function VoidForm({ sale, onDone }: { sale: Sale; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          voidSale(sale.id, "ADMIN", reason);
          onDone();
        } catch (err) {
          setError(errMsg(err));
        }
      }}
    >
      <p className="text-sm text-muted">
        {receiptNo(sale.id)} · {taka(sale.total)}। বাতিল করলে এটি সব হিসাব ও নাপিতের পাওনা থেকে বাদ যাবে, তবে তালিকায় থাকবে।
      </p>
      <Field label="কারণ" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="যেমন: ভুল নাপিতের নামে এন্ট্রি" required autoFocus />
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
          না
        </Button>
        <Button type="submit" variant="danger" className="flex-1">
          বাতিল করুন
        </Button>
      </div>
    </form>
  );
}
