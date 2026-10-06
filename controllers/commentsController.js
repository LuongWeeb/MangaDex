const commentsModel = require('../models/commentsModel');
const { sanitizeCommentContent } = require('../common/commentSanitizer');

exports.getAll = (req, res) => {
  commentsModel.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  commentsModel.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json(result);
  });
};

exports.getByStoryId = (req, res) => {
  commentsModel.getByStoryId(req.params.storyId, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.create = (req, res) => {
  const userId = req.user ? req.user.id : req.body.user_id;
  const { story_id, chapter_id } = req.body;
  const content = sanitizeCommentContent(req.body.content);

  if (!userId) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập để bình luận' });
  }

  if (!content) {
    return res.status(400).json({ message: 'Nội dung bình luận không được để trống' });
  }

  if (!story_id) {
    return res.status(400).json({ message: 'Thiếu ID truyện' });
  }

  const commentData = {
    user_id: userId,
    story_id,
    chapter_id: chapter_id || null,
    content
  };

  commentsModel.create(commentData, (err, insertId) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      message: 'Bình luận thành công',
      id: insertId,
      comment: {
        id: insertId,
        user_id: userId,
        story_id,
        chapter_id: chapter_id || null,
        content,
        username: req.user ? req.user.username : 'User',
        avatar_url: req.user ? req.user.avatar_url : '/images/avatars/default.svg',
        created_at: new Date().toISOString()
      }
    });
  });
};

exports.update = (req, res) => {
  const content = sanitizeCommentContent(req.body.content);
  if (!content) {
    return res.status(400).json({ message: 'Nội dung bình luận không được để trống' });
  }

  commentsModel.update(req.params.id, { ...req.body, content }, (err, affectedRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated' });
  });
};

exports.remove = (req, res) => {
  commentsModel.remove(req.params.id, (err, affectedRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  });
};
