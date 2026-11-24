import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { barbers, db } from "@server/db";
import { ensureShop } from "@server/lib/page-auth";
import { BarberLoginForm } from "@/components/barber-login-form";

// Live data from Neon on every request (Cache Components: no prerendered body for this page).
export const instant = false;

export default async function BarberLoginPage({ params }: PageProps<"/barber-login/[id]">) {
  const { id } = await params;
  const barberId = Number(id);
  if (!Number.isSafeInteger(barberId) || barberId <= 0) notFound();
  await ensureShop(); // the device itself must already be unlocked
  const [barber] = await db
    .select({ id: barbers.id, name: barbers.name, active: barbers.active })
    .from(barbers)
    .where(eq(barbers.id, barberId));
  if (!barber?.active) notFound();
  return <BarberLoginForm barberId={barber.id} barberName={barber.name} />;
}
