const { Notification, NotificationSettings } = require('../models/Notification');
const logger = require('../utils/logger');
const emailService = require('./emailService');

/**
 * 通知服务
 * 负责通知的创建、发送和管理
 */
class NotificationService {
  /**
   * 创建通知
   * @param {Object} notificationData 通知数据
   * @returns {Promise<Object>} 创建的通知
   */
  async createNotification(notificationData) {
    try {
      const {
        recipient,
        sender,
        type,
        title,
        content,
        data,
        icon,
        image,
        actionUrl,
        actions,
        priority = 'normal',
        channels = ['in_app'],
        expiresAt,
        batchId
      } = notificationData;

      // 检查用户通知设置
      const settings = await this.getUserNotificationSettings(recipient);
      
      // 如果用户禁用了全局通知或特定类型通知，则不创建
      if (!settings.global.enabled || !settings.types[type]?.enabled) {
        logger.info(`用户 ${recipient} 已禁用 ${type} 类型通知`);
        return null;
      }

      // 检查静默时间
      if (this.isInQuietHours(settings)) {
        logger.info(`当前处于静默时间，延迟发送通知`);
        // 可以选择延迟发送或直接跳过
      }

      // 根据用户设置调整通知渠道
      const userChannels = settings.types[type]?.channels || ['in_app'];
      const finalChannels = channels.filter(channel => userChannels.includes(channel));

      // 创建通知
      const notification = new Notification({
        recipient,
        sender,
        type,
        title,
        content,
        data,
        icon,
        image,
        actionUrl,
        actions,
        priority,
        channels: finalChannels,
        expiresAt,
        batchId
      });

      await notification.save();

      // 自动发送通知
      if (finalChannels.length > 0) {
        this.sendNotification(notification, finalChannels).catch(error => {
          logger.error('自动发送通知失败:', error);
        });
      }

      return notification;
    } catch (error) {
      logger.error('创建通知失败:', error);
      throw error;
    }
  }

  /**
   * 发送通知
   * @param {Object} notification 通知对象
   * @param {Array} channels 发送渠道
   * @returns {Promise<Object>} 发送结果
   */
  async sendNotification(notification, channels = null) {
    try {
      const sendChannels = channels || notification.channels;
      const results = {};

      for (const channel of sendChannels) {
        try {
          switch (channel) {
            case 'in_app':
              results.inApp = await this.sendInAppNotification(notification);
              break;
            case 'push':
              results.push = await this.sendPushNotification(notification);
              break;
            case 'email':
              results.email = await this.sendEmailNotification(notification);
              break;
            case 'sms':
              results.sms = await this.sendSMSNotification(notification);
              break;
            default:
              logger.warn(`未知的通知渠道: ${channel}`);
          }
        } catch (error) {
          logger.error(`发送 ${channel} 通知失败:`, error);
          results[channel] = { success: false, error: error.message };
        }
      }

      return results;
    } catch (error) {
      logger.error('发送通知失败:', error);
      throw error;
    }
  }

  /**
   * 发送应用内通知
   * @param {Object} notification 通知对象
   * @returns {Promise<Object>} 发送结果
   */
  async sendInAppNotification(notification) {
    try {
      // 更新通知状态
      await notification.updatePushStatus('inApp', {
        sent: true,
        sentAt: new Date()
      });

      // 这里可以集成 WebSocket 或 Server-Sent Events 实现实时推送
      // 目前只是标记为已发送
      logger.info(`应用内通知已发送: ${notification._id}`);

      return {
        success: true,
        channel: 'in_app',
        sentAt: new Date()
      };
    } catch (error) {
      logger.error('发送应用内通知失败:', error);
      throw error;
    }
  }

  /**
   * 发送推送通知
   * @param {Object} notification 通知对象
   * @returns {Promise<Object>} 发送结果
   */
  async sendPushNotification(notification) {
    try {
      // 获取用户的推送令牌
      const settings = await NotificationSettings.findOne({ user: notification.recipient });
      if (!settings || !settings.pushTokens.length) {
        throw new Error('用户没有有效的推送令牌');
      }

      const activeTokens = settings.getActivePushTokens();
      if (!activeTokens.length) {
        throw new Error('用户没有活跃的推送令牌');
      }

      // 这里应该集成真实的推送服务 (FCM, APNs 等)
      // 目前使用模拟实现
      const pushResult = await this.sendPushToTokens(notification, activeTokens);

      // 更新通知状态
      await notification.updatePushStatus('push', {
        sent: true,
        sentAt: new Date(),
        messageId: pushResult.messageId
      });

      logger.info(`推送通知已发送: ${notification._id}`);

      return {
        success: true,
        channel: 'push',
        sentAt: new Date(),
        messageId: pushResult.messageId,
        tokensCount: activeTokens.length
      };
    } catch (error) {
      // 更新失败状态
      await notification.updatePushStatus('push', {
        sent: false,
        error: error.message
      });
      
      logger.error('发送推送通知失败:', error);
      throw error;
    }
  }

