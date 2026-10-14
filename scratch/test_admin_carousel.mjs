import { getPool } from "../src/db/index.js";

async function main() {
  console.log("Checking production database connection...");
  const pool = getPool();
  const res = await pool.query("SELECT 1 AS ok");
  console.log("Database connection successful:", res.rows[0]);

  // Query records count
  const counts = await pool.query(`
    SELECT
      (SELECT count(*)::int FROM projects) AS projects,
      (SELECT count(*)::int FROM carousel_items) AS carousel_items,
      (SELECT count(*)::int FROM media_files) AS media_files
  `);

  console.log("Current Database Record Counts:", counts.rows[0]);
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
