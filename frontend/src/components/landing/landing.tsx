import Link from "next/link";
import { bnDigits, taka } from "@/lib/money";
import type { PublicMenu } from "@/lib/types";
import { CalendarIcon, PhoneIcon, PinIcon, ScissorsIcon } from "../icons";
import { Logo } from "../logo";
import { HairdresserPortrait, ServiceArt } from "../service-icon";
import { BookingForm } from "./booking-form";
import { PopularServices } from "./popular";
import { QueueJoin } from "./queue-join";

/** The customer-facing home page. No login; staff and admin have their own entrances in the footer. */
const TINTS = ["bg-gold/25", "bg-primary-soft", "bg-peach", "bg-mint"];

export function Landing({ menu }: { menu: PublicMenu | null }) {
  if (!menu) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <ScissorsIcon className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-fg">পেজটি এখন লোড করা যাচ্ছে না</h1>
        <p className="text-sm text-muted">কিছুক্ষণ পরে আবার চেষ্টা করুন।</p>
        <Link href="/staff" className="mt-4 text-xs text-subtle hover:text-primary">
          স্টাফ লগইন
        </Link>
      </main>
    );
  }

  const { shop } = menu;
  const name = shop.name.trim() || "সেলুন";
  const groups = menu.categories
    .map((c) => ({ ...c, items: menu.services.filter((s) => s.categoryId === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size={38} />
            <span className="font-display truncate text-sm font-semibold tracking-[0.08em] text-fg sm:text-base">{name}</span>
          </div>
          <a
            href="#book"
            className="inline-flex h-10 flex-none items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold whitespace-nowrap text-gold shadow-card transition-colors hover:bg-primary-hover"
          >
            <CalendarIcon className="h-4 w-4" />
            বুক করুন
          </a>
        </div>
        <div aria-hidden="true" className="h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-4 pb-16">
        <section className="relative -mx-4 mt-0 overflow-hidden rounded-b-[2.5rem] bg-primary px-6 pt-11 text-white shadow-pop sm:mx-0 sm:mt-6 sm:rounded-[2.5rem] sm:px-12 sm:pt-0">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_82%_30%,rgb(245_197_24/0.13),transparent)]" />
          <div className="relative grid items-end gap-2 sm:grid-cols-[1.15fr_0.85fr] sm:gap-6">
            <div className="sm:py-16">
              <p className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.3em] text-gold uppercase">
                <span aria-hidden="true" className="h-px w-8 bg-gold/70" />
                Gents Parlour
              </p>
              <h1 className="font-display mt-5 text-[2.6rem] leading-[1.06] font-bold tracking-tight sm:text-6xl">
                Look Good,
                <br />
                <span className="text-gold">Feel Confident</span>
              </h1>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
                সেবা আর দাম দেখে, পছন্দের Hairdresser ও সময় বেছে আগেই বুক করুন। লাইনে দাঁড়াতে হবে না।
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#book" className="inline-flex h-12 items-center rounded-full bg-gold px-7 font-bold text-primary shadow-[0_12px_28px_-8px_rgb(245_197_24/0.55)] transition-transform hover:-translate-y-0.5">
                  অ্যাপয়েন্টমেন্ট নিন
                </a>
                <a href="#services" className="inline-flex h-12 items-center rounded-full border border-white/25 px-7 font-medium text-white transition-colors hover:bg-white/10">
                  সেবা ও দাম
                </a>
              </div>
              <dl className="mt-9 flex gap-8 border-t border-white/10 pt-5">
                {[
                  { k: "সেবা", v: bnDigits(menu.services.length) },
                  { k: "Hairdresser", v: bnDigits(menu.barbers.length) },
                  { k: "লাইভ কিউ", v: "চালু" },
                ].map((x) => (
                  <div key={x.k}>
                    <dt className="text-xs text-white/55">{x.k}</dt>
                    <dd className="font-display mt-0.5 text-2xl font-bold text-gold">{x.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative mx-auto mt-4 w-[78%] max-w-sm sm:mt-0 sm:w-full">
              <div aria-hidden="true" className="absolute inset-x-0 top-6 bottom-0 rounded-t-full border border-gold/30" />
              <div className="relative mx-3 overflow-hidden rounded-t-full bg-gradient-to-b from-gold to-gold/70 pt-10">
                <ServiceArt name="Hair Cutting" size={400} className="block h-auto w-full" />
              </div>
            </div>
          </div>
        </section>

        <PopularServices menu={menu} />

        <section id="services" aria-labelledby="services-h" className="scroll-mt-20">
          <h2 id="services-h" className="mb-4 text-xl font-bold text-fg">
            সেবা ও দাম
          </h2>
          {groups.length === 0 ? (
            <p className="rounded-3xl bg-surface p-6 text-center text-sm text-muted shadow-card">সেবার তালিকা শীঘ্রই যোগ হবে।</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map((g, gi) => (
                <div key={g.id} className="rounded-3xl bg-surface p-5 shadow-card">
                  <h3 className="mb-3 inline-flex rounded-full bg-primary-soft px-3.5 py-1.5 text-sm font-bold text-primary">{g.name}</h3>
                  <ul className="divide-y divide-line">
                    {g.items.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
                        <span className="flex min-w-0 items-center gap-3 text-fg"><span className={`h-12 w-12 flex-none overflow-hidden rounded-2xl ${TINTS[gi % TINTS.length]}`}><ServiceArt name={s.name} size={48} className="block" /></span><span className="min-w-0 break-words font-medium">{s.name}</span></span>
                        <span className="font-bold text-gold-ink tabular-nums">{taka(s.price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {menu.barbers.length > 0 && (
          <section aria-labelledby="barbers-h">
            <h2 id="barbers-h" className="mb-4 text-xl font-bold text-fg">
              আমাদের Hairdresser
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {menu.barbers.map((b) => (
                <li key={b.id} className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-5 text-center shadow-card">
                  <HairdresserPortrait id={b.id} size={80} className="ring-4 ring-gold/40" />
                  <span className="font-semibold text-fg">{b.name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="book" aria-labelledby="book-h" className="scroll-mt-20">
          <h2 id="book-h" className="mb-1 text-xl font-bold text-fg">
            এখনই লাইনে যুক্ত হোন
          </h2>
          <p className="mb-4 text-sm text-muted">
            পছন্দের Hairdresser বেছে নিন। তিনি ফাঁকা থাকলে সরাসরি কাটবেন, না হলে তাঁর সারিতে সিরিয়াল পাবেন।
          </p>
          <QueueJoin menu={menu} />
          <h3 className="mt-10 mb-1 text-lg font-bold text-fg">আগাম সময় বেছে বুকিং</h3>
          <p className="mb-4 text-sm text-muted">নির্দিষ্ট সময়ে আসতে চাইলে এখান থেকে বুক করুন। দোকান নিশ্চিত করবে।</p>
          <BookingForm menu={menu} />
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 text-sm text-muted">
            <div className="font-semibold text-fg">{name}</div>
            {shop.address && (
              <div className="flex items-center gap-2">
                <PinIcon className="h-4 w-4 text-primary" />
                {shop.address}
              </div>
            )}
            {shop.phone && (
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-primary" />
                <a href={`tel:${shop.phone}`} className="hover:text-primary">
                  {bnDigits(shop.phone)}
                </a>
              </div>
            )}
            <div className="text-xs text-subtle">প্রতিদিন সকাল ১০টা থেকে রাত ৯টা</div>
          </div>
          <Link href="/staff" className="text-xs text-subtle hover:text-primary">
            স্টাফ লগইন
          </Link>
        </div>
      </footer>
    </div>
  );
}
