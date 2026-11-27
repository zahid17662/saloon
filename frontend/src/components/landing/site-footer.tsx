import Image from "next/image";
import Link from "next/link";
import { Logo } from "../logo";
import { FacebookIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "../icons";
import { bnDigits } from "@/lib/money";
import type { PublicMenu } from "@/lib/types";

// Developer credit contacts.
const ELORIS = [
  { label: "Eloris Labs-কে ইমেইল", href: "mailto:elorislabs444@gmail.com", Icon: MailIcon },
  { label: "Eloris Labs-কে WhatsApp", href: "https://wa.me/8801828255113", Icon: WhatsAppIcon },
  { label: "Eloris Labs Facebook", href: "https://www.facebook.com/share/19p2Yd2HA6/", Icon: FacebookIcon },
] as const;

const QUICK = [
  { href: "/book", label: "বুক করুন" },
  { href: "/track", label: "আমার সিরিয়াল" },
  { href: "#services", label: "সেবা ও দাম" },
  { href: "#location", label: "লোকেশন" },
] as const;

export function SiteFooter({ menu, name }: { menu: PublicMenu; name: string }) {
  const { shop } = menu;
  return (
    <footer className="border-t border-line bg-primary text-white/70 pb-[calc(3.5rem+env(safe-area-inset-bottom))] desk:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <Logo size={46} />
              <div className="min-w-0">
                <div className="font-display text-sm font-semibold tracking-[0.08em] break-words text-white">{name}</div>
                <div className="text-xs text-gold">Timeless style, modern confidence</div>
              </div>
            </div>

            <div className="mt-5 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.05] text-sm sm:bg-transparent sm:border-0 sm:divide-y-0 sm:space-y-2.5 sm:rounded-none">
              {shop.address && (
                <p className="flex items-start gap-3 p-4 sm:p-0">
                  <PinIcon className="mt-0.5 h-4 w-4 flex-none text-gold" />
                  <span className="min-w-0 break-words">
                    {shop.address}
                    <br />
                    সাভার, ঢাকা
                  </span>
                </p>
              )}
              {shop.phone && (
                <p className="flex items-center gap-3 p-4 sm:p-0">
                  <PhoneIcon className="h-4 w-4 flex-none text-gold" />
                  <a href={`tel:${shop.phone}`} className="text-white transition-colors sm:text-inherit sm:hover:text-white">{bnDigits(shop.phone)}</a>
                </p>
              )}
              <p className="flex items-center justify-between gap-3 p-4 sm:hidden">
                <span>প্রতিদিন খোলা</span>
                <span className="font-medium text-white">সকাল ১০টা – রাত ৯টা</span>
              </p>
            </div>

            {shop.phone && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:hidden">
                <a href={`tel:${shop.phone}`} className="inline-flex h-12 items-center justify-center rounded-full bg-gold text-sm font-bold text-primary active:scale-[0.98]">
                  ফোন করুন
                </a>
                <Link href="/book" className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 text-sm font-semibold text-white active:scale-[0.98]">
                  বুক করুন
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 sm:contents">
            <div>
              <h3 className="text-sm font-semibold text-gold">সেবা</h3>
              <ul className="mt-2 sm:mt-3">
                {menu.categories.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <Link href="#services" className="flex min-h-11 items-center text-sm transition-colors hover:text-white">{c.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gold">দ্রুত লিংক</h3>
              <ul className="mt-2 sm:mt-3">
                {QUICK.map((q) => (
                  <li key={q.href}>
                    <Link href={q.href} className="flex min-h-11 items-center text-sm transition-colors hover:text-white">{q.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="hidden sm:block">
            <h3 className="text-sm font-semibold text-gold">খোলার সময়</h3>
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
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pr-5 pl-1.5">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white">
                <Image src="/eloris-labs.png" alt="" width={24} height={24} className="h-6 w-6" />
              </span>
              <span className="leading-tight">
                <span className="block text-[10px] tracking-[0.22em] text-white/50 uppercase">Developed by</span>
                <span className="font-display block text-sm font-semibold tracking-wide text-white">Eloris Labs</span>
              </span>
            </div>
            <ul className="flex items-center gap-2.5">
              {ELORIS.map(({ label, href, Icon }) => (
                <li key={href}>
                  <a
                    href={href}
                    aria-label={label}
                    title={label}
                    {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/75 transition-colors hover:border-gold/60 hover:bg-white/10 hover:text-gold active:scale-95 sm:h-9 sm:w-9"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
