const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function backfill() {
  const res = await pool.query('SELECT id, video_url, thumbnail_url FROM portfolio_projects WHERE drive_file_id IS NULL');
  let updated = 0;
  for (const r of res.rows) {
    const match = (r.video_url || '').match(/id=([a-zA-Z0-9_-]{20,})/) || (r.thumbnail_url || '').match(/id=([a-zA-Z0-9_-]{20,})/);
    if (match) {
      await pool.query('UPDATE portfolio_projects SET drive_file_id = $1 WHERE id = $2', [match[1], r.id]);
      updated++;
    }
  }
  console.log(`Backfilled drive_file_id for ${updated} projects out of ${res.rows.length}`);
  pool.end();
}

backfill().catch(console.error);
