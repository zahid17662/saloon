import Link from "next/link";
import { Logo } from "../logo";
import { PinIcon } from "../icons";
import { DeskMenu } from "./desk-menu";

const NAV = [
  { href: "#services", label: "সেবা" },
  { href: "#trending", label: "জনপ্রিয়" },
  { href: "#location", label: "লোকেশন" },
  { href: "/track", label: "আমার সিরিয়াল" },
] as const;

export function SiteHeader({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Logo size={38} />
          <span className="font-display truncate text-sm font-semibold tracking-[0.08em] text-fg sm:text-base">{name}</span>
        </Link>

        <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-primary-soft px-3.5 py-2 text-xs font-semibold text-primary sm:inline-flex desk:hidden">
          <PinIcon className="h-3.5 w-3.5" />
          সাভার
        </span>

        <Link
          href="/book"
          className="inline-flex h-10 flex-none items-center rounded-full bg-primary px-5 text-sm font-semibold whitespace-nowrap text-gold transition-colors hover:bg-primary-hover max-sm:ml-auto desk:hidden"
        >
          বুক করুন
        </Link>

        <DeskMenu items={NAV} />
      </div>
    </header>
  );
}
