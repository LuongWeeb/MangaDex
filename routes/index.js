var express = require('express');
var router = express.Router();

const authRoute = require('./authRoute');
const meRoute = require('./meRoute');
const adminRoute = require('./adminRoute');
const uploaderRoute = require('./uploaderRoute');

const authorsRoute = require('./authorsRoute');
const categoriesRoute = require('./categoriesRoute');
const chapter_imagesRoute = require('./chapter_imagesRoute');
const chaptersRoute = require('./chaptersRoute');
const commentsRoute = require('./commentsRoute');
const reading_historiesRoute = require('./reading_historiesRoute');
const rolesRoute = require('./rolesRoute');
const storiesRoute = require('./storiesRoute');
const story_categoriesRoute = require('./story_categoriesRoute');
const story_followsRoute = require('./story_followsRoute');
const story_likesRoute = require('./story_likesRoute');
const usersRoute = require('./usersRoute');
const mobileApiResponseMiddleware = require('../middlewares/mobileApiResponseMiddleware');

const spaStoryRoutes = [
  '/truyen/:slug',
  '/truyen/:storySlug/chuong-:chapterNumber',
  '/tim-kiem',
  '/ho-so',
  '/tu-truyen',
  '/studio',
  '/quan-tri'
];

/* Health check API */
router.get('/api/health', function(req, res, next) {
  res.json({ status: 'ok', message: 'API is running' });
});

// Phân hệ Auth, Me, Admin, Uploader (Hỗ trợ cả tiền tố /api và tiền tố trực tiếp)
router.use('/api/auth', authRoute);
router.use('/auth', authRoute);
router.use('/api/me', meRoute);
router.use('/me', meRoute);
router.use('/api/admin', adminRoute);
router.use('/admin', adminRoute);
router.use('/api/uploader', uploaderRoute);
router.use('/uploader', uploaderRoute);

const mobileApiRouter = express.Router();
mobileApiRouter.use(mobileApiResponseMiddleware);
mobileApiRouter.use('/auth', authRoute);
mobileApiRouter.use('/me', meRoute);
mobileApiRouter.use('/admin', adminRoute);
mobileApiRouter.use('/uploader', uploaderRoute);
mobileApiRouter.use('/authors', authorsRoute);
mobileApiRouter.use('/categories', categoriesRoute);
mobileApiRouter.use('/chapters', chaptersRoute);
mobileApiRouter.use('/chapter_images', chapter_imagesRoute);
mobileApiRouter.use('/comments', commentsRoute);
mobileApiRouter.use('/stories', storiesRoute);
router.use('/api/v1', mobileApiRouter);

// Các tài nguyên RESTful
router.use('/authors', authorsRoute);
router.use('/categories', categoriesRoute);
router.use('/chapter_images', chapter_imagesRoute);
router.use('/chapters', chaptersRoute);
router.use('/comments', commentsRoute);
router.use('/reading_histories', reading_historiesRoute);
router.use('/roles', rolesRoute);
router.use('/stories', storiesRoute);
router.use('/story_categories', story_categoriesRoute);
router.use('/story_follows', story_followsRoute);
router.use('/story_likes', story_likesRoute);
router.use('/users', usersRoute);

module.exports = { router, spaStoryRoutes };
