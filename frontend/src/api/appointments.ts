import type { Appointment, AppointmentStatus } from "@/lib/types";
import { request, withQuery, type ActionResult } from "./http";

// Customers (no login): book a slot and see which start times are taken for a barber.
// Admin: list bookings (view only). Hairdresser (shop session): their own bookings, which they confirm / cancel / finish.
// Validation and prices are the API's.

export const bookAppointment = (input: unknown) => request<ActionResult<Appointment>>("POST", "/public/appointments", input);

export const getBookedTimes = (query: { date: string; barberId: number }) =>
  request<ActionResult<string[]>>("GET", withQuery("/public/slots", query));

export const listAppointments = (query: unknown) => request<ActionResult<Appointment[]>>("GET", withQuery("/appointments", query));

export const listBarberAppointments = (barberId: number) =>
  request<ActionResult<Appointment[]>>("GET", withQuery("/shop/appointments", { barberId }));

export const setBarberAppointmentStatus = (id: number, barberId: number, status: Exclude<AppointmentStatus, "PENDING">) =>
  request<ActionResult<Appointment>>("PATCH", `/shop/appointments/${id}`, { barberId, status });
