const express = require('express');
const router = express.Router();
const storiesController = require('../controllers/storiesController');

router.get('/', storiesController.getAll);
router.get('/category/:slug', storiesController.getByCategory);
router.get('/slug/:slug', storiesController.getBySlug);
router.get('/:id', storiesController.getById);
router.post('/:id/views', storiesController.incrementViews);
router.post('/', storiesController.create);
router.put('/:id', storiesController.update);
router.delete('/:id', storiesController.remove);

module.exports = router;
