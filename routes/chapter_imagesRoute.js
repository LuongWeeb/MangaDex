const express = require('express');
const router = express.Router();
const chapter_imagesController = require('../controllers/chapter_imagesController');

router.get('/chapter/:chapterId', chapter_imagesController.getByChapterId);
router.get('/', chapter_imagesController.getAll);
router.get('/:id', chapter_imagesController.getById);
router.post('/', chapter_imagesController.create);
router.put('/:id', chapter_imagesController.update);
router.delete('/:id', chapter_imagesController.remove);

module.exports = router;
