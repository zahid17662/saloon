"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { checkShopSession } from "@/api/auth";

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
