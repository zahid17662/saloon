import Image from "next/image";
import Link from "next/link";
import type { PublicMenu } from "@/lib/types";
import { ScissorsIcon } from "../icons";
import { BottomNav } from "./bottom-nav";
import { Location } from "./location";
import { Reviews } from "./reviews";
import { Services } from "./services";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { Trending } from "./trending";

/** The customer-facing home page: categories, highlighted services, location, reviews, footer. */
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

  const name = menu.shop.name.trim() || "সেলুন";
  const h2 = "mb-4 text-lg font-bold text-fg";

  return (
    <div className="min-h-dvh">
      <SiteHeader name={name} />

      <main>
        <section id="top" aria-labelledby="hero-h" className="relative isolate flex min-h-[22rem] items-end overflow-hidden bg-primary sm:min-h-[27rem]">
          <Image
            src="/hero-shop.jpg"
            alt="আমাদের পার্লারে চুল কাটা হচ্ছে"
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover object-[68%_18%] saturate-[1.05]"
          />
          {/* photo stays visible at the top; navy rises from the bottom and left so the text is easy to read */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-primary via-primary/60 to-primary/5" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/70 via-primary/20 to-transparent" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />

          <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-9">
            <p className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.3em] text-gold uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-gold" />
              Gents Parlour · সাভার
            </p>
            <h1 id="hero-h" className="font-display mt-3 text-[2.25rem] leading-[1.08] font-bold tracking-tight text-white sm:text-5xl">
              Look Good,
              <br />
              <span className="text-gold">Feel Confident</span>
            </h1>
            <p className="mt-3 text-sm text-white/70">Walk-in স্বাগত · অনলাইনে সিরিয়াল ও আগাম বুকিং</p>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/book"
                className="inline-flex h-12 items-center rounded-full bg-gold px-7 font-bold text-primary shadow-[0_8px_24px_-8px_rgb(214_173_67/0.6)] transition-transform hover:-translate-y-0.5"
              >
                বুক করুন
              </Link>
              <a
                href="#services"
                className="inline-flex h-12 items-center rounded-full border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                সেবা দেখুন
              </a>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-12 px-4 pt-10 pb-14">
          <section id="services" aria-labelledby="services-h" className="scroll-mt-24">
            <h2 id="services-h" className={h2}>
              সেবা
            </h2>
            <Services menu={menu} />
          </section>

          <section id="trending" aria-labelledby="trending-h" className="scroll-mt-24">
            <h2 id="trending-h" className={h2}>
              জনপ্রিয় সেবা
            </h2>
            <Trending menu={menu} />
          </section>

          <Location address={menu.shop.address} phone={menu.shop.phone} />

          <Reviews />
        </div>
      </main>

      <SiteFooter menu={menu} name={name} />
      <BottomNav />
    </div>
  );
}
