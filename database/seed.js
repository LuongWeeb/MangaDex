const fs = require('fs');
const path = require('path');
const db = require('../common/db');

// 1. Tạo các thư mục lưu ảnh trong public nếu chưa có
const dirs = [
  path.join(__dirname, '../public/images/covers'),
  path.join(__dirname, '../public/images/chapters'),
  path.join(__dirname, '../public/images/avatars')
];

dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
    console.log('📁 Đã tạo thư mục:', d);
  }
});

// Tạo một file ảnh bìa SVG mẫu làm placeholder đẹp mắt
const sampleSvg = `
<svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" rx="12" />
  <circle cx="150" cy="160" r="50" fill="rgba(255,255,255,0.2)" />
  <text x="150" y="170" font-family="Arial, sans-serif" font-size="36" fill="#ffffff" text-anchor="middle">📖</text>
  <text x="150" y="260" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">TRUYỆN HAY</text>
  <text x="150" y="290" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" text-anchor="middle">doc_truyen_online</text>
</svg>
`;

['tien-nghich.svg', 'dau-pha-thuong-khung.svg', 'one-piece.svg', 'default-cover.svg'].forEach(filename => {
  const filePath = path.join(__dirname, '../public/images/covers', filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, sampleSvg.trim());
  }
});

// Tạo avatar mặc định
const avatarSvg = `
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#6366f1" rx="50" />
  <text x="50" y="58" font-family="Arial, sans-serif" font-size="28" fill="#ffffff" text-anchor="middle">👤</text>
</svg>
`;
fs.writeFileSync(path.join(__dirname, '../public/images/avatars/default.svg'), avatarSvg.trim());

