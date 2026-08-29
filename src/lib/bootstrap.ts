import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  carouselSettings,
  categories,
  contactSettings,
  homepageSettings,
  layoutSections,
  projects,
  services,
  skills,
  softwareTools,
  themeSettings,
  workOptions,
  notificationSettings,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";

let bootstrapped = false;

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS admins (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    username        TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'admin',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS admins_email_key ON admins (email)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS admins_username_key ON admins (username)`,

  `CREATE TABLE IF NOT EXISTS admin_sessions (
    token       TEXT PRIMARY KEY,
    admin_id    INTEGER NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS admin_sessions_admin_id_idx ON admin_sessions (admin_id)`,

  `CREATE TABLE IF NOT EXISTS categories (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    slug         TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON categories (slug)`,

  `CREATE TABLE IF NOT EXISTS work_options (
    id          SERIAL PRIMARY KEY,
    label       TEXT NOT NULL,
    value       TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS work_options_value_key ON work_options (value)`,

  `CREATE TABLE IF NOT EXISTS projects (
    id               SERIAL PRIMARY KEY,
    title            TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    category_id      INTEGER REFERENCES categories (id) ON DELETE SET NULL,
    category_label   TEXT NOT NULL DEFAULT '',
    ai_lab_type      TEXT NOT NULL DEFAULT '',
    year             INTEGER,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    software         TEXT NOT NULL DEFAULT '',
    tags             TEXT NOT NULL DEFAULT '',
    external_link    TEXT NOT NULL DEFAULT '',
    video_source     TEXT NOT NULL DEFAULT 'url',
    video_url        TEXT NOT NULL DEFAULT '',
    thumbnail_url    TEXT NOT NULL DEFAULT '',
    aspect_ratio     TEXT NOT NULL DEFAULT '16:9',
    display_size     TEXT NOT NULL DEFAULT 'medium',
    display_width    INTEGER,
    display_height   INTEGER,
    width            INTEGER,
    height           INTEGER,
    duration_seconds INTEGER,
    featured         BOOLEAN NOT NULL DEFAULT false,
    published        BOOLEAN NOT NULL DEFAULT true,
    demo_status      TEXT NOT NULL DEFAULT 'none',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS projects_category_id_idx ON projects (category_id)`,
  `CREATE INDEX IF NOT EXISTS projects_published_idx ON projects (published)`,
  `CREATE INDEX IF NOT EXISTS projects_sort_order_idx ON projects (sort_order)`,

  `CREATE TABLE IF NOT EXISTS media_files (
    id             SERIAL PRIMARY KEY,
    filename       TEXT NOT NULL,
    original_name  TEXT NOT NULL,
    mime_type      TEXT NOT NULL,
    kind           TEXT NOT NULL DEFAULT 'image',
    size           INTEGER NOT NULL DEFAULT 0,
    url            TEXT NOT NULL,
    width          INTEGER,
    height         INTEGER,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS media_files_filename_key ON media_files (filename)`,
  `CREATE INDEX IF NOT EXISTS media_files_kind_idx ON media_files (kind)`,

  `CREATE TABLE IF NOT EXISTS skills (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL DEFAULT '',
    description  TEXT NOT NULL DEFAULT '',
    level        INTEGER,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS skills_sort_order_idx ON skills (sort_order)`,

  `CREATE TABLE IF NOT EXISTS software_tools (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL DEFAULT '',
    icon         TEXT NOT NULL DEFAULT 'generic',
    proficiency  INTEGER,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS software_tools_sort_order_idx ON software_tools (sort_order)`,

  `CREATE TABLE IF NOT EXISTS services (
    id            SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    deliverables  TEXT NOT NULL DEFAULT '',
    icon          TEXT NOT NULL DEFAULT '',
    price_from    TEXT NOT NULL DEFAULT '',
    sort_order    INTEGER NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS services_sort_order_idx ON services (sort_order)`,

  `CREATE TABLE IF NOT EXISTS carousel_settings (
    id            SERIAL PRIMARY KEY,
    category_id   INTEGER REFERENCES categories (id) ON DELETE CASCADE,
    slots         INTEGER NOT NULL DEFAULT 5,
    center_size   TEXT NOT NULL DEFAULT 'large',
    side_size     TEXT NOT NULL DEFAULT 'small',
    auto_fill     BOOLEAN NOT NULL DEFAULT true,
    project_ids   TEXT NOT NULL DEFAULT '[]',
    sort_order    INTEGER NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS carousel_settings_category_id_idx ON carousel_settings (category_id)`,

  `CREATE TABLE IF NOT EXISTS layout_sections (
    id           SERIAL PRIMARY KEY,
    section_key  TEXT NOT NULL,
    label        TEXT NOT NULL,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    is_visible   BOOLEAN NOT NULL DEFAULT true,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS layout_sections_key_key ON layout_sections (section_key)`,

  `CREATE TABLE IF NOT EXISTS homepage_settings (
    id                 INTEGER PRIMARY KEY DEFAULT 1,
    owner_name         TEXT NOT NULL DEFAULT 'Mohit Babariya',
    hero_name          TEXT NOT NULL DEFAULT 'MOHIT BABARIYA',
    hero_title         TEXT NOT NULL DEFAULT 'MAKE\\nVISUALS\\nMOVE.',
    hero_subtitle      TEXT NOT NULL DEFAULT '',
    hero_description   TEXT NOT NULL DEFAULT '',
    availability_label TEXT NOT NULL DEFAULT 'Available for freelance projects',
    cta_primary_label  TEXT NOT NULL DEFAULT 'WATCH REEL',
    cta_secondary_label TEXT NOT NULL DEFAULT 'START PROJECT',
    reel_url           TEXT NOT NULL DEFAULT '',
    about_intro        TEXT NOT NULL DEFAULT '',
    about_experience   TEXT NOT NULL DEFAULT '',
    about_focus        TEXT NOT NULL DEFAULT '',
    about_workflow     TEXT NOT NULL DEFAULT '',
    about_tools        TEXT NOT NULL DEFAULT '',
    about_strengths    TEXT NOT NULL DEFAULT '',
    footer_note        TEXT NOT NULL DEFAULT '',
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS contact_settings (
    id             INTEGER PRIMARY KEY DEFAULT 1,
    email          TEXT NOT NULL DEFAULT '',
    country_code   TEXT NOT NULL DEFAULT '+91',
    phone          TEXT NOT NULL DEFAULT '',
    whatsapp       TEXT NOT NULL DEFAULT '',
    location       TEXT NOT NULL DEFAULT '',
    instagram      TEXT NOT NULL DEFAULT '',
    youtube        TEXT NOT NULL DEFAULT '',
    linkedin       TEXT NOT NULL DEFAULT '',
    response_time  TEXT NOT NULL DEFAULT '',
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS theme_settings (
    id             INTEGER PRIMARY KEY DEFAULT 1,
    accent         TEXT NOT NULL DEFAULT '#e0147f',
    glass_opacity  INTEGER NOT NULL DEFAULT 45,
    glass_blur     INTEGER NOT NULL DEFAULT 20,
    grain          BOOLEAN NOT NULL DEFAULT true,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS notification_settings (
    id                  INTEGER PRIMARY KEY DEFAULT 1,
    email_enabled       BOOLEAN NOT NULL DEFAULT false,
    notification_email  TEXT NOT NULL DEFAULT '',
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS inquiries (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    country_code    TEXT NOT NULL DEFAULT '+91',
    phone_number    TEXT NOT NULL,
    company         TEXT NOT NULL DEFAULT '',
    selected_work   TEXT NOT NULL DEFAULT '[]',
    description     TEXT NOT NULL,
    reference_url   TEXT NOT NULL DEFAULT '',
    deadline        TEXT NOT NULL DEFAULT '',
    source          TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'new',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS enquiries_status_idx ON inquiries (status)`,

  `CREATE TABLE IF NOT EXISTS chat_conversations (
    id                SERIAL PRIMARY KEY,
    name              TEXT NOT NULL,
    email             TEXT NOT NULL,
    country_code      TEXT NOT NULL DEFAULT '+91',
    phone             TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'open',
    last_message      TEXT NOT NULL DEFAULT '',
    admin_unread      INTEGER NOT NULL DEFAULT 0,
    customer_unread   INTEGER NOT NULL DEFAULT 0,
    customer_seen_at  TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS chat_conversations_email_idx ON chat_conversations (email)`,
  `CREATE INDEX IF NOT EXISTS chat_conversations_updated_at_idx ON chat_conversations (updated_at)`,

  `CREATE TABLE IF NOT EXISTS chat_messages (
    id               SERIAL PRIMARY KEY,
    conversation_id  INTEGER NOT NULL REFERENCES chat_conversations (id) ON DELETE CASCADE,
    sender_type      TEXT NOT NULL,
    message          TEXT NOT NULL,
    is_read          BOOLEAN NOT NULL DEFAULT false,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON chat_messages (conversation_id)`,

  `CREATE TABLE IF NOT EXISTS admin_otp_challenges (
    id            SERIAL PRIMARY KEY,
    email         TEXT NOT NULL,
    name          TEXT NOT NULL,
    username      TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'admin',
    otp_hash      TEXT NOT NULL,
    expires_at    TIMESTAMPTZ NOT NULL,
    attempts      INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS admin_otp_challenges_email_idx ON admin_otp_challenges (email)`,

  `CREATE TABLE IF NOT EXISTS email_otp_challenges (
    id          SERIAL PRIMARY KEY,
    email       TEXT NOT NULL,
    purpose     TEXT NOT NULL,
    otp_hash    TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    attempts    INTEGER NOT NULL DEFAULT 0,
    verified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS email_otp_challenges_email_idx ON email_otp_challenges (email)`,

  `CREATE TABLE IF NOT EXISTS mobile_otp_challenges (
    id          SERIAL PRIMARY KEY,
    phone       TEXT NOT NULL,
    purpose     TEXT NOT NULL,
    otp_hash    TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    attempts    INTEGER NOT NULL DEFAULT 0,
    verified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS mobile_otp_challenges_phone_idx ON mobile_otp_challenges (phone)`,
];

async function ensureTables(): Promise<void> {
  for (const statement of DDL_STATEMENTS) {
    await db.execute(sql.raw(statement));
  }
}

async function count(table: string): Promise<number> {
  const allowedTables = [
    "admins",
    "categories",
    "projects",
    "services",
    "skills",
    "inquiries",
    "site_settings",
    "chat_conversations",
    "chat_messages",
    "conversations",
    "software_tools",
    "work_options",
    "layout_sections",
    "homepage_settings",
    "contact_settings",
    "theme_settings",
    "carousel_settings",
  ];

  if (!allowedTables.includes(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }

  const result = await db.execute(
    sql.raw(`SELECT COUNT(*) AS c FROM "${table}"`),
  );

  const rows = Array.isArray(result)
    ? result[0]
    : (result as { rows?: unknown[] }).rows;

  const firstRow = Array.isArray(rows) ? rows[0] : undefined;

  if (!firstRow || typeof firstRow !== "object") {
    return 0;
  }

  const value = (firstRow as { c?: string | number }).c;

  return Number(value ?? 0);
}
async function seedAdmin() {
  const name = process.env.SEED_ADMIN_NAME || "MOHIT BABARIYA";
  const email = (
    process.env.SEED_ADMIN_EMAIL || "mohitbabariyaa@gmail.com"
  ).toLowerCase();
  const username = (process.env.SEED_ADMIN_USERNAME || "mohit").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  const { admins } = await import("@/db/schema");

  if ((await count("admins")) > 0) {
    // Sync email, name and password if updated in environment variables
    const updateData: { email: string; name: string; passwordHash?: string } = {
      email,
      name,
    };
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }
    await db
      .update(admins)
      .set(updateData)
      .where(eq(admins.username, username));
    return;
  }

  if (!password) {
    console.warn(
      "[bootstrap] SEED_ADMIN_PASSWORD is not set. Skipping initial admin seeding.",
    );
    return;
  }

  await db.insert(admins).values({
    name,
    email,
    username,
    passwordHash: await hashPassword(password),
    role: "owner",
  });
}

export const CATEGORY_SEED = [
  ["Real Estate", "Property walk-throughs, listing films and cinematic tours."],
  ["Instagram", "Reels, vertical edits and scroll-stopping social cuts."],
  ["YouTube", "Long-form edits, retention pacing and thumbnail systems."],
  ["Motion Graphics", "Kinetic type, animated branding and title systems."],
  ["Graphic Design", "Static design systems, thumbnails and brand layouts."],
  ["Product Video", "Product storytelling, feature demos and launch edits."],
  ["AI Video", "AI-assisted generation, upscaling and hybrid workflows."],
  ["Corporate", "Brand films, internal communication and event recaps."],
  ["Other", "Experiments, personal cuts and everything in between."],
] as const;

export const SKILL_SEED = [
  ["Video Editing", "Post Production", "Narrative structure, pacing and rhythm across long and short form.", 95],
  ["Motion Graphics", "Motion", "Kinetic typography, animated logos, lower thirds and title systems.", 90],
  ["After Effects", "Tools", "Compositing, keyframing, expressions and plugin-driven workflows.", 92],
  ["Premiere Pro", "Tools", "Timeline-led editing, multicam, proxies and delivery pipelines.", 95],
  ["DaVinci Resolve", "Tools", "Node-based colour work, conform and finishing.", 88],
  ["Color Grading", "Craft", "Look development, shot matching and cinematic tone shaping.", 90],
  ["AI Video", "Craft", "AI-assisted generation, cleanup, upscale and hybrid edit workflows.", 85],
  ["Sound Design", "Craft", "Music selection, SFX layering, dialogue cleanup and final mix.", 80],
  ["Social Media Editing", "Distribution", "Hook-first cuts, captions, aspect ratio versions and platform specs.", 95],
  ["Creative Direction", "Strategy", "References, storyboards, edit styles and visual systems.", 88],
] as const;

export const SOFTWARE_TOOL_SEED = [
  ["Adobe Premiere Pro", "Editing", "premiere", 95],
  ["Adobe After Effects", "Motion", "after-effects", 92],
  ["DaVinci Resolve", "Colour", "davinci", 88],
  ["Photoshop", "Design", "photoshop", 90],
  ["Illustrator", "Vector", "illustrator", 86],
  ["Blender", "3D / Visual Design", "blender", 78],
  ["CapCut", "Social Editing", "capcut", 88],
  ["Figma", "Design Systems", "figma", 82],
  ["AI / Generative AI tools", "AI Video", "ai", 85],
] as const;

export const SERVICE_SEED = [
  {
    title: "Video Editing",
    description:
      "Timeline-led editing for brands, creators and studios — from raw footage to a finished master.",
    deliverables: "Story assembly|Rhythm & pacing|Subtitles|Multi-ratio delivery",
    icon: "cut",
  },
  {
    title: "Motion Graphics",
    description:
      "Animated typography, logo motion, lower thirds and graphic systems that carry a brand.",
    deliverables: "Kinetic type|Logo animation|Titles & LTH|Transitions",
    icon: "shape",
  },
  {
    title: "Graphic Design",
    description:
      "Thumbnails, key art, brand layouts and campaign assets built around a clear visual hierarchy.",
    deliverables: "Thumbnails|Key art|Brand layouts|Campaign sets",
    icon: "frame",
  },
  {
    title: "AI Video",
    description:
      "AI-assisted generation, enhancement and hybrid workflows blended into a normal edit pipeline.",
    deliverables: "AI generation|Cleanup & upscale|Voice & dubbing support|Hybrid edits",
    icon: "spark",
  },
  {
    title: "Colour Grading",
    description:
      "Look development and shot matching so every frame in a sequence belongs to the same world.",
    deliverables: "Primary & secondary|Shot matching|Look dev|Export masters",
    icon: "dial",
  },
  {
    title: "Social Media Editing",
    description:
      "Hook-first vertical edits designed for retention, delivered in every aspect ratio you need.",
    deliverables: "Reels & shorts|Hook design|Captions|Batch delivery",
    icon: "phone",
  },
] as const;

export const WORK_OPTION_SEED = [
  "Video Editing",
  "Reels",
  "YouTube",
  "Real Estate",
  "Motion Graphics",
  "Graphic Design",
  "Product Video",
  "AI Video",
  "AI UGC",
  "Corporate",
  "Other",
] as const;

export const SECTION_SEED = [
  ["hero", "Hero"],
  ["about", "About"],
  ["tools", "Tools & Software"],
  ["services", "Services"],
  ["work", "Work / Portfolio"],
  ["contact", "Contact & Enquiry"],
] as const;

export type SeedProject = {
  title: string;
  description: string;
  category: string;
  software: string;
  tags: string;
  aspectRatio: string;
  displaySize: string;
  year: number;
  featured: boolean;
  demoStatus: string;
  videoUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  durationSeconds: number;
};

export const PROJECT_SEED: SeedProject[] = [

  {
    title: "Concrete Light â€” Property Film",
    description:
      "A cinematic property tour cut to a slow build, with matched colour across daylight and dusk interiors.",
    category: "Real Estate",
    software: "Premiere Pro, DaVinci Resolve",
    tags: "property film,colour grade,cinematic",
    aspectRatio: "16:9",
    displaySize: "large",
    year: 2025,
    featured: true,
    demoStatus: "live",
    videoUrl: "https://videos.pexels.com/video-files/39105109/16638114_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/39105109/aerial-view-architecture-cinematic-lighting-interior-design-39105109.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 13,
  },
  {
    title: "Interior Walkthrough Cut",
    description: "Space-led edit with architectural pacing, clean transitions and a warm neutral grade.",
    category: "Real Estate",
    software: "Premiere Pro",
    tags: "walkthrough,interior,tour",
    aspectRatio: "16:9",
    displaySize: "medium",
    year: 2025,
    featured: false,
    demoStatus: "live",
    videoUrl: "https://videos.pexels.com/video-files/7578546/7578546-uhd_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/7578546/apartment-at-home-business-buy-7578546.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 21,
  },
  {
    title: "Listing Reel â€” Vertical",
    description: "Hook-first vertical cut for social with captions, beat-matched cuts and clean type.",
    category: "Instagram",
    software: "After Effects, Premiere Pro",
    tags: "reel,vertical,social",
    aspectRatio: "9:16",
    displaySize: "small",
    year: 2025,
    featured: false,
    demoStatus: "live",
    videoUrl: "https://videos.pexels.com/video-files/15887293/15887293-uhd_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/15887293/pexels-photo-15887293.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 12,
  },
  {
    title: "Process Story â€” Long Form",
    description: "Long-form edit structured around interview beats with supporting b-roll and graphics.",
    category: "YouTube",
    software: "Premiere Pro, After Effects",
    tags: "youtube,long form,interview",
    aspectRatio: "16:9",
    displaySize: "medium",
    year: 2024,
    featured: false,
    demoStatus: "live",
    videoUrl: "https://videos.pexels.com/video-files/7578108/7578108-uhd_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/7578108/adult-agent-apartment-at-home-7578108.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 20,
  },
  {
    title: "Product Detail Study",
    description: "Macro product moments graded for texture, with motion-graphic callouts on key features.",
    category: "Product Video",
    software: "After Effects, DaVinci Resolve",
    tags: "product,macro,callouts",
    aspectRatio: "1:1",
    displaySize: "small",
    year: 2025,
    featured: false,
    demoStatus: "demo",
    videoUrl: "https://videos.pexels.com/video-files/15887297/15887297-uhd_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/15887297/pexels-photo-15887297.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 14,
  },
  {
    title: "Brand Motion System",
    description: "Animated identity elements â€” logo resolve, type behaviour and transition language.",
    category: "Motion Graphics",
    software: "After Effects",
    tags: "branding,motion system,titles",
    aspectRatio: "16:9",
    displaySize: "small",
    year: 2024,
    featured: false,
    demoStatus: "demo",
    videoUrl: "https://videos.pexels.com/video-files/7578117/7578117-uhd_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/7578117/administration-adult-agent-apartment-7578117.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 11,
  },
  {
    title: "Corporate Recap Edit",
    description: "Event recap assembled from multi-camera coverage with a clean corporate finish.",
    category: "Corporate",
    software: "Premiere Pro",
    tags: "corporate,event,multicam",
    aspectRatio: "16:9",
    displaySize: "small",
    year: 2024,
    featured: false,
    demoStatus: "live",
    videoUrl: "https://videos.pexels.com/video-files/7348146/7348146-uhd_3840_2160_25fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/7348146/pexels-photo-7348146.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 12,
  },
  {
    title: "Studio Session Cut",
    description: "Documentary-styled session edit with natural sound design and soft contrast grade.",
    category: "Other",
    software: "Premiere Pro, DaVinci Resolve",
    tags: "documentary,sound design,grade",
    aspectRatio: "16:9",
    displaySize: "small",
    year: 2025,
    featured: false,
    demoStatus: "live",
    videoUrl: "https://videos.pexels.com/video-files/7578112/7578112-uhd_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/7578112/adult-agent-apartment-at-home-7578112.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 11,
  },
];

async function seedContent() {
  if ((await count("categories")) === 0) {
    await db.insert(categories).values(
      CATEGORY_SEED.map(([name, description], index) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description,
        sortOrder: index,
        isActive: true,
      })),
    );
  }

  const categoryRows = await db.select().from(categories);
  const categoryByName = new Map(categoryRows.map((c) => [c.name, c]));

  if ((await count("projects")) === 0) {
    await db.insert(projects).values(
      PROJECT_SEED.map((project, index) => {
        const category = categoryByName.get(project.category);
        return {
          title: project.title,
          description: project.description,
          categoryId: category?.id ?? null,
          categoryLabel: project.category,
          software: project.software,
          tags: project.tags,
          aspectRatio: project.aspectRatio,
          displaySize: project.displaySize,
          displayWidth: project.aspectRatio === "9:16" ? 540 : 1200,
          displayHeight: project.aspectRatio === "9:16" ? 960 : 675,
          year: project.year,
          sortOrder: index,
          featured: project.featured,
          published: true,
          demoStatus: project.demoStatus,
          videoSource: "url",
          videoUrl: project.videoUrl,
          thumbnailUrl: project.thumbnailUrl,
          width: project.width,
          height: project.height,
          durationSeconds: project.durationSeconds,
        };
      }),
    );
  }

  if ((await count("skills")) === 0) {
    await db.insert(skills).values(
      SKILL_SEED.map(([name, category, description, level], index) => ({
        name,
        category,
        description,
        level,
        sortOrder: index,
        isActive: true,
      })),
    );
  }

  if ((await count("software_tools")) === 0) {
    await db.insert(softwareTools).values(
      SOFTWARE_TOOL_SEED.map(([name, category, icon, proficiency], index) => ({
        name,
        category,
        icon,
        proficiency,
        sortOrder: index,
        isActive: true,
      })),
    );
  }

  if ((await count("services")) === 0) {
    await db.insert(services).values(
      SERVICE_SEED.map((service, index) => ({
        ...service,
        deliverables: service.deliverables,
        sortOrder: index,
        isActive: true,
      })),
    );
  }

  if ((await count("work_options")) === 0) {
    await db.insert(workOptions).values(
      WORK_OPTION_SEED.map((label, index) => ({
        label,
        value: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        sortOrder: index,
        isActive: true,
      })),
    );
  }

  if ((await count("layout_sections")) === 0) {
    await db.insert(layoutSections).values(
      SECTION_SEED.map(([sectionKey, label], index) => ({
        sectionKey,
        label,
        sortOrder: index,
        isVisible: true,
      })),
    );
  }



  if ((await count("homepage_settings")) === 0) {
    await db.insert(homepageSettings).values({
      id: 1,
      ownerName: "Mohit Babariya",
      heroName: "MOHIT BABARIYA",
      heroTitle: "MAKE\nVISUALS\nMOVE.",
      heroSubtitle: "VIDEO EDITOR Â· MOTION GRAPHICS Â· GRAPHIC DESIGN Â· AI VIDEO",
      heroDescription:
        "I edit films, reels and motion pieces that hold attention â€” clean cuts, considered pacing and a finish that feels intentional.",
      availabilityLabel: "Available for freelance projects",
      ctaPrimaryLabel: "WATCH REEL",
      ctaSecondaryLabel: "START PROJECT",
      reelUrl: "https://videos.pexels.com/video-files/39105109/16638114_3840_2160_30fps.mp4",
      aboutIntro:
        "I am Mohit Babariya, a video editor and motion designer working across editorial, social and brand content. My work sits between structure and feel â€” the timeline has to make sense, and it also has to move someone.",
      aboutExperience:
        "I work as an independent video editor, motion graphics artist and graphic designer, collaborating directly with brands, creators and studios on edits that need to ship fast without losing craft.",
      aboutFocus:
        "Short-form social editing, real-estate films, product videos, motion graphics systems and AI-assisted video workflows.",
      aboutWorkflow:
        "Brief and references â†’ footage review and selects â†’ assembly and pacing â†’ motion graphics and grade â†’ sound design and mix â†’ delivery in every required ratio.",
      aboutTools: "Premiere Pro, After Effects, DaVinci Resolve, Photoshop, Illustrator, AI video tools.",
      aboutStrengths:
        "Clean storytelling, fast turnarounds, consistent colour, precise typography and reliable communication.",
      footerNote: "Video editor Â· motion graphics Â· graphic design Â· AI video",
    });
  }

  if ((await count("contact_settings")) === 0) {
    await db.insert(contactSettings).values({
      id: 1,
      email: "hello@mohitbabariya.studio",
      countryCode: "+91",
      phone: "",
      whatsapp: "",
      location: "India Â· working worldwide",
      instagram: "",
      youtube: "",
      linkedin: "",
      responseTime: "Replies within 24 hours",
    });
  }

  if ((await count("theme_settings")) === 0) {
    await db.insert(themeSettings).values({ id: 1 });
  }

  if ((await count("carousel_settings")) === 0) {
    await db.insert(carouselSettings).values(
      categoryRows.map((category, index) => ({
        categoryId: category.id,
        slots: index === 0 ? 7 : 5,
        centerSize: "large",
        sideSize: "small",
        autoFill: true,
        projectIds: "[]",
        sortOrder: index,
        isActive: true,
      })),
    );
  }
}

async function seedNotificationSettings() {
  const rows = await db.select().from(notificationSettings).limit(1);
  if (rows.length === 0) {
    await db.insert(notificationSettings).values({ id: 1, emailEnabled: false, notificationEmail: process.env.NOTIFICATION_EMAIL || process.env.SEED_ADMIN_EMAIL || "" });
  }
}

let ensured: Promise<void> | null = null;

/** Idempotent first-run bootstrap: verifies tables exist and seeds defaults. */
export function ensureDatabase(): Promise<void> {
  if (bootstrapped) return Promise.resolve();
  if (!ensured) {
    ensured = (async () => {
      await ensureTables();
      await seedAdmin();
      await seedNotificationSettings();
      await seedContent();
      bootstrapped = true;
    })().catch((error) => {
      ensured = null;
      throw error;
    });
  }
  return ensured;
}







