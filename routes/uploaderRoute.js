const express = require('express');
const router = express.Router();
const uploaderController = require('../controllers/uploaderController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { uploadCover, uploadChapterImages, handleUploadError } = require('../middlewares/uploadMiddleware');

// Tất cả endpoints Uploader yêu cầu quyền Uploader hoặc Admin
router.use(verifyToken);
router.use(checkRole(['Uploader', 'Admin', 1, 2]));

router.get('/my-stories', uploaderController.getMyStories);
router.post('/stories', uploadCover.single('cover_file'), handleUploadError, uploaderController.createStory);
router.get('/stories/:id', uploaderController.getStoryById);
router.put('/stories/:id', uploadCover.single('cover_file'), handleUploadError, uploaderController.updateStory);
router.delete('/stories/:id', uploaderController.deleteStory);

// Quản lý chương truyện
router.get('/stories/:id/chapters', uploaderController.getStoryChapters);
router.post('/chapters', uploadChapterImages.array('chapter_images', 200), handleUploadError, uploaderController.createChapter);
router.get('/chapters/:id', uploaderController.getChapterDetail);
router.put('/chapters/:id', uploadChapterImages.array('chapter_images', 200), handleUploadError, uploaderController.updateChapter);
router.delete('/chapters/:id', uploaderController.deleteChapter);

module.exports = router;
