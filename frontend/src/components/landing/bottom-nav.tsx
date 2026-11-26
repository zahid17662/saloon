"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarIcon, HomeIcon, ListIcon, ScissorsIcon } from "../icons";
import { cx } from "../ui";

const ITEMS = [
  { id: "top", label: "হোম", Icon: HomeIcon },
  { id: "services", label: "সেবা", Icon: ScissorsIcon },
  { id: "book", label: "বুক করুন", Icon: CalendarIcon },
] as const;

/** Phone-only bar: the three stops on this page, plus the live serial screen. */
export function BottomNav() {
  const [active, setActive] = useState<string>("top");

  useEffect(() => {
    const seen = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.intersectionRatio);
        const best = [...seen.entries()].sort((a, z) => z[1] - a[1])[0];
        if (best && best[1] > 0) setActive(best[0]);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: "-20% 0px -40% 0px" },
    );
    for (const { id } of ITEMS) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="নিচের মেনু"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {ITEMS.map(({ id, label, Icon }) => {
          const on = active === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={on ? "true" : undefined}
                className={cx(
                  "relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] leading-none",
                  on ? "font-semibold text-primary" : "text-muted",
                )}
              >
                <span aria-hidden="true" className={cx("absolute top-0 h-[3px] w-8 rounded-b-full", on ? "bg-gold" : "bg-transparent")} />
                <Icon className="h-5 w-5" />
                {label}
              </a>
            </li>
          );
        })}
        <li>
          <Link href="/track" className="flex h-14 flex-col items-center justify-center gap-1 text-[11px] leading-none text-muted">
            <ListIcon className="h-5 w-5" />
            সিরিয়াল
          </Link>
        </li>
      </ul>
    </nav>
  );
}
