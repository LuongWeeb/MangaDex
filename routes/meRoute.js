const express = require('express');
const router = express.Router();
const meController = require('../controllers/meController');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { uploadAvatar, handleUploadError } = require('../middlewares/uploadMiddleware');

// Tất cả routes /api/me yêu cầu đăng nhập
router.use(verifyToken);

router.get('/', authController.getMe);
router.put('/profile', meController.updateProfile);
router.post('/avatar', uploadAvatar.single('avatar'), meController.uploadAvatar, handleUploadError);
router.put('/change-password', meController.changePassword);
router.get('/follows', meController.getFollows);
router.get('/follows/check/:storyId', meController.checkFollow);
router.post('/follows/:storyId', meController.toggleFollow);

router.get('/likes/check/:storyId', meController.checkLike);
router.post('/likes/:storyId', meController.toggleLike);
router.get('/likes', meController.getLikes);

router.get('/history', meController.getReadingHistory);
router.post('/history', meController.saveReadingHistory);

module.exports = router;
