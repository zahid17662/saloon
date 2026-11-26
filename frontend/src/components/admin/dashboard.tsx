"use client";

import { useState } from "react";
import Link from "next/link";
import { useCatalog } from "../catalog-context";
import { RangeFilter, useDateRange } from "../range-filter";
import { Badge, cx, Empty, ErrorText, LoadingScreen, TrendPill } from "../ui";
import { HairdresserPortrait } from "../service-icon";
import { rangeLabel } from "./common";
import { SalesChart } from "./sales-chart";
import { useSalesWindow } from "./use-admin-data";
import { byBarber, byService, liveSales, summarize } from "@/lib/reports";
import { bnDigits, receiptNo, taka } from "@/lib/money";
import { fmtDate, fmtDateTime, shiftDays, todayKey, type DateRange } from "@/lib/time";

/** Same-length period immediately before `r`, for the trend pill. */
function previousRange(r: DateRange): DateRange {
  const days = Math.round((Date.parse(r.to) - Date.parse(r.from)) / 86_400_000) + 1;
  return { from: shiftDays(r.from, -days), to: shiftDays(r.to, -days) };
}

const pct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

const linkCls = "text-sm font-medium text-primary hover:underline";

export function Dashboard() {
  const catalog = useCatalog();
  const r = useDateRange("today");
  const [tab, setTab] = useState<"top" | "recent">("top");
  // One request covers the chosen period, the period before it (trend pill) and the 14-day chart.
  const today = todayKey();
  const loaded = useSalesWindow(
    [previousRange(r.range).from, shiftDays(today, -13)].sort()[0],
    [r.range.to, today].sort()[1],
  );
  if (!catalog || !loaded.data) return loaded.error ? <ErrorText>{loaded.error}</ErrorText> : <LoadingScreen />;
  const all = loaded.data;
  const barbers = catalog.barbers;
  const sales = liveSales(all, r.range);
  const prev = summarize(liveSales(all, previousRange(r.range)));
  const t = summarize(sales);
  const avg = t.count ? Math.round(t.total / t.count) : 0;
  const rows = byBarber(sales, barbers);
  const top = byService(sales).slice(0, 5);
  const recent = [...all].sort((a, z) => z.id - a.id).slice(0, 5);
  const vsLabel = r.preset === "today" ? "গতকালের তুলনায়" : "আগের সময়ের তুলনায়";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg max-lg:sr-only">ড্যাশবোর্ড</h1>
          <p className="text-sm text-muted">
            {r.preset === "today" ? fmtDate(new Date().toISOString()) : rangeLabel(r.range)}
          </p>
        </div>
        <RangeFilter state={r} />
      </div>

      {/* One quiet card: headline total, three small figures, and the 14-day line. */}
      <section className="rounded-3xl bg-primary p-5 text-white shadow-card sm:p-6 xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:gap-10">
        <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-white/70">মোট বিক্রি</p>
            <p className="mt-1 text-[34px] leading-none font-bold tabular-nums sm:text-4xl">{taka(t.total)}</p>
          </div>
          <TrendPill value={pct(t.total, prev.total)} onDark />
        </div>
        <p className="mt-1.5 text-xs text-white/60">{vsLabel}</p>
        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4">
          <div>
            <dt className="text-xs text-white/60">মালিকের ভাগ</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums text-gold sm:text-lg">{taka(t.ownerShare)}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/60">কাস্টমার</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums sm:text-lg">{bnDigits(t.count)}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/60">গড় বিল</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums sm:text-lg">{taka(avg)}</dd>
          </div>
        </dl>
        </div>
        <div className="mt-4 border-t border-white/15 pt-3 xl:mt-0 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-10">
          <p className="mb-1 text-xs text-white/60">গত ১৪ দিন</p>
          <SalesChart sales={all} bare dark />
        </div>
      </section>

      {/* Everything below is plain lists on the page background: no more boxes. */}
      <div className="mt-8 grid gap-x-12 gap-y-8 xl:grid-cols-3">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-fg">Hairdresser</h2>
            <Link href="/admin/reports" className={linkCls}>রিপোর্ট</Link>
          </div>
          {rows.length === 0 ? (
            <Empty>এই সময়ে কোনো বিক্রি নেই</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((x) => (
                <li key={x.barberId} className="flex items-center gap-3 py-3">
                  <HairdresserPortrait id={x.barberId} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-fg">{x.barberName}</div>
                    <div className="text-xs text-muted">{bnDigits(x.count)} কাস্টমার · {bnDigits(x.services)} সার্ভিস</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold tabular-nums text-fg">{taka(x.total)}</div>
                    <div className="text-xs text-muted tabular-nums">মালিক {taka(x.ownerShare)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Phone: one list at a time behind two tabs. Wide screens: both lists side by side. */}
        <section className="xl:col-span-2">
          <div role="tablist" aria-label="তালিকা" className="mb-3 flex gap-5 border-b border-line xl:hidden">
            {([["top", "শীর্ষ সার্ভিস"], ["recent", "সাম্প্রতিক এন্ট্রি"]] as const).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cx(
                  "relative -mb-px py-2.5 text-sm font-semibold transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full",
                  tab === id ? "text-primary after:bg-gold" : "text-muted after:bg-transparent",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="xl:grid xl:grid-cols-2 xl:gap-12">
            <div className={cx(tab === "top" ? "block" : "hidden", "xl:block")}>
              <h2 className="mb-2 hidden text-base font-semibold text-fg xl:block">শীর্ষ সার্ভিস</h2>
              {top.length === 0 ? (
                <Empty>এই সময়ে কোনো বিক্রি নেই</Empty>
              ) : (
                <ul className="divide-y divide-line">
                  {top.map((x, i) => (
                    <li key={x.name} className="flex items-center gap-3 py-2.5">
                      <span className={cx("w-4 text-sm font-bold tabular-nums", i === 0 ? "text-gold-ink" : "text-subtle")}>{bnDigits(i + 1)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-fg">{x.name}</div>
                        <div className="text-xs text-muted">{bnDigits(x.qty)} বার</div>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-primary-soft">
                          <div className="h-full rounded-full bg-gold" style={{ width: `${t.total > 0 ? Math.max(4, Math.round((x.revenue / t.total) * 100)) : 0}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold tabular-nums text-fg">{taka(x.revenue)}</div>
                        <div className="text-xs text-muted tabular-nums">
                          {bnDigits(t.total > 0 ? Math.round((x.revenue / t.total) * 100) : 0)}%
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className={cx(tab === "recent" ? "block" : "hidden", "xl:block")}>
              <div className="mb-2 hidden items-center justify-between xl:flex">
                <h2 className="text-base font-semibold text-fg">সাম্প্রতিক এন্ট্রি</h2>
                <Link href="/admin/sales" className={linkCls}>সব দেখুন</Link>
              </div>
              {recent.length === 0 ? (
                <Empty>এখনো কোনো বিক্রি হয়নি</Empty>
              ) : (
                <ul className="divide-y divide-line">
                  {recent.map((sale) => (
                    <li key={sale.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-fg">
                          {barbers.find((b) => b.id === sale.barberId)?.name}
                        </div>
                        <div className="truncate text-xs text-muted">
                          {receiptNo(sale.id)} · {fmtDateTime(sale.createdAt)}
                        </div>
                      </div>
                      {sale.voidedAt ? (
                        <Badge tone="red">বাতিল</Badge>
                      ) : (
                        <span className="text-sm font-semibold tabular-nums">{taka(sale.total)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/admin/sales" className={cx(linkCls, "mt-2 inline-block xl:hidden")}>সব দেখুন</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
