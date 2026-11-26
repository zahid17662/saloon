import Link from "next/link";
import { taka } from "@/lib/money";
import type { PublicMenu } from "@/lib/types";
import { ServicePhoto } from "../service-photo";

/**
 * A short, hand-picked row of services the shop wants to show first: one from each category,
 * then the rest in menu order. There is no order-count data yet, so this is a selection, not a ranking.
 */
function highlights(menu: PublicMenu, max = 6) {
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
  if (items.length === 0) return null;

  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
      {items.map((s) => (
        <li key={s.id} className="w-40 flex-none snap-start sm:w-auto">
          <Link
            href={`/book?service=${s.id}`}
            className="group flex h-full flex-col rounded-3xl bg-surface p-2.5 shadow-card ring-1 ring-primary/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary-soft to-white">
              <ServicePhoto name={s.name} />
            </span>
            <span className="mt-2.5 block px-1 text-[11px] font-semibold tracking-wide text-muted uppercase">{catName(s.categoryId)}</span>
            <span className="block px-1 text-[15px] leading-snug font-semibold break-words text-fg">{s.name}</span>
            <span className="mt-auto flex items-center justify-between gap-2 px-1 pt-1.5 pb-0.5">
              <span className="text-base leading-none font-bold text-gold-ink tabular-nums">{taka(s.price)}</span>
              <span aria-hidden="true" className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-gold">
                বুক
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
