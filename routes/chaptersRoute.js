const express = require('express');
const router = express.Router();
const chaptersController = require('../controllers/chaptersController');

router.get('/', chaptersController.getAll);
router.get('/:id', chaptersController.getById);
router.post('/:id/views', chaptersController.incrementViews);
router.post('/', chaptersController.create);
router.put('/:id', chaptersController.update);
router.delete('/:id', chaptersController.remove);

module.exports = router;
