import type { Sale } from "@/lib/types";
import { request, withQuery, type ActionResult } from "./http";

// Barber screen (shop device): createSale, voidMySale. Admin only: listSales, adminVoidSale, addPastSale.
// enteredByAdmin and every timestamp are decided by the API, never taken from here.

export const createSale = (input: unknown) => request<ActionResult<Sale>>("POST", "/sales", input);
export const voidMySale = (input: unknown) => request<ActionResult<Sale>>("POST", "/sales/void-mine", input);
export const listSales = (query: unknown) => request<ActionResult<Sale[]>>("GET", withQuery("/sales", query));
export const adminVoidSale = (input: unknown) => request<ActionResult<Sale>>("POST", "/sales/admin-void", input);
export const addPastSale = (input: unknown) => request<ActionResult<Sale>>("POST", "/sales/past", input);
