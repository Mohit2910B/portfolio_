-- ============================================================================
-- Safe additive migration for an existing smeet_portfolio MySQL database.
-- NEVER drops or renames existing columns/tables and NEVER deletes rows.
-- It only creates missing tables (001) and adds missing columns.
-- ============================================================================

USE `smeet_portfolio`;

DELIMITER $$

DROP PROCEDURE IF EXISTS `add_column_if_missing`$$
CREATE PROCEDURE `add_column_if_missing`(
  IN p_table_name VARCHAR(64),
  IN p_column_name VARCHAR(64),
  IN p_column_definition TEXT
)
BEGIN
  IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table_name
  ) AND NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_column_name
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table_name, '` ADD COLUMN `', p_column_name, '` ', p_column_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DELIMITER ;

-- admins
CALL add_column_if_missing('admins', 'role', 'VARCHAR(64) NOT NULL DEFAULT ''admin''');
CALL add_column_if_missing('admins', 'last_login_at', 'TIMESTAMP NULL DEFAULT NULL');
CALL add_column_if_missing('admins', 'updated_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- categories
CALL add_column_if_missing('categories', 'description', 'TEXT NULL');
CALL add_column_if_missing('categories', 'is_active', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('categories', 'updated_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- work options
CALL add_column_if_missing('work_options', 'is_active', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('work_options', 'created_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL add_column_if_missing('work_options', 'updated_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- projects
CALL add_column_if_missing('projects', 'slug', 'VARCHAR(191) NULL');
CALL add_column_if_missing('projects', 'category_label', 'VARCHAR(191) NULL');
CALL add_column_if_missing('projects', 'ai_lab_type', 'VARCHAR(191) NULL');
CALL add_column_if_missing('projects', 'external_link', 'TEXT NULL');
CALL add_column_if_missing('projects', 'duration_seconds', 'INT NULL');
CALL add_column_if_missing('projects', 'demo_status', 'VARCHAR(64) NOT NULL DEFAULT ''none''');
CALL add_column_if_missing('projects', 'created_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL add_column_if_missing('projects', 'updated_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- media library
CALL add_column_if_missing('media_files', 'file_type', 'VARCHAR(64) NULL');
CALL add_column_if_missing('media_files', 'kind', 'VARCHAR(64) NOT NULL DEFAULT ''image''');
CALL add_column_if_missing('media_files', 'url', 'TEXT NULL');
CALL add_column_if_missing('media_files', 'file_path', 'TEXT NULL');
CALL add_column_if_missing('media_files', 'project_id', 'INT UNSIGNED NULL');
CALL add_column_if_missing('media_files', 'width', 'INT NULL');
CALL add_column_if_missing('media_files', 'height', 'INT NULL');
CALL add_column_if_missing('media_files', 'created_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');

-- services (your existing DB has active/blurb/items/enabled; the new app uses
-- is_active/deliverables/price_from/created_at/updated_at. Nothing is removed.)
CALL add_column_if_missing('services', 'deliverables', 'TEXT NULL');
CALL add_column_if_missing('services', 'price_from', 'VARCHAR(191) NULL');
CALL add_column_if_missing('services', 'is_active', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('services', 'created_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL add_column_if_missing('services', 'updated_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- skills
CALL add_column_if_missing('skills', 'description', 'TEXT NULL');
CALL add_column_if_missing('skills', 'percentage', 'INT NULL');
CALL add_column_if_missing('skills', 'is_active', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('skills', 'created_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL add_column_if_missing('skills', 'updated_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- CMS tables (001 creates them if missing, these calls make older copies safe)
CALL add_column_if_missing('homepage_settings', 'updated_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
CALL add_column_if_missing('contact_settings', 'social_links', 'JSON NULL');
CALL add_column_if_missing('theme_settings', 'accent', 'VARCHAR(32) NOT NULL DEFAULT ''#e0147f''');
CALL add_column_if_missing('theme_settings', 'glass_opacity', 'INT NOT NULL DEFAULT 45');
CALL add_column_if_missing('theme_settings', 'glass_blur', 'INT NOT NULL DEFAULT 20');
CALL add_column_if_missing('theme_settings', 'grain', 'TINYINT(1) NOT NULL DEFAULT 1');

-- inquiries: preserve the existing table name used by the older project.
CALL add_column_if_missing('inquiries', 'country_code', 'VARCHAR(16) NULL DEFAULT ''+91''');
CALL add_column_if_missing('inquiries', 'phone_number', 'VARCHAR(64) NULL');
CALL add_column_if_missing('inquiries', 'company', 'VARCHAR(255) NULL');
CALL add_column_if_missing('inquiries', 'selected_work', 'JSON NULL');
CALL add_column_if_missing('inquiries', 'description', 'TEXT NULL');
CALL add_column_if_missing('inquiries', 'reference_url', 'TEXT NULL');
CALL add_column_if_missing('inquiries', 'deadline', 'VARCHAR(191) NULL');
CALL add_column_if_missing('inquiries', 'source', 'VARCHAR(191) NULL');
CALL add_column_if_missing('inquiries', 'status', 'VARCHAR(64) NOT NULL DEFAULT ''new''');
CALL add_column_if_missing('inquiries', 'created_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');

-- chat
CALL add_column_if_missing('chat_conversations', 'country_code', 'VARCHAR(16) NULL DEFAULT ''+91''');
CALL add_column_if_missing('chat_conversations', 'last_message', 'TEXT NULL');
CALL add_column_if_missing('chat_conversations', 'admin_unread', 'INT NOT NULL DEFAULT 0');
CALL add_column_if_missing('chat_conversations', 'customer_unread', 'INT NOT NULL DEFAULT 0');
CALL add_column_if_missing('chat_conversations', 'customer_seen_at', 'TIMESTAMP NULL DEFAULT NULL');
CALL add_column_if_missing('chat_conversations', 'updated_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
CALL add_column_if_missing('chat_messages', 'is_read', 'TINYINT(1) NOT NULL DEFAULT 0');

DROP PROCEDURE IF EXISTS `add_column_if_missing`;