  /**
   * 发送邮件通知
   * @param {Object} notification 通知对象
   * @returns {Promise<Object>} 发送结果
   */
  async sendEmailNotification(notification) {
    try {
      // 获取用户信息
      const User = require('../models/User');
      const user = await User.findById(notification.recipient);
      if (!user || !user.email) {
        throw new Error('用户邮箱不存在');
      }

      // 发送邮件
      const emailResult = await emailService.sendNotificationEmail({
        to: user.email,
        subject: notification.title,
        content: notification.content,
        data: notification.data,
        actionUrl: notification.actionUrl
      });

      // 更新通知状态
      await notification.updatePushStatus('email', {
        sent: true,
        sentAt: new Date(),
        messageId: emailResult.messageId
      });

      logger.info(`邮件通知已发送: ${notification._id}`);

      return {
        success: true,
        channel: 'email',
        sentAt: new Date(),
        messageId: emailResult.messageId
      };
    } catch (error) {
      // 更新失败状态
      await notification.updatePushStatus('email', {
        sent: false,
        error: error.message
      });
      
      logger.error('发送邮件通知失败:', error);
      throw error;
    }
  }

  /**
   * 发送短信通知
   * @param {Object} notification 通知对象
   * @returns {Promise<Object>} 发送结果
   */
  async sendSMSNotification(notification) {
    try {
      // 获取用户信息
      const User = require('../models/User');
      const user = await User.findById(notification.recipient);
      if (!user || !user.phone) {
        throw new Error('用户手机号不存在');
      }

      // 这里应该集成真实的短信服务
      // 目前使用模拟实现
      const smsResult = await this.sendSMSToPhone(notification, user.phone);

      // 更新通知状态
      await notification.updatePushStatus('sms', {
        sent: true,
        sentAt: new Date(),
        messageId: smsResult.messageId
      });

      logger.info(`短信通知已发送: ${notification._id}`);

      return {
        success: true,
        channel: 'sms',
        sentAt: new Date(),
        messageId: smsResult.messageId
      };
    } catch (error) {
      // 更新失败状态
      await notification.updatePushStatus('sms', {
        sent: false,
        error: error.message
      });
      
      logger.error('发送短信通知失败:', error);
      throw error;
    }
  }

  /**
   * 批量创建通知
   * @param {Array} notifications 通知数据数组
   * @param {String} batchId 批次ID
   * @returns {Promise<Array>} 创建的通知数组
   */
  async createBatchNotifications(notifications, batchId = null) {
    try {
      const batch = batchId || this.generateBatchId();
      const results = [];

      for (const notificationData of notifications) {
        try {
          const notification = await this.createNotification({
            ...notificationData,
            batchId: batch
          });
          if (notification) {
            results.push(notification);
          }
        } catch (error) {
          logger.error('批量创建通知中的单个通知失败:', error);
        }
      }

      logger.info(`批量创建通知完成，批次ID: ${batch}，成功: ${results.length}/${notifications.length}`);
      return results;
    } catch (error) {
      logger.error('批量创建通知失败:', error);
      throw error;
    }
  }

  /**
   * 重试失败的通知
   * @returns {Promise<Object>} 重试结果
   */
  async retryFailedNotifications() {
    try {
      const failedNotifications = await Notification.getRetryNotifications();
      const results = {
        total: failedNotifications.length,
        success: 0,
        failed: 0
      };

      for (const notification of failedNotifications) {
        try {
          // 检查重试次数
          if (notification.retryCount >= 3) {
            logger.warn(`通知 ${notification._id} 重试次数已达上限`);
            continue;
          }

          // 重新发送
          await this.sendNotification(notification);
          
          // 更新重试信息
          notification.retryCount += 1;
          notification.nextRetryAt = null;
          await notification.save();

          results.success++;
        } catch (error) {
          // 设置下次重试时间
          const nextRetry = new Date();
          nextRetry.setMinutes(nextRetry.getMinutes() + Math.pow(2, notification.retryCount) * 5);
          
          notification.retryCount += 1;
          notification.nextRetryAt = nextRetry;
          await notification.save();

          results.failed++;
          logger.error(`重试通知 ${notification._id} 失败:`, error);
        }
      }

      logger.info(`通知重试完成: 总计 ${results.total}，成功 ${results.success}，失败 ${results.failed}`);
      return results;
    } catch (error) {
      logger.error('重试失败通知出错:', error);
      throw error;
    }
  }

