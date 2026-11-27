"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CloseIcon, MenuIcon } from "../icons";

export type DeskNavItem = { href: string; label: string };

/** Hamburger for wide screens; the menu links and the book button live inside the panel. */
export function DeskMenu({ items }: { items: readonly DeskNavItem[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative ml-auto hidden desk:block">
      <button
        type="button"
        aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
        aria-expanded={open}
        aria-controls="desk-menu"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-primary transition-colors hover:bg-primary-soft"
      >
        {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
      </button>

      {open && (
        <div id="desk-menu" className="absolute top-[calc(100%+0.5rem)] right-0 w-64 rounded-2xl border border-line bg-surface p-2 shadow-pop">
          <nav aria-label="প্রধান মেনু">
            {items.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-xl px-3.5 text-sm font-medium text-fg transition-colors hover:bg-primary-soft"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/#services"
            onClick={() => setOpen(false)}
            className="mt-2 flex h-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-gold transition-colors hover:bg-primary-hover"
          >
            বুক করুন
          </Link>
        </div>
      )}
    </div>
  );
}
