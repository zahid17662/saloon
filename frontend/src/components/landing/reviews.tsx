import { REVIEWS } from "@/lib/reviews";
import { bnDigits } from "@/lib/money";
import { fmtDateKey } from "@/lib/time";

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5 text-gold" aria-label={`${bnDigits(n)} তারা`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill={i < n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M10 1.8l2.4 5 5.5.8-4 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-4-3.8 5.5-.8z" />
        </svg>
      ))}
    </span>
  );
}

/** Customer reviews. Hidden until the shop has real ones in src/lib/reviews.ts. */
export function Reviews() {
  if (REVIEWS.length === 0) return null;
  return (
    <section id="reviews" aria-labelledby="reviews-h" className="scroll-mt-24">
      <h2 id="reviews-h" className="mb-4 text-lg font-bold text-fg">
        কাস্টমাররা যা বলছেন
      </h2>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
        {REVIEWS.map((r) => (
          <li key={`${r.name}-${r.date}`} className="w-[17rem] flex-none snap-start sm:w-auto">
            <figure className="flex h-full flex-col rounded-3xl bg-surface p-5 shadow-card ring-1 ring-primary/5">
              <div className="flex items-start justify-between gap-3">
                <figcaption className="font-semibold text-fg">{r.name}</figcaption>
                <span className="text-xs text-subtle">{fmtDateKey(r.date)}</span>
              </div>
              <Stars n={r.rating} />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted">{r.text}</blockquote>
              {r.service && (
                <p className="mt-4 border-t border-line pt-3 text-xs font-medium text-primary">{r.service}</p>
              )}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
