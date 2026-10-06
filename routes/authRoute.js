const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { loginLimiter } = require('../middlewares/rateLimitMiddleware');

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
