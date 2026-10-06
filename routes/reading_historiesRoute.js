const express = require('express');
const router = express.Router();
const reading_historiesController = require('../controllers/reading_historiesController');

router.get('/', reading_historiesController.getAll);
router.get('/:id', reading_historiesController.getById);
router.post('/', reading_historiesController.create);
router.put('/:id', reading_historiesController.update);
router.delete('/:id', reading_historiesController.remove);

module.exports = router;
