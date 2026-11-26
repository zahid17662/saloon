"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { taka } from "@/lib/money";
import { categoryPhoto } from "@/lib/category-photo";
import type { PublicMenu } from "@/lib/types";
import { BackIcon } from "../icons";
import { ServiceArt } from "../service-icon";

/** Categories as photo tiles; opening one shows that category's services, like the shop screen. */
export function Services({ menu }: { menu: PublicMenu }) {
  const groups = menu.categories
    .map((c) => ({ ...c, items: menu.services.filter((s) => s.categoryId === c.id) }))
    .filter((g) => g.items.length > 0);
  const [open, setOpen] = useState<number | null>(null);
  const cur = groups.find((g) => g.id === open);

  if (groups.length === 0) return <p className="py-6 text-center text-sm text-muted">সেবার তালিকা শীঘ্রই যোগ হবে।</p>;

  if (!cur) {
    return (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {groups.map((g) => (
          <li key={g.id}>
            <button
              onClick={() => setOpen(g.id)}
              className="group relative block w-full overflow-hidden rounded-2xl ring-1 ring-line transition-all hover:ring-line-strong"
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
        ))}
      </ul>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setOpen(null)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
        >
          <BackIcon className="h-4 w-4" />
          সব ক্যাটাগরি
        </button>
        <span className="text-sm font-semibold text-fg">{cur.name}</span>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cur.items.map((s) => (
          <li key={s.id}>
            <Link
              href={`/book?service=${s.id}`}
              className="group flex h-full flex-col rounded-3xl bg-surface p-2.5 shadow-card ring-1 ring-primary/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary-soft to-white">
                <ServiceArt name={s.name} size={160} className="relative block h-full w-full" />
              </span>
              <span className="mt-2.5 block px-1 text-[15px] leading-snug font-semibold break-words text-fg">{s.name}</span>
              <span className="mt-auto flex items-center justify-between gap-2 px-1 pt-1 pb-0.5">
                <span className="text-base leading-none font-bold text-gold-ink tabular-nums">{taka(s.price)}</span>
                <span aria-hidden="true" className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-gold">
                  বুক
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
