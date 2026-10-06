const db = require('../common/db');

function getAll(options, callback) {
  const {
    page, limit, sort, status, categorySlug, search, country = 'all',
    minChapters = 0, includeCategories = [], excludeCategories = []
  } = options;
  const filters = ["s.approval_status = 'Đã duyệt'"];
  const filterParams = [];

  if (status === 'ongoing') {
    filters.push("s.status = 'Đang ra'");
  } else if (status === 'completed') {
    filters.push("s.status = 'Hoàn thành'");
  }

  if (search) {
    filters.push('(s.title LIKE ? OR s.other_name LIKE ?)');
    const searchTerm = `%${search}%`;
    filterParams.push(searchTerm, searchTerm);
  }

  if (country !== 'all') {
    filters.push('s.origin_country = ?');
    filterParams.push(country);
  }

  if (minChapters > 0) {
    filters.push(`
      EXISTS (
        SELECT 1 FROM chapters chapter_filter
        WHERE chapter_filter.story_id = s.id
        GROUP BY chapter_filter.story_id
        HAVING COUNT(chapter_filter.id) >= ?
      )
    `);
    filterParams.push(minChapters);
  }

  if (includeCategories.length > 0) {
    filters.push(`
      (SELECT COUNT(DISTINCT include_category.slug)
       FROM story_categories include_sc
       JOIN categories include_category ON include_category.id = include_sc.category_id
       WHERE include_sc.story_id = s.id AND include_category.slug IN (?)) = ?
    `);
    filterParams.push(includeCategories, includeCategories.length);
  }

  if (excludeCategories.length > 0) {
    filters.push(`
      NOT EXISTS (
        SELECT 1 FROM story_categories exclude_sc
        JOIN categories exclude_category ON exclude_category.id = exclude_sc.category_id
        WHERE exclude_sc.story_id = s.id AND exclude_category.slug IN (?)
      )
    `);
    filterParams.push(excludeCategories);
  }

  if (categorySlug) {
    filters.push(`
      EXISTS (
        SELECT 1
        FROM story_categories category_filter
        JOIN categories category ON category.id = category_filter.category_id
        WHERE category_filter.story_id = s.id AND category.slug = ?
      )
    `);
    filterParams.push(categorySlug);
  }

  const whereClause = `WHERE ${filters.join(' AND ')}`;
  const sortClauses = {
    latest: 's.updated_at DESC, s.id DESC',
    views: 's.views DESC, s.updated_at DESC, s.id DESC',
    likes: 'total_likes DESC, s.updated_at DESC, s.id DESC',
    follows: 'total_follows DESC, s.updated_at DESC, s.id DESC',
    name: 's.title ASC, s.id ASC'
  };
  const offset = (page - 1) * limit;

  const countSql = `SELECT COUNT(*) AS total FROM stories s ${whereClause}`;
  const sql = `
    SELECT s.*, 
           a.name AS author_name,
           (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id) AS total_chapters,
           (SELECT chapter_number FROM chapters c WHERE c.story_id = s.id ORDER BY chapter_number DESC LIMIT 1) AS latest_chapter,
           (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.id) AS total_likes,
           (SELECT COUNT(*) FROM story_follows sf WHERE sf.story_id = s.id) AS total_follows,
           (
             SELECT GROUP_CONCAT(cat.name SEPARATOR ', ')
             FROM story_categories sc
             JOIN categories cat ON sc.category_id = cat.id
             WHERE sc.story_id = s.id
           ) AS category_names,
           (
             SELECT GROUP_CONCAT(sc.category_id SEPARATOR ',')
             FROM story_categories sc
             WHERE sc.story_id = s.id
           ) AS category_ids
    FROM stories s
    LEFT JOIN authors a ON s.author_id = a.id
    ${whereClause}
    ORDER BY ${sortClauses[sort] || sortClauses.latest}
    LIMIT ? OFFSET ?
  `;

  db.query(countSql, filterParams, (countError, countResults) => {
    if (countError) return callback(countError);

    db.query(sql, [...filterParams, limit, offset], (error, results) => {
      if (error) return callback(error);

      const total = Number(countResults[0].total);
      callback(null, {
        data: results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    });
  });
}

function getById(id, callback) {
  const sql = `
    SELECT s.*, 
           a.name AS author_name,
           (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id) AS total_chapters,
           (SELECT chapter_number FROM chapters c WHERE c.story_id = s.id ORDER BY chapter_number DESC LIMIT 1) AS latest_chapter,
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
    WHERE s.id = ?
  `;
  db.query(sql, [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
}

function getBySlug(slug, callback) {
  const sql = `
    SELECT s.*, 
           a.name AS author_name,
           (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id) AS total_chapters,
           (SELECT chapter_number FROM chapters c WHERE c.story_id = s.id ORDER BY chapter_number DESC LIMIT 1) AS latest_chapter,
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
    WHERE s.slug = ? AND s.approval_status = 'Đã duyệt'
  `;
  db.query(sql, [slug], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
}

function incrementViews(id, callback) {
  db.query('UPDATE stories SET views = views + 1 WHERE id = ?', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

function create(data, callback) {
  const sql = 'INSERT INTO `stories` (`uploader_id`, `author_id`, `title`, `other_name`, `slug`, `cover_image`, `description`, `age_limit`, `status`, `approval_status`, `views`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
  db.query(sql, [data.uploader_id, data.author_id, data.title, data.other_name, data.slug, data.cover_image, data.description, data.age_limit || '0+', data.status || 'Đang ra', data.approval_status || 'Chờ duyệt', data.views || 0], (err, result) => {
    if (err) return callback(err);
    callback(null, result.insertId);
  });
}

function update(id, data, callback) {
  const sql = 'UPDATE `stories` SET `uploader_id` = ?, `author_id` = ?, `title` = ?, `other_name` = ?, `slug` = ?, `cover_image` = ?, `description` = ?, `age_limit` = ?, `status` = ?, `approval_status` = ?, `views` = ?, `updated_at` = NOW() WHERE `id` = ?';
  db.query(sql, [data.uploader_id, data.author_id, data.title, data.other_name, data.slug, data.cover_image, data.description, data.age_limit, data.status, data.approval_status || 'Đã duyệt', data.views, id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

function remove(id, callback) {
  db.query('DELETE FROM `stories` WHERE `id` = ?', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

module.exports = { getAll, getById, getBySlug, incrementViews, create, update, remove };
