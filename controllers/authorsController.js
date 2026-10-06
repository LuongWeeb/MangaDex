const authorsModel = require('../models/authorsModel');

exports.getAll = (req, res) => {
  authorsModel.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  authorsModel.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json(result);
  });
};

exports.create = (req, res) => {
  authorsModel.create(req.body, (err, insertId) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: insertId });
  });
};

exports.update = (req, res) => {
  authorsModel.update(req.params.id, req.body, (err, affectedRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated' });
  });
};

exports.remove = (req, res) => {
  authorsModel.remove(req.params.id, (err, affectedRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  });
};
