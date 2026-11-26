import Image from "next/image";
import Link from "next/link";
import { bnDigits } from "@/lib/money";
import type { PublicMenu } from "@/lib/types";
import { CalendarIcon, PhoneIcon, PinIcon, ScissorsIcon } from "../icons";
import { Logo } from "../logo";
import { HairdresserPortrait } from "../service-icon";
import { BookingProvider } from "./booking-context";
import { BookTabs } from "./book-tabs";
import { BottomNav } from "./bottom-nav";
import { Services } from "./services";

/** The customer-facing home page. No login; staff and admin have their own entrances in the footer. */
export function Landing({ menu }: { menu: PublicMenu | null }) {
  if (!menu) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <ScissorsIcon className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-fg">
          পেজটি এখন লোড করা যাচ্ছে না
        </h1>
        <p className="text-sm text-muted">কিছুক্ষণ পরে আবার চেষ্টা করুন।</p>
        <Link
          href="/staff"
          className="mt-4 text-xs text-subtle hover:text-primary"
        >
          স্টাফ লগইন
        </Link>
      </main>
    );
  }

  const { shop } = menu;
  const name = shop.name.trim() || "সেলুন";
  const h2 = "mb-5 text-xl font-bold text-fg";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size={38} />
            <span className="font-display truncate text-sm font-semibold tracking-[0.08em] text-fg sm:text-base">
              {name}
            </span>
          </div>
          <a
            href="#book"
            className="inline-flex h-10 flex-none items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold whitespace-nowrap text-gold transition-colors hover:bg-primary-hover"
          >
            <CalendarIcon className="h-4 w-4" />
            বুক করুন
          </a>
        </div>
      </header>

      <BookingProvider>
        <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <section
            id="top"
            aria-labelledby="hero-h"
            className="relative isolate flex min-h-[27rem] items-end overflow-hidden sm:min-h-[32rem]"
          >
            <Image
              src="/hero-shop.jpg"
              alt="আমাদের পার্লারে চুল কাটা হচ্ছে"
              fill
              priority
              sizes="100vw"
              className="-z-10 object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-t from-primary via-primary/80 to-primary/40"
            />
            <div className="mx-auto w-full max-w-5xl px-4 pt-20 pb-10 sm:pb-14">
              <p className="text-[11px] font-semibold tracking-[0.3em] text-gold uppercase">
                Gents Parlour
              </p>
              <h1
                id="hero-h"
                className="font-display mt-4 text-[2.5rem] leading-[1.06] font-bold tracking-tight text-white sm:text-6xl"
              >
                Look Good,
                <br />
                <span className="text-gold">Feel Confident</span>
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
                সেবা আর দাম দেখে আগেই বুক করুন। লাইনে দাঁড়াতে হবে না।
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href="#book"
                  className="inline-flex h-12 items-center rounded-full bg-gold px-7 font-bold text-primary transition-transform hover:-translate-y-0.5"
                >
                  বুক করুন
                </a>
                <a
                  href="#services"
                  className="text-[15px] font-medium text-white/85 hover:text-white"
                >
                  সেবা ও দাম ↓
                </a>
              </div>
            </div>
          </section>

          <div className="mx-auto max-w-5xl space-y-14 px-4 pt-12 pb-16">
            <section aria-labelledby="about-h">
              <h2 id="about-h" className={h2}>
                আমাদের সম্পর্কে
              </h2>
              <p className="max-w-xl text-[15px] leading-relaxed text-muted">
                ছেলেদের জন্য হেয়ারকাট, দাড়ি ট্রিম, ফেসিয়াল ও হেয়ার কেয়ার। সব সেবার
                দাম নিচে দেখুন, পছন্দের Hairdresser বেছে আগেই বুক করুন।
              </p>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-line py-4 text-center">
                {[
                  { k: "সেবা", v: `${bnDigits(menu.services.length)}টি` },
                  {
                    k: "Hairdresser",
                    v: `${bnDigits(menu.barbers.length)} জন`,
                  },
                  { k: "খোলা", v: "১০টা–৯টা" },
                ].map((x) => (
                  <div key={x.k}>
                    <dt className="text-xs text-muted">{x.k}</dt>
                    <dd className="mt-0.5 font-semibold text-fg">{x.v}</dd>
                  </div>
                ))}
              </dl>
              {(shop.address || shop.phone) && (
                <div className="mt-4 space-y-1.5 text-sm text-muted">
                  {shop.address && (
                    <div className="flex items-center gap-2">
                      <PinIcon className="h-4 w-4 flex-none text-primary" />
                      {shop.address}
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 flex-none text-primary" />
                      <a
                        href={`tel:${shop.phone}`}
                        className="hover:text-primary"
                      >
                        {bnDigits(shop.phone)}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section
              id="services"
              aria-labelledby="services-h"
              className="scroll-mt-20"
            >
              <h2 id="services-h" className={h2}>
                সেবা ও দাম
              </h2>
              <Services menu={menu} />
            </section>

            {menu.barbers.length > 0 && (
              <section aria-labelledby="barbers-h">
                <h2 id="barbers-h" className={h2}>
                  আমাদের Hairdresser
                </h2>
                <ul className="flex gap-6 overflow-x-auto pb-1">
                  {menu.barbers.map((b) => (
                    <li
                      key={b.id}
                      className="flex flex-none flex-col items-center gap-2 text-center"
                    >
                      <HairdresserPortrait
                        id={b.id}
                        size={64}
                        className="ring-2 ring-gold/40"
                      />
                      <span className="text-sm font-semibold text-fg">
                        {b.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="how-h">
              <h2 id="how-h" className={h2}>
                কীভাবে কাজ করে
              </h2>
              <ol className="grid gap-5 sm:grid-cols-3">
                {[
                  {
                    t: "বুক করুন",
                    d: "সেবা ও Hairdresser বেছে নাম আর মোবাইল নম্বর দিন।",
                  },
                  {
                    t: "নিশ্চিত হবে",
                    d: "আপনার বুকিং দোকানের স্ক্রিনে যাবে, Hairdresser নিশ্চিত করবেন।",
                  },
                  {
                    t: "অবস্থা দেখুন",
                    d: "আপনার সিরিয়াল, সামনে কতজন আর কতক্ষণ বাকি, সব দেখতে পাবেন।",
                  },
                ].map((x, i) => (
                  <li key={x.t} className="flex gap-3">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary text-sm font-bold text-gold">
                      {bnDigits(i + 1)}
                    </span>
                    <div>
                      <div className="font-semibold text-fg">{x.t}</div>
                      <p className="mt-0.5 text-sm text-muted">{x.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href="/track"
                className="mt-5 inline-block text-[15px] font-medium text-primary hover:underline"
              >
                আমার সিরিয়াল দেখুন →
              </Link>
            </section>

            <section
              id="book"
              aria-labelledby="book-h"
              className="scroll-mt-20"
            >
              <h2 id="book-h" className={h2}>
                বুক করুন
              </h2>
              <BookTabs menu={menu} />
            </section>
          </div>
        </main>
      </BookingProvider>

      <footer className="border-t border-line bg-surface pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-6">
          <div className="flex items-center gap-3">
            <Logo size={44} />
            <div>
              <div className="text-sm font-semibold text-fg">{name}</div>
              <div className="text-xs text-subtle">
                প্রতিদিন সকাল ১০টা থেকে রাত ৯টা
              </div>
            </div>
          </div>
          <Link
            href="/staff"
            className="text-xs text-subtle hover:text-primary"
          >
            স্টাফ লগইন
          </Link>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
