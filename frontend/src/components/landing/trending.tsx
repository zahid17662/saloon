"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { taka } from "@/lib/money";
import type { PublicMenu } from "@/lib/types";
import { BackIcon, NextIcon } from "../icons";
import { cx } from "../ui";
import { ServicePhoto } from "../service-photo";

/**
 * A short, hand-picked row of services the shop wants to show first: one from each category,
 * then the rest in menu order. There is no order-count data yet, so this is a selection, not a ranking.
 */
function highlights(menu: PublicMenu, max = 8) {
  const byCat = new Map<number, typeof menu.services>();
  for (const s of menu.services) byCat.set(s.categoryId, [...(byCat.get(s.categoryId) ?? []), s]);
  const picked: typeof menu.services = [];
  for (let round = 0; picked.length < max; round++) {
    const added = [...byCat.values()].filter((list) => list[round]).map((list) => list[round]);
    if (added.length === 0) break;
    picked.push(...added.slice(0, max - picked.length));
  }
  return picked;
}

export function Trending({ menu }: { menu: PublicMenu }) {
  const items = highlights(menu);
  const catName = (id: number) => menu.categories.find((c) => c.id === id)?.name ?? "";
  const row = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ prev: false, next: false });

  const measure = useCallback(() => {
    const el = row.current;
    if (!el) return;
    setEdge({ prev: el.scrollLeft > 4, next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, items.length]);

  const go = (dir: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = (card?.getBoundingClientRect().width ?? el.clientWidth) + 16;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  const arrow = "flex h-11 w-11 items-center justify-center rounded-full border text-primary transition-colors";

  return (
    <div>
      <ul
        ref={row}
        onScroll={measure}
        className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-pl-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((s) => (
          <li key={s.id} className="w-[68%] flex-none snap-start sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] desk:w-[calc((100%-3rem)/4)]">
            <Link href={`/book?service=${s.id}`} className="group flex h-full flex-col">
              <span className="relative block aspect-[365/346] w-full overflow-hidden rounded-2xl bg-primary-soft">
                <ServicePhoto name={s.name} sizes="(min-width: 900px) 24vw, (min-width: 640px) 45vw, 68vw" />
              </span>
              <span className="mt-4 block text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{catName(s.categoryId)}</span>
              <span className="mt-1 block text-[15px] leading-snug font-semibold break-words text-fg">{s.name}</span>
              <span className="mt-2 block text-lg leading-none font-bold text-gold-ink tabular-nums">{taka(s.price)}</span>
              <span className="mt-auto pt-4">
                <span className="flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-gold transition-colors group-hover:bg-primary-hover">
                  বুক করুন
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-center gap-4">
        <a
          href="#services"
          className="inline-flex h-12 items-center rounded-xl border border-primary px-7 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-gold"
        >
          সব সেবা দেখুন
        </a>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="আগের সেবাগুলো"
            disabled={!edge.prev}
            onClick={() => go(-1)}
            className={cx(arrow, edge.prev ? "border-primary hover:bg-primary-soft" : "border-line text-muted/50")}
          >
            <BackIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="পরের সেবাগুলো"
            disabled={!edge.next}
            onClick={() => go(1)}
            className={cx(arrow, edge.next ? "border-primary hover:bg-primary-soft" : "border-line text-muted/50")}
          >
            <NextIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
