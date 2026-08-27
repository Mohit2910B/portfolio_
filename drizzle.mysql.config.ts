import "dotenv/config";
import type { Config } from "drizzle-kit";

/**
 * MySQL 8.0 schema target for local Windows setup.
 * The existing preview environment still uses the default Drizzle config.
 * Use this file only when DATABASE_URL is mysql://root:...@localhost:3306/smeet_portfolio.
 */
export default {
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/smeet_portfolio",
  },
} satisfies Config;
