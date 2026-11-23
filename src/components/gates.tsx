"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isAdmin, isShopUnlocked, useStore, type State } from "@/lib/store";
import { LoadingScreen } from "./ui";

/**
 * FR-1: barber screens need an unlocked shop device (or an admin session).
 * Optimistic client check only — the backend re-checks on every action (FR-4).
 */
export function ShopGate({ children }: { children: (s: State) => ReactNode }) {
  const s = useStore();
  const router = useRouter();
  const ok = s !== null && (isShopUnlocked(s) || isAdmin(s));

  useEffect(() => {
    if (s && !ok) router.replace("/unlock");
  }, [s, ok, router]);

  if (!s || !ok) return <LoadingScreen />;
  return <>{children(s)}</>;
}

/** For admin pages: the admin layout guarantees state is loaded. */
export function useLiveStore(): State {
  const s = useStore();
  if (!s) throw new Error("Store not ready — render inside AdminShell or ShopGate");
  return s;
}
