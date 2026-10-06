const express = require('express');
const router = express.Router();
const authorsController = require('../controllers/authorsController');

router.get('/', authorsController.getAll);
router.get('/:id', authorsController.getById);
router.post('/', authorsController.create);
router.put('/:id', authorsController.update);
router.delete('/:id', authorsController.remove);

module.exports = router;
