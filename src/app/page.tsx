import { db } from "@/db";
import { BarberPicker } from "@/components/barber-picker";
import { ShopGate } from "@/components/gates";
import { ensureShop } from "@/lib/page-auth";
import { todayStats } from "@/server/sales";

// Live data from Neon on every request (Cache Components: no prerendered body for this page).
export const instant = false;

export default async function Home() {
  await ensureShop();
  const stats = await todayStats(db);
  return (
    <ShopGate>
      <BarberPicker stats={stats} />
    </ShopGate>
  );
}
