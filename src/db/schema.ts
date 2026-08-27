import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* ADMINS + SESSIONS                                                   */
/* ------------------------------------------------------------------ */

export const admins = pgTable(
  "admins",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("admin"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("admins_email_key").on(t.email),
    uniqueIndex("admins_username_key").on(t.username),
  ],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    token: text("token").primaryKey(),
    adminId: integer("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("admin_sessions_admin_id_idx").on(t.adminId)],
);

/* ------------------------------------------------------------------ */
/* TAXONOMY                                                            */
/* ------------------------------------------------------------------ */

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").default("").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("categories_slug_key").on(t.slug)],
);

export const workOptions = pgTable(
  "work_options",
  {
    id: serial("id").primaryKey(),
    label: text("label").notNull(),
    value: text("value").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("work_options_value_key").on(t.value)],
);

/* ------------------------------------------------------------------ */
/* PORTFOLIO                                                           */
/* ------------------------------------------------------------------ */

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    categoryLabel: text("category_label").default("").notNull(),
    aiLabType: text("ai_lab_type").default("").notNull(),
    year: integer("year"),
    sortOrder: integer("sort_order").notNull().default(0),
    software: text("software").default("").notNull(),
    tags: text("tags").default("").notNull(),
    externalLink: text("external_link").default("").notNull(),
    videoSource: text("video_source").notNull().default("url"),
    videoUrl: text("video_url").default("").notNull(),
    thumbnailUrl: text("thumbnail_url").default("").notNull(),
    aspectRatio: text("aspect_ratio").notNull().default("16:9"),
    displaySize: text("display_size").notNull().default("medium"),
    displayWidth: integer("display_width"),
    displayHeight: integer("display_height"),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(true),
    demoStatus: text("demo_status").notNull().default("none"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("projects_category_id_idx").on(t.categoryId),
    index("projects_published_idx").on(t.published),
    index("projects_sort_order_idx").on(t.sortOrder),
  ],
);

export const mediaFiles = pgTable(
  "media_files",
  {
    id: serial("id").primaryKey(),
    filename: text("filename").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    kind: text("kind").notNull().default("image"),
    size: integer("size").notNull().default(0),
    url: text("url").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("media_files_filename_key").on(t.filename),
    index("media_files_kind_idx").on(t.kind),
  ],
);

/* ------------------------------------------------------------------ */
/* CMS CONTENT                                                         */
/* ------------------------------------------------------------------ */

export const skills = pgTable(
  "skills",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").default("").notNull(),
    description: text("description").default("").notNull(),
    level: integer("level"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("skills_sort_order_idx").on(t.sortOrder)],
);

export const softwareTools = pgTable(
  "software_tools",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").default("").notNull(),
    icon: text("icon").default("generic").notNull(),
    proficiency: integer("proficiency"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("software_tools_sort_order_idx").on(t.sortOrder)],
);

export const services = pgTable(
  "services",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    deliverables: text("deliverables").default("").notNull(),
    icon: text("icon").default("").notNull(),
    priceFrom: text("price_from").default("").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("services_sort_order_idx").on(t.sortOrder)],
);

export const carouselSettings = pgTable(
  "carousel_settings",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "cascade",
    }),
    slots: integer("slots").notNull().default(5),
    centerSize: text("center_size").notNull().default("large"),
    sideSize: text("side_size").notNull().default("small"),
    autoFill: boolean("auto_fill").notNull().default(true),
    projectIds: text("project_ids").default("[]").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("carousel_settings_category_id_idx").on(t.categoryId)],
);

export const layoutSections = pgTable(
  "layout_sections",
  {
    id: serial("id").primaryKey(),
    sectionKey: text("section_key").notNull(),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("layout_sections_key_key").on(t.sectionKey)],
);

