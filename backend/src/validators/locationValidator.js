const { body, query, param, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

// 获取位置记录验证
const getLocationsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  query('placeType')
    .optional()
    .isIn(['home', 'work', 'school', 'restaurant', 'cafe', 'shop', 'hospital', 'park', 'gym', 'cinema', 'hotel', 'airport', 'station', 'beach', 'mountain', 'museum', 'library', 'church', 'other'])
    .withMessage('地点类型无效'),
  query('visitType')
    .optional()
    .isIn(['checkin', 'visit', 'live', 'work', 'travel'])
    .withMessage('访问类型无效'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式无效'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式无效'),
  query('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('收藏状态必须是布尔值'),
  query('privacy')
    .optional()
    .isIn(['public', 'private', 'friends'])
    .withMessage('隐私设置无效'),
  query('tags')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(tag => typeof tag === 'string' && tag.length <= 20);
      }
      return typeof value === 'string' && value.length <= 20;
    })
    .withMessage('标签格式无效或长度超过20个字符'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度必须在1-100个字符之间'),
  query('sortBy')
    .optional()
    .isIn(['visitedAt', 'createdAt', 'visitCount', 'placeName'])
    .withMessage('排序字段无效'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向无效'),
  handleValidationErrors
];

// 创建位置记录验证
const createLocationValidation = [
  body('coordinates')
    .notEmpty()
    .withMessage('坐标信息不能为空')
    .custom((value) => {
      if (!value || !value.coordinates || !Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
        throw new Error('坐标格式无效');
      }
      const [longitude, latitude] = value.coordinates;
      if (typeof longitude !== 'number' || typeof latitude !== 'number') {
        throw new Error('坐标必须是数字');
      }
      if (longitude < -180 || longitude > 180) {
        throw new Error('经度必须在-180到180之间');
      }
      if (latitude < -90 || latitude > 90) {
        throw new Error('纬度必须在-90到90之间');
      }
      return true;
    }),
  body('address')
    .notEmpty()
    .withMessage('地址信息不能为空')
    .custom((value) => {
      if (!value || !value.formatted) {
        throw new Error('格式化地址不能为空');
      }
      return true;
    }),
  body('placeName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('地点名称长度必须在1-100个字符之间'),
  body('placeType')
    .optional()
    .isIn(['home', 'work', 'school', 'restaurant', 'cafe', 'shop', 'hospital', 'park', 'gym', 'cinema', 'hotel', 'airport', 'station', 'beach', 'mountain', 'museum', 'library', 'church', 'other'])
    .withMessage('地点类型无效'),
  body('visitType')
    .optional()
    .isIn(['checkin', 'visit', 'live', 'work', 'travel'])
    .withMessage('访问类型无效'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('停留时长必须是非负整数'),
  body('accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('准确度必须是非负数'),
  body('altitude')
    .optional()
    .isFloat()
    .withMessage('海拔必须是数字'),
  body('speed')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('速度必须是非负数'),
  body('heading')
    .optional()
    .isFloat({ min: 0, max: 360 })
    .withMessage('方向必须在0-360度之间'),
  body('weather')
    .optional()
    .custom((value) => {
      if (value && typeof value === 'object') {
        if (value.condition && !['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'foggy', 'stormy'].includes(value.condition)) {
          throw new Error('天气状况无效');
        }
        if (value.temperature && typeof value.temperature !== 'number') {
          throw new Error('温度必须是数字');
        }
        if (value.humidity && (typeof value.humidity !== 'number' || value.humidity < 0 || value.humidity > 100)) {
          throw new Error('湿度必须是0-100之间的数字');
        }
      }
      return true;
    }),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('标签数量不能超过10个');
      }
      return tags.every(tag => typeof tag === 'string' && tag.length <= 20);
    })
    .withMessage('每个标签长度不能超过20个字符'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('备注长度不能超过500个字符'),
  body('privacy')
    .optional()
    .isIn(['public', 'private', 'friends'])
    .withMessage('隐私设置无效'),
  handleValidationErrors
];

// 获取附近位置验证
const getNearbyLocationsValidation = [
  query('longitude')
    .notEmpty()
    .withMessage('经度不能为空')
    .isFloat({ min: -180, max: 180 })
    .withMessage('经度必须在-180到180之间'),
  query('latitude')
    .notEmpty()
    .withMessage('纬度不能为空')
    .isFloat({ min: -90, max: 90 })
    .withMessage('纬度必须在-90到90之间'),
  query('maxDistance')
    .optional()
    .isInt({ min: 1, max: 50000 })
    .withMessage('最大距离必须在1-50000米之间'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('返回数量必须在1-100之间'),
  query('includeOthers')
    .optional()
    .isBoolean()
    .withMessage('是否包含其他用户位置必须是布尔值'),
  handleValidationErrors
];

// 搜索位置验证
const searchLocationsValidation = [
  query('query')
    .notEmpty()
    .withMessage('搜索关键词不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度必须在1-100个字符之间'),
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('经度必须在-180到180之间'),
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('纬度必须在-90到90之间'),
  query('radius')
    .optional()
    .isInt({ min: 1, max: 50000 })
    .withMessage('搜索半径必须在1-50000米之间'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('返回数量必须在1-100之间'),
  handleValidationErrors
];

// 更新位置记录验证
const updateLocationValidation = [
  param('id')
    .isMongoId()
    .withMessage('位置记录ID格式无效'),
  body('placeName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('地点名称长度必须在1-100个字符之间'),
  body('placeType')
    .optional()
    .isIn(['home', 'work', 'school', 'restaurant', 'cafe', 'shop', 'hospital', 'park', 'gym', 'cinema', 'hotel', 'airport', 'station', 'beach', 'mountain', 'museum', 'library', 'church', 'other'])
    .withMessage('地点类型无效'),
  body('visitType')
    .optional()
    .isIn(['checkin', 'visit', 'live', 'work', 'travel'])
    .withMessage('访问类型无效'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('停留时长必须是非负整数'),
  body('weather')
    .optional()
    .custom((value) => {
      if (value && typeof value === 'object') {
        if (value.condition && !['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'foggy', 'stormy'].includes(value.condition)) {
          throw new Error('天气状况无效');
        }
        if (value.temperature && typeof value.temperature !== 'number') {
          throw new Error('温度必须是数字');
        }
        if (value.humidity && (typeof value.humidity !== 'number' || value.humidity < 0 || value.humidity > 100)) {
          throw new Error('湿度必须是0-100之间的数字');
        }
      }
      return true;
    }),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('标签数量不能超过10个');
      }
      return tags.every(tag => typeof tag === 'string' && tag.length <= 20);
    })
    .withMessage('每个标签长度不能超过20个字符'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('备注长度不能超过500个字符'),
  body('privacy')
    .optional()
    .isIn(['public', 'private', 'friends'])
    .withMessage('隐私设置无效'),
  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('收藏状态必须是布尔值'),
  handleValidationErrors
];

// 地理编码验证
const geocodeValidation = [
  query('address')
    .if(query('longitude').not().exists())
    .notEmpty()
    .withMessage('地址不能为空')
    .isLength({ min: 1, max: 200 })
    .withMessage('地址长度必须在1-200个字符之间'),
  query('longitude')
    .if(query('address').not().exists())
    .notEmpty()
    .withMessage('经度不能为空')
    .isFloat({ min: -180, max: 180 })
    .withMessage('经度必须在-180到180之间'),
  query('latitude')
    .if(query('address').not().exists())
    .notEmpty()
    .withMessage('纬度不能为空')
    .isFloat({ min: -90, max: 90 })
    .withMessage('纬度必须在-90到90之间'),
  handleValidationErrors
];

// 错误处理中间件
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(errorMessages.join('; '), 400));
  }
  next();
}

module.exports = {
  getLocationsValidation,
  createLocationValidation,
  getNearbyLocationsValidation,
  searchLocationsValidation,
  updateLocationValidation,
  geocodeValidation
};