"use client";

import { useState } from "react";
import type { PublicMenu } from "@/lib/types";
import { cx } from "../ui";
import { BookingForm } from "./booking-form";
import { QueueJoin } from "./queue-join";

const TABS = [
  { id: "now", label: "এখনই লাইনে", hint: "পছন্দের Hairdresser বেছে নিন। তিনি ফাঁকা থাকলে সরাসরি কাটবেন, না হলে তাঁর সারিতে সিরিয়াল পাবেন।" },
  { id: "later", label: "আগাম বুকিং", hint: "নির্দিষ্ট সময়ে আসতে চাইলে বুক করুন। Hairdresser নিশ্চিত করবেন।" },
] as const;

/** One booking form at a time, so the home page stays short. */
export function BookTabs({ menu }: { menu: PublicMenu }) {
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
      {tab === "now" ? <QueueJoin menu={menu} /> : <BookingForm menu={menu} />}
    </div>
  );
}
