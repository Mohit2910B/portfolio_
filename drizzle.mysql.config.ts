import "dotenv/config";
import type { Config } from "drizzle-kit";

/**
 * MySQL Drizzle configuration.
 * DATABASE_URL must be provided through environment variables.
 */
export default {
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;