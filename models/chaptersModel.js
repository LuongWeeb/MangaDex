const db = require('../common/db');

function getAll(callback) {
  db.query('SELECT * FROM `chapters`', (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

function getById(id, callback) {
  db.query('SELECT * FROM `chapters` WHERE `id` = ?', [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
}

function getByStoryId(storyId, callback) {
  db.query('SELECT * FROM `chapters` WHERE `story_id` = ? ORDER BY `chapter_number` ASC', [storyId], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

function incrementViews(id, callback) {
  db.query('UPDATE `chapters` SET `views` = `views` + 1 WHERE `id` = ?', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

function create(data, callback) {
  const sql = 'INSERT INTO `chapters` (`story_id`, `chapter_number`, `title`, `views`, `created_at`) VALUES (?, ?, ?, ?, NOW())';
  db.query(sql, [data.story_id, data.chapter_number, data.title, data.views || 0], (err, result) => {
    if (err) return callback(err);
    callback(null, result.insertId);
  });
}

function update(id, data, callback) {
  const sql = 'UPDATE `chapters` SET `story_id` = ?, `chapter_number` = ?, `title` = ?, `views` = ? WHERE `id` = ?';
  db.query(sql, [data.story_id, data.chapter_number, data.title, data.views, id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

function remove(id, callback) {
  db.query('DELETE FROM `chapters` WHERE `id` = ?', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

module.exports = { getAll, getById, getByStoryId, incrementViews, create, update, remove };
