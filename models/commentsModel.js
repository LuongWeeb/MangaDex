const db = require('../common/db');

function getAll(callback) {
  db.query('SELECT * FROM `comments` ORDER BY `created_at` DESC', (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

function getById(id, callback) {
  db.query('SELECT * FROM `comments` WHERE `id` = ?', [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
}

function getByStoryId(storyId, callback) {
  const sql = `
    SELECT c.id, c.user_id, c.story_id, c.chapter_id, c.content, c.created_at,
           u.username, u.avatar_url,
           ch.chapter_number
    FROM comments c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN chapters ch ON c.chapter_id = ch.id
    WHERE c.story_id = ?
    ORDER BY c.created_at DESC
  `;
  db.query(sql, [storyId], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

function create(data, callback) {
  const sql = 'INSERT INTO `comments` (`user_id`, `story_id`, `chapter_id`, `content`, `created_at`) VALUES (?, ?, ?, ?, NOW())';
  db.query(sql, [data.user_id, data.story_id, data.chapter_id || null, data.content], (err, result) => {
    if (err) return callback(err);
    callback(null, result.insertId);
  });
}

function update(id, data, callback) {
  const sql = 'UPDATE `comments` SET `content` = ? WHERE `id` = ?';
  db.query(sql, [data.content, id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

function remove(id, callback) {
  db.query('DELETE FROM `comments` WHERE `id` = ?', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

module.exports = { getAll, getById, getByStoryId, create, update, remove };
