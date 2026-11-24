import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Node has no browser WebSocket for the Neon driver, so hand it the `ws` implementation.
neonConfig.webSocketConstructor = ws;

// Pooled Neon connection over WebSocket (supports interactive transactions).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
export * from "./schema";
