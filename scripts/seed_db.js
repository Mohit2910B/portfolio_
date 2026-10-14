const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Postgres%402026@127.0.0.1:5432/smeet_portfolio';
const pool = new Pool({ connectionString });

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function seed() {
  console.log('Seeding initial production data...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Seed Admin
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'mohitbabariyaa@gmail.com';
    const adminUsername = process.env.SEED_ADMIN_USERNAME || 'Mohit';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Mohit@2910';
    const adminName = process.env.SEED_ADMIN_NAME || 'MOHIT BABARIYA';
    const passwordHash = hashPassword(adminPassword);

    const existingAdmin = await client.query('SELECT id FROM admins WHERE email = $1 OR username = $2', [adminEmail, adminUsername]);
    if (existingAdmin.rows.length === 0) {
      await client.query(
        `INSERT INTO admins (name, email, username, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
        [adminName, adminEmail, adminUsername, passwordHash, 'admin']
      );
      console.log('Admin account created:', adminEmail);
    } else {
      // Update password hash to guarantee login works
      await client.query(
        `UPDATE admins SET password_hash = $1, name = $2 WHERE email = $3 OR username = $4`,
        [passwordHash, adminName, adminEmail, adminUsername]
      );
      console.log('Admin account credentials updated:', adminEmail);
    }

    // 2. Categories
    const categoriesData = [
      { name: 'Commercial', slug: 'commercial', description: 'High-production brand commercials and product videos.', sort_order: 1 },
      { name: 'Social Media / Reels', slug: 'reels', description: 'High-retention vertical short-form reels and TikToks.', sort_order: 2 },
      { name: 'Motion Graphics', slug: 'motion-graphics', description: '2D & 3D title design, typography, and visual animation.', sort_order: 3 },
      { name: 'Real Estate', slug: 'real-estate', description: 'Cinematic real estate property tours and architectural films.', sort_order: 4 },
      { name: 'YouTube & Long-form', slug: 'youtube', description: 'Engaging YouTube edits, podcasts, and video essays.', sort_order: 5 },
      { name: 'AI & 3D VFX', slug: 'ai-3d', description: 'Futuristic AI video generation, 3D modeling, and compositing.', sort_order: 6 },
    ];

    const categoryIdMap = {};
    for (const c of categoriesData) {
      const res = await client.query(
        `INSERT INTO categories (name, slug, description, sort_order, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
         RETURNING id, slug`,
        [c.name, c.slug, c.description, c.sort_order]
      );
      categoryIdMap[c.slug] = res.rows[0].id;
    }
    console.log('Categories seeded:', Object.keys(categoryIdMap).length);

    // 3. Projects (Portfolio)
    const existingProjects = await client.query('SELECT COUNT(*) FROM portfolio_projects');
    if (parseInt(existingProjects.rows[0].count, 10) === 0) {
      const projectsData = [
        {
          title: 'CYBERPUNK NEON — BRAND COMMERCIAL',
          description: 'High-octane commercial motion edit featuring futuristic 3D compositing, sleek color grading, and dynamic audio soundscapes.',
          category_slug: 'commercial',
          year: 2026,
          software: 'After Effects, DaVinci Resolve, Cinema 4D',
          tags: 'Commercial, Motion Graphics, 3D, VFX',
          external_url: 'https://youtube.com',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
          aspect_ratio: '16:9',
          display_size: 'large',
          is_featured: true,
          is_published: true,
          sort_order: 1,
        },
        {
          title: 'LUXURY VILLA ARCHITECTURAL TOUR',
          description: 'Cinematic real estate property walkthrough with ultra-smooth speed ramps, aerial drone stabilization, and warm editorial color grade.',
          category_slug: 'real-estate',
          year: 2025,
          software: 'Premiere Pro, DaVinci Resolve',
          tags: 'Real Estate, Architectural, Drone, Color Grading',
          external_url: '',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          aspect_ratio: '16:9',
          display_size: 'medium',
          is_featured: true,
          is_published: true,
          sort_order: 2,
        },
        {
          title: 'VIRAL REEL — HIGH RETENTION SCRIPTING & EDITING',
          description: 'Fast-paced vertical short-form edit with kinetic typography, sound effects, and fast cuts designed for 90%+ audience retention.',
          category_slug: 'reels',
          year: 2026,
          software: 'Premiere Pro, After Effects',
          tags: 'Reels, Short-Form, TikTok, Kinetic Typography',
          external_url: '',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          aspect_ratio: '9:16',
          display_size: 'medium',
          is_featured: true,
          is_published: true,
          sort_order: 3,
        },
        {
          title: 'ABSTRACT KINETIC TYPOGRAPHY PROMO',
          description: 'Bold editorial motion graphics piece showcasing custom typography animations, synchronized audio design, and sleek optical flares.',
          category_slug: 'motion-graphics',
          year: 2025,
          software: 'After Effects, Illustrator',
          tags: 'Motion Design, Typography, Optical Flares',
          external_url: '',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
          aspect_ratio: '16:9',
          display_size: 'medium',
          is_featured: false,
          is_published: true,
          sort_order: 4,
        },
        {
          title: 'AI NEURAL CANVAS — CONCEPTual TEASER',
          description: 'Experimental AI video editing project utilizing Midjourney image generation, Runway Gen-2 video synthesis, and 3D camera mapping.',
          category_slug: 'ai-3d',
          year: 2026,
          software: 'Midjourney, Runway Gen-2, After Effects',
          tags: 'AI Video, Generative Art, 3D Camera Mapping',
          external_url: '',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
          aspect_ratio: '16:9',
          display_size: 'large',
          is_featured: true,
          is_published: true,
          sort_order: 5,
        },
        {
          title: 'TECH DOCUMENTARY — YOUTUBE MASTERCLASS',
          description: 'Comprehensive 20-minute video edit with customized graphic overlays, lower thirds, multi-cam switching, and pristine dialogue cleanup.',
          category_slug: 'youtube',
          year: 2025,
          software: 'Premiere Pro, Audition, DaVinci Resolve',
          tags: 'YouTube, Documentary, Multi-Cam, Sound Editing',
          external_url: '',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
          aspect_ratio: '16:9',
          display_size: 'medium',
          is_featured: false,
          is_published: true,
          sort_order: 6,
        },
      ];

      for (const p of projectsData) {
        await client.query(
          `INSERT INTO portfolio_projects 
            (title, description, category_id, category_label, year, software, tags, external_url, video_url, thumbnail_url, aspect_ratio, display_size, is_featured, is_published, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            p.title,
            p.description,
            categoryIdMap[p.category_slug] || null,
            p.category_slug.toUpperCase(),
            p.year,
            p.software,
            p.tags,
            p.external_url,
            p.video_url,
            p.thumbnail_url,
            p.aspect_ratio,
            p.display_size,
            p.is_featured,
            p.is_published,
            p.sort_order,
          ]
        );
      }
      console.log('Portfolio projects seeded: 6');
    }

    // 4. Carousel Items (Showreel)
    const existingCarousel = await client.query('SELECT COUNT(*) FROM carousel_items');
    if (parseInt(existingCarousel.rows[0].count, 10) === 0) {
      const carouselData = [
        {
          title: '2026 COMMERCIAL MOTION SHOWREEL',
          badge: 'FEATURED REEL',
          category: 'COMMERCIAL',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
          duration: '01:45',
          aspect_ratio: '16:9',
          description: 'A high-impact montage of brand commercials, 3D motion graphics, and color grading projects.',
          sort_order: 1,
          is_published: true,
        },
        {
          title: 'VIRAL REELS & SHORT-FORM COMPILATION',
          badge: 'HIGH RETENTION',
          category: 'SOCIAL MEDIA',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          duration: '00:60',
          aspect_ratio: '9:16',
          description: 'Selection of top-performing vertical video edits that generated over 10M+ views across platforms.',
          sort_order: 2,
          is_published: true,
        },
        {
          title: 'REAL ESTATE CINEMATIC WALKTHROUGHS',
          badge: 'ARCHITECTURAL',
          category: 'REAL ESTATE',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          duration: '02:15',
          aspect_ratio: '16:9',
          description: 'Smooth drone aerials, ambient soundscapes, and luxury architectural cinematography edits.',
          sort_order: 3,
          is_published: true,
        },
        {
          title: 'AI VIDEO & 3D COMPOSITING REEL',
          badge: 'AI CREATIVE',
          category: 'AI / VFX',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
          duration: '01:20',
          aspect_ratio: '16:9',
          description: 'Experimental generative AI art blended with 3D camera tracking and visual effects.',
          sort_order: 4,
          is_published: true,
        },
      ];

      for (const c of carouselData) {
        await client.query(
          `INSERT INTO carousel_items 
            (title, badge, category, video_url, thumbnail_url, duration, aspect_ratio, description, sort_order, is_published)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            c.title,
            c.badge,
            c.category,
            c.video_url,
            c.thumbnail_url,
            c.duration,
            c.aspect_ratio,
            c.description,
            c.sort_order,
            c.is_published,
          ]
        );
      }
      console.log('Carousel items seeded: 4');
    }

    // 5. Services
    const existingServices = await client.query('SELECT COUNT(*) FROM services');
    if (parseInt(existingServices.rows[0].count, 10) === 0) {
      const servicesData = [
        {
          title: '01 / Video Editing',
          description: 'Comprehensive video post-production for commercials, films, YouTube, and corporate brand videos with seamless pacing and sound design.',
          deliverables: 'Full HD/4K Export, Color Correction, Multi-Cam Sync, Audio Mix',
          icon: 'video',
          price_from: '$500+',
          sort_order: 1,
        },
        {
          title: '02 / Motion Graphics',
          description: 'Custom 2D & 3D animation, kinetic typography, brand intro animation, lower thirds, and complex visual element compositing.',
          deliverables: 'Custom AE Templates, 3D Title Sequences, Transparent Overlays',
          icon: 'sparkles',
          price_from: '$400+',
          sort_order: 2,
        },
        {
          title: '03 / Short-Form Reels & TikToks',
          description: 'High-retention vertical edits tailored for Instagram Reels, YouTube Shorts, and TikTok with punchy captions, SFX, and hook optimization.',
          deliverables: '9:16 Vertical Cut, Kinetic Captions, Sound FX Package, Hook Variations',
          icon: 'smartphone',
          price_from: '$150/reel',
          sort_order: 3,
        },
        {
          title: '04 / Real Estate Films',
          description: 'Elevated real estate property walkthrough videos combining speed ramps, drone shot stabilization, and warm editorial color grading.',
          deliverables: 'Property Highlight Reel, Agent Intro Cut, Social Media Teasers',
          icon: 'home',
          price_from: '$600+',
          sort_order: 4,
        },
        {
          title: '05 / Color Grading',
          description: 'Professional color correction and cinematic Look Creation in DaVinci Resolve to establish brand aesthetics and emotional resonance.',
          deliverables: 'Custom LUT Creation, Shot Matching, Skin-Tone Correction, Dolby Vision Ready',
          icon: 'palette',
          price_from: '$300+',
          sort_order: 5,
        },
        {
          title: '06 / AI Video Generation & VFX',
          description: 'Cutting-edge AI video workflows, generative background creation, 3D object insertion, and neural visual effects for innovative brands.',
          deliverables: 'AI Prompt Directing, Midjourney Assets, Runway Gen-2 Compositing',
          icon: 'cpu',
          price_from: '$700+',
          sort_order: 6,
        },
      ];

      for (const s of servicesData) {
        await client.query(
          `INSERT INTO services (title, description, deliverables, icon, price_from, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)`,
          [s.title, s.description, s.deliverables, s.icon, s.price_from, s.sort_order]
        );
      }
      console.log('Services seeded: 6');
    }

    // 6. Skills
    const existingSkills = await client.query('SELECT COUNT(*) FROM skills');
    if (parseInt(existingSkills.rows[0].count, 10) === 0) {
      const skillsData = [
        { name: 'Cinematic Video Editing', category: 'POST-PRODUCTION', description: 'Advanced pacing, scene transitions, storytelling structure, multi-camera editing.', level: 98, sort_order: 1 },
        { name: 'Motion Design & VFX', category: 'ANIMATION', description: 'After Effects expressions, 2D/3D compositing, optical flares, element animation.', level: 94, sort_order: 2 },
        { name: 'DaVinci Color Grading', category: 'COLOR', description: 'Color wheels, node trees, skin-tone matching, cinematic LUT building.', level: 92, sort_order: 3 },
        { name: 'High-Retention Short-Form', category: 'SOCIAL MEDIA', description: 'Hook design, kinetic typography, sound layering, visual retention cues.', level: 96, sort_order: 4 },
        { name: '3D Compositing & Modeling', category: '3D ART', description: 'Blender & Cinema 4D camera tracking, lighting, product rendering.', level: 88, sort_order: 5 },
        { name: 'AI Video Workflows', category: 'EMERGING TECH', description: 'Midjourney, Runway Gen-2, Pika Labs, ElevenLabs voice cloning, AI video synthesis.', level: 90, sort_order: 6 },
      ];

      for (const sk of skillsData) {
        await client.query(
          `INSERT INTO skills (name, category, description, level, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [sk.name, sk.category, sk.description, sk.level, sk.sort_order]
        );
      }
      console.log('Skills seeded: 6');
    }

    // 7. Tools & Software
    const existingTools = await client.query('SELECT COUNT(*) FROM tools_software');
    if (parseInt(existingTools.rows[0].count, 10) === 0) {
      const toolsData = [
        { name: 'Adobe Premiere Pro', category: 'Editing', description: 'Core timeline editing, audio mixing, multi-cam workflow.', proficiency: 98, sort_order: 1 },
        { name: 'Adobe After Effects', category: 'Motion & VFX', description: 'Complex animation, visual effects, tracking, compositing.', proficiency: 95, sort_order: 2 },
        { name: 'DaVinci Resolve', category: 'Color & Finishing', description: 'Professional color grading, Fairlight audio, master exports.', proficiency: 92, sort_order: 3 },
        { name: 'Blender / Cinema 4D', category: '3D Creation', description: '3D animation, lighting, texturing, product rendering.', proficiency: 86, sort_order: 4 },
        { name: 'Midjourney & Runway', category: 'AI Tools', description: 'AI visual generation, frame interpolation, video generation.', proficiency: 94, sort_order: 5 },
        { name: 'Adobe Photoshop / Illustrator', category: 'Design', description: 'Asset creation, matte painting, graphic preparation.', proficiency: 90, sort_order: 6 },
      ];

      for (const t of toolsData) {
        await client.query(
          `INSERT INTO tools_software (name, category, description, proficiency, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [t.name, t.category, t.description, t.proficiency, t.sort_order]
        );
      }
      console.log('Tools & Software seeded: 6');
    }

    // 8. Experience
    const existingExp = await client.query('SELECT COUNT(*) FROM experience');
    if (parseInt(existingExp.rows[0].count, 10) === 0) {
      const expData = [
        {
          company: 'FREELANCE CREATIVE DIRECTOR & EDITOR',
          role: 'Lead Video Editor / Motion Designer',
          description: 'Directing video post-production for global brands, agencies, and high-profile content creators. Specializing in commercial edits, real estate films, and viral short-form campaigns.',
          start_date: '2021',
          end_date: 'PRESENT',
          location: 'Remote Worldwide / Mumbai, India',
          sort_order: 1,
        },
        {
          company: 'MEDIA MEDIA PRODUCTIONS',
          role: 'Senior Motion Designer & Video Editor',
          description: 'Led a team of 4 editors creating daily social media content, brand promo assets, and broadcast TV commercials.',
          start_date: '2019',
          end_date: '2021',
          location: 'Mumbai, India',
          sort_order: 2,
        },
        {
          company: 'VISUAL ARTS AGENCY',
          role: 'Junior Video Editor',
          description: 'Assisted in rough assembly, audio sync, color correction, and lower-third graphics generation for corporate YouTube channels.',
          start_date: '2018',
          end_date: '2019',
          location: 'India',
          sort_order: 3,
        },
      ];

      for (const e of expData) {
        await client.query(
          `INSERT INTO experience (company, role, description, start_date, end_date, location, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
          [e.company, e.role, e.description, e.start_date, e.end_date, e.location, e.sort_order]
        );
      }
      console.log('Experience items seeded: 3');
    }

    // 9. Creative Process
    const existingProcess = await client.query('SELECT COUNT(*) FROM creative_process');
    if (parseInt(existingProcess.rows[0].count, 10) === 0) {
      const processData = [
        { step_number: '01', title: 'DISCOVER', description: 'Uncovering project goals, target audience, brand aesthetic, and narrative direction through initial brief alignment.', sort_order: 1 },
        { step_number: '02', title: 'PLAN & STORYBOARD', description: 'Structuring sequence flow, selecting audio tracks, organizing raw media, and creating visual moodboards.', sort_order: 2 },
        { step_number: '03', title: 'EDITORIAL CUT', description: 'Assembly editing, establishing rhythmic pacing, fine-tuning scene cuts, and syncing video to musical beats.', sort_order: 3 },
        { step_number: '04', title: 'MOTION & COLOR', description: 'Adding kinetic title graphics, lower thirds, 3D compositing, optical effects, and cinematic color grading in DaVinci Resolve.', sort_order: 4 },
        { step_number: '05', title: 'AUDIO & SFX', description: 'Layering immersive sound effects, Foley elements, dialogue noise reduction, and final audio mastering.', sort_order: 5 },
        { step_number: '06', title: 'DELIVER & OPTIMIZE', description: 'Final rendering in multi-format aspect ratios (16:9, 9:16, 1:1, 4:5) optimized for web, broadcast, and social media.', sort_order: 6 },
      ];

      for (const p of processData) {
        await client.query(
          `INSERT INTO creative_process (step_number, title, description, sort_order, is_active)
           VALUES ($1, $2, $3, $4, true)`,
          [p.step_number, p.title, p.description, p.sort_order]
        );
      }
      console.log('Creative Process seeded: 6');
    }

    // 10. Homepage Content
    await client.query(
      `INSERT INTO homepage_content (
        id, hero_eyebrow, hero_heading, hero_subtitle, hero_description,
        hero_cta_primary, hero_cta_secondary, hero_media_url,
        about_heading, about_subheading, about_description,
        about_experience_years, about_projects_completed, about_clients_count,
        services_intro, portfolio_intro, process_intro, contact_intro,
        footer_tagline, footer_copyright
      ) VALUES (
        1,
        'VIDEO EDITOR / MOTION DESIGNER',
        'MOHIT BABARIYA',
        'Professional Video Editor & Motion Designer',
        'Crafting high-converting short-form reels, cinematic real estate films, YouTube edits, and commercial motion graphics worldwide.',
        'VIEW MY WORK',
        'LET''S WORK TOGETHER',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'THE PERSON BEHIND THE WORK',
        'Passionate Storyteller & Visual Craftsman',
        'I specialize in transforming raw footage into compelling visual narratives. With over 6+ years of experience in video editing, motion design, 3D compositing, and AI workflows, I help brands and creators hold audience attention.',
        '6+',
        '450+',
        '120+',
        'Tailored video editing, motion graphics, and post-production solutions for creators, brands, and agencies.',
        'Selected commercial, narrative, and motion graphics projects crafted with precision.',
        'A proven, collaborative workflow designed to take your video project from concept to polished final export.',
        'Have an upcoming video, commercial, or motion graphics project? Let''s create something exceptional together.',
        'CRAFTING VISUAL EXCELLENCE WORLDWIDE',
        '© 2026 MOHIT BABARIYA. ALL RIGHTS RESERVED.'
      ) ON CONFLICT (id) DO NOTHING;`
    );

    // 11. Contact Settings
    await client.query(
      `INSERT INTO contact_settings (
        id, email, country_code, phone, whatsapp, location,
        instagram, youtube, linkedin, response_time, notification_email, is_email_enabled
      ) VALUES (
        1,
        'mohitbabariyaa@gmail.com',
        '+91',
        '+91 98765 43210',
        '+91 98765 43210',
        'Mumbai, India / Remote Worldwide',
        'https://instagram.com/mohitbabariya',
        'https://youtube.com/@mohitbabariya',
        'https://linkedin.com/in/mohitbabariya',
        'Within 24 Hours',
        'mohitbabariyaa@gmail.com',
        true
      ) ON CONFLICT (id) DO NOTHING;`
    );

    // 12. Theme Settings
    await client.query(
      `INSERT INTO theme_settings (id, active_theme, accent_color)
       VALUES (1, 1, '#C7A56A')
       ON CONFLICT (id) DO NOTHING;`
    );

    // 13. Layout Order
    const layoutSections = [
      { key: 'hero', label: 'Hero Section', order: 1 },
      { key: 'showreel', label: 'Cinematic Showreel', order: 2 },
      { key: 'work', label: 'Selected Work', order: 3 },
      { key: 'about', label: 'About', order: 4 },
      { key: 'experience', label: 'Experience', order: 5 },
      { key: 'services', label: 'Services', order: 6 },
      { key: 'skills', label: 'Skills', order: 7 },
      { key: 'tools', label: 'Tools & Software', order: 8 },
      { key: 'process', label: 'Creative Process', order: 9 },
      { key: 'contact', label: 'Contact', order: 10 },
    ];

    for (const s of layoutSections) {
      await client.query(
        `INSERT INTO layout_order (section_key, label, sort_order, is_visible)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (section_key) DO UPDATE SET label = EXCLUDED.label`,
        [s.key, s.label, s.order]
      );
    }
    console.log('Layout order seeded: 10 sections');

    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
