const express = require('express');
const router = express.Router();
const story_categoriesController = require('../controllers/story_categoriesController');

router.get('/', story_categoriesController.getAll);
router.get('/:id', story_categoriesController.getById);
router.post('/', story_categoriesController.create);
router.put('/:id', story_categoriesController.update);
router.delete('/:id', story_categoriesController.remove);

module.exports = router;
