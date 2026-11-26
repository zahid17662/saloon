"use client";

import { useState } from "react";
import Image from "next/image";
import { taka } from "@/lib/money";
import { categoryPhoto } from "@/lib/category-photo";
import type { PublicMenu } from "@/lib/types";
import { cx } from "../ui";

/** Photo tiles pick the category; the price list below shows that category only. */
export function Services({ menu }: { menu: PublicMenu }) {
  const groups = menu.categories
    .map((c) => ({ ...c, items: menu.services.filter((s) => s.categoryId === c.id) }))
    .filter((g) => g.items.length > 0);
  const [active, setActive] = useState(groups[0]?.id ?? 0);
  const cur = groups.find((g) => g.id === active) ?? groups[0];

  if (!cur) return <p className="py-6 text-center text-sm text-muted">সেবার তালিকা শীঘ্রই যোগ হবে।</p>;

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {groups.map((g) => {
          const on = g.id === cur.id;
          return (
            <li key={g.id}>
              <button
                onClick={() => setActive(g.id)}
                aria-pressed={on}
                className={cx(
                  "group relative block w-full overflow-hidden rounded-2xl ring-1 transition-all",
                  on ? "ring-2 ring-gold" : "ring-line hover:ring-line-strong",
                )}
              >
                <span className="relative block aspect-[16/11]">
                  <Image
                    src={categoryPhoto(g.name)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/35 to-transparent" />
                  <span className="absolute inset-x-2 bottom-2.5 block text-center text-[13px] leading-tight font-semibold tracking-wide text-white">
                    {g.name}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <ul className="mt-6 divide-y divide-line">
        {cur.items.map((s) => (
          <li key={s.id} className="flex items-center gap-3 py-3.5">
            <span className="min-w-0 flex-1 font-medium break-words text-fg">{s.name}</span>
            <span className="font-bold text-gold-ink tabular-nums">{taka(s.price)}</span>
          </li>
        ))}
      </ul>
      <a href="#book" className="mt-4 inline-block text-[15px] font-medium text-primary hover:underline">
        {cur.name} বুক করুন →
      </a>
    </div>
  );
}
