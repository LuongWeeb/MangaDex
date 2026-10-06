const db = require('../common/db');
const bcrypt = require('bcryptjs');

const validGenders = new Set(['male', 'female', 'other', '']);

function validAvatarUrl(value) {
  return !value || /^(https:\/\/[^\s]{1,480}|\/[^\s]{1,480})$/i.test(value);
}

exports.updateProfile = (req, res) => {
  const fullName = typeof req.body.full_name === 'string' ? req.body.full_name.trim().slice(0, 100) : '';
  const avatarUrl = typeof req.body.avatar_url === 'string' ? req.body.avatar_url.trim().slice(0, 500) : '';
  const gender = typeof req.body.gender === 'string' ? req.body.gender : '';

  if (!validGenders.has(gender)) {
    return res.status(400).json({ message: 'Giới tính không hợp lệ' });
  }
  if (!validAvatarUrl(avatarUrl)) {
    return res.status(400).json({ message: 'URL ảnh đại diện không hợp lệ' });
  }

  db.query(
    'UPDATE users SET full_name = ?, avatar_url = ?, gender = ? WHERE id = ?',
    [fullName || null, avatarUrl || '/images/avatars/default.svg', gender || null, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
      db.query(
        `SELECT u.id, u.username, u.email, u.avatar_url, u.full_name, u.gender, u.role_id, u.created_at,
                r.name AS role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
        [req.user.id],
        (selectErr, users) => {
          if (selectErr) return res.status(500).json({ error: selectErr.message });
          res.json({ message: 'Đã lưu thông tin hồ sơ', user: users[0] });
        }
      );
    }
  );
};

exports.uploadAvatar = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn một ảnh hợp lệ' });
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Đã tải ảnh đại diện', avatar_url: avatarUrl });
  });
};

exports.changePassword = (req, res) => {
  const { current_password: currentPassword, new_password: newPassword } = req.body;
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu mới cần có ít nhất 6 ký tự' });
  }

  db.query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [req.user.id], (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!users.length) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    bcrypt.compare(currentPassword, users[0].password_hash, (compareErr, isMatch) => {
      if (compareErr) return res.status(500).json({ error: compareErr.message });
      if (!isMatch) return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
      bcrypt.hash(newPassword, 10, (hashErr, passwordHash) => {
        if (hashErr) return res.status(500).json({ error: hashErr.message });
        db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.id], (updateErr) => {
          if (updateErr) return res.status(500).json({ error: updateErr.message });
          res.json({ message: 'Đổi mật khẩu thành công' });
        });
      });
    });
  });
};

// 1. Lấy danh sách truyện đang theo dõi của người dùng hiện tại
exports.getFollows = (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT s.id, s.title, s.slug, s.cover_image, s.status, s.views,
           a.name AS author_name,
           sf.created_at AS followed_at,
           (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id) AS total_chapters,
           (SELECT chapter_number FROM chapters c WHERE c.story_id = s.id ORDER BY chapter_number DESC LIMIT 1) AS latest_chapter
    FROM story_follows sf
    JOIN stories s ON sf.story_id = s.id
    LEFT JOIN authors a ON s.author_id = a.id
    WHERE sf.user_id = ?
    ORDER BY sf.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 2. Kiểm tra xem người dùng đã theo dõi truyện này chưa
exports.checkFollow = (req, res) => {
  const userId = req.user.id;
  const storyId = req.params.storyId;

  db.query(
    'SELECT 1 FROM story_follows WHERE user_id = ? AND story_id = ? LIMIT 1',
    [userId, storyId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ followed: results.length > 0 });
    }
  );
};

// 3. Toggle Theo dõi truyện (Nếu theo dõi rồi thì hủy, chưa thì thêm)
exports.toggleFollow = (req, res) => {
  const userId = req.user.id;
  const storyId = req.params.storyId;

  db.query(
    'SELECT 1 FROM story_follows WHERE user_id = ? AND story_id = ? LIMIT 1',
    [userId, storyId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.length > 0) {
        // Đã theo dõi -> Xóa
        db.query(
          'DELETE FROM story_follows WHERE user_id = ? AND story_id = ?',
          [userId, storyId],
          (delErr) => {
            if (delErr) return res.status(500).json({ error: delErr.message });
            getFollowCount(storyId, (count) => {
              res.json({ followed: false, followCount: count, message: 'Đã hủy theo dõi truyện' });
            });
          }
        );
      } else {
        // Chưa theo dõi -> Thêm
        db.query(
          'INSERT INTO story_follows (user_id, story_id) VALUES (?, ?)',
          [userId, storyId],
          (insErr) => {
            if (insErr) return res.status(500).json({ error: insErr.message });
            getFollowCount(storyId, (count) => {
              res.json({ followed: true, followCount: count, message: 'Đã lưu truyện vào Tủ truyện' });
            });
          }
        );
      }
    }
  );
};

// 4. Kiểm tra xem người dùng đã thích truyện này chưa
exports.checkLike = (req, res) => {
  const userId = req.user.id;
  const storyId = req.params.storyId;

  db.query(
    'SELECT 1 FROM story_likes WHERE user_id = ? AND story_id = ? LIMIT 1',
    [userId, storyId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ liked: results.length > 0 });
    }
  );
};

// Danh sách truyện người dùng đã yêu thích, dùng cho trang Hồ sơ trên mobile.
exports.getLikes = (req, res) => {
  const sql = `
    SELECT s.id, s.title, s.slug, s.cover_image, s.status, s.views,
           a.name AS author_name, sl.created_at AS liked_at,
           (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id) AS total_chapters,
           (SELECT chapter_number FROM chapters c WHERE c.story_id = s.id ORDER BY chapter_number DESC LIMIT 1) AS latest_chapter
    FROM story_likes sl
    JOIN stories s ON sl.story_id = s.id
    LEFT JOIN authors a ON s.author_id = a.id
    WHERE sl.user_id = ?
    ORDER BY sl.created_at DESC
  `;
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 5. Toggle Thích truyện (Like / Unlike)
exports.toggleLike = (req, res) => {
  const userId = req.user.id;
  const storyId = req.params.storyId;

  db.query(
    'SELECT 1 FROM story_likes WHERE user_id = ? AND story_id = ? LIMIT 1',
    [userId, storyId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.length > 0) {
        // Đã thích -> Bỏ thích
        db.query(
          'DELETE FROM story_likes WHERE user_id = ? AND story_id = ?',
          [userId, storyId],
          (delErr) => {
            if (delErr) return res.status(500).json({ error: delErr.message });
            getLikeCount(storyId, (count) => {
              res.json({ liked: false, likeCount: count, message: 'Đã bỏ thích truyện' });
            });
          }
        );
      } else {
        // Chưa thích -> Thêm thích
        db.query(
          'INSERT INTO story_likes (user_id, story_id) VALUES (?, ?)',
          [userId, storyId],
          (insErr) => {
            if (insErr) return res.status(500).json({ error: insErr.message });
            getLikeCount(storyId, (count) => {
              res.json({ liked: true, likeCount: count, message: 'Đã thích truyện' });
            });
          }
        );
      }
    }
  );
};

// 6. Lấy Lịch sử đọc của người dùng
exports.getReadingHistory = (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT rh.updated_at,
           s.id AS story_id, s.title AS story_title, s.slug AS story_slug, s.cover_image,
           c.id AS chapter_id, c.chapter_number, c.title AS chapter_title,
           (SELECT COUNT(*) FROM chapters total_chapters WHERE total_chapters.story_id = s.id) AS total_chapters
    FROM reading_histories rh
    JOIN stories s ON rh.story_id = s.id
    JOIN chapters c ON rh.last_chapter_id = c.id
    WHERE rh.user_id = ?
    ORDER BY rh.updated_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 7. Cập nhật Lịch sử đọc (Khi độc giả bấm vào một chương)
exports.saveReadingHistory = (req, res) => {
  const userId = req.user.id;
  const { storyId, chapterId } = req.body;

  if (!storyId || !chapterId) {
    return res.status(400).json({ message: 'Thiếu storyId hoặc chapterId' });
  }

  const sql = `
    INSERT INTO reading_histories (user_id, story_id, last_chapter_id, updated_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE last_chapter_id = VALUES(last_chapter_id), updated_at = NOW()
  `;

  db.query(sql, [userId, storyId, chapterId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Đã cập nhật tiến độ đọc' });
  });
};

// Helper tính tổng số like của truyện
function getLikeCount(storyId, callback) {
  db.query('SELECT COUNT(*) AS total FROM story_likes WHERE story_id = ?', [storyId], (err, res) => {
    callback(err ? 0 : res[0].total);
  });
}

// Helper tính tổng số follow của truyện
function getFollowCount(storyId, callback) {
  db.query('SELECT COUNT(*) AS total FROM story_follows WHERE story_id = ?', [storyId], (err, res) => {
    callback(err ? 0 : res[0].total);
  });
}
