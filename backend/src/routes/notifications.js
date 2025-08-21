const express = require('express');
const notificationController = require('../controllers/notificationController');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getNotificationsValidation,
  createNotificationValidation,
  updateNotificationSettingsValidation,
  addPushTokenValidation,
  batchDeleteValidation
} = require('../validators/notificationValidator');

const router = express.Router();

// 获取用户通知列表
router.get('/', auth, getNotificationsValidation, notificationController.getNotifications);

// 获取通知详情
router.get('/:id', auth, notificationController.getNotification);

// 获取未读通知数量
router.get('/unread-count', auth, notificationController.getUnreadCount);

// 获取通知统计
router.get('/stats', auth, notificationController.getNotificationStats);

// 标记通知为已读
router.put('/:id/read', auth, notificationController.markAsRead);

// 标记所有通知为已读
router.put('/read-all', auth, notificationController.markAllAsRead);

// 删除通知
router.delete('/:id', auth, notificationController.deleteNotification);

// 批量删除通知
router.delete('/batch', auth, batchDeleteValidation, notificationController.batchDeleteNotifications);

// 创建通知（管理员功能）
router.post('/', adminAuth, createNotificationValidation, notificationController.createNotification);

// 发送推送通知（管理员功能）
router.post('/:id/send', adminAuth, notificationController.sendPushNotification);

// 通知设置相关路由
// 获取通知设置
router.get('/settings/me', auth, notificationController.getNotificationSettings);

// 更新通知设置
router.put('/settings/me', auth, updateNotificationSettingsValidation, notificationController.updateNotificationSettings);

// 推送令牌管理
// 添加推送令牌
router.post('/push-tokens', auth, addPushTokenValidation, notificationController.addPushToken);

// 移除推送令牌
router.delete('/push-tokens/:deviceId', auth, notificationController.removePushToken);

module.exports = router;