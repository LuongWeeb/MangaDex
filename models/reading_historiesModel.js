const db = require('../common/db');

function getAll(callback) {
  db.query('SELECT * FROM `reading_histories`', (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

function getById(id, callback) {
  db.query('SELECT * FROM `reading_histories` WHERE `user_id` = ?', [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
}

function create(data, callback) {
  const sql = 'INSERT INTO `reading_histories` (`user_id`, `story_id`, `last_chapter_id`, `updated_at`) VALUES (?, ?, ?, ?)';
  db.query(sql, [data.user_id, data.story_id, data.last_chapter_id, data.updated_at], (err, result) => {
    if (err) return callback(err);
    callback(null, result.insertId);
  });
}

function update(id, data, callback) {
  const sql = 'UPDATE `reading_histories` SET `story_id` = ?, `last_chapter_id` = ?, `updated_at` = ? WHERE `user_id` = ?';
  db.query(sql, [data.story_id, data.last_chapter_id, data.updated_at, id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

function remove(id, callback) {
  db.query('DELETE FROM `reading_histories` WHERE `user_id` = ?', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

module.exports = { getAll, getById, create, update, remove };
