const db = require('../common/db');

function getAll(callback) {
  db.query('SELECT * FROM `roles`', (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

function getById(id, callback) {
  db.query('SELECT * FROM `roles` WHERE `id` = ?', [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
}

function create(data, callback) {
  const sql = 'INSERT INTO `roles` (`name`) VALUES (?)';
  db.query(sql, [data.name], (err, result) => {
    if (err) return callback(err);
    callback(null, result.insertId);
  });
}

function update(id, data, callback) {
  const sql = 'UPDATE `roles` SET `name` = ? WHERE `id` = ?';
  db.query(sql, [data.name, id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

function remove(id, callback) {
  db.query('DELETE FROM `roles` WHERE `id` = ?', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

module.exports = { getAll, getById, create, update, remove };
