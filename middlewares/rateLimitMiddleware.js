const rateLimit = require('express-rate-limit');

const skipDuringTests = () => process.env.NODE_ENV === 'test';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipDuringTests,
  message: { message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.' }
});

const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipDuringTests,
  message: { message: 'Bạn gửi bình luận quá nhanh. Vui lòng thử lại sau một phút.' }
});

module.exports = { loginLimiter, commentLimiter };
