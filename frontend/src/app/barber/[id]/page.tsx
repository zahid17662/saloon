import { notFound } from "next/navigation";
import { BarberScreen } from "@/components/barber-screen";
import { ShopGate } from "@/components/gates";
import { ensureShop, shopData } from "@/lib/page-auth";
import type { Sale } from "@/lib/types";

// Live data from the API on every request (Cache Components: no prerendered body for this page).
export const instant = false;

export default async function BarberPage({ params }: PageProps<"/barber/[id]">) {
  const { id } = await params;
  const barberId = Number(id);
  if (!Number.isSafeInteger(barberId) || barberId <= 0) notFound();
  await ensureShop();
  const todaySales = await shopData<Sale[]>(`/sales/barber/${barberId}/today`);
  return (
    <ShopGate>
      <BarberScreen barberId={barberId} todaySales={todaySales} />
    </ShopGate>
  );
}
