import { ComponentProps } from "react";
import { BarberPicker } from "@/components/barber-picker";
import { ShopGate } from "@/components/gates";
import { ensureShop, shopData } from "@/lib/page-auth";

// Live data from the API on every request (Cache Components: no prerendered body for this page).
export const instant = false;

export default async function Home() {
  await ensureShop();
  const stats = await shopData<ComponentProps<typeof BarberPicker>["stats"]>("/sales/today-stats");
  return (
    <ShopGate>
      <BarberPicker stats={stats} />
    </ShopGate>
  );
}
