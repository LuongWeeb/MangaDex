const express = require('express');
const router = express.Router();
const story_likesController = require('../controllers/story_likesController');

router.get('/', story_likesController.getAll);
router.get('/:id', story_likesController.getById);
router.post('/', story_likesController.create);
router.put('/:id', story_likesController.update);
router.delete('/:id', story_likesController.remove);

module.exports = router;
