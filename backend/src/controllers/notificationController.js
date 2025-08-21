const { Notification, NotificationSettings } = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');

// 获取用户通知列表
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      type,
      isRead,
      priority,
      startDate,
      endDate
    } = req.query;

    // 构建查询条件
    const query = {
      recipient: userId,
      isDeleted: false
    };

    // 添加筛选条件
    if (type) {
      query.type = type;
    }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    if (priority) {
      query.priority = priority;
    }

    // 日期范围筛选
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // 分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // 查询通知
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'username avatar nickname')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          count: total,
          limit: limitNum,
          hasNext: hasNextPage,
          hasPrev: hasPrevPage
        }
      }
    });
  } catch (error) {
    logger.error('获取通知列表错误:', error);
    next(error);
  }
};

// 获取通知详情
const getNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient: userId,
      isDeleted: false
    }).populate('sender', 'username avatar nickname');

    if (!notification) {
      return next(new AppError('通知不存在', 404));
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error('获取通知详情错误:', error);
    next(error);
  }
};

// 标记通知为已读
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient: userId,
      isDeleted: false
    });

    if (!notification) {
      return next(new AppError('通知不存在', 404));
    }

    if (!notification.isRead) {
      await notification.markAsRead();
    }

    res.status(200).json({
      success: true,
      message: '通知已标记为已读'
    });
  } catch (error) {
    logger.error('标记通知为已读错误:', error);
    next(error);
  }
};

// 标记所有通知为已读
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    const query = {
      recipient: userId,
      isRead: false,
      isDeleted: false
    };

    if (type) {
      query.type = type;
    }

    const result = await Notification.markAllAsRead(userId, type);

    res.status(200).json({
      success: true,
      message: `已标记 ${result.modifiedCount} 条通知为已读`
    });
  } catch (error) {
    logger.error('标记所有通知为已读错误:', error);
    next(error);
  }
};

// 删除通知
const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { permanent = false } = req.query;

    const notification = await Notification.findOne({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return next(new AppError('通知不存在', 404));
    }

    if (permanent === 'true' || notification.isDeleted) {
      // 永久删除
      await Notification.findByIdAndDelete(id);
    } else {
      // 软删除
      await notification.softDelete();
    }

    res.status(200).json({
      success: true,
      message: '通知删除成功'
    });
  } catch (error) {
    logger.error('删除通知错误:', error);
    next(error);
  }
};

// 批量删除通知
const batchDeleteNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { ids, permanent = false } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('请提供要删除的通知ID列表', 400));
    }

    const query = {
      _id: { $in: ids },
      recipient: userId
    };

    if (permanent) {
      // 永久删除
      const result = await Notification.deleteMany(query);
      res.status(200).json({
        success: true,
        message: `已永久删除 ${result.deletedCount} 条通知`
      });
    } else {
      // 软删除
      const result = await Notification.updateMany(query, {
        isDeleted: true,
        deletedAt: new Date()
      });
      res.status(200).json({
        success: true,
        message: `已删除 ${result.modifiedCount} 条通知`
      });
    }
  } catch (error) {
    logger.error('批量删除通知错误:', error);
    next(error);
  }
};

// 获取未读通知数量
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    const count = await Notification.getUnreadCount(userId, type);

    res.status(200).json({
      success: true,
      data: {
        count
      }
    });
  } catch (error) {
    logger.error('获取未读通知数量错误:', error);
    next(error);
  }
};

// 创建通知
const createNotification = async (req, res, next) => {
  try {
    const {
      recipient,
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
      expiresAt
    } = req.body;

    const notification = await notificationService.createNotification({
      recipient,
      sender: req.user?.id,
      type,
      title,
      content,
      data,
      icon,
      image,
      actionUrl,
      actions,
      priority,
      channels,
      expiresAt
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: '通知创建成功'
    });
  } catch (error) {
    logger.error('创建通知错误:', error);
    next(error);
  }
};

// 发送推送通知
const sendPushNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { channels } = req.body;

    const notification = await Notification.findById(id);
    if (!notification) {
      return next(new AppError('通知不存在', 404));
    }

    const result = await notificationService.sendNotification(notification, channels);

    res.status(200).json({
      success: true,
      data: result,
      message: '推送通知发送成功'
    });
  } catch (error) {
    logger.error('发送推送通知错误:', error);
    next(error);
  }
};

// 获取通知设置
const getNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let settings = await NotificationSettings.findOne({ user: userId });
    
    if (!settings) {
      // 创建默认设置
      settings = await NotificationSettings.create({ user: userId });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('获取通知设置错误:', error);
    next(error);
  }
};

// 更新通知设置
const updateNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    let settings = await NotificationSettings.findOne({ user: userId });
    
    if (!settings) {
      // 创建新设置
      settings = await NotificationSettings.create({
        user: userId,
        ...updateData
      });
    } else {
      // 更新现有设置
      Object.assign(settings, updateData);
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings,
      message: '通知设置更新成功'
    });
  } catch (error) {
    logger.error('更新通知设置错误:', error);
    next(error);
  }
};

// 添加推送令牌
const addPushToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token, platform, deviceId } = req.body;

    let settings = await NotificationSettings.findOne({ user: userId });
    
    if (!settings) {
      settings = await NotificationSettings.create({ user: userId });
    }

    await settings.addPushToken(token, platform, deviceId);

    res.status(200).json({
      success: true,
      message: '推送令牌添加成功'
    });
  } catch (error) {
    logger.error('添加推送令牌错误:', error);
    next(error);
  }
};

// 移除推送令牌
const removePushToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.params;

    const settings = await NotificationSettings.findOne({ user: userId });
    
    if (settings) {
      await settings.removePushToken(deviceId);
    }

    res.status(200).json({
      success: true,
      message: '推送令牌移除成功'
    });
  } catch (error) {
    logger.error('移除推送令牌错误:', error);
    next(error);
  }
};

// 获取通知统计
const getNotificationStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const matchStage = {
      recipient: userId,
      isDeleted: false
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.createdAt.$lte = new Date(endDate);
      }
    }

    const stats = await Notification.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$isRead', false] }, 1, 0]
            }
          },
          byType: {
            $push: {
              type: '$type',
              isRead: '$isRead',
              priority: '$priority'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          unread: 1,
          read: { $subtract: ['$total', '$unread'] },
          byType: 1
        }
      }
    ]);

    // 按类型统计
    const typeStats = {};
    const priorityStats = { low: 0, normal: 0, high: 0, urgent: 0 };
    
    if (stats[0] && stats[0].byType) {
      stats[0].byType.forEach(item => {
        if (!typeStats[item.type]) {
          typeStats[item.type] = { total: 0, unread: 0 };
        }
        typeStats[item.type].total++;
        if (!item.isRead) {
          typeStats[item.type].unread++;
        }
        priorityStats[item.priority]++;
      });
    }

    const result = stats[0] || { total: 0, unread: 0, read: 0 };
    result.typeStats = typeStats;
    result.priorityStats = priorityStats;
    delete result.byType;

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('获取通知统计错误:', error);
    next(error);
  }
};

module.exports = {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  batchDeleteNotifications,
  getUnreadCount,
  createNotification,
  sendPushNotification,
  getNotificationSettings,
  updateNotificationSettings,
  addPushToken,
  removePushToken,
  getNotificationStats
};