import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export class DatabaseNotConfiguredError extends Error {
  constructor(message?: string) {
    super(
      message ||
        "Production database is not configured. In Vercel Project Settings -> Environment Variables, set DATABASE_URL to your remote PostgreSQL database URL (e.g. Neon, Supabase, Vercel Postgres, AWS RDS).",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

function cleanEnvValue(value?: string): string {
  if (!value) return "";
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'")) ||
    (v.startsWith("`") && v.endsWith("`"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

function isLocalHost(host: string): boolean {
  const h = host.toLowerCase().trim();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h === "0.0.0.0" ||
    h.endsWith(".localhost") ||
    h === "host.docker.internal"
  );
}

function extractHostname(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname?.trim() || null;
  } catch {
    const atIndex = rawUrl.lastIndexOf("@");
    if (atIndex !== -1) {
      const hostPart = rawUrl.slice(atIndex + 1);
      const host = hostPart.split("/")[0]?.split(":")[0]?.split("?")[0]?.trim();
      if (host) return host;
    }
    return null;
  }
}

function isCloudDeployment(): boolean {
  return (
    process.env.VERCEL === "1" ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_ENV) ||
    process.env.NETLIFY === "true" ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.FLY_APP_NAME)
  );
}

export type DbResolution =
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
  | { type: "unconfigured" };

export function getDatabaseResolution(): DbResolution {
  const isCloud = isCloudDeployment();

  const rawUrl =
    cleanEnvValue(process.env.DATABASE_URL) ||
    cleanEnvValue(process.env.POSTGRES_URL) ||
    cleanEnvValue(process.env.POSTGRES_PRISMA_URL) ||
    cleanEnvValue(process.env.POSTGRES_URL_NON_POOLING) ||
    cleanEnvValue(process.env.DATABASE_URI) ||
    cleanEnvValue(process.env.DB_URL);

  const dbHost = cleanEnvValue(process.env.DB_HOST);
  const dbPort = process.env.DB_PORT ? Number(cleanEnvValue(process.env.DB_PORT)) : 5432;
  const dbUser = cleanEnvValue(process.env.DB_USER);
  const dbPassword = process.env.DB_PASSWORD ? cleanEnvValue(process.env.DB_PASSWORD) : "";
  const dbName = cleanEnvValue(process.env.DB_NAME);
  const dbSslEnv = cleanEnvValue(process.env.DB_SSL).toLowerCase();

  let urlHostname: string | null = null;
  let urlIsLocal = false;

  if (rawUrl) {
    urlHostname = extractHostname(rawUrl);
    if (urlHostname) {
      urlIsLocal = isLocalHost(urlHostname);
    }
  }

  const hostIsProvided = Boolean(dbHost);
  const hostIsLocal = dbHost ? isLocalHost(dbHost) : false;

  // 1. Remote DATABASE_URL
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

  // 2. Remote discrete DB_HOST
  if (hostIsProvided && !hostIsLocal) {
    const sslDisabled = dbSslEnv === "false";
    const sslEnabled = dbSslEnv === "true" || !sslDisabled;

    return {
      type: "remote-params",
      host: dbHost,
      port: dbPort || 5432,
      user: dbUser || "postgres",
      password: dbPassword,
      database: dbName || "postgres",
      ssl: sslEnabled && !sslDisabled,
    };
  }

  // 3. In cloud/production, if no remote DB credentials exist, do NOT connect to loopback
  if (isCloud) {
    return { type: "unconfigured" };
  }

  // 4. Local development only:
  if (rawUrl) {
    return { type: "local-url", connectionString: rawUrl };
  }

  if (hostIsProvided || dbUser || dbName) {
    return {
      type: "local-params",
      host: dbHost || "localhost",
      port: dbPort || 5432,
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

const globalForDb = globalThis as unknown as {
  cachedPgPool?: Pool;
  cachedPgKey?: string;
};

export function getPool(): Pool {
  const resolution = getDatabaseResolution();
  const currentKey = JSON.stringify(resolution);

  if (globalForDb.cachedPgPool && globalForDb.cachedPgKey === currentKey) {
    return globalForDb.cachedPgPool;
  }

  if (resolution.type === "remote-url") {
    const pool = new Pool({
      connectionString: resolution.connectionString,
      ssl: resolution.ssl ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
    globalForDb.cachedPgPool = pool;
    globalForDb.cachedPgKey = currentKey;
    return pool;
  }

  if (resolution.type === "remote-params") {
    const pool = new Pool({
      host: resolution.host,
      port: resolution.port,
      user: resolution.user,
      password: resolution.password,
      database: resolution.database,
      ssl: resolution.ssl ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
    globalForDb.cachedPgPool = pool;
    globalForDb.cachedPgKey = currentKey;
    return pool;
  }

  if (resolution.type === "local-url") {
    const pool = new Pool({
      connectionString: resolution.connectionString,
      max: 5,
    });
    globalForDb.cachedPgPool = pool;
    globalForDb.cachedPgKey = currentKey;
    return pool;
  }

  if (resolution.type === "local-params") {
    const pool = new Pool({
      host: resolution.host,
      port: resolution.port,
      user: resolution.user,
      password: resolution.password,
      database: resolution.database,
      max: 5,
    });
    globalForDb.cachedPgPool = pool;
    globalForDb.cachedPgKey = currentKey;
    return pool;
  }

  const unconfiguredPool = new Pool({
    connectionString: "postgresql://unconfigured:unconfigured@0.0.0.0:5432/unconfigured",
    max: 1,
    connectionTimeoutMillis: 1000,
  });

  const unconfiguredError = new DatabaseNotConfiguredError();

  unconfiguredPool.query = (async () => {
    console.error(
      "[db] Production database error: Neither DATABASE_URL nor DB_HOST points to a live remote PostgreSQL server in environment variables.",
    );
    throw unconfiguredError;
  }) as unknown as typeof unconfiguredPool.query;

  unconfiguredPool.connect = (async () => {
    console.error(
      "[db] Production database error: Neither DATABASE_URL nor DB_HOST points to a live remote PostgreSQL server in environment variables.",
    );
    throw unconfiguredError;
  }) as unknown as typeof unconfiguredPool.connect;

  globalForDb.cachedPgPool = unconfiguredPool;
  globalForDb.cachedPgKey = currentKey;
  return unconfiguredPool;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const active = getPool();
    const value = Reflect.get(active, prop, receiver);
    if (typeof value === "function") {
      return value.bind(active);
    }
    return value;
  },
});

export const db = drizzle(pool);