  /**
   * 清理过期通知
   * @returns {Promise<Object>} 清理结果
   */
  async cleanupExpiredNotifications() {
    try {
      const result = await Notification.cleanupExpired();
      logger.info(`清理过期通知完成: ${result.deletedCount} 条`);
      return result;
    } catch (error) {
      logger.error('清理过期通知失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户通知设置
   * @param {String} userId 用户ID
   * @returns {Promise<Object>} 用户通知设置
   */
  async getUserNotificationSettings(userId) {
    try {
      let settings = await NotificationSettings.findOne({ user: userId });
      
      if (!settings) {
        // 创建默认设置
        settings = await NotificationSettings.create({ user: userId });
      }

      return settings;
    } catch (error) {
      logger.error('获取用户通知设置失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否在静默时间内
   * @param {Object} settings 用户设置
   * @returns {Boolean} 是否在静默时间
   */
  isInQuietHours(settings) {
    if (!settings.global.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = settings.global.quietHours;

    if (start <= end) {
      // 同一天内的时间范围
      return currentTime >= start && currentTime <= end;
    } else {
      // 跨天的时间范围
      return currentTime >= start || currentTime <= end;
    }
  }

  /**
   * 生成批次ID
   * @returns {String} 批次ID
   */
  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 发送推送到令牌（模拟实现）
   * @param {Object} notification 通知对象
   * @param {Array} tokens 推送令牌数组
   * @returns {Promise<Object>} 发送结果
   */
  async sendPushToTokens(notification, tokens) {
    // 这里应该集成真实的推送服务 (FCM, APNs 等)
    // 目前返回模拟结果
    return {
      messageId: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      success: true,
      tokensCount: tokens.length
    };
  }

  /**
   * 发送短信到手机（模拟实现）
   * @param {Object} notification 通知对象
   * @param {String} phone 手机号
   * @returns {Promise<Object>} 发送结果
   */
  async sendSMSToPhone(notification, phone) {
    // 这里应该集成真实的短信服务
    // 目前返回模拟结果
    return {
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      success: true,
      phone
    };
  }

  /**
   * 创建系统通知
   * @param {Object} data 通知数据
   * @returns {Promise<Object>} 创建的通知
   */
  async createSystemNotification(data) {
    return this.createNotification({
      ...data,
      type: 'system',
      sender: null,
      priority: data.priority || 'high',
      channels: data.channels || ['in_app', 'email']
    });
  }

  /**
   * 创建成就通知
   * @param {String} userId 用户ID
   * @param {Object} achievement 成就对象
   * @returns {Promise<Object>} 创建的通知
   */
  async createAchievementNotification(userId, achievement) {
    return this.createNotification({
      recipient: userId,
      type: 'achievement',
      title: '🎉 恭喜解锁新成就！',
      content: `您已解锁成就「${achievement.name}」`,
      data: {
        objectType: 'achievement',
        objectId: achievement._id,
        extra: {
          achievementName: achievement.name,
          achievementDescription: achievement.description,
          points: achievement.points
        }
      },
      icon: '🏆',
      priority: 'high',
      channels: ['in_app', 'push']
    });
  }

  /**
   * 创建互动通知（点赞、评论等）
   * @param {Object} data 通知数据
   * @returns {Promise<Object>} 创建的通知
   */
  async createInteractionNotification(data) {
    const { type, sender, recipient, objectType, objectId, extra } = data;
    
    let title, content, icon;
    
    switch (type) {
      case 'like':
        title = '有人点赞了您的内容';
        content = `${extra.senderName} 点赞了您的${objectType === 'moment' ? '时光记录' : '内容'}`;
        icon = '👍';
        break;
      case 'comment':
        title = '有人评论了您的内容';
        content = `${extra.senderName} 评论了您的${objectType === 'moment' ? '时光记录' : '内容'}`;
        icon = '💬';
        break;
      case 'follow':
        title = '有新的关注者';
        content = `${extra.senderName} 关注了您`;
        icon = '👥';
        break;
      default:
        title = '新的互动';
        content = '您有新的互动消息';
        icon = '🔔';
    }

    return this.createNotification({
      recipient,
      sender,
      type,
      title,
      content,
      data: {
        objectType,
        objectId,
        extra
      },
      icon,
      priority: 'normal',
      channels: ['in_app', 'push']
    });
  }
}

module.exports = new NotificationService();