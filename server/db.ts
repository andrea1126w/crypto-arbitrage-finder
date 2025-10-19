import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Use WebSocket only in development (Replit), not in production (Railway)
if (process.env.NODE_ENV === 'development') {
  neonConfig.webSocketConstructor = ws;
}// Use WebSocket only in development (Replit), not in production (Railway)
if (process.env.NODE_ENV === 'development') {
  neonConfig.webSocketConstructor = ws;
}
// Force rebuild for Railway cache invalidationif (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
