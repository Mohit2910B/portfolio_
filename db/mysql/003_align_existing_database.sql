-- Safe additive migration for the current MySQL database.
-- Run this after 001_complete_schema.sql. It never drops tables or data.
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

CALL add_column_if_missing('admins','role','VARCHAR(64) NOT NULL DEFAULT ''admin''');
CALL add_column_if_missing('admins','last_login_at','TIMESTAMP NULL DEFAULT NULL');
CALL add_column_if_missing('admins','updated_at','TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL add_column_if_missing('categories','description','TEXT NULL');
CALL add_column_if_missing('categories','is_active','TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('categories','updated_at','TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL add_column_if_missing('work_options','is_active','TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('work_options','updated_at','TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL add_column_if_missing('projects','slug','VARCHAR(191) NULL');
CALL add_column_if_missing('projects','description','TEXT NULL');
CALL add_column_if_missing('projects','category_label','VARCHAR(191) NULL');
CALL add_column_if_missing('projects','ai_lab_type','VARCHAR(191) NULL');
CALL add_column_if_missing('projects','sort_order','INT NOT NULL DEFAULT 0');
CALL add_column_if_missing('projects','software','TEXT NULL');
CALL add_column_if_missing('projects','tags','TEXT NULL');
CALL add_column_if_missing('projects','external_link','TEXT NULL');
CALL add_column_if_missing('projects','video_source','VARCHAR(32) NOT NULL DEFAULT ''url''');
CALL add_column_if_missing('projects','video_url','TEXT NULL');
CALL add_column_if_missing('projects','media_url','TEXT NULL');
CALL add_column_if_missing('projects','thumbnail_url','TEXT NULL');
CALL add_column_if_missing('projects','aspect_ratio','VARCHAR(32) NOT NULL DEFAULT ''16:9''');
CALL add_column_if_missing('projects','display_size','VARCHAR(32) NOT NULL DEFAULT ''medium''');
CALL add_column_if_missing('projects','display_width','INT NULL');
CALL add_column_if_missing('projects','display_height','INT NULL');
CALL add_column_if_missing('projects','width','INT NULL');
CALL add_column_if_missing('projects','height','INT NULL');
CALL add_column_if_missing('projects','duration_seconds','INT NULL');
CALL add_column_if_missing('projects','featured','TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_missing('projects','published','TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('projects','demo_status','VARCHAR(64) NOT NULL DEFAULT ''none''');
CALL add_column_if_missing('projects','created_at','TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL add_column_if_missing('projects','updated_at','TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL add_column_if_missing('media_files','file_type','VARCHAR(64) NULL');
CALL add_column_if_missing('media_files','kind','VARCHAR(64) NOT NULL DEFAULT ''image''');
CALL add_column_if_missing('media_files','url','TEXT NULL');
CALL add_column_if_missing('media_files','file_path','TEXT NULL');
CALL add_column_if_missing('media_files','project_id','INT UNSIGNED NULL');
CALL add_column_if_missing('media_files','width','INT NULL');
CALL add_column_if_missing('media_files','height','INT NULL');

CALL add_column_if_missing('skills','icon','VARCHAR(191) NULL');
CALL add_column_if_missing('skills','description','TEXT NULL');
CALL add_column_if_missing('skills','percentage','INT NULL');
CALL add_column_if_missing('skills','is_active','TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('software_tools','is_active','TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('services','is_active','TINYINT(1) NOT NULL DEFAULT 1');

CALL add_column_if_missing('homepage_settings','experience_content','TEXT NULL');
CALL add_column_if_missing('homepage_settings','services_content','TEXT NULL');
CALL add_column_if_missing('homepage_settings','skills_content','TEXT NULL');
CALL add_column_if_missing('contact_settings','social_links','JSON NULL');

CALL add_column_if_missing('enquiries','country_code','VARCHAR(16) NULL DEFAULT ''+91''');
CALL add_column_if_missing('enquiries','phone_number','VARCHAR(64) NULL');
CALL add_column_if_missing('enquiries','company','VARCHAR(255) NULL');
CALL add_column_if_missing('enquiries','selected_work','JSON NULL');
CALL add_column_if_missing('enquiries','description','TEXT NULL');
CALL add_column_if_missing('enquiries','reference_url','TEXT NULL');
CALL add_column_if_missing('enquiries','deadline','VARCHAR(191) NULL');
CALL add_column_if_missing('enquiries','source','VARCHAR(191) NULL');
CALL add_column_if_missing('enquiries','status','VARCHAR(64) NOT NULL DEFAULT ''new''');

CALL add_column_if_missing('chat_conversations','country_code','VARCHAR(16) NULL DEFAULT ''+91''');
CALL add_column_if_missing('chat_conversations','last_message','TEXT NULL');
CALL add_column_if_missing('chat_conversations','admin_unread','INT NOT NULL DEFAULT 0');
CALL add_column_if_missing('chat_conversations','customer_unread','INT NOT NULL DEFAULT 0');
CALL add_column_if_missing('chat_conversations','customer_seen_at','TIMESTAMP NULL DEFAULT NULL');
CALL add_column_if_missing('chat_messages','is_read','TINYINT(1) NOT NULL DEFAULT 0');

DROP PROCEDURE IF EXISTS `add_column_if_missing`;
