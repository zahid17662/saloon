"use client";

import { useState } from "react";
import { taka } from "@/lib/money";
import type { PublicMenu } from "@/lib/types";
import { cx } from "../ui";
import { ServiceArt } from "../service-icon";

/** Category chips on top, one plain price list below. */
export function ServicesList({ menu }: { menu: PublicMenu }) {
  const groups = menu.categories
    .map((c) => ({ ...c, items: menu.services.filter((s) => s.categoryId === c.id) }))
    .filter((g) => g.items.length > 0);
  const [active, setActive] = useState(groups[0]?.id ?? 0);
  const cur = groups.find((g) => g.id === active) ?? groups[0];

  if (!cur) return <p className="py-6 text-center text-sm text-muted">সেবার তালিকা শীঘ্রই যোগ হবে।</p>;
  return (
    <div>
      <div role="tablist" aria-label="সেবার ধরন" className="-mx-4 flex gap-6 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
        {groups.map((g) => (
          <button
            key={g.id}
            role="tab"
            aria-selected={g.id === cur.id}
            onClick={() => setActive(g.id)}
            className={cx(
              "relative -mb-px flex-none py-3 text-[15px] font-semibold whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full",
              g.id === cur.id ? "text-primary after:bg-gold" : "text-muted after:bg-transparent hover:text-fg",
            )}
          >
            {g.name}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-line">
        {cur.items.map((s) => (
          <li key={s.id} className="flex items-center gap-3 py-3">
            <span className="h-11 w-11 flex-none overflow-hidden rounded-xl bg-primary-soft">
              <ServiceArt name={s.name} size={44} className="block" />
            </span>
            <span className="min-w-0 flex-1 font-medium break-words text-fg">{s.name}</span>
            <span className="font-bold text-gold-ink tabular-nums">{taka(s.price)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
