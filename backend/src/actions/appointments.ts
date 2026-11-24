// Customer appointments. Booking and the public menu need no login (customers have no accounts), so
// booking is rate limited per client IP like logins are. Listing and changing status are admin only.

import { db } from "@/db";
import { attemptStore, getClientIp, requireAdmin } from "@/lib/auth";
import { beginAttempt } from "@/lib/rate-limit";
import { appointmentInput, appointmentStatusInput, appointmentsQuery, idSchema, slotsQuery } from "@/lib/schemas";
import type { Appointment } from "@/lib/types";
import { parseInput, runAction, type ActionResult } from "@/server/action";
import * as appts from "@/server/appointments";
import { DomainError } from "@/server/errors";

const BLOCKED = "অনেকবার চেষ্টা করা হয়েছে, কিছুক্ষণ পরে আবার চেষ্টা করুন";

/** Public: a customer books a slot. 5 attempts per 15 minutes per client address. */
export async function bookAppointment(input: unknown): Promise<ActionResult<Appointment>> {
  return runAction(async () => {
    const ip = await getClientIp();
    if (!ip) throw new Error("no client ip"); // no trusted client address: refuse rather than share a bucket
    if (!(await beginAttempt(attemptStore, ip, "book")).allowed) throw new DomainError(BLOCKED);
    return appts.createAppointment(db, parseInput(appointmentInput, input));
  });
}

/** Public: the services, prices and barbers a customer may pick from (no commissions or internals). */
export async function getPublicMenu(): Promise<ActionResult<appts.PublicMenu>> {
  return runAction(() => appts.publicMenu(db));
}

/** Public: start times already taken for one barber on one day. */
export async function getBookedTimes(query: unknown): Promise<ActionResult<string[]>> {
  return runAction(async () => {
    const q = parseInput(slotsQuery, query);
    return appts.bookedTimes(db, q.date, q.barberId);
  });
}

export async function listAppointments(query: unknown): Promise<ActionResult<Appointment[]>> {
  return runAction(async () => {
    await requireAdmin();
    return appts.listAppointments(db, parseInput(appointmentsQuery, query));
  });
}

export async function setAppointmentStatus(id: unknown, input: unknown): Promise<ActionResult<Appointment>> {
  return runAction(async () => {
    await requireAdmin();
    return appts.setAppointmentStatus(db, parseInput(idSchema, id), parseInput(appointmentStatusInput, input).status);
  });
}
