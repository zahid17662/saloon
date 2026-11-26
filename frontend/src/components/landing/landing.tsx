import Image from "next/image";
import Link from "next/link";
import { bnDigits } from "@/lib/money";
import type { PublicMenu } from "@/lib/types";
import { PhoneIcon, PinIcon, ScissorsIcon } from "../icons";
import { Logo } from "../logo";
import { BottomNav } from "./bottom-nav";
import { Services } from "./services";
import { Trending } from "./trending";

/** The customer-facing home page: categories, a few highlighted services, and the footer. */
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
  const h2 = "mb-4 text-lg font-bold text-fg";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size={38} />
            <span className="font-display truncate text-sm font-semibold tracking-[0.08em] text-fg sm:text-base">{name}</span>
          </div>
          <Link
            href="/book"
            className="inline-flex h-10 flex-none items-center rounded-full bg-primary px-5 text-sm font-semibold whitespace-nowrap text-gold transition-colors hover:bg-primary-hover"
          >
            বুক করুন
          </Link>
        </div>
      </header>

      <main>
        <section id="top" aria-labelledby="hero-h" className="relative isolate flex min-h-[22rem] items-end overflow-hidden sm:min-h-[26rem]">
          <Image src="/hero-shop.jpg" alt="আমাদের পার্লারে চুল কাটা হচ্ছে" fill priority sizes="100vw" className="-z-10 object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-primary via-primary/80 to-primary/40" />
          <div className="mx-auto w-full max-w-5xl px-4 pt-16 pb-9">
            <p className="text-[11px] font-semibold tracking-[0.3em] text-gold uppercase">Gents Parlour</p>
            <h1 id="hero-h" className="font-display mt-3 text-[2.25rem] leading-[1.08] font-bold tracking-tight text-white sm:text-5xl">
              Look Good,
              <br />
              <span className="text-gold">Feel Confident</span>
            </h1>
            <Link
              href="/book"
              className="mt-6 inline-flex h-12 items-center rounded-full bg-gold px-7 font-bold text-primary transition-transform hover:-translate-y-0.5"
            >
              বুক করুন
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-5xl space-y-10 px-4 pt-9 pb-14">
          <section id="services" aria-labelledby="services-h" className="scroll-mt-20">
            <h2 id="services-h" className={h2}>
              সেবা
            </h2>
            <Services menu={menu} />
          </section>

          <section aria-labelledby="trending-h">
            <h2 id="trending-h" className={h2}>
              জনপ্রিয় সেবা
            </h2>
            <Trending menu={menu} />
          </section>
        </div>
      </main>

      <footer className="border-t border-line bg-surface pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex items-center gap-3">
            <Logo size={44} />
            <div>
              <div className="font-semibold text-fg">{name}</div>
              <div className="text-xs text-subtle">প্রতিদিন সকাল ১০টা থেকে রাত ৯টা</div>
            </div>
          </div>
          <div className="mt-5 grid gap-2 text-sm text-muted sm:grid-cols-2">
            {shop.address && (
              <div className="flex items-start gap-2">
                <PinIcon className="mt-0.5 h-4 w-4 flex-none text-primary" />
                {shop.address}
              </div>
            )}
            {shop.phone && (
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 flex-none text-primary" />
                <a href={`tel:${shop.phone}`} className="hover:text-primary">{bnDigits(shop.phone)}</a>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-subtle">
            <Link href="/track" className="font-medium text-primary hover:underline">আমার সিরিয়াল দেখুন</Link>
            <Link href="/staff" className="hover:text-primary">স্টাফ লগইন</Link>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
