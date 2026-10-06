const db = require('../common/db');

function getAll(callback) {
  const sql = `
    SELECT c.*, COUNT(DISTINCT sc.story_id) AS story_count
    FROM categories c
    LEFT JOIN story_categories sc ON sc.category_id = c.id
    GROUP BY c.id, c.name, c.slug
    ORDER BY c.name ASC
  `;
  db.query(sql, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

function getById(id, callback) {
  db.query('SELECT * FROM `categories` WHERE `id` = ?', [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
}

function create(data, callback) {
  const sql = 'INSERT INTO `categories` (`name`, `slug`) VALUES (?, ?)';
  db.query(sql, [data.name, data.slug], (err, result) => {
    if (err) return callback(err);
    callback(null, result.insertId);
  });
}

function update(id, data, callback) {
  const sql = 'UPDATE `categories` SET `name` = ?, `slug` = ? WHERE `id` = ?';
  db.query(sql, [data.name, data.slug, id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

function remove(id, callback) {
  db.query('DELETE FROM `categories` WHERE `id` = ?', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows);
  });
}

module.exports = { getAll, getById, create, update, remove };
