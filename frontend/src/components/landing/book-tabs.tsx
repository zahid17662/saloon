"use client";

import { useState } from "react";
import type { PublicMenu } from "@/lib/types";
import { cx } from "../ui";
import { BookingForm } from "./booking-form";
import { QueueJoin } from "./queue-join";

const TABS = [
  { id: "now", label: "এখনই লাইনে", hint: "সার্ভিস আর Hairdresser বেছে নিন। 'যে কেউ' বাছলে যিনি আগে ফাঁকা হবেন তিনিই কাটবেন।" },
  { id: "later", label: "আগাম বুকিং", hint: "নির্দিষ্ট দিনে ও সময়ে আসতে চাইলে বুক করুন। Hairdresser নিশ্চিত করবেন।" },
] as const;

/** One booking form at a time. */
export function BookTabs({ menu, preset }: { menu: PublicMenu; preset?: number }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("now");
  const cur = TABS.find((t) => t.id === tab) ?? TABS[0];
  return (
    <div>
      <div role="tablist" aria-label="বুকিংয়ের ধরন" className="flex gap-6 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              "relative -mb-px py-3 text-[15px] font-semibold transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full",
              tab === t.id ? "text-primary after:bg-gold" : "text-muted after:bg-transparent hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-4 mb-4 text-sm text-muted">{cur.hint}</p>
      {tab === "now" ? <QueueJoin menu={menu} preset={preset} /> : <BookingForm menu={menu} preset={preset} />}
    </div>
  );
}
