-- ===================================================================
-- MOHIT BABARIYA — PORTFOLIO + CMS SCHEMA
-- Reference DDL. `npx drizzle-kit push` applies src/db/schema.ts to the
-- live database; this file documents the same structure.
-- ===================================================================

CREATE TABLE IF NOT EXISTS admins (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  username        TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'admin',
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_key ON admins (email);
CREATE UNIQUE INDEX IF NOT EXISTS admins_username_key ON admins (username);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token       TEXT PRIMARY KEY,
  admin_id    INTEGER NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_sessions_admin_id_idx ON admin_sessions (admin_id);

CREATE TABLE IF NOT EXISTS categories (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON categories (slug);

CREATE TABLE IF NOT EXISTS work_options (
  id          SERIAL PRIMARY KEY,
  label       TEXT NOT NULL,
  value       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS work_options_value_key ON work_options (value);

CREATE TABLE IF NOT EXISTS projects (
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
);
CREATE INDEX IF NOT EXISTS projects_category_id_idx ON projects (category_id);
CREATE INDEX IF NOT EXISTS projects_published_idx ON projects (published);
CREATE INDEX IF NOT EXISTS projects_sort_order_idx ON projects (sort_order);

CREATE TABLE IF NOT EXISTS media_files (
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
);
CREATE UNIQUE INDEX IF NOT EXISTS media_files_filename_key ON media_files (filename);
CREATE INDEX IF NOT EXISTS media_files_kind_idx ON media_files (kind);

CREATE TABLE IF NOT EXISTS skills (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  level        INTEGER,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS skills_sort_order_idx ON skills (sort_order);

CREATE TABLE IF NOT EXISTS services (
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
);
CREATE INDEX IF NOT EXISTS services_sort_order_idx ON services (sort_order);

CREATE TABLE IF NOT EXISTS carousel_settings (
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
);
CREATE INDEX IF NOT EXISTS carousel_settings_category_id_idx ON carousel_settings (category_id);

CREATE TABLE IF NOT EXISTS layout_sections (
  id           SERIAL PRIMARY KEY,
  section_key  TEXT NOT NULL,
  label        TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_visible   BOOLEAN NOT NULL DEFAULT true,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS layout_sections_key_key ON layout_sections (section_key);

CREATE TABLE IF NOT EXISTS homepage_settings (
  id                 INTEGER PRIMARY KEY DEFAULT 1,
  owner_name         TEXT NOT NULL DEFAULT 'Mohit Babariya',
  hero_name          TEXT NOT NULL DEFAULT 'MOHIT BABARIYA',
  hero_title         TEXT NOT NULL DEFAULT 'MAKE\nVISUALS\nMOVE.',
  hero_subtitle      TEXT NOT NULL DEFAULT '',
  hero_description   TEXT NOT NULL DEFAULT '',
  availability_label TEXT NOT NULL DEFAULT 'Available for projects',
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
);

CREATE TABLE IF NOT EXISTS contact_settings (
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
);

CREATE TABLE IF NOT EXISTS theme_settings (
  id             INTEGER PRIMARY KEY DEFAULT 1,
  accent         TEXT NOT NULL DEFAULT '#e0147f',
  glass_opacity  INTEGER NOT NULL DEFAULT 45,
  glass_blur     INTEGER NOT NULL DEFAULT 20,
  grain          BOOLEAN NOT NULL DEFAULT true,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enquiries (
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
);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries (status);

CREATE TABLE IF NOT EXISTS chat_conversations (
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
);
CREATE INDEX IF NOT EXISTS chat_conversations_email_idx ON chat_conversations (email);
CREATE INDEX IF NOT EXISTS chat_conversations_updated_at_idx ON chat_conversations (updated_at);

CREATE TABLE IF NOT EXISTS chat_messages (
  id               SERIAL PRIMARY KEY,
  conversation_id  INTEGER NOT NULL REFERENCES chat_conversations (id) ON DELETE CASCADE,
  sender_type      TEXT NOT NULL,
  message          TEXT NOT NULL,
  is_read          BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON chat_messages (conversation_id);

-- Software / tools icon grid shown on the public portfolio.
CREATE TABLE IF NOT EXISTS software_tools (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT '',
  icon         TEXT NOT NULL DEFAULT 'generic',
  proficiency  INTEGER,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS software_tools_sort_order_idx ON software_tools (sort_order);

CREATE TABLE IF NOT EXISTS notification_settings (
  id                  INTEGER PRIMARY KEY DEFAULT 1,
  email_enabled       BOOLEAN NOT NULL DEFAULT false,
  notification_email  TEXT NOT NULL DEFAULT '',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_otp_challenges (
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
);

CREATE TABLE IF NOT EXISTS email_otp_challenges (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  purpose     TEXT NOT NULL,
  otp_hash    TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mobile_otp_challenges (
  id          SERIAL PRIMARY KEY,
  phone       TEXT NOT NULL,
  purpose     TEXT NOT NULL,
  otp_hash    TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

