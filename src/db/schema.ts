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
/* 1. ADMINS + SESSIONS                                                */
/* ------------------------------------------------------------------ */

export const admins = pgTable(
  "admins",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    username: text("username").notNull().default("admin"),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("admin"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("admins_email_key").on(t.email),
    uniqueIndex("admins_username_key").on(t.username),
  ]
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
  (t) => [index("admin_sessions_admin_id_idx").on(t.adminId)]
);

/* ------------------------------------------------------------------ */
/* 2. CATEGORIES                                                      */
/* ------------------------------------------------------------------ */

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    driveFolderId: text("drive_folder_id"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("categories_slug_key").on(t.slug),
    index("categories_drive_folder_id_idx").on(t.driveFolderId),
    index("categories_deleted_at_idx").on(t.deletedAt),
  ]
);

/* ------------------------------------------------------------------ */
/* 3. PORTFOLIO PROJECTS                                              */
/* ------------------------------------------------------------------ */

export const portfolioProjects = pgTable(
  "portfolio_projects",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    categoryLabel: text("category_label").notNull().default(""),
    year: integer("year").notNull().default(2026),
    software: text("software").notNull().default(""),
    tags: text("tags").notNull().default(""),
    externalUrl: text("external_url").notNull().default(""),
    videoUrl: text("video_url").notNull().default(""),
    thumbnailUrl: text("thumbnail_url").notNull().default(""),
    aspectRatio: text("aspect_ratio").notNull().default("16:9"),
    displaySize: text("display_size").notNull().default("medium"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    driveFileId: text("drive_file_id"),
    driveFolderId: text("drive_folder_id"),
    isReplacement: boolean("is_replacement").notNull().default(false),
    fileSize: integer("file_size").notNull().default(0),
    mimeType: text("mime_type").notNull().default(""),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("portfolio_projects_category_id_idx").on(t.categoryId),
    index("portfolio_projects_sort_order_idx").on(t.sortOrder),
    index("portfolio_projects_is_published_idx").on(t.isPublished),
    index("portfolio_projects_drive_file_id_idx").on(t.driveFileId),
    index("portfolio_projects_deleted_at_idx").on(t.deletedAt),
  ]
);

/* ------------------------------------------------------------------ */
/* 3B. GOOGLE DRIVE SYNC STATE & LOGS                                 */
/* ------------------------------------------------------------------ */

export const driveSyncState = pgTable(
  "drive_sync_state",
  {
    id: serial("id").primaryKey(),
    rootFolderId: text("root_folder_id").notNull(),
    status: text("status").notNull().default("idle"), // 'idle' | 'syncing' | 'success' | 'error'
    lastSyncStartedAt: timestamp("last_sync_started_at", { withTimezone: true }),
    lastSyncCompletedAt: timestamp("last_sync_completed_at", { withTimezone: true }),
    totalDriveFiles: integer("total_drive_files").notNull().default(0),
    totalCategoriesSynced: integer("total_categories_synced").notNull().default(0),
    totalVideosSynced: integer("total_videos_synced").notNull().default(0),
    lastError: text("last_error"),
    changeToken: text("change_token"),
    syncType: text("sync_type").notNull().default("manual"),
    detailsJson: text("details_json").notNull().default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

/* ------------------------------------------------------------------ */
/* 4. CAROUSEL ITEMS (SHOWREEL)                                       */
/* ------------------------------------------------------------------ */

export const carouselItems = pgTable(
  "carousel_items",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id").references(() => portfolioProjects.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    category: text("category").notNull().default(""),
    badge: text("badge").notNull().default(""),
    videoUrl: text("video_url").notNull().default(""),
    thumbnailUrl: text("thumbnail_url").notNull().default(""),
    duration: text("duration").notNull().default(""),
    aspectRatio: text("aspect_ratio").notNull().default("16:9"),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("carousel_items_sort_order_idx").on(t.sortOrder),
    index("carousel_items_is_published_idx").on(t.isPublished),
  ]
);

/* ------------------------------------------------------------------ */
/* 5. MEDIA FILES                                                     */
/* ------------------------------------------------------------------ */

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
  ]
);

/* ------------------------------------------------------------------ */
/* 6. SERVICES                                                        */
/* ------------------------------------------------------------------ */

export const services = pgTable(
  "services",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    deliverables: text("deliverables").notNull().default(""),
    icon: text("icon").notNull().default(""),
    priceFrom: text("price_from").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("services_sort_order_idx").on(t.sortOrder)]
);

/* ------------------------------------------------------------------ */
/* 7. SKILLS                                                          */
/* ------------------------------------------------------------------ */

