const db = require('../common/db');

const parseArrayField = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const getCoverPath = (file) => file ? `/uploads/covers/${file.filename}` : null;
const getChapterImagePaths = (files) => (files || []).map((file) => `/uploads/chapters/${file.filename}`);

// 1. Lấy danh sách truyện do Uploader đăng tải (hoặc tất cả nếu là Admin)
exports.getMyStories = (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role_name === 'Admin' || req.user.role_id === 1;

  let sql = `
    SELECT s.*, 
           a.name AS author_name,
           (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id) AS total_chapters,
           (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.id) AS total_likes,
           (SELECT COUNT(*) FROM story_follows sf WHERE sf.story_id = s.id) AS total_follows,
           (
             SELECT GROUP_CONCAT(cat.name SEPARATOR ', ')
             FROM story_categories sc
             JOIN categories cat ON sc.category_id = cat.id
             WHERE sc.story_id = s.id
           ) AS category_names
    FROM stories s
    LEFT JOIN authors a ON s.author_id = a.id
  `;

  const params = [];
  if (!isAdmin) {
    sql += ' WHERE s.uploader_id = ?';
    params.push(userId);
  }
  sql += ' ORDER BY s.updated_at DESC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 2. Khai báo tạo truyện mới (UP-MNG-01)
exports.createStory = (req, res) => {
  const userId = req.user.id;
  const { title, other_name, author_id, new_author_name, category_ids, cover_image, description, age_limit, status, origin_country } = req.body;
  const parsedCategoryIds = parseArrayField(category_ids);
  const originCountry = ['china', 'japan', 'korea', 'vietnam'].includes(origin_country) ? origin_country : null;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Tiêu đề truyện không được để trống' });
  }

  // Hàm tạo slug thân thiện
  const generateSlug = (str) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4);
  };

  const slug = generateSlug(title);

  const isAdmin = req.user.role_name === 'Admin' || req.user.role_id === 1;
  const approvalStatus = isAdmin ? 'Đã duyệt' : 'Chờ duyệt';

  // Xử lý tác giả nếu chọn nhập tác giả mới
  const proceedCreateStory = (finalAuthorId) => {
    const insertStorySql = `
      INSERT INTO stories (uploader_id, author_id, title, other_name, slug, cover_image, description, age_limit, status, origin_country, approval_status, views, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
    `;

    const uploadedCover = getCoverPath(req.file);
    const finalCover = uploadedCover || (cover_image && cover_image.trim() ? cover_image.trim() : '/images/covers/default-cover.svg');

    db.query(
      insertStorySql,
      [userId, finalAuthorId || null, title.trim(), other_name || null, slug, finalCover, description || '', age_limit || '0+', status || 'Đang ra', originCountry, approvalStatus],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const storyId = result.insertId;

        // Lưu danh mục liên kết vào story_categories
        if (parsedCategoryIds.length > 0) {
          const values = parsedCategoryIds.map(catId => [storyId, catId]);
          db.query('INSERT INTO story_categories (story_id, category_id) VALUES ?', [values], (scErr) => {
            if (scErr) console.error('Lỗi lưu story_categories:', scErr);
          });
        }

        res.status(201).json({
          message: isAdmin 
            ? 'Đã xuất bản truyện thành công!' 
            : 'Truyện đã gửi thành công và đang chờ Quản trị viên kiểm duyệt!',
          story_id: storyId,
          slug,
          approval_status: approvalStatus
        });
      }
    );
  };

  if (new_author_name && new_author_name.trim()) {
    const authorSlug = generateSlug(new_author_name);
    db.query('INSERT INTO authors (name, slug) VALUES (?, ?)', [new_author_name.trim(), authorSlug], (err, r) => {
      if (err) return proceedCreateStory(author_id || null);
      proceedCreateStory(r.insertId);
    });
  } else {
    proceedCreateStory(author_id || null);
  }
};

// 3. Đăng chương mới kèm hỗ trợ ảnh truyện tranh hoặc chữ (UP-MNG-02, UP-MNG-03)
exports.createChapter = (req, res) => {
  const { story_id, chapter_number, title, images } = req.body;
  const imageUrls = parseArrayField(images)
    .filter((url) => typeof url === 'string' && url.trim())
    .map((url) => url.trim());
  const chapterImages = [...imageUrls, ...getChapterImagePaths(req.files)];

  if (!story_id || chapter_number === undefined || chapter_number === '') {
    return res.status(400).json({ message: 'Vui lòng điền ID truyện và số thứ tự chương' });
  }

  const num = parseFloat(chapter_number);
  if (isNaN(num)) {
    return res.status(400).json({ message: 'Số thứ tự chương phải là số (VD: 1, 1.5, 2)' });
  }

  const insertChapSql = `
    INSERT INTO chapters (story_id, chapter_number, title, views, created_at)
    VALUES (?, ?, ?, 0, NOW())
  `;

  db.query(insertChapSql, [story_id, num, title || `Chương ${num}`], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const chapterId = result.insertId;

    // Cập nhật updated_at cho bộ truyện
    db.query('UPDATE stories SET updated_at = NOW() WHERE id = ?', [story_id]);

    // Nếu có danh sách link ảnh truyện tranh
    if (chapterImages.length > 0) {
      const validImages = chapterImages.map((url, idx) => [chapterId, url, idx + 1]);

      if (validImages.length > 0) {
        db.query(
          'INSERT INTO chapter_images (chapter_id, image_url, order_index) VALUES ?',
          [validImages],
          (imgErr) => {
            if (imgErr) console.error('Lỗi lưu chapter_images:', imgErr);
          }
        );
      }
    }

    res.status(201).json({
      message: 'Đăng chương mới thành công',
      chapter_id: chapterId,
      chapter_number: num
    });
  });
};

