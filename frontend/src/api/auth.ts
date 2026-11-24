import { request, type ActionResult, type AuthResult } from "./http";

export type { AuthResult } from "./http";

/** FR-1: unlock this device with the shop code. */
export const unlockShop = (input: unknown) => request<AuthResult>("POST", "/auth/unlock", input);

/** FR-2: admin login. A successful login also unlocks this device for the barber screens. */
export const loginAdmin = (input: unknown) => request<AuthResult>("POST", "/auth/login", input);

/** Ends the admin session only; the device stays unlocked for barbers. */
export const logoutAdmin = () => request<AuthResult>("POST", "/auth/logout");

export const changeAdminPin = (input: unknown) => request<AuthResult>("POST", "/auth/change-pin", input);

/** FR-21: logs out every other device. */
export const changeShopCode = (input: unknown) => request<AuthResult>("POST", "/auth/change-shop-code", input);

/** Used by the barber screens to notice a stale device (e.g. after the shop code changed). */
export async function checkShopSession(): Promise<{ valid: boolean }> {
  const r = await request<ActionResult<{ valid: boolean }>>("POST", "/auth/check");
  return r.ok ? r.data : { valid: false };
}
