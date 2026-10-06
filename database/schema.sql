-- ====================================================================
-- CƠ SỞ DỮ LIỆU: ỨNG DỤNG ĐỌC TRUYỆN ONLINE (ĐỒ ÁN 4)
-- Hệ quản trị CSDL: MySQL 8.0+ (utf8mb4 hỗ trợ tiếng Việt đầy đủ)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `doc_truyen_online` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `doc_truyen_online`;

-- 1. BẢNG PHÂN QUYỀN (ROLES)
CREATE TABLE IF NOT EXISTS `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG NGƯỜI DÙNG (USERS)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_id` INT NOT NULL,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `avatar_url` VARCHAR(255) DEFAULT NULL,
    `full_name` VARCHAR(100) DEFAULT NULL,
    `gender` ENUM('male', 'female', 'other') DEFAULT NULL,
    `is_banned` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_users_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG TÁC GIẢ (AUTHORS)
CREATE TABLE IF NOT EXISTS `authors` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG THỂ LOẠI (CATEGORIES)
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG TRUYỆN (STORIES)
CREATE TABLE IF NOT EXISTS `stories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `uploader_id` INT DEFAULT NULL,
    `author_id` INT DEFAULT NULL,
    `title` VARCHAR(255) NOT NULL,
    `other_name` VARCHAR(255) DEFAULT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `cover_image` VARCHAR(255) DEFAULT NULL,
    `description` TEXT,
    `age_limit` VARCHAR(10) DEFAULT '0+',
    `status` ENUM('Đang ra', 'Hoàn thành') DEFAULT 'Đang ra',
    `approval_status` ENUM('Chờ duyệt', 'Đã duyệt', 'Từ chối') DEFAULT 'Chờ duyệt',
    `views` BIGINT DEFAULT 0,
    `origin_country` ENUM('china', 'japan', 'korea', 'vietnam') DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_stories_uploader` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_stories_author` FOREIGN KEY (`author_id`) REFERENCES `authors` (`id`) ON DELETE SET NULL,
    INDEX `idx_stories_views` (`views`),
    INDEX `idx_stories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG LIÊN KẾT TRUYỆN VÀ THỂ LOẠI (STORY_CATEGORIES - Khóa chính phức hợp)
CREATE TABLE IF NOT EXISTS `story_categories` (
    `story_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    PRIMARY KEY (`story_id`, `category_id`),
    CONSTRAINT `fk_sc_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sc_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG CHƯƠNG TRUYỆN (CHAPTERS)
CREATE TABLE IF NOT EXISTS `chapters` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `story_id` INT NOT NULL,
    `chapter_number` DECIMAL(6,1) NOT NULL,
    `title` VARCHAR(255) DEFAULT NULL,
    `views` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_chapters_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
    INDEX `idx_chapter_story_number` (`story_id`, `chapter_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. BẢNG HÌNH ẢNH CHƯƠNG TRUYỆN (CHAPTER_IMAGES)
CREATE TABLE IF NOT EXISTS `chapter_images` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `chapter_id` INT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `order_index` INT NOT NULL DEFAULT 1,
    CONSTRAINT `fk_ci_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id`) ON DELETE CASCADE,
    INDEX `idx_ci_order` (`chapter_id`, `order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. BẢNG BÌNH LUẬN (COMMENTS)
CREATE TABLE IF NOT EXISTS `comments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `story_id` INT NOT NULL,
    `chapter_id` INT DEFAULT NULL,
    `content` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_comments_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_comments_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. BẢNG LỊCH SỬ ĐỌC (READING_HISTORIES - Khóa chính phức hợp user_id, story_id)
CREATE TABLE IF NOT EXISTS `reading_histories` (
    `user_id` INT NOT NULL,
    `story_id` INT NOT NULL,
    `last_chapter_id` INT NOT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `story_id`),
    CONSTRAINT `fk_rh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rh_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rh_chapter` FOREIGN KEY (`last_chapter_id`) REFERENCES `chapters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. BẢNG THEO DÕI TRUYỆN (STORY_FOLLOWS - Khóa chính phức hợp user_id, story_id)
CREATE TABLE IF NOT EXISTS `story_follows` (
    `user_id` INT NOT NULL,
    `story_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `story_id`),
    CONSTRAINT `fk_sf_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sf_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. BẢNG YÊU THÍCH TRUYỆN (STORY_LIKES - Khóa chính phức hợp user_id, story_id)
CREATE TABLE IF NOT EXISTS `story_likes` (
    `user_id` INT NOT NULL,
    `story_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `story_id`),
    CONSTRAINT `fk_sl_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sl_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ====================================================================
-- DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA MẪU)
-- ====================================================================

INSERT INTO `roles` (`id`, `name`) VALUES
(1, 'Admin'),
(2, 'Uploader'),
(3, 'User')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `categories` (`id`, `name`, `slug`) VALUES
(1, 'Tiên Hiệp', 'tien-hiep'),
(2, 'Kiếm Hiệp', 'kiem-hiep'),
(3, 'Huyền Huyễn', 'huyen-huyen'),
(4, 'Đô Thị', 'do-thi'),
(5, 'Khoa Huyễn', 'khoa-huyen'),
(6, 'Trinh Thám', 'trinh-tham'),
(7, 'Ngôn Tình', 'ngon-tinh'),
(8, 'Manga/Manhwa', 'manga-manhwa')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `authors` (`id`, `name`, `slug`) VALUES
(1, 'Nhĩ Căn', 'nhi-can'),
(2, 'Thiên Tằm Thổ Đậu', 'thien-tam-tho-dau'),
(3, 'Kim Dung', 'kim-dung'),
(4, 'Cổ Long', 'co-long')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