export const skills = pgTable(
  "skills",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull().default(""),
    description: text("description").notNull().default(""),
    level: integer("level").notNull().default(90),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("skills_sort_order_idx").on(t.sortOrder)]
);

/* ------------------------------------------------------------------ */
/* 8. TOOLS & SOFTWARE                                                */
/* ------------------------------------------------------------------ */

export const toolsSoftware = pgTable(
  "tools_software",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull().default(""),
    description: text("description").notNull().default(""),
    iconUrl: text("icon_url").notNull().default(""),
    proficiency: integer("proficiency").notNull().default(95),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tools_software_sort_order_idx").on(t.sortOrder)]
);

/* ------------------------------------------------------------------ */
/* 9. EXPERIENCE                                                      */
/* ------------------------------------------------------------------ */

export const experience = pgTable(
  "experience",
  {
    id: serial("id").primaryKey(),
    company: text("company").notNull(),
    role: text("role").notNull(),
    description: text("description").notNull().default(""),
    startDate: text("start_date").notNull().default(""),
    endDate: text("end_date").notNull().default(""),
    location: text("location").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("experience_sort_order_idx").on(t.sortOrder)]
);

/* ------------------------------------------------------------------ */
/* 10. CREATIVE PROCESS                                               */
/* ------------------------------------------------------------------ */

export const creativeProcess = pgTable(
  "creative_process",
  {
    id: serial("id").primaryKey(),
    stepNumber: text("step_number").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("creative_process_sort_order_idx").on(t.sortOrder)]
);

/* ------------------------------------------------------------------ */
/* 11. HOMEPAGE CONTENT                                               */
/* ------------------------------------------------------------------ */

