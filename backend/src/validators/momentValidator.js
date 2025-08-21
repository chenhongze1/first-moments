const { body, query, param } = require('express-validator');
const { validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

// 验证结果处理中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(errorMessages.join(', '), 400));
  }
  next();
};

// 获取时光记录列表验证
const getMomentsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('每页数量必须是1-50之间的整数'),
  
  query('profileId')
    .optional()
    .isMongoId()
    .withMessage('档案ID格式无效'),
  
  query('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const tags = value.split(',');
        if (tags.some(tag => tag.trim().length > 20)) {
          throw new Error('标签长度不能超过20个字符');
        }
      }
      return true;
    }),
  
  query('mood')
    .optional()
    .isIn(['happy', 'sad', 'excited', 'calm', 'angry', 'surprised', 'love', 'grateful', 'proud', 'other'])
    .withMessage('心情值无效'),
  
  query('privacy')
    .optional()
    .isIn(['public', 'private', 'friends'])
    .withMessage('隐私设置无效'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式无效'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式无效'),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度必须在1-100个字符之间'),
  
  query('sortBy')
    .optional()
    .isIn(['momentDate', 'createdAt', 'updatedAt', 'likeCount', 'commentCount'])
    .withMessage('排序字段无效'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向无效'),
  
  handleValidationErrors
];

// 创建时光记录验证
const createMomentValidation = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('标题长度必须在1-100个字符之间')
    .trim(),
  
  body('content')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('内容长度必须在1-2000个字符之间')
    .trim(),
  
  body('profileId')
    .notEmpty()
    .withMessage('档案ID不能为空')
    .isMongoId()
    .withMessage('档案ID格式无效'),
  
  body('momentDate')
    .optional()
    .isISO8601()
    .withMessage('记录时间格式无效'),
  
  body('tags')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        if (value.length > 10) {
          throw new Error('标签数量不能超过10个');
        }
        if (value.some(tag => typeof tag !== 'string' || tag.trim().length > 20)) {
          throw new Error('标签必须是字符串且长度不能超过20个字符');
        }
      } else if (typeof value === 'string') {
        const tags = value.split(',');
        if (tags.length > 10) {
          throw new Error('标签数量不能超过10个');
        }
        if (tags.some(tag => tag.trim().length > 20)) {
          throw new Error('标签长度不能超过20个字符');
        }
      }
      return true;
    }),
  
  body('location.coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('纬度必须在-90到90之间'),
  
  body('location.coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('经度必须在-180到180之间'),
  
  body('location.address.formatted')
    .optional()
    .isLength({ max: 200 })
    .withMessage('地址长度不能超过200个字符'),
  
  body('location.placeName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('地点名称长度不能超过100个字符'),
  
  body('mood')
    .optional()
    .isIn(['happy', 'sad', 'excited', 'calm', 'angry', 'surprised', 'love', 'grateful', 'proud', 'other'])
    .withMessage('心情值无效'),
  
  body('weather.condition')
    .optional()
    .isIn(['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'foggy', 'stormy'])
    .withMessage('天气状况无效'),
  
  body('weather.temperature')
    .optional()
    .isFloat({ min: -50, max: 60 })
    .withMessage('温度必须在-50到60度之间'),
  
  body('weather.humidity')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('湿度必须在0-100%之间'),
  
  body('privacy')
    .optional()
    .isIn(['public', 'private', 'friends'])
    .withMessage('隐私设置无效'),
  
  handleValidationErrors
];

// 更新时光记录验证
const updateMomentValidation = [
  param('id')
    .isMongoId()
    .withMessage('记录ID格式无效'),
  
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('标题长度必须在1-100个字符之间')
    .trim(),
  
  body('content')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('内容长度必须在1-2000个字符之间')
    .trim(),
  
  body('momentDate')
    .optional()
    .isISO8601()
    .withMessage('记录时间格式无效'),
  
  body('tags')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        if (value.length > 10) {
          throw new Error('标签数量不能超过10个');
        }
        if (value.some(tag => typeof tag !== 'string' || tag.trim().length > 20)) {
          throw new Error('标签必须是字符串且长度不能超过20个字符');
        }
      } else if (typeof value === 'string') {
        const tags = value.split(',');
        if (tags.length > 10) {
          throw new Error('标签数量不能超过10个');
        }
        if (tags.some(tag => tag.trim().length > 20)) {
          throw new Error('标签长度不能超过20个字符');
        }
      }
      return true;
    }),
  
  body('location.coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('纬度必须在-90到90之间'),
  
  body('location.coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('经度必须在-180到180之间'),
  
  body('mood')
    .optional()
    .isIn(['happy', 'sad', 'excited', 'calm', 'angry', 'surprised', 'love', 'grateful', 'proud', 'other'])
    .withMessage('心情值无效'),
  
  body('privacy')
    .optional()
    .isIn(['public', 'private', 'friends'])
    .withMessage('隐私设置无效'),
  
  body('isPinned')
    .optional()
    .isBoolean()
    .withMessage('置顶状态必须是布尔值'),
  
  handleValidationErrors
];

// 添加评论验证
const addCommentValidation = [
  param('id')
    .isMongoId()
    .withMessage('记录ID格式无效'),
  
  body('content')
    .notEmpty()
    .withMessage('评论内容不能为空')
    .isLength({ min: 1, max: 500 })
    .withMessage('评论内容长度必须在1-500个字符之间')
    .trim(),
  
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('回复评论ID格式无效'),
  
  handleValidationErrors
];

module.exports = {
  getMomentsValidation,
  createMomentValidation,
  updateMomentValidation,
  addCommentValidation
};