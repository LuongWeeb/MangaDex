const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentsController');
const { optionalAuth, verifyToken } = require('../middlewares/authMiddleware');
const { commentLimiter } = require('../middlewares/rateLimitMiddleware');

router.get('/story/:storyId', commentsController.getByStoryId);
router.get('/', commentsController.getAll);
router.get('/:id', commentsController.getById);
router.post('/', commentLimiter, optionalAuth, commentsController.create);
router.put('/:id', verifyToken, commentsController.update);
router.delete('/:id', verifyToken, commentsController.remove);

module.exports = router;