// 4. Xóa truyện (Uploader xóa truyện mình đăng hoặc Admin)
exports.deleteStory = (req, res) => {
  const storyId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role_name === 'Admin' || req.user.role_id === 1;

  let checkSql = 'SELECT id, uploader_id FROM stories WHERE id = ?';
  db.query(checkSql, [storyId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy truyện' });

    const story = results[0];
    if (!isAdmin && story.uploader_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa truyện của người khác' });
    }

    db.query('DELETE FROM stories WHERE id = ?', [storyId], (delErr) => {
      if (delErr) return res.status(500).json({ error: delErr.message });
      res.json({ message: 'Đã xóa bộ truyện thành công' });
    });
  });
};

// 5. Lấy chi tiết truyện để sửa (UP-MNG-04)
exports.getStoryById = (req, res) => {
  const storyId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role_name === 'Admin' || req.user.role_id === 1;

  const sql = `
    SELECT s.*, 
           a.name AS author_name,
           (
             SELECT GROUP_CONCAT(sc.category_id SEPARATOR ',')
             FROM story_categories sc
             WHERE sc.story_id = s.id
           ) AS category_ids
    FROM stories s
    LEFT JOIN authors a ON s.author_id = a.id
    WHERE s.id = ?
  `;

  db.query(sql, [storyId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy bộ truyện' });

    const story = results[0];
    if (!isAdmin && story.uploader_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bộ truyện này' });
    }

    res.json(story);
  });
};

// 6. Cập nhật thông tin truyện (UP-MNG-04)
exports.updateStory = (req, res) => {
  const storyId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role_name === 'Admin' || req.user.role_id === 1;
  const { title, other_name, author_id, new_author_name, category_ids, cover_image, description, age_limit, status, origin_country } = req.body;
  const parsedCategoryIds = parseArrayField(category_ids);
  const originCountry = ['china', 'japan', 'korea', 'vietnam'].includes(origin_country) ? origin_country : null;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Tiêu đề truyện không được để trống' });
  }

  // Kiểm tra quyền sở hữu
  db.query('SELECT id, uploader_id FROM stories WHERE id = ?', [storyId], (checkErr, results) => {
    if (checkErr) return res.status(500).json({ error: checkErr.message });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy bộ truyện' });

    const story = results[0];
    if (!isAdmin && story.uploader_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa truyện của người khác' });
    }

    const proceedUpdate = (finalAuthorId) => {
      const updateSql = `
        UPDATE stories 
        SET title = ?, other_name = ?, author_id = ?, cover_image = ?, description = ?, age_limit = ?, status = ?, origin_country = ?, updated_at = NOW()
        WHERE id = ?
      `;

      const uploadedCover = getCoverPath(req.file);
      const finalCover = uploadedCover || (cover_image && cover_image.trim() ? cover_image.trim() : '/images/covers/default-cover.svg');

      db.query(
        updateSql,
        [title.trim(), other_name || null, finalAuthorId || null, finalCover, description || '', age_limit || '0+', status || 'Đang ra', originCountry, storyId],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });

          // Cập nhật thể loại: xóa cũ, thêm mới
          if (category_ids !== undefined) {
            db.query('DELETE FROM story_categories WHERE story_id = ?', [storyId], (delErr) => {
              if (parsedCategoryIds.length > 0) {
                const values = parsedCategoryIds.map(catId => [storyId, catId]);
                db.query('INSERT INTO story_categories (story_id, category_id) VALUES ?', [values], (insErr) => {
                  if (insErr) console.error('Lỗi cập nhật story_categories:', insErr);
                });
              }
            });
          }

          res.json({ message: 'Đã cập nhật thông tin truyện thành công!' });
        }
      );
    };

    if (new_author_name && new_author_name.trim()) {
      const generateSlug = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
      db.query('INSERT INTO authors (name, slug) VALUES (?, ?)', [new_author_name.trim(), generateSlug(new_author_name)], (aErr, aRes) => {
        if (aErr) return proceedUpdate(author_id || null);
        proceedUpdate(aRes.insertId);
      });
    } else {
      proceedUpdate(author_id || null);
    }
  });
};

