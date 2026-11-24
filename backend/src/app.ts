// The REST API. Every route runs one action from src/actions inside a request context (cookies and
// headers) and returns its { ok, data | error } result as JSON. Status codes follow the result:
// 200 ok, 400 a message for the user, 401 not logged in, 500 a bug or an outage.

import express, { type Request, type RequestHandler, type Response } from "express";
import * as appointmentActions from "./actions/appointments";
import * as auth from "./actions/auth";
import { GET as backupGET } from "./actions/backup";
import * as catalogActions from "./actions/catalog";
import * as payoutActions from "./actions/payouts";
import * as reads from "./actions/reads";
import * as saleActions from "./actions/sales";
import { contextFromExpress, runWithContext } from "./lib/http-context";
import { GENERIC_ERR } from "./lib/messages";
import { MSG } from "./server/action";

type Handler = (req: Request, res: Response) => Promise<unknown>;

function statusOf(result: unknown): number {
  if (!result || typeof result !== "object" || !("ok" in result) || (result as { ok: unknown }).ok !== false) return 200;
  const error = (result as { error?: unknown }).error;
  if (error === MSG.unauthorized) return 401;
  if (error === MSG.generic) return 500;
  return 400;
}

/** Runs the handler with this request's cookies/headers available to lib/auth. */
const route =
  (fn: Handler): RequestHandler =>
  (req, res) =>
    runWithContext(contextFromExpress(req, res), async () => {
      try {
        const result = await fn(req, res);
        if (res.headersSent) return; // the handler wrote the response itself (backup download)
        res.status(statusOf(result)).json(result);
      } catch (e) {
        // Name only: driver errors can echo hostnames or credentials.
        console.error("request failed:", e instanceof Error ? e.name : "non-Error thrown");
        if (!res.headersSent) res.status(500).json({ ok: false, error: GENERIC_ERR });
      }
    });

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  const api = express.Router();

  api.get("/health", (_req, res) => void res.json({ ok: true }));

  // ----- session / auth (FR-1, FR-2, FR-21)
  api.get("/auth/session", route(async () => ({ ok: true, data: await reads.getSessionStatus() })));
  api.post("/auth/unlock", route((req) => auth.unlockShop(req.body)));
  api.post("/auth/login", route((req) => auth.loginAdmin(req.body)));
  api.post("/auth/logout", route(() => auth.logoutAdmin()));
  api.post("/auth/change-pin", route((req) => auth.changeAdminPin(req.body)));
  api.post("/auth/change-shop-code", route((req) => auth.changeShopCode(req.body)));
  api.post("/auth/check", route(async () => ({ ok: true, data: await auth.checkShopSession() })));

  // ----- catalog
  api.get("/public/shop-name", route(async () => ({ ok: true, data: await reads.getPublicShopName() })));
  api.get("/catalog", route(() => reads.getCatalogView()));

  // ----- customers (no login): menu, free slots, booking
  api.get("/public/menu", route(() => appointmentActions.getPublicMenu()));
  api.get("/public/slots", route((req) => appointmentActions.getBookedTimes({ date: req.query.date, barberId: Number(req.query.barberId) })));
  api.post("/public/appointments", route((req) => appointmentActions.bookAppointment(req.body)));

  // ----- appointments (admin)
  api.get(
    "/appointments",
    route((req) => {
      const q = req.query;
      return appointmentActions.listAppointments({ from: q.from, to: q.to, ...(q.status === undefined ? {} : { status: q.status }) });
    }),
  );
  api.patch("/appointments/:id", route((req) => appointmentActions.setAppointmentStatus(Number(req.params.id), req.body)));
  api.post("/barbers", route((req) => catalogActions.addBarber(req.body)));
  api.patch("/barbers/:id", route((req) => catalogActions.updateBarber(Number(req.params.id), req.body)));
  api.post("/categories", route((req) => catalogActions.addCategory(req.body)));
  api.patch("/categories/:id", route((req) => catalogActions.updateCategory(Number(req.params.id), req.body)));
  api.post("/services", route((req) => catalogActions.addService(req.body)));
  api.patch("/services/:id", route((req) => catalogActions.updateService(Number(req.params.id), req.body)));
  api.patch("/settings", route((req) => catalogActions.updateSettings(req.body)));

  // ----- sales (specific paths before "/sales/:id")
  api.get("/sales/today-stats", route(() => reads.getTodayStats()));
  api.get("/sales/barber/:id/today", route((req) => reads.getBarberSalesToday(Number(req.params.id))));
  api.post("/sales/void-mine", route((req) => saleActions.voidMySale(req.body)));
  api.post("/sales/admin-void", route((req) => saleActions.adminVoidSale(req.body)));
  api.post("/sales/past", route((req) => saleActions.addPastSale(req.body)));
  // Query-string values are all strings; the numeric filter is converted before validation.
  api.get(
    "/sales",
    route((req) => {
      const { barberId, ...rest } = req.query;
      return saleActions.listSales(barberId === undefined ? rest : { ...rest, barberId: Number(barberId) });
    }),
  );
  api.post("/sales", route((req) => saleActions.createSale(req.body)));
  api.get("/sales/:id", route((req) => reads.getSaleById(Number(req.params.id))));

  // ----- payouts
  api.get("/payouts", route(() => payoutActions.getPayoutsView()));
  api.post("/payouts", route((req) => payoutActions.addPayout(req.body)));
  api.delete("/payouts/:id", route((req) => payoutActions.deletePayout({ id: Number(req.params.id) })));

  // ----- owner backup download (admin only; the action re-checks the session)
  api.get(
    "/admin/backup",
    route(async (_req, res) => {
      const r = await backupGET();
      res.status(r.status);
      r.headers.forEach((value, key) => res.setHeader(key, value));
      res.send(await r.text());
    }),
  );

  app.use("/api", api);
  app.use((_req, res) => void res.status(404).json({ ok: false, error: MSG.badInput }));
  // Malformed JSON bodies and other framework errors.
  app.use(((err, _req, res, _next) => {
    console.error("request rejected:", err instanceof Error ? err.name : "non-Error thrown");
    res.status(400).json({ ok: false, error: MSG.badInput });
  }) as express.ErrorRequestHandler);

  return app;
}
