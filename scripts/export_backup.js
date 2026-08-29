const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function exportDatabase() {
  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connStr) {
    console.error('DATABASE_URL is not set.');
    return;
  }

  const pool = new Pool({ connectionString: connStr });

  const tables = [
    'admins',
    'categories',
    'projects',
    'services',
    'skills',
    'hero_slides',
    'workflow_steps',
    'testimonials',
    'awards',
    'contact_settings',
    'enquiries',
    'chat_conversations',
    'chat_messages',
    'notification_settings',
    'mobile_otp_challenges',
  ];

  let sql = `-- ==========================================================\n`;
  sql += `-- MOHIT BABARIYA - PORTFOLIO DATABASE BACKUP\n`;
  sql += `-- Export Date: ${new Date().toISOString()}\n`;
  sql += `-- Database Engine: PostgreSQL / Neon / Vercel Postgres\n`;
  sql += `-- ==========================================================\n\n`;

  for (const table of tables) {
    try {
      const res = await pool.query(`SELECT * FROM ${table} ORDER BY id ASC`);
      sql += `-- ----------------------------------------------------------\n`;
      sql += `-- Data for Table: ${table} (${res.rows.length} rows)\n`;
      sql += `-- ----------------------------------------------------------\n`;

      for (const row of res.rows) {
        const columns = Object.keys(row);
        const values = columns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return String(val);
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });

        sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      }
      sql += `\n`;
    } catch (err) {
      sql += `-- Note: ${table} error: ${err.message}\n\n`;
    }
  }

  fs.writeFileSync('database_backup.sql', sql, 'utf8');
  console.log('✅ database_backup.sql successfully generated with live data!');
  await pool.end();
}

exportDatabase().catch(console.error);