export const homepageContent = pgTable("homepage_content", {
  id: integer("id").primaryKey().default(1),
  heroEyebrow: text("hero_eyebrow").notNull().default("VIDEO EDITOR / MOTION DESIGNER"),
  heroHeading: text("hero_heading").notNull().default("MOHIT BABARIYA"),
  heroSubtitle: text("hero_subtitle").notNull().default("Professional Video Editor & Motion Designer"),
  heroDescription: text("hero_description").notNull().default("Crafting high-converting short-form reels, cinematic real estate films, YouTube edits, and commercial motion graphics worldwide."),
  heroCtaPrimary: text("hero_cta_primary").notNull().default("VIEW MY WORK"),
  heroCtaSecondary: text("hero_cta_secondary").notNull().default("LET'S WORK TOGETHER"),
  heroMediaUrl: text("hero_media_url").notNull().default(""),
  heroImageUrl: text("hero_image_url").notNull().default("/images/mohit-vertical.png?v=7"),
  heroImageAspect: text("hero_image_aspect").notNull().default("9:16"),
  heroImageFit: text("hero_image_fit").notNull().default("cover-top"),
  heroImageWidth: text("hero_image_width").notNull().default("360px"),
  heroImageFrame: text("hero_image_frame").notNull().default("phone"),
  heroBadgeTitle: text("hero_badge_title").notNull().default("THE ART OF EDITING"),
  heroBadgeSubtitle: text("hero_badge_subtitle").notNull().default("VIDEO EDITOR"),
  heroBadgeVisible: boolean("hero_badge_visible").notNull().default(true),
  aboutHeading: text("about_heading").notNull().default("THE PERSON BEHIND THE WORK"),
  aboutSubheading: text("about_subheading").notNull().default("Passionate Storyteller & Visual Craftsman"),
  aboutDescription: text("about_description").notNull().default("I specialize in transforming raw footage into compelling visual narratives."),
  aboutExperienceYears: text("about_experience_years").notNull().default("2+"),
  aboutProjectsCompleted: text("about_projects_completed").notNull().default("450+"),
  aboutClientsCount: text("about_clients_count").notNull().default("120+"),
  servicesIntro: text("services_intro").notNull().default("Tailored video editing, motion graphics, and post-production solutions."),
  portfolioIntro: text("portfolio_intro").notNull().default("Selected commercial, narrative, and motion graphics projects."),
  processIntro: text("process_intro").notNull().default("A proven, collaborative workflow..."),
  contactIntro: text("contact_intro").notNull().default("Have an upcoming video project? Let's create something exceptional together."),
  footerTagline: text("footer_tagline").notNull().default("CRAFTING VISUAL EXCELLENCE WORLDWIDE"),
  footerCopyright: text("footer_copyright").notNull().default("© 2026 MOHIT BABARIYA. ALL RIGHTS RESERVED."),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* 11B. PORTFOLIO SOURCE CONFIGURATION (Drive / YouTube / Other)       */
/* ------------------------------------------------------------------ */

export const portfolioSourceConfig = pgTable("portfolio_source_config", {
  id: serial("id").primaryKey(),
  sourceType: text("source_type").notNull().default("drive"),
  sourceUrl: text("source_url").notNull().default("https://drive.google.com/drive/folders/1qDP0lUvRfyDsvktivuDTviwKxfi67W1i"),
  folderId: text("folder_id").notNull().default("1qDP0lUvRfyDsvktivuDTviwKxfi67W1i"),
  channelTitle: text("channel_title").notNull().default("Google Drive Portfolio"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  syncStatus: text("sync_status").notNull().default("idle"),
  totalItems: integer("total_items").notNull().default(0),
  detailsJson: text("details_json").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* 12. CONTACT SETTINGS                                               */
/* ------------------------------------------------------------------ */

export const contactSettings = pgTable("contact_settings", {
  id: integer("id").primaryKey().default(1),
  email: text("email").notNull().default("mohitbabariyaa@gmail.com"),
  countryCode: text("country_code").notNull().default("+91"),
  phone: text("phone").notNull().default("+91 98765 43210"),
  whatsapp: text("whatsapp").notNull().default("+91 98765 43210"),
  location: text("location").notNull().default("Mumbai, India / Remote Worldwide"),
  instagram: text("instagram").notNull().default("https://instagram.com/mohitbabariya"),
  youtube: text("youtube").notNull().default("https://youtube.com/@mohitbabariya"),
  linkedin: text("linkedin").notNull().default("https://linkedin.com/in/mohitbabariya"),
  responseTime: text("response_time").notNull().default("Within 24 Hours"),
  notificationEmail: text("notification_email").notNull().default("mohitbabariyaa@gmail.com"),
  isEmailEnabled: boolean("is_email_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* 13. THEME SETTINGS                                                 */
/* ------------------------------------------------------------------ */

export const themeSettings = pgTable("theme_settings", {
  id: integer("id").primaryKey().default(1),
  activeTheme: integer("active_theme").notNull().default(1),
  accentColor: text("accent_color").notNull().default("#C8A66A"),
  customConfigJson: text("custom_config_json").notNull().default("{}"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* 14. LAYOUT ORDER                                                   */
/* ------------------------------------------------------------------ */

export const layoutOrder = pgTable("layout_order", {
  id: serial("id").primaryKey(),
  sectionKey: text("section_key").notNull(),
  label: text("label").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("layout_order_section_key_key").on(t.sectionKey),
]);

/* ------------------------------------------------------------------ */
/* 15. ENQUIRIES                                                      */
/* ------------------------------------------------------------------ */

export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  countryCode: text("country_code").notNull().default("+91"),
  phone: text("phone").notNull().default(""),
  company: text("company").notNull().default(""),
  projectType: text("project_type").notNull().default(""),
  description: text("description").notNull().default(""),
  budget: text("budget").notNull().default(""),
  deadline: text("deadline").notNull().default(""),
  status: text("status").notNull().default("new"), // 'new' | 'read' | 'archived'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("enquiries_status_idx").on(t.status),
]);

/* ------------------------------------------------------------------ */
/* 16. CHAT CONVERSATIONS                                             */
/* ------------------------------------------------------------------ */

export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  countryCode: text("country_code").notNull().default("+91"),
  phone: text("phone").notNull().default(""),
  status: text("status").notNull().default("open"),
  lastMessage: text("last_message").notNull().default(""),
  adminUnread: integer("admin_unread").notNull().default(0),
  customerUnread: integer("customer_unread").notNull().default(0),
  customerToken: text("customer_token").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("chat_conversations_updated_at_idx").on(t.updatedAt),
]);

/* ------------------------------------------------------------------ */
/* 17. CHAT MESSAGES                                                  */
/* ------------------------------------------------------------------ */

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  senderType: text("sender_type").notNull(), // 'customer' | 'admin'
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("chat_messages_conversation_id_idx").on(t.conversationId),
]);

/* Export types */
export type Admin = typeof admins.$inferSelect;
export type PortfolioProject = typeof portfolioProjects.$inferSelect;
export type CarouselItem = typeof carouselItems.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type ToolSoftware = typeof toolsSoftware.$inferSelect;
export type Experience = typeof experience.$inferSelect;
export type CreativeProcessItem = typeof creativeProcess.$inferSelect;
export type HomepageContent = typeof homepageContent.$inferSelect;
export type ContactSetting = typeof contactSettings.$inferSelect;
export type ThemeSetting = typeof themeSettings.$inferSelect;
export type LayoutOrderItem = typeof layoutOrder.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type DriveSyncState = typeof driveSyncState.$inferSelect;
export type PortfolioSourceConfig = typeof portfolioSourceConfig.$inferSelect;
