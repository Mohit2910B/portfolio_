import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

export class DatabaseNotConfiguredError extends Error {
  constructor(message?: string) {
    super(
      message ||
        "Production database is not configured. In Netlify Site settings -> Environment variables, set DATABASE_URL to your remote PostgreSQL database URL (e.g. Neon, Supabase, AWS RDS).",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

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

function isCloudOrProduction(): boolean {
  return (
    process.env.NETLIFY === "true" ||
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.FLY_APP_NAME)
  );
}

export function getDatabaseResolution():
  | { type: "remote-url"; connectionString: string; ssl: boolean }
  | {
      type: "remote-params";
      host: string;
      port: number;
      user: string;
      database: string;
      ssl: boolean;
      password?: string;
    }
  | { type: "local-url"; connectionString: string }
  | {
      type: "local-params";
      host: string;
      port: number;
      user: string;
      database: string;
      password?: string;
    }
  | { type: "unconfigured" } {
  const isCloud = isCloudOrProduction();
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

  // 1. Prioritize remote DATABASE_URL
  if (rawUrl && !urlIsLocal) {
    const sslDisabled = rawUrl.includes("sslmode=disable") || dbSslEnv === "false";
    const sslEnabled =
      dbSslEnv === "true" ||
      rawUrl.includes("sslmode=require") ||
      rawUrl.includes("sslmode=prefer") ||
      rawUrl.includes("sslmode=verify") ||
      !sslDisabled;

    return {
      type: "remote-url",
      connectionString: rawUrl,
      ssl: sslEnabled && !sslDisabled,
    };
  }

  // 2. Prioritize remote DB_HOST
  if (hostIsProvided && !hostIsLocal) {
    const sslDisabled = dbSslEnv === "false";
    const sslEnabled = dbSslEnv === "true" || !sslDisabled;

    return {
      type: "remote-params",
      host: dbHost!,
      port: dbPort,
      user: dbUser || "postgres",
      password: dbPassword,
      database: dbName || "postgres",
      ssl: sslEnabled && !sslDisabled,
    };
  }

  // 3. In cloud/production: DO NOT connect to localhost/127.0.0.1
  if (isCloud) {
    return { type: "unconfigured" };
  }

  // 4. In local development only:
  if (rawUrl) {
    return { type: "local-url", connectionString: rawUrl };
  }

  if (hostIsProvided || dbUser || dbName) {
    return {
      type: "local-params",
      host: dbHost || "localhost",
      port: dbPort,
      user: dbUser || "postgres",
      password: dbPassword,
      database: dbName || "postgres",
    };
  }

  return {
    type: "local-url",
    connectionString: "postgresql://postgres:postgres@localhost:5432/postgres",
  };
}

function createProductionSafePool(): Pool {
  const resolution = getDatabaseResolution();

  if (resolution.type === "remote-url") {
    return new Pool({
      connectionString: resolution.connectionString,
      ssl: resolution.ssl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  if (resolution.type === "remote-params") {
    return new Pool({
      host: resolution.host,
      port: resolution.port,
      user: resolution.user,
      password: resolution.password,
      database: resolution.database,
      ssl: resolution.ssl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  if (resolution.type === "local-url") {
    return new Pool({
      connectionString: resolution.connectionString,
      max: 5,
    });
  }

  if (resolution.type === "local-params") {
    return new Pool({
      host: resolution.host,
      port: resolution.port,
      user: resolution.user,
      password: resolution.password,
      database: resolution.database,
      max: 5,
    });
  }

  // Unconfigured in cloud production: Create a safe stub pool that rejects queries with descriptive instructions
  const unconfiguredPool = new Pool({
    // Dummy loopback config that is never actually connected to because query/connect are intercepted
    connectionString: "postgresql://unconfigured:unconfigured@0.0.0.0:5432/unconfigured",
    max: 1,
    connectionTimeoutMillis: 1000,
  });

  const unconfiguredError = new DatabaseNotConfiguredError();

  unconfiguredPool.query = (async () => {
    console.error(
      "[db] Production database error: Neither DATABASE_URL nor DB_HOST points to a live remote PostgreSQL server in Netlify environment variables. Localhost/127.0.0.1 cannot be used on Netlify.",
    );
    throw unconfiguredError;
  }) as unknown as typeof unconfiguredPool.query;

  unconfiguredPool.connect = (async () => {
    console.error(
      "[db] Production database error: Neither DATABASE_URL nor DB_HOST points to a live remote PostgreSQL server in Netlify environment variables. Localhost/127.0.0.1 cannot be used on Netlify.",
    );
    throw unconfiguredError;
  }) as unknown as typeof unconfiguredPool.connect;

  return unconfiguredPool;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ?? createProductionSafePool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);


