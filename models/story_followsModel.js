const db = require('../common/db');

function getAll(callback) {
  db.query('SELECT * FROM `story_follows`', (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

function getById(id, callback) {
  db.query('SELECT * FROM `story_follows` WHERE `user_id` = ?', [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
}

function create(data, callback) {
  const sql = 'INSERT INTO `story_follows` (`user_id`, `story_id`, `created_at`) VALUES (?, ?, ?)';
  db.query(sql, [data.user_id, data.story_id, data.created_at], (err, result) => {
    if (err) return callback(err);
    callback(null, result.insertId);
  });
}

function update(id, data, callback) {
  const sql = 'UPDATE `story_follows` SET `story_id` = ?, `created_at` = ? WHERE `user_id` = ?';
  db.query(sql, [data.story_id, data.created_at, id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

function remove(id, callback) {
  db.query('DELETE FROM `story_follows` WHERE `user_id` = ?', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

module.exports = { getAll, getById, create, update, remove };
