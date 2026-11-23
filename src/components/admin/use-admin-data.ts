"use client";

// Loading helpers for admin screens that read live Neon data through admin-only Server Actions.
// Both ignore a slow reply that was overtaken by a newer request, and expose `reload()` for use
// after a change.

import { useCallback, useEffect, useState } from "react";
import { getPayoutsView, type PayoutsView } from "@/app/actions/payouts";
import { listSales } from "@/app/actions/sales";
import { NET_ERR } from "@/lib/messages";
import type { Sale } from "@/lib/types";

export interface Loaded<T> {
  data: T | null;
  error: string;
  /** True while `data` belongs to an older query than the one now asked for. */
  stale: boolean;
  reload: () => void;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function useLoaded<T>(key: string, load: () => Promise<Result<T>>): Loaded<T> {
  const [state, setState] = useState<{ key: string; data: T | null; error: string }>({ key: "", data: null, error: "" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let current = true;
    load()
      .then((r) => {
        if (!current) return;
        setState((prev) => (r.ok ? { key, data: r.data, error: "" } : { key, data: prev.data, error: r.error }));
      })
      .catch(() => {
        if (current) setState((prev) => ({ key, data: prev.data, error: NET_ERR }));
      });
    return () => {
      current = false;
    };
    // `load` is rebuilt every render; the key and tick are what identify a request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  return { data: state.data, error: state.error, stale: state.key !== key, reload: useCallback(() => setTick((n) => n + 1), []) };
}

/** Every sale (live and voided) dated from..to in Dhaka, newest first. */
export function useSalesWindow(from: string, to: string): Loaded<Sale[]> {
  return useLoaded(`${from}|${to}`, () => listSales({ from, to, status: "all" }));
}

/** Payout history plus per-barber earned / paid / balance. */
export function usePayoutsView(): Loaded<PayoutsView> {
  return useLoaded("payouts", () => getPayoutsView());
}
