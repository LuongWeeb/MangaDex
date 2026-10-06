const db = require('../common/db');

function getAll(callback) {
  db.query('SELECT * FROM `users`', (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

function getById(id, callback) {
  db.query('SELECT * FROM `users` WHERE `id` = ?', [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
}

function create(data, callback) {
  const sql = 'INSERT INTO `users` (`role_id`, `username`, `email`, `password_hash`, `avatar_url`, `created_at`) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [data.role_id, data.username, data.email, data.password_hash, data.avatar_url, data.created_at], (err, result) => {
    if (err) return callback(err);
    callback(null, result.insertId);
  });
}

function update(id, data, callback) {
  const sql = 'UPDATE `users` SET `role_id` = ?, `username` = ?, `email` = ?, `password_hash` = ?, `avatar_url` = ?, `created_at` = ? WHERE `id` = ?';
  db.query(sql, [data.role_id, data.username, data.email, data.password_hash, data.avatar_url, data.created_at, id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

function remove(id, callback) {
  db.query('DELETE FROM `users` WHERE `id` = ?', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

module.exports = { getAll, getById, create, update, remove };
