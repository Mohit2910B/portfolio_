import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:Postgres%402026@127.0.0.1:5432/smeet_portfolio",
  },
} satisfies Config;
