import { notFound } from "next/navigation";
import { db } from "@/db";
import { BarberScreen } from "@/components/barber-screen";
import { ShopGate } from "@/components/gates";
import { ensureShop } from "@/lib/page-auth";
import { barberSalesToday } from "@/server/sales";

// Live data from Neon on every request (Cache Components: no prerendered body for this page).
export const instant = false;

export default async function BarberPage({ params }: PageProps<"/barber/[id]">) {
  const { id } = await params;
  const barberId = Number(id);
  if (!Number.isSafeInteger(barberId) || barberId <= 0) notFound();
  await ensureShop();
  const todaySales = await barberSalesToday(db, barberId);
  return (
    <ShopGate>
      <BarberScreen barberId={barberId} todaySales={todaySales} />
    </ShopGate>
  );
}
