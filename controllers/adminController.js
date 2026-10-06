const db = require('../common/db');

// 1. Thống kê tổng quan hệ thống cho Admin Dashboard
exports.getStats = (req, res) => {
  const stats = {};
  
  db.query('SELECT COUNT(*) AS total_stories, COALESCE(SUM(views), 0) AS total_views FROM stories', (err1, r1) => {
    if (err1) return res.status(500).json({ error: err1.message });
    stats.total_stories = r1[0].total_stories;
    stats.total_views = r1[0].total_views;

    db.query('SELECT COUNT(*) AS total_users FROM users', (err2, r2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      stats.total_users = r2[0].total_users;

      db.query('SELECT COUNT(*) AS total_comments FROM comments', (err3, r3) => {
        if (err3) return res.status(500).json({ error: err3.message });
        stats.total_comments = r3[0].total_comments;

        db.query('SELECT COUNT(*) AS total_chapters FROM chapters', (err4, r4) => {
          if (err4) return res.status(500).json({ error: err4.message });
          stats.total_chapters = r4[0].total_chapters;

          db.query("SELECT COUNT(*) AS pending_stories FROM stories WHERE approval_status = 'Chờ duyệt'", (err5, r5) => {
            stats.pending_stories = err5 ? 0 : r5[0].pending_stories;
            res.json(stats);
          });
        });
      });
    });
  });
};

// 2. Quản lý người dùng: Lấy danh sách kèm vai trò & trạng thái khóa (is_banned)
exports.getUsers = (req, res) => {
  const sql = `
    SELECT u.id, u.username, u.email, u.avatar_url, u.role_id, u.is_banned, u.created_at, r.name AS role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    ORDER BY u.id ASC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 3. Phân quyền người dùng (Thay đổi role_id)
exports.updateUserRole = (req, res) => {
  const { role_id } = req.body;
  const userId = req.params.id;

  if (!role_id) return res.status(400).json({ message: 'Thiếu role_id' });

  db.query('UPDATE users SET role_id = ? WHERE id = ?', [role_id, userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cập nhật phân quyền thành công' });
  });
};

// 3.1 Khóa / Mở khóa tài khoản (Ban/Unban)
exports.toggleBanUser = (req, res) => {
  const userId = req.params.id;
  if (parseInt(userId, 10) === req.user.id) {
    return res.status(400).json({ message: 'Không thể tự khóa tài khoản của chính mình!' });
  }

  db.query('SELECT is_banned, username FROM users WHERE id = ?', [userId], (err, rows) => {
    if (err || rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const newStatus = rows[0].is_banned ? 0 : 1;
    db.query('UPDATE users SET is_banned = ? WHERE id = ?', [newStatus, userId], (upErr) => {
      if (upErr) return res.status(500).json({ error: upErr.message });
      res.json({
        message: newStatus ? `Đã khóa tài khoản [${rows[0].username}] thành công` : `Đã mở khóa cho [${rows[0].username}]`,
        is_banned: newStatus
      });
    });
  });
};

// 4. Xóa tài khoản người dùng
exports.deleteUser = (req, res) => {
  const userId = req.params.id;
  if (parseInt(userId, 10) === req.user.id) {
    return res.status(400).json({ message: 'Không thể tự xóa tài khoản của chính mình' });
  }

  db.query('DELETE FROM users WHERE id = ?', [userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Đã xóa người dùng thành công' });
  });
};

// 5. Kiểm duyệt truyện: Lấy danh sách truyện cần duyệt
exports.getStoriesForModeration = (req, res) => {
  const sql = `
    SELECT s.id, s.title, s.slug, s.cover_image, s.status, s.approval_status, s.created_at,
           u.username AS uploader_name, a.name AS author_name,
           (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id) AS total_chapters
    FROM stories s
    LEFT JOIN users u ON s.uploader_id = u.id
    LEFT JOIN authors a ON s.author_id = a.id
    ORDER BY FIELD(s.approval_status, 'Chờ duyệt', 'Đã duyệt', 'Từ chối'), s.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 5.1 Cập nhật trạng thái duyệt truyện (Duyệt / Từ chối)
exports.updateStoryApproval = (req, res) => {
  const { approval_status } = req.body;
  const storyId = req.params.id;

  if (!approval_status) return res.status(400).json({ message: 'Thiếu trạng thái duyệt' });

  db.query('UPDATE stories SET approval_status = ? WHERE id = ?', [approval_status, storyId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `Đã cập nhật trạng thái truyện: ${approval_status}` });
  });
};

// 6. Kiểm duyệt bình luận: Lấy danh sách bình luận hệ thống
exports.getAllComments = (req, res) => {
  const sql = `
    SELECT c.id, c.content, c.created_at,
           u.username, u.email,
           s.title AS story_title, s.id AS story_id
    FROM comments c
    JOIN users u ON c.user_id = u.id
    JOIN stories s ON c.story_id = s.id
    ORDER BY c.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 6.1 Xóa bình luận vi phạm
exports.deleteComment = (req, res) => {
  const commentId = req.params.id;
  db.query('DELETE FROM comments WHERE id = ?', [commentId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Đã xóa bình luận thành công' });
  });
};

// 7. Thêm thể loại mới
exports.createCategory = (req, res) => {
  const { name, slug } = req.body;
  if (!name) return res.status(400).json({ message: 'Tên thể loại không được để trống' });
  const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  db.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [name.trim(), categorySlug], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, name, slug: categorySlug });
  });
};

// 8. Xóa thể loại
exports.deleteCategory = (req, res) => {
  db.query('DELETE FROM categories WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Đã xóa thể loại' });
  });
};

// 9. Thêm tác giả mới
exports.createAuthor = (req, res) => {
  const { name, slug } = req.body;
  if (!name) return res.status(400).json({ message: 'Tên tác giả không được để trống' });
  const authorSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  db.query('INSERT INTO authors (name, slug) VALUES (?, ?)', [name.trim(), authorSlug], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, name, slug: authorSlug });
  });
};

// 10. Xóa tác giả
exports.deleteAuthor = (req, res) => {
  db.query('DELETE FROM authors WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Đã xóa tác giả' });
  });
};
