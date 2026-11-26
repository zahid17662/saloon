import { taka } from "@/lib/money";
import type { PublicMenu } from "@/lib/types";
import { ServiceIcon } from "../service-icon";

/** Card colours cycle so the row reads as a shelf of offers, not a list. */
const TONES = [
  { card: "bg-gold text-primary", pill: "bg-primary text-gold" },
  { card: "bg-primary text-white", pill: "bg-gold text-primary" },
  { card: "bg-mint text-fg", pill: "bg-primary text-gold" },
  { card: "bg-peach text-fg", pill: "bg-primary text-gold" },
];

/** One highlight service per category, as a swipeable row of colour cards. */
export function PopularServices({ menu }: { menu: PublicMenu }) {
  const seen = new Set<number>();
  const picks = menu.services
    .filter((s) => (seen.has(s.categoryId) ? false : seen.add(s.categoryId)))
    .slice(0, 6);
  if (picks.length < 2) return null;
  const catName = (id: number) => menu.categories.find((c) => c.id === id)?.name ?? "";

  return (
    <section aria-labelledby="popular-h">
      <h2 id="popular-h" className="mb-4 text-xl font-bold text-fg">
        জনপ্রিয় সেবা
      </h2>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
        {picks.map((s, i) => {
          const tone = TONES[i % TONES.length];
          return (
            <li key={s.id} className="w-[11.5rem] flex-none snap-start">
              <a href="#book" className={`block h-full rounded-[1.75rem] p-5 text-center shadow-card transition-transform active:scale-[0.98] ${tone.card}`}>
                <span className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface text-primary shadow-card">
                  <ServiceIcon name={s.name} className="h-9 w-9" />
                </span>
                <span className="font-display block text-lg leading-snug font-extrabold">{s.name}</span>
                <span className="mt-1 block text-xs opacity-70">{catName(s.categoryId)}</span>
                <span className={`mt-4 inline-flex rounded-full px-4 py-1.5 text-sm font-bold tabular-nums ${tone.pill}`}>{taka(s.price)}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