export const homepageSettings = pgTable("homepage_settings", {
  id: integer("id").primaryKey().default(1),
  ownerName: text("owner_name").notNull().default("Mohit Babariya"),
  heroName: text("hero_name").notNull().default("MOHIT BABARIYA"),
  heroTitle: text("hero_title").notNull().default("MAKE\nVISUALS\nMOVE."),
  heroSubtitle: text("hero_subtitle").notNull().default(""),
  heroDescription: text("hero_description").notNull().default(""),
  availabilityLabel: text("availability_label").notNull().default("Available for projects"),
  ctaPrimaryLabel: text("cta_primary_label").notNull().default("WATCH REEL"),
  ctaSecondaryLabel: text("cta_secondary_label").notNull().default("START PROJECT"),
  reelUrl: text("reel_url").notNull().default(""),
  aboutIntro: text("about_intro").notNull().default(""),
  aboutExperience: text("about_experience").notNull().default(""),
  aboutFocus: text("about_focus").notNull().default(""),
  aboutWorkflow: text("about_workflow").notNull().default(""),
  aboutTools: text("about_tools").notNull().default(""),
  aboutStrengths: text("about_strengths").notNull().default(""),
  footerNote: text("footer_note").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactSettings = pgTable("contact_settings", {
  id: integer("id").primaryKey().default(1),
  email: text("email").notNull().default(""),
  countryCode: text("country_code").notNull().default("+91"),
  phone: text("phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  location: text("location").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  youtube: text("youtube").notNull().default(""),
  linkedin: text("linkedin").notNull().default(""),
  responseTime: text("response_time").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});


export const notificationSettings = pgTable("notification_settings", {
  id: integer("id").primaryKey().default(1),
  emailEnabled: boolean("email_enabled").notNull().default(false),
  notificationEmail: text("notification_email").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminOtpChallenges = pgTable("admin_otp_challenges", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const emailOtpChallenges = pgTable("email_otp_challenges", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  purpose: text("purpose").notNull(),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mobileOtpChallenges = pgTable("mobile_otp_challenges", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  purpose: text("purpose").notNull(),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const themeSettings = pgTable("theme_settings", {
  id: integer("id").primaryKey().default(1),
  accent: text("accent").notNull().default("#e0147f"),
  glassOpacity: integer("glass_opacity").notNull().default(45),
  glassBlur: integer("glass_blur").notNull().default(20),
  grain: boolean("grain").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* ENQUIRIES + LIVE CHAT                                               */
/* ------------------------------------------------------------------ */

export const enquiries = pgTable(
  "inquiries",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    countryCode: text("country_code").notNull().default("+91"),
    phoneNumber: text("phone_number").notNull(),
    company: text("company").default("").notNull(),
    selectedWork: text("selected_work").default("[]").notNull(),
    description: text("description").notNull(),
    referenceUrl: text("reference_url").default("").notNull(),
    deadline: text("deadline").default("").notNull(),
    source: text("source").default("").notNull(),
    status: text("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("enquiries_status_idx").on(t.status)],
);

export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    countryCode: text("country_code").notNull().default("+91"),
    phone: text("phone").notNull(),
    status: text("status").notNull().default("open"),
    lastMessage: text("last_message").default("").notNull(),
    adminUnread: integer("admin_unread").notNull().default(0),
    customerUnread: integer("customer_unread").notNull().default(0),
    customerSeenAt: timestamp("customer_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("chat_conversations_email_idx").on(t.email),
    index("chat_conversations_updated_at_idx").on(t.updatedAt),
  ],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    senderType: text("sender_type").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_messages_conversation_id_idx").on(t.conversationId)],
);

export type Project = typeof projects.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type SoftwareTool = typeof softwareTools.$inferSelect;
export type Service = typeof services.$inferSelect;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type CarouselSetting = typeof carouselSettings.$inferSelect;
export type HomepageSettings = typeof homepageSettings.$inferSelect;
export type ContactSettings = typeof contactSettings.$inferSelect;
export type ThemeSettings = typeof themeSettings.$inferSelect;
export type LayoutSection = typeof layoutSections.$inferSelect;
export type WorkOption = typeof workOptions.$inferSelect;
export type Admin = typeof admins.$inferSelect;
