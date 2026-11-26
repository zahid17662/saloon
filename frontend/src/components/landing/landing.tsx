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
        <section id="top" aria-labelledby="hero-h" className="relative isolate flex min-h-[22rem] items-end overflow-hidden sm:min-h-[27rem]">
          <Image src="/hero-shop.jpg" alt="আমাদের পার্লারে চুল কাটা হচ্ছে" fill priority sizes="100vw" className="-z-10 object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-primary via-primary/80 to-primary/40" />
          <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-10">
            <p className="text-[11px] font-semibold tracking-[0.3em] text-gold uppercase">Gents Parlour · সাভার</p>
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
