"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Booking = { preset: number | null; pick: (serviceId: number) => void };

const Ctx = createContext<Booking>({ preset: null, pick: () => {} });

export const useBooking = () => useContext(Ctx);

/** Lets a service card further up the page preselect itself in the booking form below. */
export function BookingProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<number | null>(null);
  function pick(serviceId: number) {
    setPreset(serviceId);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  }
  return <Ctx.Provider value={{ preset, pick }}>{children}</Ctx.Provider>;
}
