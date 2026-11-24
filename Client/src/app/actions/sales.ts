"use server";

// Sale Server Actions. Every action: (1) auth on the server (FR-4), (2) zod-validate, (3) call the
// plain function in src/server/sales.ts with the SERVER clock, (4) revalidate.
//  - barber screen (shop device): createSale, voidMySale
//  - admin only: listSales, adminVoidSale, addPastSale (FR-22)

import { revalidatePath } from "next/cache";
import { db } from "@server/db";
import { requireAdmin, requireBarberSelf } from "@server/lib/auth";
import { resolveBackdate } from "@server/lib/backdate";
import { adminVoidInput, barberVoidInput, pastSaleInput, saleInput, salesQuery } from "@server/lib/schemas";
import type { Sale } from "@server/lib/types";
import { parseInput, runAction, type ActionResult } from "@server/server/action";
import { DomainError } from "@server/server/errors";
import * as sales from "@server/server/sales";

// Sales feed the barber screens, receipts, the admin list, dashboard and reports.
const refreshAll = () => revalidatePath("/", "layout");

export async function createSale(input: unknown): Promise<ActionResult<Sale>> {
  return runAction(async () => {
    const parsed = parseInput(saleInput, input);
    await requireBarberSelf(parsed.barberId); // the device must hold THIS barber's own session
    const sale = await sales.createSale(db, parsed);
    refreshAll();
    return sale;
  });
}

export async function voidMySale(input: unknown): Promise<ActionResult<Sale>> {
  return runAction(async () => {
    const parsed = parseInput(barberVoidInput, input);
    await requireBarberSelf(parsed.barberId);
    const sale = await sales.voidSaleByBarber(db, parsed);
    refreshAll();
    return sale;
  });
}

export async function listSales(input: unknown): Promise<ActionResult<Sale[]>> {
  return runAction(async () => {
    await requireAdmin();
    return sales.listSales(db, parseInput(salesQuery, input));
  });
}

export async function adminVoidSale(input: unknown): Promise<ActionResult<Sale>> {
  return runAction(async () => {
    await requireAdmin();
    const sale = await sales.voidSaleByAdmin(db, parseInput(adminVoidInput, input));
    refreshAll();
    return sale;
  });
}

/** FR-22. enteredByAdmin and the timestamp are decided here, never taken from the client. */
export async function addPastSale(input: unknown): Promise<ActionResult<Sale>> {
  return runAction(async () => {
    await requireAdmin();
    const { date, time, ...saleFields } = parseInput(pastSaleInput, input);
    const now = new Date();
    const when = resolveBackdate(date, time, now);
    if (!when.ok) throw new DomainError(when.error);
    const sale = await sales.createSale(db, saleFields, { now, at: when.at, enteredByAdmin: true });
    refreshAll();
    return sale;
  });
}
