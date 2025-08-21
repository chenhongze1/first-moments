const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

// 配置文件存储
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      logger.error('创建上传目录失败:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'video/mp4': true,
    'video/mpeg': true,
    'video/quicktime': true,
    'audio/mpeg': true,
    'audio/wav': true,
    'audio/mp3': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10 // 最多10个文件
  }
});

/**
 * 上传单个文件
 * @param {string} fieldName - 表单字段名
 * @returns {Function} multer中间件
 */
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

/**
 * 上传多个文件
 * @param {string} fieldName - 表单字段名
 * @param {number} maxCount - 最大文件数量
 * @returns {Function} multer中间件
 */
const uploadMultiple = (fieldName, maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

/**
 * 上传文件到服务器
 * @param {Object} file - 文件对象
 * @returns {Promise<Object>} 上传结果
 */
const uploadFile = async (file) => {
  try {
    if (!file) {
      throw new Error('没有提供文件');
    }

    // 生成文件URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    // 返回文件信息
    return {
      url: fileUrl,
      key: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    };
  } catch (error) {
    logger.error('文件上传失败:', error);
    throw error;
  }
};

/**
 * 删除文件
 * @param {string} fileKey - 文件键名（文件名）
 * @returns {Promise<boolean>} 删除结果
 */
const deleteFile = async (fileKey) => {
  try {
    if (!fileKey) {
      throw new Error('没有提供文件键名');
    }

    const filePath = path.join(__dirname, '../../uploads', fileKey);
    
    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      logger.warn(`文件不存在: ${filePath}`);
      return true; // 文件不存在也算删除成功
    }

    // 删除文件
    await fs.unlink(filePath);
    logger.info(`文件删除成功: ${filePath}`);
    return true;
  } catch (error) {
    logger.error('文件删除失败:', error);
    throw error;
  }
};

/**
 * 获取文件信息
 * @param {string} fileKey - 文件键名
 * @returns {Promise<Object>} 文件信息
 */
const getFileInfo = async (fileKey) => {
  try {
    if (!fileKey) {
      throw new Error('没有提供文件键名');
    }

    const filePath = path.join(__dirname, '../../uploads', fileKey);
    const stats = await fs.stat(filePath);
    
    return {
      key: fileKey,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      path: filePath
    };
  } catch (error) {
    logger.error('获取文件信息失败:', error);
    throw error;
  }
};

/**
 * 验证文件类型
 * @param {string} mimetype - 文件MIME类型
 * @param {Array} allowedTypes - 允许的类型数组
 * @returns {boolean} 验证结果
 */
const validateFileType = (mimetype, allowedTypes = []) => {
  if (allowedTypes.length === 0) {
    // 默认允许的类型
    allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'audio/mp3'
    ];
  }
  
  return allowedTypes.includes(mimetype);
};

/**
 * 验证文件大小
 * @param {number} size - 文件大小（字节）
 * @param {number} maxSize - 最大大小（字节）
 * @returns {boolean} 验证结果
 */
const validateFileSize = (size, maxSize = 50 * 1024 * 1024) => {
  return size <= maxSize;
};

/**
 * 清理过期的临时文件
 * @param {number} maxAge - 最大年龄（毫秒）
 * @returns {Promise<number>} 清理的文件数量
 */
const cleanupTempFiles = async (maxAge = 24 * 60 * 60 * 1000) => {
  try {
    const uploadDir = path.join(__dirname, '../../uploads');
    const files = await fs.readdir(uploadDir);
    let cleanedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.stat(filePath);
      
      // 检查文件年龄
      if (Date.now() - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        cleanedCount++;
        logger.info(`清理过期文件: ${file}`);
      }
    }
    
    return cleanedCount;
  } catch (error) {
    logger.error('清理临时文件失败:', error);
    throw error;
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFile,
  deleteFile,
  getFileInfo,
  validateFileType,
  validateFileSize,
  cleanupTempFiles
};