import "dotenv/config";
import type { Config } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Drizzle MySQL configuration.");
}

export default {
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: databaseUrl,
  },
} satisfies Config;