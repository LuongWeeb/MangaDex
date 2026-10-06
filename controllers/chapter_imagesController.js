const chapter_imagesModel = require('../models/chapter_imagesModel');

exports.getAll = (req, res) => {
  const chapterId = req.query.chapter_id || req.params.chapterId;
  if (chapterId) {
    return chapter_imagesModel.getByChapterId(chapterId, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  }
  chapter_imagesModel.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getByChapterId = (req, res) => {
  chapter_imagesModel.getByChapterId(req.params.chapterId, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  chapter_imagesModel.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json(result);
  });
};

exports.create = (req, res) => {
  chapter_imagesModel.create(req.body, (err, insertId) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: insertId });
  });
};

exports.update = (req, res) => {
  chapter_imagesModel.update(req.params.id, req.body, (err, affectedRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated' });
  });
};

exports.remove = (req, res) => {
  chapter_imagesModel.remove(req.params.id, (err, affectedRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  });
};
