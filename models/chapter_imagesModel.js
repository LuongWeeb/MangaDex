const db = require('../common/db');

function getAll(callback) {
  db.query('SELECT * FROM `chapter_images` ORDER BY `chapter_id` ASC, `order_index` ASC', (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

function getById(id, callback) {
  db.query('SELECT * FROM `chapter_images` WHERE `id` = ?', [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
}

function getByChapterId(chapterId, callback) {
  const sql = 'SELECT * FROM `chapter_images` WHERE `chapter_id` = ? ORDER BY `order_index` ASC';
  db.query(sql, [chapterId], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

function create(data, callback) {
  const sql = 'INSERT INTO `chapter_images` (`chapter_id`, `image_url`, `order_index`) VALUES (?, ?, ?)';
  db.query(sql, [data.chapter_id, data.image_url, data.order_index || 1], (err, result) => {
    if (err) return callback(err);
    callback(null, result.insertId);
  });
}

function update(id, data, callback) {
  const sql = 'UPDATE `chapter_images` SET `chapter_id` = ?, `image_url` = ?, `order_index` = ? WHERE `id` = ?';
  db.query(sql, [data.chapter_id, data.image_url, data.order_index, id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

function remove(id, callback) {
  db.query('DELETE FROM `chapter_images` WHERE `id` = ?', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

module.exports = { getAll, getById, getByChapterId, create, update, remove };
