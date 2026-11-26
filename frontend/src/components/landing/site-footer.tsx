import Image from "next/image";
import Link from "next/link";
import { Logo } from "../logo";
import { PhoneIcon, PinIcon } from "../icons";
import { bnDigits } from "@/lib/money";
import type { PublicMenu } from "@/lib/types";

const QUICK = [
  { href: "/book", label: "বুক করুন" },
  { href: "/track", label: "আমার সিরিয়াল" },
  { href: "#services", label: "সেবা ও দাম" },
  { href: "#location", label: "লোকেশন" },
] as const;

export function SiteFooter({ menu, name }: { menu: PublicMenu; name: string }) {
  const { shop } = menu;
  return (
    <footer className="border-t border-line bg-primary text-white/70 pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <Logo size={46} />
              <div>
                <div className="font-display text-sm font-semibold tracking-[0.08em] text-white">{name}</div>
                <div className="text-xs text-gold">ভালো দেখুন, আত্মবিশ্বাসী থাকুন</div>
              </div>
            </div>
            <div className="mt-5 space-y-2.5 text-sm">
              {shop.address && (
                <p className="flex items-start gap-2">
                  <PinIcon className="mt-0.5 h-4 w-4 flex-none text-gold" />
                  <span>
                    {shop.address}
                    <br />
                    সাভার, ঢাকা
                  </span>
                </p>
              )}
              {shop.phone && (
                <p className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 flex-none text-gold" />
                  <a href={`tel:${shop.phone}`} className="transition-colors hover:text-white">{bnDigits(shop.phone)}</a>
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">সেবা</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {menu.categories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href="#services" className="transition-colors hover:text-white">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">দ্রুত লিংক</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {QUICK.map((q) => (
                <li key={q.href}>
                  <Link href={q.href} className="transition-colors hover:text-white">{q.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">খোলার সময়</h3>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt>প্রতিদিন</dt>
                <dd className="text-white">সকাল ১০টা – রাত ৯টা</dd>
              </div>
            </dl>
            {shop.phone && (
              <a
                href={`tel:${shop.phone}`}
                className="mt-5 inline-flex h-11 items-center rounded-full bg-gold px-6 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5"
              >
                ফোন করুন
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-5 border-t border-white/15 pt-6 sm:flex-row sm:justify-between">
          <p className="text-center text-xs sm:text-left">
            © {bnDigits(new Date().getFullYear())} {name}। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pr-5 pl-1.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white">
              <Image src="/eloris-labs.png" alt="" width={24} height={24} className="h-6 w-6" />
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] tracking-[0.22em] text-white/50 uppercase">Developed by</span>
              <span className="font-display block text-sm font-semibold tracking-wide text-white">Eloris Labs</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
