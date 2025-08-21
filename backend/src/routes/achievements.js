const express = require('express');
const router = express.Router();
const {
  getAchievementTemplates,
  createAchievementTemplate,
  updateAchievementTemplate,
  deleteAchievementTemplate,
  getUserAchievements,
  initializeUserAchievements,
  updateAchievementProgress,
  grantAchievement,
  getAchievementLeaderboard
} = require('../controllers/achievementController');
const { auth, checkOwnership } = require('../middleware/auth');
const {
  createAchievementTemplateValidation,
  updateAchievementTemplateValidation,
  updateAchievementProgressValidation,
  grantAchievementValidation,
  getAchievementTemplatesValidation,
  getUserAchievementsValidation,
  getLeaderboardValidation
} = require('../validators/achievementValidator');

// ==================== 成就模板路由 ====================

// 获取成就模板列表（公开接口）
router.get('/templates', 
  getAchievementTemplatesValidation,
  getAchievementTemplates
);

// 创建成就模板（管理员）
router.post('/templates',
  auth,
  createAchievementTemplateValidation,
  createAchievementTemplate
);

// 更新成就模板（管理员）
router.put('/templates/:id',
  auth,
  updateAchievementTemplateValidation,
  updateAchievementTemplate
);

// 删除成就模板（管理员）
router.delete('/templates/:id',
  auth,
  deleteAchievementTemplate
);

// ==================== 用户成就路由 ====================

// 获取用户成就列表
router.get('/user/:userId?',
  auth,
  getUserAchievementsValidation,
  getUserAchievements
);

// 初始化用户成就
router.post('/initialize',
  auth,
  initializeUserAchievements
);

// 更新成就进度
router.put('/progress/:id',
  auth,
  updateAchievementProgressValidation,
  updateAchievementProgress
);

// 手动授予成就（管理员）
router.post('/grant',
  auth,
  grantAchievementValidation,
  grantAchievement
);

// 获取成就排行榜
router.get('/leaderboard',
  getLeaderboardValidation,
  getAchievementLeaderboard
);

module.exports = router;