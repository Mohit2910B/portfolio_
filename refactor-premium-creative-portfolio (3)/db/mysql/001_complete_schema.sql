-- ============================================================================
-- Mohit/Smeet Portfolio CMS — MySQL 8.0 complete schema
-- Database: smeet_portfolio
-- Safe for fresh setup and safe to rerun: uses CREATE TABLE IF NOT EXISTS.
-- This file does NOT delete existing user data.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `smeet_portfolio`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `smeet_portfolio`;

-- --------------------------------------------------------------------------
-- Admin authentication
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `username` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(512) NOT NULL,
  `role` VARCHAR(64) NOT NULL DEFAULT 'admin',
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admins_email_key` (`email`),
  UNIQUE KEY `admins_username_key` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `token` VARCHAR(191) NOT NULL,
  `admin_id` INT UNSIGNED NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token`),
  KEY `admin_sessions_admin_id_idx` (`admin_id`),
  CONSTRAINT `admin_sessions_admin_id_fk`
    FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Portfolio taxonomy and enquiry selectable work options
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_key` (`slug`),
  KEY `categories_sort_order_idx` (`sort_order`),
  KEY `categories_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `work_options` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(191) NOT NULL,
  `value` VARCHAR(191) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `work_options_value_key` (`value`),
  KEY `work_options_sort_order_idx` (`sort_order`),
  KEY `work_options_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Portfolio projects
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(191) NULL,
  `description` TEXT NULL,
  `category_id` INT UNSIGNED NULL,
  `category_label` VARCHAR(191) NULL,
  `ai_lab_type` VARCHAR(191) NULL,
  `year` INT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `software` TEXT NULL,
  `tags` TEXT NULL,
  `external_link` TEXT NULL,
  `video_source` VARCHAR(32) NOT NULL DEFAULT 'url',
  `video_url` TEXT NULL,
  `media_url` TEXT NULL,
  `thumbnail_url` TEXT NULL,
  `aspect_ratio` VARCHAR(32) NOT NULL DEFAULT '16:9',
  `display_size` VARCHAR(32) NOT NULL DEFAULT 'medium',
  `display_width` INT NULL,
  `display_height` INT NULL,
  `width` INT NULL,
  `height` INT NULL,
  `duration_seconds` INT NULL,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `published` TINYINT(1) NOT NULL DEFAULT 1,
  `demo_status` VARCHAR(64) NOT NULL DEFAULT 'none',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `projects_slug_key` (`slug`),
  KEY `projects_category_id_idx` (`category_id`),
  KEY `projects_published_idx` (`published`),
  KEY `projects_featured_idx` (`featured`),
  KEY `projects_sort_order_idx` (`sort_order`),
  CONSTRAINT `projects_category_id_fk`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Media library
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `media_files` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `filename` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(64) NULL,
  `mime_type` VARCHAR(127) NOT NULL,
  `kind` VARCHAR(64) NOT NULL DEFAULT 'image',
  `size` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `url` TEXT NOT NULL,
  `file_path` TEXT NULL,
  `project_id` INT UNSIGNED NULL,
  `width` INT NULL,
  `height` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `media_files_filename_key` (`filename`),
  KEY `media_files_kind_idx` (`kind`),
  KEY `media_files_project_id_idx` (`project_id`),
  CONSTRAINT `media_files_project_id_fk`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Services, skills, and software/tools CMS
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `services` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `deliverables` TEXT NULL,
  `icon` VARCHAR(191) NULL,
  `price_from` VARCHAR(191) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `services_sort_order_idx` (`sort_order`),
  KEY `services_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `skills` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NULL,
  `icon` VARCHAR(191) NULL,
  `description` TEXT NULL,
  `level` INT NULL,
  `percentage` INT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `skills_sort_order_idx` (`sort_order`),
  KEY `skills_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `software_tools` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NULL,
  `icon` VARCHAR(191) NOT NULL DEFAULT 'generic',
  `proficiency` INT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `software_tools_sort_order_idx` (`sort_order`),
  KEY `software_tools_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Homepage/CMS, site, theme, contact, layout
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `homepage_settings` (
  `id` INT UNSIGNED NOT NULL DEFAULT 1,
  `owner_name` VARCHAR(191) NOT NULL DEFAULT 'Mohit Babariya',
  `hero_name` VARCHAR(191) NOT NULL DEFAULT 'MOHIT BABARIYA',
  `hero_title` TEXT NULL,
  `hero_subtitle` TEXT NULL,
  `hero_description` TEXT NULL,
  `availability_label` VARCHAR(255) NULL,
  `cta_primary_label` VARCHAR(191) NULL,
  `cta_secondary_label` VARCHAR(191) NULL,
  `reel_url` TEXT NULL,
  `about_intro` TEXT NULL,
  `about_experience` TEXT NULL,
  `about_focus` TEXT NULL,
  `about_workflow` TEXT NULL,
  `about_tools` TEXT NULL,
  `about_strengths` TEXT NULL,
  `experience_content` TEXT NULL,
  `services_content` TEXT NULL,
  `skills_content` TEXT NULL,
  `footer_note` TEXT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_settings` (
  `id` INT UNSIGNED NOT NULL DEFAULT 1,
  `email` VARCHAR(191) NULL,
  `country_code` VARCHAR(16) NULL DEFAULT '+91',
  `phone` VARCHAR(64) NULL,
  `whatsapp` VARCHAR(64) NULL,
  `location` VARCHAR(255) NULL,
  `instagram` TEXT NULL,
  `youtube` TEXT NULL,
  `linkedin` TEXT NULL,
  `social_links` JSON NULL,
  `response_time` VARCHAR(191) NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `theme_settings` (
  `id` INT UNSIGNED NOT NULL DEFAULT 1,
  `accent` VARCHAR(32) NOT NULL DEFAULT '#e0147f',
  `glass_opacity` INT NOT NULL DEFAULT 45,
  `glass_blur` INT NOT NULL DEFAULT 20,
  `grain` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `layout_sections` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `section_key` VARCHAR(191) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_visible` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `layout_sections_key_key` (`section_key`),
  KEY `layout_sections_sort_order_idx` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` INT UNSIGNED NOT NULL DEFAULT 1,
  `setting_key` VARCHAR(191) NULL,
  `setting_value` JSON NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Carousel configuration and project/media references
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `carousel_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED NULL,
  `slots` INT NOT NULL DEFAULT 5,
  `center_size` VARCHAR(64) NOT NULL DEFAULT 'large',
  `side_size` VARCHAR(64) NOT NULL DEFAULT 'small',
  `auto_fill` TINYINT(1) NOT NULL DEFAULT 1,
  `project_ids` JSON NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `carousel_settings_category_id_idx` (`category_id`),
  KEY `carousel_settings_sort_order_idx` (`sort_order`),
  CONSTRAINT `carousel_settings_category_id_fk`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `carousel_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `carousel_setting_id` INT UNSIGNED NULL,
  `category_id` INT UNSIGNED NULL,
  `project_id` INT UNSIGNED NULL,
  `media_file_id` INT UNSIGNED NULL,
  `display_size` VARCHAR(64) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `carousel_items_setting_idx` (`carousel_setting_id`),
  KEY `carousel_items_category_idx` (`category_id`),
  KEY `carousel_items_project_idx` (`project_id`),
  KEY `carousel_items_media_idx` (`media_file_id`),
  CONSTRAINT `carousel_items_setting_fk`
    FOREIGN KEY (`carousel_setting_id`) REFERENCES `carousel_settings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `carousel_items_category_fk`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `carousel_items_project_fk`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `carousel_items_media_fk`
    FOREIGN KEY (`media_file_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Contact / project enquiries
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `enquiries` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `country_code` VARCHAR(16) NULL DEFAULT '+91',
  `phone_number` VARCHAR(64) NOT NULL,
  `phone` VARCHAR(64) NULL,
  `company` VARCHAR(255) NULL,
  `selected_work` JSON NULL,
  `subject` VARCHAR(255) NULL,
  `message` TEXT NULL,
  `description` TEXT NULL,
  `reference_url` TEXT NULL,
  `deadline` VARCHAR(191) NULL,
  `source` VARCHAR(191) NULL,
  `status` VARCHAR(64) NOT NULL DEFAULT 'new',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `enquiries_status_idx` (`status`),
  KEY `enquiries_created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Live chat
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_conversations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `country_code` VARCHAR(16) NULL DEFAULT '+91',
  `phone` VARCHAR(64) NOT NULL,
  `status` VARCHAR(64) NOT NULL DEFAULT 'open',
  `last_message` TEXT NULL,
  `admin_unread` INT NOT NULL DEFAULT 0,
  `customer_unread` INT NOT NULL DEFAULT 0,
  `customer_seen_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chat_conversations_email_idx` (`email`),
  KEY `chat_conversations_updated_at_idx` (`updated_at`),
  KEY `chat_conversations_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` INT UNSIGNED NOT NULL,
  `sender_type` VARCHAR(64) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chat_messages_conversation_id_idx` (`conversation_id`),
  KEY `chat_messages_created_at_idx` (`created_at`),
  CONSTRAINT `chat_messages_conversation_id_fk`
    FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Safe singleton rows and seed taxonomy/content defaults.
-- Uses INSERT IGNORE to avoid overwriting existing data.
-- --------------------------------------------------------------------------
INSERT IGNORE INTO `homepage_settings` (`id`, `owner_name`, `hero_name`, `hero_title`, `hero_subtitle`, `hero_description`, `availability_label`, `cta_primary_label`, `cta_secondary_label`)
VALUES (1, 'Mohit Babariya', 'MOHIT BABARIYA', 'MAKE\nVISUALS\nMOVE.', 'VIDEO EDITOR · MOTION GRAPHICS · GRAPHIC DESIGN · AI VIDEO', 'I edit films, reels and motion pieces that hold attention — clean cuts, considered pacing and a finish that feels intentional.', 'Available for freelance projects', 'WATCH REEL', 'START PROJECT');

INSERT IGNORE INTO `contact_settings` (`id`, `country_code`, `location`, `response_time`)
VALUES (1, '+91', 'India · working worldwide', 'Replies within 24 hours');

INSERT IGNORE INTO `theme_settings` (`id`, `accent`, `glass_opacity`, `glass_blur`, `grain`)
VALUES (1, '#e0147f', 45, 20, 1);

INSERT IGNORE INTO `categories` (`name`, `slug`, `description`, `sort_order`) VALUES
  ('Real Estate', 'real-estate', 'Property walk-throughs, listing films and cinematic tours.', 0),
  ('Motion Graphics', 'motion-graphics', 'Kinetic type, animated branding and title systems.', 1),
  ('Social Media', 'social-media', 'Reels, shorts and scroll-stopping social edits.', 2),
  ('Product Video', 'product-video', 'Product storytelling, feature demos and launch edits.', 3),
  ('Corporate', 'corporate', 'Brand films, internal communication and event recaps.', 4),
  ('AI Video', 'ai-video', 'AI-assisted generation, upscaling and hybrid workflows.', 5),
  ('Commercial', 'commercial', 'Campaign films and promotional edits.', 6),
  ('Other', 'other', 'Experiments, personal cuts and everything in between.', 7);

INSERT IGNORE INTO `work_options` (`label`, `value`, `sort_order`) VALUES
  ('Video Editing', 'video-editing', 0),
  ('Reels', 'reels', 1),
  ('YouTube', 'youtube', 2),
  ('Real Estate', 'real-estate', 3),
  ('Motion Graphics', 'motion-graphics', 4),
  ('Graphic Design', 'graphic-design', 5),
  ('Product Video', 'product-video', 6),
  ('AI Video', 'ai-video', 7),
  ('AI UGC', 'ai-ugc', 8),
  ('Corporate', 'corporate', 9),
  ('Other', 'other', 10);

INSERT IGNORE INTO `layout_sections` (`section_key`, `label`, `sort_order`, `is_visible`) VALUES
  ('hero', 'Hero', 0, 1),
  ('about', 'About', 1, 1),
  ('tools', 'Tools & Software', 2, 1),
  ('services', 'Services', 3, 1),
  ('work', 'Work / Portfolio', 4, 1),
  ('contact', 'Contact & Enquiry', 5, 1);

INSERT IGNORE INTO `software_tools` (`name`, `category`, `icon`, `proficiency`, `sort_order`) VALUES
  ('Adobe Premiere Pro', 'Editing', 'premiere', 95, 0),
  ('Adobe After Effects', 'Motion', 'after-effects', 92, 1),
  ('DaVinci Resolve', 'Colour', 'davinci', 88, 2),
  ('Photoshop', 'Design', 'photoshop', 90, 3),
  ('Illustrator', 'Vector', 'illustrator', 86, 4),
  ('Blender', '3D / Visual Design', 'blender', 78, 5),
  ('CapCut', 'Social Editing', 'capcut', 88, 6),
  ('Figma', 'Design Systems', 'figma', 82, 7),
  ('AI / Generative AI tools', 'AI Video', 'ai', 85, 8);

INSERT IGNORE INTO `services` (`title`, `description`, `deliverables`, `icon`, `sort_order`) VALUES
  ('Video Editing', 'Timeline-led editing for brands, creators and studios.', 'Story assembly|Rhythm & pacing|Subtitles|Multi-ratio delivery', 'cut', 0),
  ('Motion Graphics', 'Animated typography, logo motion and graphic systems.', 'Kinetic type|Logo animation|Titles & LTH|Transitions', 'shape', 1),
  ('Graphic Design', 'Thumbnails, key art and brand layouts.', 'Thumbnails|Key art|Brand layouts|Campaign sets', 'frame', 2),
  ('AI Video', 'AI-assisted generation and hybrid edit workflows.', 'AI generation|Cleanup & upscale|Hybrid edits', 'spark', 3);

INSERT IGNORE INTO `skills` (`name`, `category`, `level`, `percentage`, `sort_order`) VALUES
  ('Video Editing', 'Post Production', 95, 95, 0),
  ('Motion Graphics', 'Motion', 90, 90, 1),
  ('After Effects', 'Tools', 92, 92, 2),
  ('Premiere Pro', 'Tools', 95, 95, 3),
  ('DaVinci Resolve', 'Tools', 88, 88, 4),
  ('Color Grading', 'Craft', 90, 90, 5),
  ('AI Video', 'Craft', 85, 85, 6),
  ('Sound Design', 'Craft', 80, 80, 7),
  ('Social Media Editing', 'Distribution', 95, 95, 8),
  ('Creative Direction', 'Strategy', 88, 88, 9);

INSERT IGNORE INTO `carousel_settings` (`category_id`, `slots`, `center_size`, `side_size`, `auto_fill`, `project_ids`, `sort_order`, `is_active`)
SELECT `id`, 5, 'large', 'small', 1, JSON_ARRAY(), `sort_order`, 1 FROM `categories`;
