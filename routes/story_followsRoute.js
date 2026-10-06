const express = require('express');
const router = express.Router();
const story_followsController = require('../controllers/story_followsController');

router.get('/', story_followsController.getAll);
router.get('/:id', story_followsController.getById);
router.post('/', story_followsController.create);
router.put('/:id', story_followsController.update);
router.delete('/:id', story_followsController.remove);

module.exports = router;
