import { ShopGate } from "@/components/gates";
import { ReceiptView } from "@/components/receipt-view";
import { ensureShop, shopData } from "@/lib/page-auth";
import type { Sale } from "@/lib/types";

// Live data from the API on every request (Cache Components: no prerendered body for this page).
export const instant = false;

export default async function ReceiptPage({ params }: PageProps<"/receipt/[id]">) {
  const { id } = await params;
  const saleId = Number(id);
  await ensureShop();
  const sale = Number.isSafeInteger(saleId) && saleId > 0 ? await shopData<Sale | null>(`/sales/${saleId}`) : null;
  return (
    <ShopGate>
      <ReceiptView sale={sale} />
    </ShopGate>
  );
}
