const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const tree = JSON.parse(fs.readFileSync('scratch/drive_complete_tree.json', 'utf8'));

// Slug generator
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Clean title from filename
function cleanTitle(filename) {
  let title = filename.replace(/\.(mp4|mov|mkv|avi|webm|m4v)$/i, '').trim();
  title = title.replace(/^#/, '');
  title = title.replace(/_/g, ' ');
  return title;
}

// Detect aspect ratio based on category or filename
function getAspectRatio(categoryTitle, filename) {
  const lower = (categoryTitle + ' ' + filename).toLowerCase();
  if (
    lower.includes('reel') ||
    lower.includes('shorts') ||
    lower.includes('tiktok') ||
    lower.includes('story') ||
    lower.includes('9:16') ||
    lower.includes('vertical')
  ) {
    return '9:16';
  }
  return '16:9';
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is missing in .env.local');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  console.log('✓ Connected to PostgreSQL database');

  try {
    await client.query('BEGIN');

    // 1. Clear old dummy projects and carousel items
    console.log('Clearing old placeholder carousel and project items...');
    await client.query('DELETE FROM carousel_items');
    await client.query('DELETE FROM portfolio_projects');
    await client.query('DELETE FROM categories');

    console.log('\n--- Inserting 8 Google Drive Categories ---');
    const categoryMap = new Map(); // title -> id

    for (let i = 0; i < tree.length; i++) {
      const cat = tree[i];
      const cleanCatTitle = cat.title.trim();
      const slug = slugify(cleanCatTitle);

      const res = await client.query(
        `INSERT INTO categories (name, slug, description, sort_order, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, name, slug`,
        [cleanCatTitle, slug, `${cleanCatTitle} showcase video edits by Mohit Babariya`, i + 1]
      );

      const catId = res.rows[0].id;
      categoryMap.set(cleanCatTitle, catId);
      console.log(`✓ [Category #${catId}] "${cleanCatTitle}" (slug: ${slug})`);
    }

    console.log('\n--- Inserting 47 Category-Wise Video Projects ---');
    let projectCount = 0;

    for (let catIdx = 0; catIdx < tree.length; catIdx++) {
      const cat = tree[catIdx];
      const catTitle = cat.title.trim();
      const catId = categoryMap.get(catTitle);

      console.log(`\n📁 Category: ${catTitle} (${cat.items.length} videos)`);

      for (let itemIdx = 0; itemIdx < cat.items.length; itemIdx++) {
        const item = cat.items[itemIdx];
        projectCount++;

        const title = cleanTitle(item.name);
        const fileId = item.id;
        const videoUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
        const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
        const externalUrl = `https://drive.google.com/file/d/${fileId}/view`;
        const aspectRatio = getAspectRatio(catTitle, item.name);
        const sortOrder = projectCount;

        // Insert into portfolio_projects
        const projRes = await client.query(
          `INSERT INTO portfolio_projects (
            title, description, category_id, category_label, year, software, tags,
            external_url, video_url, thumbnail_url, aspect_ratio, display_size,
            is_featured, is_published, sort_order
          ) VALUES ($1, $2, $3, $4, 2026, $5, $6, $7, $8, $9, $10, $11, $12, true, $13)
          RETURNING id`,
          [
            title,
            `${catTitle} video edit showcase: ${title}. Professional cinematic editing, motion & audio work by Mohit Babariya.`,
            catId,
            catTitle,
            'Premiere Pro, After Effects, DaVinci Resolve',
            `${catTitle}, ${aspectRatio === '9:16' ? 'Vertical Reel' : 'Cinematic'}, 4K`,
            externalUrl,
            videoUrl,
            thumbnailUrl,
            aspectRatio,
            aspectRatio === '9:16' ? 'medium' : 'large',
            itemIdx === 0, // feature the first one in each category
            sortOrder,
          ]
        );
        const projectId = projRes.rows[0].id;

        // Insert into carousel_items as well for the 3D Showreel
        await client.query(
          `INSERT INTO carousel_items (
            project_id, title, category, badge, video_url, thumbnail_url,
            duration, aspect_ratio, description, sort_order, is_published
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
          [
            projectId,
            title,
            catTitle,
            aspectRatio === '9:16' ? 'VERTICAL REEL' : 'CINEMATIC 4K',
            videoUrl,
            thumbnailUrl,
            '01:00',
            aspectRatio,
            `${catTitle} — ${title}`,
            sortOrder,
          ]
        );

        console.log(`  ✓ #${projectCount}: "${title}" [${aspectRatio}]`);
      }
    }

    await client.query('COMMIT');
    console.log(`\n🎉 SUCCESS! Seeded ${tree.length} categories and ${projectCount} videos!`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
  } finally {
    await client.end();
  }
}

main();
