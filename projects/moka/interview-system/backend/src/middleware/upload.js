const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/resumes');
const avatarDir = path.join(__dirname, '../../uploads/avatars');

[uploadDir, avatarDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'resume') {
      cb(null, uploadDir);
    } else if (file.fieldname === 'avatar') {
      cb(null, avatarDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名: 原文件名-UUID.扩展名
    const uniqueName = `${file.originalname.split('.')[0]}-${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (allowedMimes.includes(mimetype) && allowedExtensions.includes(extname)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 PDF、Word、Excel 和图片文件!'), false);
  }
};

// Multer配置
const uploadConfig = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};

// 单文件上传
const uploadSingle = multer(uploadConfig).single('resume');

// 多文件上传
const uploadMultiple = multer(uploadConfig).array('resumes', 5);

// 错误处理中间件
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大10MB）',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: '上传文件数量超过限制',
        error: 'TOO_MANY_FILES'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
      error: 'UPLOAD_ERROR'
    });
  }
  next(err);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  uploadDir,
  avatarDir
};
