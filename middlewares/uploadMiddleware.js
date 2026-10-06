const fs = require('fs');
const path = require('path');
const multer = require('multer');

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function createStorage(directoryName) {
  const destination = path.join(__dirname, '..', 'public', 'uploads', directoryName);
  fs.mkdirSync(destination, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, callback) => callback(null, destination),
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
      callback(null, uniqueName);
    }
  });
}

function imageFileFilter(req, file, callback) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extension)) {
    return callback(null, true);
  }

  const error = new Error('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF');
  error.code = 'INVALID_IMAGE_TYPE';
  return callback(error);
}

const uploadOptions = {
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
};

exports.uploadCover = multer({
  ...uploadOptions,
  storage: createStorage('covers')
});

exports.uploadChapterImages = multer({
  ...uploadOptions,
  storage: createStorage('chapters')
});

exports.uploadAvatar = multer({
  ...uploadOptions,
  storage: createStorage('avatars')
});

exports.handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Mỗi ảnh có dung lượng tối đa 5MB'
      : 'Dữ liệu tải lên không hợp lệ';
    return res.status(status).json({ message });
  }

  if (error && error.code === 'INVALID_IMAGE_TYPE') {
    return res.status(400).json({ message: error.message });
  }

  return next(error);
};
