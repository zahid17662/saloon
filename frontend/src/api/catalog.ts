import type { Barber, Category, Service, Settings } from "@/lib/types";
import { request, type ActionResult } from "./http";

// Admin catalog writes: barbers, categories, services, shop settings. Input is validated by the API.

export const addBarber = (input: unknown) => request<ActionResult<Barber>>("POST", "/barbers", input);
export const updateBarber = (id: unknown, patch: unknown) => request<ActionResult<Barber>>("PATCH", `/barbers/${id}`, patch);

export const addCategory = (input: unknown) => request<ActionResult<Category>>("POST", "/categories", input);
export const updateCategory = (id: unknown, patch: unknown) =>
  request<ActionResult<Category>>("PATCH", `/categories/${id}`, patch);

export const addService = (input: unknown) => request<ActionResult<Service>>("POST", "/services", input);
export const updateService = (id: unknown, patch: unknown) => request<ActionResult<Service>>("PATCH", `/services/${id}`, patch);

export const updateSettings = (patch: unknown) => request<ActionResult<Settings>>("PATCH", "/settings", patch);