// 2. Chạy kịch bản nạp dữ liệu vào MySQL
async function runSeed() {
  console.log('🚀 Bắt đầu nạp dữ liệu mẫu vào MySQL...');

  const query = (sql, params = []) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });

  try {
    // 1. Roles
    await query(`
      INSERT INTO roles (id, name) VALUES 
      (1, 'Admin'), (2, 'Uploader'), (3, 'User')
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);
    console.log('✅ Đã nạp bảng Roles');

    // 2. Users (Mật khẩu demo: 123456 đã hash bcrypt giả lập)
    await query(`
      INSERT INTO users (id, role_id, username, email, password_hash, avatar_url) VALUES
      (1, 1, 'admin', 'admin@doan4.vn', '$2b$10$Wmd/M9XtqPQKR1JPe4TqYuDuQsVu.VhrbqR9lxZ6B2MDptOas.mSm', '/images/avatars/default.svg'),
      (2, 2, 'dichgia_vip', 'uploader@doan4.vn', '$2b$10$Wmd/M9XtqPQKR1JPe4TqYuDuQsVu.VhrbqR9lxZ6B2MDptOas.mSm', '/images/avatars/default.svg'),
      (3, 3, 'docgia_01', 'user01@doan4.vn', '$2b$10$Wmd/M9XtqPQKR1JPe4TqYuDuQsVu.VhrbqR9lxZ6B2MDptOas.mSm', '/images/avatars/default.svg')
      ON DUPLICATE KEY UPDATE username = VALUES(username)
    `);
    console.log('✅ Đã nạp bảng Users (admin, uploader, user)');

    // 3. Authors
    await query(`
      INSERT INTO authors (id, name, slug) VALUES
      (1, 'Nhĩ Căn', 'nhi-can'),
      (2, 'Thiên Tằm Thổ Đậu', 'thien-tam-tho-dau'),
      (3, 'Kim Dung', 'kim-dung'),
      (4, 'Eiichiro Oda', 'eiichiro-oda')
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);
    console.log('✅ Đã nạp bảng Authors');

    // 4. Categories
    await query(`
      INSERT INTO categories (id, name, slug) VALUES
      (1, 'Tiên Hiệp', 'tien-hiep'),
      (2, 'Huyền Huyễn', 'huyen-huyen'),
      (3, 'Kiếm Hiệp', 'kiem-hiep'),
      (4, 'Đô Thị', 'do-thi'),
      (5, 'Truyện Tranh (Manga)', 'manga')
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);
    console.log('✅ Đã nạp bảng Categories');

    // 5. Stories
    await query(`
      INSERT INTO stories (id, uploader_id, author_id, title, other_name, slug, cover_image, description, age_limit, status, views) VALUES
      (1, 2, 1, 'Tiên Nghịch', 'Xian Ni', 'tien-nghich', '/images/covers/tien-nghich.svg', 'Một thiếu niên bình phàm bước lên con đường tu tiên nghịch thiên cải mệnh, trải qua muôn vàn trắc trở.', '16+', 'Hoàn thành', 35400),
      (2, 2, 2, 'Đấu Phá Thương Khung', 'Battle Through the Heavens', 'dau-pha-thuong-khung', '/images/covers/dau-pha-thuong-khung.svg', 'Nơi đây thuộc về đấu khí, không có hoa tiếu diễm lệ ma pháp, chỉ có phồn diễn tới đỉnh cao đấu khí!', '13+', 'Hoàn thành', 58900),
      (3, 2, 4, 'One Piece', 'Đảo Hải Tặc', 'one-piece', '/images/covers/one-piece.svg', 'Hành trình của Monkey D. Luffy và băng Mũ Rơm trên con đường chinh phục kho báu vĩ đại nhất thế giới.', '13+', 'Đang ra', 120500)
      ON DUPLICATE KEY UPDATE title = VALUES(title)
    `);
    console.log('✅ Đã nạp bảng Stories (Tiên Nghịch, Đấu Phá Thương Khung, One Piece)');

    // 6. Story_Categories
    await query(`
      INSERT INTO story_categories (story_id, category_id) VALUES
      (1, 1), (1, 2), -- Tiên Nghịch: Tiên Hiệp, Huyền Huyễn
      (2, 2),         -- Đấu Phá: Huyền Huyễn
      (3, 5)          -- One Piece: Manga
      ON DUPLICATE KEY UPDATE story_id = VALUES(story_id)
    `);
    console.log('✅ Đã nạp bảng Story_Categories');

    // 7. Chapters
    await query(`
      INSERT INTO chapters (id, story_id, chapter_number, title, views) VALUES
      (1, 1, 1.0, 'Chương 1: Thiếu niên Vương Lâm', 1250),
      (2, 1, 2.0, 'Chương 2: Khảo nghiệm Tiên Môn', 980),
      (3, 1, 3.0, 'Chương 3: Nghịch thiên cải mệnh', 860),
      (4, 2, 1.0, 'Chương 1: Phế vật Tiêu Viêm', 2100),
      (5, 2, 2.0, 'Chương 2: Đấu Khí Đại Lục', 1840),
      (6, 3, 1.0, 'Chapter 1: Romance Dawn - Bình minh của cuộc phiêu lưu', 4500)
      ON DUPLICATE KEY UPDATE title = VALUES(title)
    `);
    console.log('✅ Đã nạp bảng Chapters');

    // 8. Comments
    await query(`
      INSERT INTO comments (id, user_id, story_id, chapter_id, content) VALUES
      (1, 3, 1, 1, 'Truyện Nhĩ Căn viết mở đầu bánh cuốn thực sự! Rất đáng đọc.'),
      (2, 3, 2, 4, 'Ba mươi năm Hà Đông, ba mươi năm Hà Tây, đừng khinh thiếu niên nghèo! Câu nói bất hủ.'),
      (3, 3, 3, 6, 'Luffy ngầu đét! Hóng các chap tiếp theo.')
      ON DUPLICATE KEY UPDATE content = VALUES(content)
    `);
    console.log('✅ Đã nạp bảng Comments');

    // 9. Follows & Likes
    await query(`
      INSERT INTO story_follows (user_id, story_id) VALUES
      (3, 1), (3, 2)
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
    `);
    await query(`
      INSERT INTO story_likes (user_id, story_id) VALUES
      (3, 1), (3, 2), (3, 3)
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
    `);
    console.log('✅ Đã nạp bảng Story_Follows & Story_Likes');

    console.log('\n🎉 HOÀN THÀNH NẠP DỮ LIỆU MẪU THÀNH CÔNG!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khi nạp dữ liệu mẫu:', err.message);
    process.exit(1);
  }
}

runSeed();
