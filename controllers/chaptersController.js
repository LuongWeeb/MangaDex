const chaptersModel = require('../models/chaptersModel');

exports.getAll = (req, res) => {
  if (req.query.story_id) {
    return chaptersModel.getByStoryId(req.query.story_id, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  }
  chaptersModel.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  chaptersModel.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json(result);
  });
};

exports.incrementViews = (req, res) => {
  chaptersModel.incrementViews(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Chapter views updated' });
  });
};

exports.create = (req, res) => {
  chaptersModel.create(req.body, (err, insertId) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: insertId });
  });
};

exports.update = (req, res) => {
  chaptersModel.update(req.params.id, req.body, (err, affectedRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated' });
  });
};

exports.remove = (req, res) => {
  chaptersModel.remove(req.params.id, (err, affectedRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  });
};
