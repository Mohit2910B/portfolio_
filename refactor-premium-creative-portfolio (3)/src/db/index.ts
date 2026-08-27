import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST ?? "localhost";
  const port = process.env.DB_PORT ?? "3306";
  const name = process.env.DB_NAME ?? "smeet_portfolio";
  const user = process.env.DB_USER ?? "root";
  const password = process.env.DB_PASSWORD ?? "";

  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(
    password,
  )}@${host}:${port}/${name}`;
}

const databaseUrl = resolveDatabaseUrl();

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsMysqlPool?: mysql.Pool;
};

export const pool =
  globalForDb.__arenaNextJsMysqlPool ??
  mysql.createPool({
    uri: databaseUrl,
    connectionLimit: Number(process.env.DB_POOL_MAX ?? 10),
    waitForConnections: true,
    idleTimeout: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 30_000),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsMysqlPool = pool;
}

export const db = drizzle(pool);