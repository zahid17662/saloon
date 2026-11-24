import { notFound } from "next/navigation";
import { db } from "@server/db";
import { BarberScreen } from "@/components/barber-screen";
import { BarberGate, ShopGate } from "@/components/gates";
import { ensureBarberSelf } from "@server/lib/page-auth";
import { barberSalesToday } from "@server/server/sales";

// Live data from Neon on every request (Cache Components: no prerendered body for this page).
export const instant = false;

export default async function BarberPage({ params }: PageProps<"/barber/[id]">) {
  const { id } = await params;
  const barberId = Number(id);
  if (!Number.isSafeInteger(barberId) || barberId <= 0) notFound();
  await ensureBarberSelf(barberId);
  const todaySales = await barberSalesToday(db, barberId);
  return (
    <ShopGate>
      <BarberGate barberId={barberId}>
        <BarberScreen barberId={barberId} todaySales={todaySales} />
      </BarberGate>
    </ShopGate>
  );
}
