import type { Payout } from "@/lib/types";
import { request, type ActionResult } from "./http";

export interface BarberBalance {
  barberId: number;
  earned: number;
  paid: number;
  balance: number; // negative = advance
  salesCount: number; // live sales, all time
}

export interface PayoutsView {
  payouts: Payout[];
  balances: BarberBalance[];
}

export const getPayoutsView = () => request<ActionResult<PayoutsView>>("GET", "/payouts");
export const addPayout = (input: unknown) => request<ActionResult<Payout>>("POST", "/payouts", input);

/** Input is `{ id }`. */
export const deletePayout = (input: unknown) => {
  const id = input && typeof input === "object" ? (input as { id?: unknown }).id : undefined;
  return request<ActionResult<null>>("DELETE", `/payouts/${id}`);
};
