const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function exportDatabase() {
  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connStr) {
    console.error('DATABASE_URL is not set.');
    return;
  }

  const pool = new Pool({ connectionString: connStr });

  let sql = `-- ==========================================================\n`;
  sql += `-- MOHIT BABARIYA - COMPLETE PORTFOLIO DATABASE BACKUP\n`;
  sql += `-- Export Date: ${new Date().toISOString()}\n`;
  sql += `-- Database Engine: PostgreSQL / Neon / Vercel Postgres\n`;
  sql += `-- ==========================================================\n\n`;

  try {
    // Get all public tables in clean order
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `);

    const tables = tableRes.rows.map((r) => r.table_name);

    for (const table of tables) {
      try {
        const res = await pool.query(`SELECT * FROM "${table}"`);
        sql += `-- ----------------------------------------------------------\n`;
        sql += `-- Table: ${table} (${res.rows.length} rows)\n`;
        sql += `-- ----------------------------------------------------------\n`;

        if (res.rows.length === 0) {
          sql += `-- (No rows)\n\n`;
          continue;
        }

        const cols = Object.keys(res.rows[0]);
        const colList = cols.map((c) => `"${c}"`).join(', ');

        for (const row of res.rows) {
          const vals = cols
            .map((c) => {
              const v = row[c];
              if (v === null || v === undefined) return 'NULL';
              if (typeof v === 'boolean') return v ? 'true' : 'false';
              if (typeof v === 'number') return v;
              if (v instanceof Date) return `'${v.toISOString()}'`;
              if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
              return `'${v.toString().replace(/'/g, "''")}'`;
            })
            .join(', ');

          sql += `INSERT INTO "${table}" (${colList}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
        }
        sql += `\n`;
      } catch (err) {
        console.warn(`Could not export table ${table}: ${err.message}`);
      }
    }

    const backupPath = path.resolve(__dirname, '../database_backup.sql');
    fs.writeFileSync(backupPath, sql, 'utf8');
    console.log(`✅ database_backup.sql successfully generated with all live tables and rows!`);
  } catch (e) {
    console.error('Error exporting database:', e);
  } finally {
    await pool.end();
  }
}

exportDatabase();
