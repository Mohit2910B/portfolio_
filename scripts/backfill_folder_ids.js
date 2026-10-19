const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function backfill() {
  const tree = JSON.parse(fs.readFileSync('scratch/drive_complete_tree.json', 'utf8'));
  let catsUpdated = 0;
  let projsUpdated = 0;

  for (const folder of tree) {
    const folderId = folder.id;
    const folderTitle = folder.title;
    const slug = folderTitle.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

    // Update category
    const catRes = await pool.query(
      'UPDATE categories SET drive_folder_id = $1 WHERE LOWER(TRIM(name)) = LOWER(TRIM($2)) OR slug = $3 RETURNING id',
      [folderId, folderTitle, slug]
    );
    if (catRes.rows.length > 0) {
      catsUpdated += catRes.rows.length;
      const catId = catRes.rows[0].id;

      // Update projects in this folder
      for (const item of folder.items) {
        const pRes = await pool.query(
          'UPDATE portfolio_projects SET drive_folder_id = $1, category_id = $2 WHERE drive_file_id = $3',
          [folderId, catId, item.id]
        );
        projsUpdated += pRes.rowCount || 0;
      }
    }
  }

  console.log(`Updated ${catsUpdated} categories and ${projsUpdated} projects with drive_folder_id.`);
  pool.end();
}

backfill().catch(console.error);
