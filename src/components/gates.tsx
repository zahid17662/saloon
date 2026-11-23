"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { checkShopSession } from "@/app/actions/auth";
import { useStore, type State } from "@/lib/store";
import { LoadingScreen } from "./ui";

/**
 * FR-1: barber screens need an unlocked shop device (or an admin session).
 * proxy.ts redirects devices with no valid cookie; this also asks the server on load and when the
 * tab regains focus, so a device whose shop code was changed (FR-21) is sent back to /unlock.
 * The authoritative check still happens in every Server Action (FR-4).
 */
export function ShopGate({ children }: { children: (s: State) => ReactNode }) {
  const s = useStore();
  const router = useRouter();
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const check = () =>
      checkShopSession()
        .then((r) => {
          if (!alive) return;
          setValid(r.valid);
          if (!r.valid) router.replace("/unlock");
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

  if (!s || valid !== true) return <LoadingScreen />;
  return <>{children(s)}</>;
}

/** For admin pages: the admin layout guarantees state is loaded. */
export function useLiveStore(): State {
  const s = useStore();
  if (!s) throw new Error("Store not ready — render inside AdminShell or ShopGate");
  return s;
}
