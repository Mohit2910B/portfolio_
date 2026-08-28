import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

function isLocalHost(host: string): boolean {
  const h = host.toLowerCase().trim();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h === "0.0.0.0" ||
    h.endsWith(".localhost")
  );
}

function isCloudEnvironment(): boolean {
  return (
    process.env.NETLIFY === "true" ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.FLY_APP_NAME)
  );
}

function getPoolConfig(): PoolConfig {
  const isCloudProd = isCloudEnvironment();
  const rawUrl = process.env.DATABASE_URL?.trim();
  const dbHost = process.env.DB_HOST?.trim();
  const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
  const dbUser = process.env.DB_USER?.trim();
  const dbPassword = process.env.DB_PASSWORD ?? "";
  const dbName = process.env.DB_NAME?.trim();
  const dbSslEnv = process.env.DB_SSL?.trim()?.toLowerCase();

  let urlIsLocal = false;
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      urlIsLocal = isLocalHost(parsed.hostname);
    } catch {
      urlIsLocal = rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1");
    }
  }

  const hostIsProvided = Boolean(dbHost);
  const hostIsLocal = dbHost ? isLocalHost(dbHost) : false;

  // In cloud production (e.g. Netlify), if DATABASE_URL points to localhost but DB_HOST points to a remote host, prefer DB_*
  const shouldUseDbHostOverUrl =
    isCloudProd && rawUrl && urlIsLocal && hostIsProvided && !hostIsLocal;

  if (rawUrl && !shouldUseDbHostOverUrl) {
    const isRemote = !urlIsLocal;
    const sslDisabled = rawUrl.includes("sslmode=disable") || dbSslEnv === "false";
    const sslEnabled =
      dbSslEnv === "true" ||
      rawUrl.includes("sslmode=require") ||
      rawUrl.includes("sslmode=prefer") ||
      rawUrl.includes("sslmode=verify") ||
      isRemote;

    return {
      connectionString: rawUrl,
      ssl: sslEnabled && !sslDisabled ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  if (dbHost || dbUser || dbName) {
    const host = dbHost || "localhost";
    const isRemote = !isLocalHost(host);

    const sslDisabled = dbSslEnv === "false";
    const sslEnabled = dbSslEnv === "true" || isRemote;

    return {
      host,
      port: dbPort,
      user: dbUser || "postgres",
      password: dbPassword,
      database: dbName || "postgres",
      ssl: sslEnabled && !sslDisabled ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  return {
    connectionString: "postgresql://postgres:postgres@localhost:5432/postgres",
    max: 5,
  };
}



const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool(getPoolConfig());

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

