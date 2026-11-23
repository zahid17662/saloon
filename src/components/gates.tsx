"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { checkShopSession } from "@/app/actions/auth";
import { useStore, type State } from "@/lib/store";
import { useCatalog } from "./catalog-context";

/**
 * TRANSITIONAL (removed when store.ts is deleted): sales and payouts still live in localStorage, but
 * categories, services, barbers and settings now come from Neon. This returns the old State shape
 * with the Neon catalog laid over the local one, so screens keep working unchanged.
 */
function useMergedState(): State | null {
  const local = useStore();
  const catalog = useCatalog();
  return useMemo(
    () =>
      local && catalog
        ? {
            ...local,
            db: {
              ...local.db,
              categories: catalog.categories,
              services: catalog.services,
              barbers: catalog.barbers,
              settings: catalog.settings,
            },
          }
        : null,
    [local, catalog],
  );
}

/**
 * FR-1: barber screens need an unlocked shop device (or an admin session).
 * proxy.ts redirects devices with no valid cookie; this also asks the server on load and when the
 * tab regains focus, so a device whose shop code was changed (FR-21) is sent back to /unlock.
 * The authoritative check still happens in every Server Action (FR-4).
 */
export function ShopGate({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    const check = () =>
      checkShopSession()
        .then((r) => {
          if (alive && !r.valid) router.replace("/unlock");
        })
        .catch(() => {
          /* offline or server error: keep the current state */
        });
    check();
    window.addEventListener("focus", check);
    return () => {
      alive = false;
      window.removeEventListener("focus", check);
    };
  }, [router]);

  return <>{children}</>;
}

/** For admin pages: the admin layout guarantees state is loaded. */
export function useLiveStore(): State {
  const s = useMergedState();
  if (!s) throw new Error("Store not ready — render inside AdminShell or ShopGate");
  return s;
}
