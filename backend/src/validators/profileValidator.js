const { body, param, query } = require('express-validator');

// 创建档案验证规则
const createProfileValidation = [
  body('name')
    .notEmpty()
    .withMessage('档案名称不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('档案名称长度应在1-50个字符之间')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('档案描述不能超过500个字符')
    .trim(),
  
  body('type')
    .optional()
    .isIn(['personal', 'shared', 'family', 'work', 'travel', 'hobby'])
    .withMessage('档案类型无效'),
  
  body('privacy')
    .optional()
    .isIn(['public', 'private', 'friends'])
    .withMessage('隐私设置无效'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('头像URL格式无效'),
  
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('封面图片URL格式无效'),
  
  body('settings')
    .optional()
    .isObject()
    .withMessage('设置必须是对象格式'),
  
  body('settings.allowComments')
    .optional()
    .isBoolean()
    .withMessage('允许评论设置必须是布尔值'),
  
  body('settings.allowSharing')
    .optional()
    .isBoolean()
    .withMessage('允许分享设置必须是布尔值'),
  
  body('settings.showStats')
    .optional()
    .isBoolean()
    .withMessage('显示统计设置必须是布尔值'),
  
  body('members')
    .optional()
    .isArray()
    .withMessage('成员列表必须是数组格式'),
  
  body('members.*')
    .optional()
    .isMongoId()
    .withMessage('成员ID格式无效')
];

// 更新档案验证规则
const updateProfileValidation = [
  param('id')
    .isMongoId()
    .withMessage('档案ID格式无效'),
  
  body('name')
    .optional()
    .notEmpty()
    .withMessage('档案名称不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('档案名称长度应在1-50个字符之间')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('档案描述不能超过500个字符')
    .trim(),
  
  body('privacy')
    .optional()
    .isIn(['public', 'private', 'friends'])
    .withMessage('隐私设置无效'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('头像URL格式无效'),
  
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('封面图片URL格式无效'),
  
  body('settings')
    .optional()
    .isObject()
    .withMessage('设置必须是对象格式'),
  
  body('settings.allowComments')
    .optional()
    .isBoolean()
    .withMessage('允许评论设置必须是布尔值'),
  
  body('settings.allowSharing')
    .optional()
    .isBoolean()
    .withMessage('允许分享设置必须是布尔值'),
  
  body('settings.showStats')
    .optional()
    .isBoolean()
    .withMessage('显示统计设置必须是布尔值')
];

// 获取档案验证规则
const getProfileValidation = [
  param('id')
    .isMongoId()
    .withMessage('档案ID格式无效')
];

// 删除档案验证规则
const deleteProfileValidation = [
  param('id')
    .isMongoId()
    .withMessage('档案ID格式无效'),
  
  query('permanent')
    .optional()
    .isBoolean()
    .withMessage('永久删除参数必须是布尔值')
];

// 获取档案列表验证规则
const getProfilesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('搜索关键词不能超过100个字符')
    .trim(),
  
  query('type')
    .optional()
    .isIn(['personal', 'shared', 'family', 'work', 'travel', 'hobby'])
    .withMessage('档案类型无效'),
  
  query('privacy')
    .optional()
    .isIn(['public', 'private', 'friends'])
    .withMessage('隐私设置无效'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'viewsCount'])
    .withMessage('排序字段无效'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向无效')
];

module.exports = {
  createProfileValidation,
  updateProfileValidation,
  getProfileValidation,
  deleteProfileValidation,
  getProfilesValidation
};