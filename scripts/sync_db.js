const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Postgres%402026@127.0.0.1:5432/smeet_portfolio';

const pool = new Pool({ connectionString });

async function sync() {
  console.log('Connecting to database:', connectionString);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Admins
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL DEFAULT 'admin',
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;`);
    await client.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';`);
    await client.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;`);

    // 2. Sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`);

    // 4. Projects (portfolio_projects)
    await client.query(`
      CREATE TABLE IF NOT EXISTS portfolio_projects (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        category_label TEXT NOT NULL DEFAULT '',
        year INTEGER NOT NULL DEFAULT 2026,
        software TEXT NOT NULL DEFAULT '',
        tags TEXT NOT NULL DEFAULT '',
        external_url TEXT NOT NULL DEFAULT '',
        video_url TEXT NOT NULL DEFAULT '',
        thumbnail_url TEXT NOT NULL DEFAULT '',
        aspect_ratio TEXT NOT NULL DEFAULT '16:9',
        display_size TEXT NOT NULL DEFAULT 'medium',
        is_featured BOOLEAN NOT NULL DEFAULT false,
        is_published BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS category_label TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2026;`);
    await client.query(`ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS software TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS aspect_ratio TEXT DEFAULT '16:9';`);
    await client.query(`ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS display_size TEXT DEFAULT 'medium';`);

    // 5. Carousel Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS carousel_items (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES portfolio_projects(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        badge TEXT NOT NULL DEFAULT '',
        video_url TEXT NOT NULL DEFAULT '',
        thumbnail_url TEXT NOT NULL DEFAULT '',
        duration TEXT NOT NULL DEFAULT '',
        aspect_ratio TEXT NOT NULL DEFAULT '16:9',
        description TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_published BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS project_id INTEGER;`);
    await client.query(`ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS aspect_ratio TEXT DEFAULT '16:9';`);
    await client.query(`ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;`);

    // 6. Media Files
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_files (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'image',
        size INTEGER NOT NULL DEFAULT 0,
        url TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 7. Services
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        deliverables TEXT NOT NULL DEFAULT '',
        icon TEXT NOT NULL DEFAULT '',
        price_from TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS deliverables TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS price_from TEXT DEFAULT '';`);

    // 8. Skills
    await client.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        level INTEGER NOT NULL DEFAULT 90,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE skills ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';`);

    // 9. Tools & Software
    await client.query(`
      CREATE TABLE IF NOT EXISTS tools_software (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        icon_url TEXT NOT NULL DEFAULT '',
        proficiency INTEGER NOT NULL DEFAULT 95,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE tools_software ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE tools_software ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE tools_software ADD COLUMN IF NOT EXISTS proficiency INTEGER DEFAULT 95;`);

    // 10. Experience
    await client.query(`
      CREATE TABLE IF NOT EXISTS experience (
        id SERIAL PRIMARY KEY,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        start_date TEXT NOT NULL DEFAULT '',
        end_date TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 11. Creative Process
    await client.query(`
      CREATE TABLE IF NOT EXISTS creative_process (
        id SERIAL PRIMARY KEY,
        step_number TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 12. Homepage Content
    await client.query(`
      CREATE TABLE IF NOT EXISTS homepage_content (
        id INTEGER PRIMARY KEY DEFAULT 1,
        hero_eyebrow TEXT NOT NULL DEFAULT 'VIDEO EDITOR / MOTION DESIGNER',
        hero_heading TEXT NOT NULL DEFAULT 'MOHIT BABARIYA',
        hero_subtitle TEXT NOT NULL DEFAULT 'Professional Video Editor & Motion Designer',
        hero_description TEXT NOT NULL DEFAULT 'Crafting high-converting short-form reels, cinematic real estate films, YouTube edits, and commercial motion graphics worldwide.',
        hero_cta_primary TEXT NOT NULL DEFAULT 'VIEW MY WORK',
        hero_cta_secondary TEXT NOT NULL DEFAULT 'LET''S WORK TOGETHER',
        hero_media_url TEXT NOT NULL DEFAULT '',
        about_heading TEXT NOT NULL DEFAULT 'THE PERSON BEHIND THE WORK',
        about_subheading TEXT NOT NULL DEFAULT 'Passionate Storyteller & Visual Craftsman',
        about_description TEXT NOT NULL DEFAULT 'I specialize in transforming raw footage into compelling visual narratives.',
        about_experience_years TEXT NOT NULL DEFAULT '6+',
        about_projects_completed TEXT NOT NULL DEFAULT '450+',
        about_clients_count TEXT NOT NULL DEFAULT '120+',
        services_intro TEXT NOT NULL DEFAULT 'Tailored video editing, motion graphics, and post-production solutions.',
        portfolio_intro TEXT NOT NULL DEFAULT 'Selected commercial, narrative, and motion graphics projects.',
        process_intro TEXT NOT NULL DEFAULT 'A proven, collaborative workflow designed to take your video project from concept to polished export.',
        contact_intro TEXT NOT NULL DEFAULT 'Have an upcoming video or motion graphics project? Let''s create something exceptional together.',
        footer_tagline TEXT NOT NULL DEFAULT 'CRAFTING VISUAL EXCELLENCE WORLDWIDE',
        footer_copyright TEXT NOT NULL DEFAULT '© 2026 MOHIT BABARIYA. ALL RIGHTS RESERVED.',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS hero_eyebrow TEXT DEFAULT 'VIDEO EDITOR / MOTION DESIGNER';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS hero_description TEXT DEFAULT 'Crafting high-converting short-form reels, cinematic real estate films, YouTube edits, and commercial motion graphics worldwide.';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS hero_cta_primary TEXT DEFAULT 'VIEW MY WORK';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS hero_cta_secondary TEXT DEFAULT 'LET''S WORK TOGETHER';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS about_heading TEXT DEFAULT 'THE PERSON BEHIND THE WORK';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS about_subheading TEXT DEFAULT 'Passionate Storyteller & Visual Craftsman';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS about_description TEXT DEFAULT 'I specialize in transforming raw footage into compelling visual narratives.';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS about_experience_years TEXT DEFAULT '6+';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS about_projects_completed TEXT DEFAULT '450+';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS about_clients_count TEXT DEFAULT '120+';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS services_intro TEXT DEFAULT 'Tailored video editing, motion graphics, and post-production solutions.';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS portfolio_intro TEXT DEFAULT 'Selected commercial, narrative, and motion graphics projects.';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS process_intro TEXT DEFAULT 'A proven workflow...';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS contact_intro TEXT DEFAULT 'Have an upcoming video project?';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS footer_tagline TEXT DEFAULT 'CRAFTING VISUAL EXCELLENCE WORLDWIDE';`);
    await client.query(`ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS footer_copyright TEXT DEFAULT '© 2026 MOHIT BABARIYA. ALL RIGHTS RESERVED.';`);

    // 13. Contact Settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        email TEXT NOT NULL DEFAULT 'mohitbabariyaa@gmail.com',
        country_code TEXT NOT NULL DEFAULT '+91',
        phone TEXT NOT NULL DEFAULT '+91 98765 43210',
        whatsapp TEXT NOT NULL DEFAULT '+91 98765 43210',
        location TEXT NOT NULL DEFAULT 'Mumbai, India / Remote Worldwide',
        instagram TEXT NOT NULL DEFAULT 'https://instagram.com/mohitbabariya',
        youtube TEXT NOT NULL DEFAULT 'https://youtube.com/@mohitbabariya',
        linkedin TEXT NOT NULL DEFAULT 'https://linkedin.com/in/mohitbabariya',
        response_time TEXT NOT NULL DEFAULT 'Within 24 Hours',
        notification_email TEXT NOT NULL DEFAULT 'mohitbabariyaa@gmail.com',
        is_email_enabled BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS email TEXT DEFAULT 'mohitbabariyaa@gmail.com';`);
    await client.query(`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+91';`);
    await client.query(`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+91 98765 43210';`);
    await client.query(`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '+91 98765 43210';`);
    await client.query(`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Mumbai, India';`);
    await client.query(`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS instagram TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS youtube TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS linkedin TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS response_time TEXT DEFAULT 'Within 24 Hours';`);

    // 14. Theme Settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS theme_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        active_theme INTEGER NOT NULL DEFAULT 1,
        accent_color TEXT NOT NULL DEFAULT '#C7A56A',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE theme_settings ADD COLUMN IF NOT EXISTS active_theme INTEGER DEFAULT 1;`);
    await client.query(`ALTER TABLE theme_settings ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#C7A56A';`);

    // 15. Layout Order
    await client.query(`
      CREATE TABLE IF NOT EXISTS layout_order (
        id SERIAL PRIMARY KEY,
        section_key TEXT UNIQUE NOT NULL,
        label TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_visible BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS layout_order_section_key_idx ON layout_order(section_key);`);
    await client.query(`ALTER TABLE layout_order ADD COLUMN IF NOT EXISTS label TEXT DEFAULT '';`);

    // 16. Enquiries
    await client.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        country_code TEXT NOT NULL DEFAULT '+91',
        phone TEXT NOT NULL DEFAULT '',
        company TEXT NOT NULL DEFAULT '',
        project_type TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        budget TEXT NOT NULL DEFAULT '',
        deadline TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE enquiries ALTER COLUMN message DROP NOT NULL;`);
    await client.query(`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS company TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS budget TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS deadline TEXT DEFAULT '';`);

    // 17. Chat Conversations
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        country_code TEXT NOT NULL DEFAULT '+91',
        phone TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'open',
        last_message TEXT NOT NULL DEFAULT '',
        admin_unread INTEGER NOT NULL DEFAULT 0,
        customer_unread INTEGER NOT NULL DEFAULT 0,
        customer_token TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS last_message TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS customer_token TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS admin_unread INTEGER DEFAULT 0;`);
    await client.query(`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS customer_unread INTEGER DEFAULT 0;`);

    // 18. Chat Messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        sender_type TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('Database sync complete successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database sync failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

sync();
