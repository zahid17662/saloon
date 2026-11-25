"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAdmin } from "@/api/auth";
import { NET_ERR } from "@/lib/messages";
import { useCatalog } from "../catalog-context";
import { cx, LoadingScreen, Modal } from "../ui";
import {
  CalendarIcon,
  ChartIcon,
  GearIcon,
  HomeIcon,
  ListIcon,
  LogoutIcon,
  ReceiptIcon,
  ScissorsIcon,
  UsersIcon,
  WalletIcon,
} from "../icons";

const TABS = ["/admin", "/admin/sales", "/admin/appointments", "/admin/payouts"];

const NAV = [
  { href: "/admin", label: "ড্যাশবোর্ড", Icon: ChartIcon },
  { href: "/admin/reports", label: "রিপোর্ট", Icon: ListIcon },
  { href: "/admin/sales", label: "বিক্রি", Icon: ReceiptIcon },
  { href: "/admin/appointments", label: "অ্যাপয়েন্টমেন্ট", Icon: CalendarIcon },
  { href: "/admin/payouts", label: "নাপিতের পেমেন্ট", Icon: WalletIcon },
  { href: "/admin/barbers", label: "নাপিত", Icon: UsersIcon },
  { href: "/admin/services", label: "সার্ভিস ও দাম", Icon: ScissorsIcon },
  { href: "/admin/settings", label: "সেটিংস", Icon: GearIcon },
] as const;

/**
 * FR-2: every /admin page except login needs an admin session. proxy.ts redirects requests without a
 * valid admin cookie; the Server Actions re-check on every call (FR-4).
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const catalog = useCatalog();
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const loggingOut = useRef(false);
  const [more, setMore] = useState(false);

  if (isLogin) return <>{children}</>;
  if (!catalog) return <LoadingScreen />;
  const shopName = catalog.settings.shopName;

  async function logout() {
    if (loggingOut.current) return; // ignore a double tap
    loggingOut.current = true;
    try {
      await logoutAdmin();
      router.replace("/admin/login");
    } catch {
      loggingOut.current = false;
      window.alert(NET_ERR); // still signed in; nothing was lost
    }
  }

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="min-h-dvh lg:pl-[17rem]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        মূল অংশে যান
      </a>
      {/* Desktop sidebar — floating white panel, icons in circles, blue active circle */}
      <aside className="fixed inset-y-4 left-4 hidden w-60 flex-col rounded-3xl bg-surface p-4 shadow-card lg:flex">
        <div className="mb-8 flex items-center gap-3 px-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_6px_18px_rgb(59_130_246/0.35)]">
            <ScissorsIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-fg">{shopName}</div>
            <div className="text-xs text-subtle">এডমিন প্যানেল</div>
          </div>
        </div>
        <nav aria-label="প্রধান মেনু" className="flex-1 space-y-1">
          {NAV.map(({ href, label, Icon }) => {
            const on = active(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "group flex items-center gap-3 rounded-full py-1.5 pr-3 pl-1.5 text-sm transition-colors",
                  on ? "bg-primary-soft font-semibold text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <span
                  className={cx(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                    on ? "bg-primary text-white" : "bg-surface-2 text-muted group-hover:text-fg",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-line pt-3">
          <Link
            href="/staff"
            className="flex items-center gap-3 rounded-full py-1.5 pr-3 pl-1.5 text-sm text-muted hover:bg-surface-2 hover:text-fg"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2">
              <HomeIcon className="h-[18px] w-[18px]" />
            </span>
            নাপিতের স্ক্রিন
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-full py-1.5 pr-3 pl-1.5 text-sm text-muted hover:bg-surface-2 hover:text-fg"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2">
              <LogoutIcon className="h-[18px] w-[18px]" />
            </span>
            লগআউট
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          <div className="min-w-0 truncate font-semibold text-fg">{NAV.find((n) => active(n.href))?.label ?? shopName}</div>
          <div className="flex gap-1">
            <Link href="/staff" aria-label="নাপিতের স্ক্রিন" className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-2">
              <HomeIcon className="h-5 w-5" />
            </Link>
            <button
              aria-label="লগআউট"
              onClick={logout}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
            >
              <LogoutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-7xl p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-6 lg:py-8 lg:pb-8">{children}</main>

      {/* Mobile bottom tab bar: four daily screens + "আরও" for the rest */}
      <nav aria-label="নিচের মেনু" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {NAV.filter((n) => TABS.includes(n.href)).map(({ href, label, Icon }) => {
            const on = active(href);
            return (
              <li key={href}>
                <Link href={href} aria-current={on ? "page" : undefined} className={cx("flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-snug", on ? "font-semibold text-primary" : "text-muted")}>
                  <span className={cx("flex h-7 w-12 items-center justify-center rounded-full", on && "bg-primary-soft")}><Icon className="h-5 w-5" /></span>
                  <span className="max-w-full truncate">{label.replace("নাপিতের ", "").replace("অ্যাপয়েন্টমেন্ট", "বুকিং")}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button onClick={() => setMore(true)} aria-haspopup="dialog" className={cx("flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-snug", NAV.some((n) => !TABS.includes(n.href) && active(n.href)) ? "font-semibold text-primary" : "text-muted")}>
              <span className="flex h-7 w-12 items-center justify-center rounded-full"><ListIcon className="h-5 w-5" /></span>
              আরও
            </button>
          </li>
        </ul>
      </nav>

      <Modal open={more} title="আরও" onClose={() => setMore(false)}>
        <ul className="-mx-2 space-y-1">
          {NAV.filter((n) => !TABS.includes(n.href)).map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} onClick={() => setMore(false)} className={cx("flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px]", active(href) ? "bg-primary-soft font-semibold text-primary" : "text-fg hover:bg-surface-2")}>
                <Icon className="h-5 w-5" />{label}
              </Link>
            </li>
          ))}
          <li className="my-1 border-t border-line" />
          <li>
            <Link href="/staff" onClick={() => setMore(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] text-fg hover:bg-surface-2"><HomeIcon className="h-5 w-5" />নাপিতের স্ক্রিন</Link>
          </li>
          <li>
            <button onClick={logout} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] text-fg hover:bg-surface-2"><LogoutIcon className="h-5 w-5" />লগআউট</button>
          </li>
        </ul>
      </Modal>
    </div>
  );
}
