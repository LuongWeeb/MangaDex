const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Tất cả endpoints Admin đều yêu cầu quyền Admin
router.use(verifyToken);
router.use(checkRole(['Admin', 1]));

router.get('/stats', adminController.getStats);

// Quản lý người dùng & Khóa tài khoản
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/ban', adminController.toggleBanUser);
router.delete('/users/:id', adminController.deleteUser);

// Kiểm duyệt truyện đăng
router.get('/stories/moderation', adminController.getStoriesForModeration);
router.put('/stories/:id/approval', adminController.updateStoryApproval);

// Kiểm duyệt bình luận
router.get('/comments', adminController.getAllComments);
router.delete('/comments/:id', adminController.deleteComment);

// Thể loại & Tác giả
router.post('/categories', adminController.createCategory);
router.delete('/categories/:id', adminController.deleteCategory);
router.post('/authors', adminController.createAuthor);
router.delete('/authors/:id', adminController.deleteAuthor);

module.exports = router;
