const { body, param, query } = require('express-validator');

// 创建成就模板验证
const createAchievementTemplateValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('成就名称不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('成就名称长度必须在2-50个字符之间'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('成就描述不能为空')
    .isLength({ min: 10, max: 500 })
    .withMessage('成就描述长度必须在10-500个字符之间'),

  body('type')
    .isIn(['action', 'milestone', 'collection', 'social', 'time_based', 'special'])
    .withMessage('成就类型无效'),

  body('category')
    .isIn(['profile', 'record', 'social', 'exploration', 'creativity', 'persistence', 'special'])
    .withMessage('成就分类无效'),

  body('difficulty')
    .isIn(['easy', 'medium', 'hard', 'legendary'])
    .withMessage('成就难度无效'),

  body('icon')
    .optional()
    .isURL()
    .withMessage('成就图标必须是有效的URL'),

  body('badge')
    .optional()
    .isURL()
    .withMessage('成就徽章必须是有效的URL'),

  body('points')
    .isInt({ min: 1, max: 10000 })
    .withMessage('成就积分必须是1-10000之间的整数'),

  body('conditions.type')
    .isIn(['count', 'streak', 'time_duration', 'specific_action', 'collection_complete'])
    .withMessage('成就条件类型无效'),

  body('conditions.target')
    .isInt({ min: 1 })
    .withMessage('成就目标必须是大于0的整数'),

  body('conditions.parameters')
    .optional()
    .isObject()
    .withMessage('成就条件参数必须是对象'),

  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('前置成就必须是数组'),

  body('prerequisites.*')
    .optional()
    .isMongoId()
    .withMessage('前置成就ID格式无效'),

  body('isHidden')
    .optional()
    .isBoolean()
    .withMessage('是否隐藏必须是布尔值'),

  body('isTimeLimited')
    .optional()
    .isBoolean()
    .withMessage('是否限时必须是布尔值'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始时间格式无效'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束时间格式无效'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),

  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('标签长度必须在1-20个字符之间'),

  body('localization')
    .optional()
    .isObject()
    .withMessage('多语言配置必须是对象')
];

// 更新成就模板验证
const updateAchievementTemplateValidation = [
  param('id')
    .isMongoId()
    .withMessage('成就模板ID格式无效'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('成就名称不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('成就名称长度必须在2-50个字符之间'),

  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('成就描述不能为空')
    .isLength({ min: 10, max: 500 })
    .withMessage('成就描述长度必须在10-500个字符之间'),

  body('type')
    .optional()
    .isIn(['action', 'milestone', 'collection', 'social', 'time_based', 'special'])
    .withMessage('成就类型无效'),

  body('category')
    .optional()
    .isIn(['profile', 'record', 'social', 'exploration', 'creativity', 'persistence', 'special'])
    .withMessage('成就分类无效'),

  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard', 'legendary'])
    .withMessage('成就难度无效'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'deprecated'])
    .withMessage('成就状态无效'),

  body('points')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('成就积分必须是1-10000之间的整数'),

  body('isHidden')
    .optional()
    .isBoolean()
    .withMessage('是否隐藏必须是布尔值'),

  body('isTimeLimited')
    .optional()
    .isBoolean()
    .withMessage('是否限时必须是布尔值')
];

// 获取成就模板列表验证
const getAchievementTemplatesValidation = [
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
    .isIn(['action', 'milestone', 'collection', 'social', 'time_based', 'special'])
    .withMessage('成就类型无效'),

  query('category')
    .optional()
    .isIn(['profile', 'record', 'social', 'exploration', 'creativity', 'persistence', 'special'])
    .withMessage('成就分类无效'),

  query('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard', 'legendary'])
    .withMessage('成就难度无效'),

  query('status')
    .optional()
    .isIn(['active', 'inactive', 'deprecated'])
    .withMessage('成就状态无效'),

  query('includeHidden')
    .optional()
    .isBoolean()
    .withMessage('是否包含隐藏成就必须是布尔值'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('搜索关键词长度必须在1-50个字符之间')
];

// 获取用户成就列表验证
const getUserAchievementsValidation = [
  param('userId')
    .optional()
    .isMongoId()
    .withMessage('用户ID格式无效'),

  query('status')
    .optional()
    .isIn(['not_started', 'in_progress', 'achieved', 'expired'])
    .withMessage('成就状态无效'),

  query('type')
    .optional()
    .isIn(['action', 'milestone', 'collection', 'social', 'time_based', 'special'])
    .withMessage('成就类型无效'),

  query('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard', 'legendary'])
    .withMessage('成就难度无效'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),

  query('sortBy')
    .optional()
    .isIn(['achievedAt', 'startedAt', 'progress.percentage', 'template.difficulty', 'template.points'])
    .withMessage('排序字段无效'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向无效')
];

// 更新成就进度验证
const updateAchievementProgressValidation = [
  param('id')
    .isMongoId()
    .withMessage('用户成就ID格式无效'),

  body('progress')
    .isInt({ min: 0 })
    .withMessage('进度值必须是大于等于0的整数'),

  body('reason')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('更新原因长度必须在1-200个字符之间')
];

// 手动授予成就验证
const grantAchievementValidation = [
  body('userId')
    .isMongoId()
    .withMessage('用户ID格式无效'),

  body('templateId')
    .isMongoId()
    .withMessage('成就模板ID格式无效'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('授予原因不能为空')
    .isLength({ min: 5, max: 200 })
    .withMessage('授予原因长度必须在5-200个字符之间')
];

// 获取排行榜验证
const getLeaderboardValidation = [
  query('type')
    .optional()
    .isIn(['total_points', 'achievement_count'])
    .withMessage('排行榜类型无效'),

  query('period')
    .optional()
    .isIn(['all_time', 'week', 'month', 'year'])
    .withMessage('时间范围无效'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('排行榜数量必须是1-100之间的整数')
];

module.exports = {
  createAchievementTemplateValidation,
  updateAchievementTemplateValidation,
  getAchievementTemplatesValidation,
  getUserAchievementsValidation,
  updateAchievementProgressValidation,
  grantAchievementValidation,
  getLeaderboardValidation
};