// 7. Lấy danh sách chương của một bộ truyện để quản lý (UP-MNG-05)
exports.getStoryChapters = (req, res) => {
  const storyId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role_name === 'Admin' || req.user.role_id === 1;

  // Kiểm tra quyền
  db.query('SELECT id, title, uploader_id FROM stories WHERE id = ?', [storyId], (checkErr, results) => {
    if (checkErr) return res.status(500).json({ error: checkErr.message });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy bộ truyện' });

    const story = results[0];
    if (!isAdmin && story.uploader_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền quản lý chương của truyện này' });
    }

    const chapSql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM chapter_images ci WHERE ci.chapter_id = c.id) AS image_count
      FROM chapters c
      WHERE c.story_id = ?
      ORDER BY c.chapter_number ASC
    `;

    db.query(chapSql, [storyId], (err, chapters) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ story, chapters });
    });
  });
};

// 8. Lấy chi tiết một chương truyện để sửa (kèm danh sách ảnh hoặc nội dung chữ)
exports.getChapterDetail = (req, res) => {
  const chapterId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role_name === 'Admin' || req.user.role_id === 1;

  const sql = `
    SELECT c.*, s.uploader_id, s.title AS story_title
    FROM chapters c
    JOIN stories s ON c.story_id = s.id
    WHERE c.id = ?
  `;

  db.query(sql, [chapterId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy chương' });

    const chapter = results[0];
    if (!isAdmin && chapter.uploader_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa chương này' });
    }

    // Lấy danh sách ảnh nếu có
    db.query('SELECT image_url, order_index FROM chapter_images WHERE chapter_id = ? ORDER BY order_index ASC', [chapterId], (imgErr, images) => {
      chapter.images = images || [];
      res.json(chapter);
    });
  });
};

// 9. Cập nhật nội dung chương truyện (sửa số chapter, tiêu đề, danh sách link ảnh)
exports.updateChapter = (req, res) => {
  const chapterId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role_name === 'Admin' || req.user.role_id === 1;
  const { chapter_number, title, images } = req.body;
  const imageUrls = Array.isArray(images) ? images : parseArrayField(images);
  const uploadedImages = getChapterImagePaths(req.files);

  if (chapter_number === undefined || chapter_number === '') {
    return res.status(400).json({ message: 'Số thứ tự chương không được để trống' });
  }

  const num = parseFloat(chapter_number);
  if (isNaN(num)) {
    return res.status(400).json({ message: 'Số thứ tự chương phải là số (VD: 1, 2, 2.5)' });
  }

  // Kiểm tra quyền
  const sql = `
    SELECT c.id, c.story_id, s.uploader_id
    FROM chapters c
    JOIN stories s ON c.story_id = s.id
    WHERE c.id = ?
  `;

  db.query(sql, [chapterId], (checkErr, results) => {
    if (checkErr) return res.status(500).json({ error: checkErr.message });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy chương' });

    const chap = results[0];
    if (!isAdmin && chap.uploader_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa chương này' });
    }

    const updateSql = 'UPDATE chapters SET chapter_number = ?, title = ? WHERE id = ?';
    db.query(updateSql, [num, title || `Chương ${num}`, chapterId], (upErr) => {
      if (upErr) return res.status(500).json({ error: upErr.message });

      // Thay danh sách ảnh bằng link giữ lại/thêm mới và các file vừa tải lên.
      if (images !== undefined || uploadedImages.length > 0) {
        db.query('DELETE FROM chapter_images WHERE chapter_id = ?', [chapterId], (delErr) => {
          if (delErr) return console.error('Lỗi xóa ảnh chương cũ:', delErr);
          const validImages = [...imageUrls, ...uploadedImages]
            .map((url, idx) => [chapterId, url.trim(), idx + 1])
            .filter(item => item[1].length > 0);

          if (validImages.length > 0) {
            db.query('INSERT INTO chapter_images (chapter_id, image_url, order_index) VALUES ?', [validImages], (insErr) => {
              if (insErr) console.error('Lỗi cập nhật ảnh chương:', insErr);
            });
          }
        });
      }

      // Cập nhật updated_at cho bộ truyện
      db.query('UPDATE stories SET updated_at = NOW() WHERE id = ?', [chap.story_id]);

      res.json({ message: 'Đã cập nhật chương thành công!' });
    });
  });
};

// 10. Xóa một chương truyện
exports.deleteChapter = (req, res) => {
  const chapterId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role_name === 'Admin' || req.user.role_id === 1;

  const sql = `
    SELECT c.id, c.story_id, s.uploader_id
    FROM chapters c
    JOIN stories s ON c.story_id = s.id
    WHERE c.id = ?
  `;

  db.query(sql, [chapterId], (checkErr, results) => {
    if (checkErr) return res.status(500).json({ error: checkErr.message });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy chương' });

    const chap = results[0];
    if (!isAdmin && chap.uploader_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa chương này' });
    }

    db.query('DELETE FROM chapters WHERE id = ?', [chapterId], (delErr) => {
      if (delErr) return res.status(500).json({ error: delErr.message });

      // Cập nhật updated_at cho bộ truyện
      db.query('UPDATE stories SET updated_at = NOW() WHERE id = ?', [chap.story_id]);

      res.json({ message: 'Đã xóa chương thành công' });
    });
  });
};
