const { body, query, param, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

// 获取通知列表验证
const getNotificationsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  query('type')
    .optional()
    .isIn(['like', 'comment', 'follow', 'mention', 'share', 'achievement', 'reminder', 'system', 'update', 'security', 'invitation', 'milestone'])
    .withMessage('通知类型无效'),
  
  query('isRead')
    .optional()
    .isBoolean()
    .withMessage('已读状态必须是布尔值'),
  
  query('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('优先级无效'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式无效'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式无效'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('参数验证失败', 400, errors.array()));
    }
    next();
  }
];

// 创建通知验证
const createNotificationValidation = [
  body('recipient')
    .notEmpty()
    .withMessage('接收者不能为空')
    .isMongoId()
    .withMessage('接收者ID格式无效'),
  
  body('type')
    .notEmpty()
    .withMessage('通知类型不能为空')
    .isIn(['like', 'comment', 'follow', 'mention', 'share', 'achievement', 'reminder', 'system', 'update', 'security', 'invitation', 'milestone'])
    .withMessage('通知类型无效'),
  
  body('title')
    .notEmpty()
    .withMessage('通知标题不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('通知标题长度必须在1-100个字符之间'),
  
  body('content')
    .notEmpty()
    .withMessage('通知内容不能为空')
    .isLength({ min: 1, max: 500 })
    .withMessage('通知内容长度必须在1-500个字符之间'),
  
  body('data')
    .optional()
    .isObject()
    .withMessage('通知数据必须是对象'),
  
  body('data.objectType')
    .optional()
    .isIn(['moment', 'profile', 'user', 'achievement', 'comment', 'location', 'system'])
    .withMessage('对象类型无效'),
  
  body('data.objectId')
    .optional()
    .isMongoId()
    .withMessage('对象ID格式无效'),
  
  body('icon')
    .optional()
    .isString()
    .withMessage('图标必须是字符串'),
  
  body('image')
    .optional()
    .isURL()
    .withMessage('图片必须是有效的URL'),
  
  body('actionUrl')
    .optional()
    .isURL()
    .withMessage('操作链接必须是有效的URL'),
  
  body('actions')
    .optional()
    .isArray()
    .withMessage('操作按钮必须是数组'),
  
  body('actions.*.label')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('按钮标签长度必须在1-20个字符之间'),
  
  body('actions.*.action')
    .optional()
    .notEmpty()
    .withMessage('按钮操作不能为空'),
  
  body('actions.*.style')
    .optional()
    .isIn(['primary', 'secondary', 'success', 'warning', 'danger'])
    .withMessage('按钮样式无效'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('优先级无效'),
  
  body('channels')
    .optional()
    .isArray()
    .withMessage('通知渠道必须是数组'),
  
  body('channels.*')
    .optional()
    .isIn(['push', 'email', 'sms', 'in_app'])
    .withMessage('通知渠道无效'),
  
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('过期时间格式无效'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('参数验证失败', 400, errors.array()));
    }
    next();
  }
];

// 更新通知设置验证
const updateNotificationSettingsValidation = [
  body('global')
    .optional()
    .isObject()
    .withMessage('全局设置必须是对象'),
  
  body('global.enabled')
    .optional()
    .isBoolean()
    .withMessage('全局启用状态必须是布尔值'),
  
  body('global.quietHours')
    .optional()
    .isObject()
    .withMessage('静默时间设置必须是对象'),
  
  body('global.quietHours.enabled')
    .optional()
    .isBoolean()
    .withMessage('静默时间启用状态必须是布尔值'),
  
  body('global.quietHours.start')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('静默开始时间格式无效（HH:mm）'),
  
  body('global.quietHours.end')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('静默结束时间格式无效（HH:mm）'),
  
  body('types')
    .optional()
    .isObject()
    .withMessage('类型设置必须是对象'),
  
  body('types.*.enabled')
    .optional()
    .isBoolean()
    .withMessage('类型启用状态必须是布尔值'),
  
  body('types.*.channels')
    .optional()
    .isArray()
    .withMessage('类型通知渠道必须是数组'),
  
  body('types.*.channels.*')
    .optional()
    .isIn(['push', 'email', 'sms', 'in_app'])
    .withMessage('通知渠道无效'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('参数验证失败', 400, errors.array()));
    }
    next();
  }
];

// 添加推送令牌验证
const addPushTokenValidation = [
  body('token')
    .notEmpty()
    .withMessage('推送令牌不能为空')
    .isString()
    .withMessage('推送令牌必须是字符串'),
  
  body('platform')
    .notEmpty()
    .withMessage('平台不能为空')
    .isIn(['ios', 'android', 'web'])
    .withMessage('平台类型无效'),
  
  body('deviceId')
    .notEmpty()
    .withMessage('设备ID不能为空')
    .isString()
    .withMessage('设备ID必须是字符串'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('参数验证失败', 400, errors.array()));
    }
    next();
  }
];

// 批量删除通知验证
const batchDeleteValidation = [
  body('ids')
    .notEmpty()
    .withMessage('通知ID列表不能为空')
    .isArray({ min: 1 })
    .withMessage('通知ID列表必须是非空数组'),
  
  body('ids.*')
    .isMongoId()
    .withMessage('通知ID格式无效'),
  
  body('permanent')
    .optional()
    .isBoolean()
    .withMessage('永久删除标志必须是布尔值'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('参数验证失败', 400, errors.array()));
    }
    next();
  }
];

// 发送推送通知验证
const sendPushNotificationValidation = [
  param('id')
    .isMongoId()
    .withMessage('通知ID格式无效'),
  
  body('channels')
    .optional()
    .isArray()
    .withMessage('通知渠道必须是数组'),
  
  body('channels.*')
    .optional()
    .isIn(['push', 'email', 'sms', 'in_app'])
    .withMessage('通知渠道无效'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('参数验证失败', 400, errors.array()));
    }
    next();
  }
];

// 通知ID参数验证
const notificationIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('通知ID格式无效'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('参数验证失败', 400, errors.array()));
    }
    next();
  }
];

// 设备ID参数验证
const deviceIdValidation = [
  param('deviceId')
    .notEmpty()
    .withMessage('设备ID不能为空')
    .isString()
    .withMessage('设备ID必须是字符串'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('参数验证失败', 400, errors.array()));
    }
    next();
  }
];

// 通知统计验证
const notificationStatsValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式无效'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式无效'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('参数验证失败', 400, errors.array()));
    }
    
    // 验证日期范围
    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      
      if (startDate >= endDate) {
        return next(new AppError('开始日期必须早于结束日期', 400));
      }
      
      // 限制查询范围不超过1年
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      if (endDate - startDate > oneYear) {
        return next(new AppError('查询时间范围不能超过1年', 400));
      }
    }
    
    next();
  }
];

module.exports = {
  getNotificationsValidation,
  createNotificationValidation,
  updateNotificationSettingsValidation,
  addPushTokenValidation,
  batchDeleteValidation,
  sendPushNotificationValidation,
  notificationIdValidation,
  deviceIdValidation,
  notificationStatsValidation
};