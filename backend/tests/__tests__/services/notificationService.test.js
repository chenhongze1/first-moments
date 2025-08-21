const notificationService = require('../../../src/services/notificationService');
const Notification = require('../../../src/models/Notification');
const User = require('../../../src/models/User');
const emailService = require('../../../src/services/emailService');
const mongoose = require('mongoose');

// Mock dependencies
jest.mock('../../../src/models/Notification');
jest.mock('../../../src/models/User');
jest.mock('../../../src/services/emailService');

describe('Notification Service', () => {
  let mockUser;
  let mockNotification;

  beforeEach(() => {
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      settings: {
        notifications: {
          email: true,
          push: true,
          achievements: true,
          moments: true,
          profiles: true,
          system: true
        }
      }
    };

    mockNotification = {
      _id: new mongoose.Types.ObjectId(),
      userId: mockUser._id,
      type: 'achievement',
      title: '新成就解锁',
      message: '您获得了新成就：第一条记录',
      priority: 'medium',
      isRead: false,
      data: {
        achievementId: new mongoose.Types.ObjectId(),
        points: 10
      },
      createdAt: new Date(),
      save: jest.fn().mockResolvedValue(this)
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('通知创建', () => {
    it('应该成功创建通知', async () => {
      Notification.mockImplementation(() => mockNotification);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const notificationData = {
        userId: mockUser._id,
        type: 'achievement',
        title: '新成就解锁',
        message: '您获得了新成就：第一条记录',
        priority: 'medium',
        data: {
          achievementId: new mongoose.Types.ObjectId(),
          points: 10
        }
      };

      const result = await notificationService.createNotification(notificationData);

      expect(Notification).toHaveBeenCalledWith(notificationData);
      expect(mockNotification.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.notification).toBeDefined();
    });

    it('应该处理用户不存在的情况', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const notificationData = {
        userId: new mongoose.Types.ObjectId(),
        type: 'achievement',
        title: '新成就解锁',
        message: '您获得了新成就：第一条记录'
      };

      const result = await notificationService.createNotification(notificationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('用户不存在');
    });

    it('应该处理通知创建失败', async () => {
      const saveError = new Error('数据库保存失败');
      mockNotification.save = jest.fn().mockRejectedValue(saveError);
      Notification.mockImplementation(() => mockNotification);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const notificationData = {
        userId: mockUser._id,
        type: 'achievement',
        title: '新成就解锁',
        message: '您获得了新成就：第一条记录'
      };

      const result = await notificationService.createNotification(notificationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('数据库保存失败');
    });
  });

  describe('成就通知', () => {
    it('应该成功发送成就通知', async () => {
      Notification.mockImplementation(() => mockNotification);
      User.findById = jest.fn().mockResolvedValue(mockUser);
      emailService.sendAchievementNotification = jest.fn().mockResolvedValue({ success: true });

      const achievementData = {
        name: '第一条记录',
        description: '创建了您的第一条时光记录',
        points: 10,
        icon: '🎉'
      };

      const result = await notificationService.sendAchievementNotification(
        mockUser._id,
        achievementData
      );

      expect(result.success).toBe(true);
      expect(mockNotification.save).toHaveBeenCalled();
      expect(emailService.sendAchievementNotification).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.displayName || mockUser.username,
        achievementData
      );
    });

    it('应该在用户禁用成就通知时跳过发送', async () => {
      mockUser.settings.notifications.achievements = false;
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const achievementData = {
        name: '第一条记录',
        description: '创建了您的第一条时光记录',
        points: 10
      };

      const result = await notificationService.sendAchievementNotification(
        mockUser._id,
        achievementData
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('用户已禁用成就通知');
      expect(emailService.sendAchievementNotification).not.toHaveBeenCalled();
    });
  });

  describe('记录通知', () => {
    it('应该成功发送记录点赞通知', async () => {
      Notification.mockImplementation(() => mockNotification);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const likeData = {
        momentId: new mongoose.Types.ObjectId(),
        momentTitle: '美丽的风景',
        likerName: 'Alice',
        likerId: new mongoose.Types.ObjectId()
      };

      const result = await notificationService.sendMomentLikeNotification(
        mockUser._id,
        likeData
      );

      expect(result.success).toBe(true);
      expect(mockNotification.save).toHaveBeenCalled();
    });

    it('应该成功发送记录评论通知', async () => {
      Notification.mockImplementation(() => mockNotification);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const commentData = {
        momentId: new mongoose.Types.ObjectId(),
        momentTitle: '美丽的风景',
        commenterName: 'Bob',
        commenterId: new mongoose.Types.ObjectId(),
        commentContent: '很棒的照片！'
      };

      const result = await notificationService.sendMomentCommentNotification(
        mockUser._id,
        commentData
      );

      expect(result.success).toBe(true);
      expect(mockNotification.save).toHaveBeenCalled();
    });

    it('应该在用户禁用记录通知时跳过发送', async () => {
      mockUser.settings.notifications.moments = false;
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const likeData = {
        momentId: new mongoose.Types.ObjectId(),
        momentTitle: '美丽的风景',
        likerName: 'Alice'
      };

      const result = await notificationService.sendMomentLikeNotification(
        mockUser._id,
        likeData
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('用户已禁用记录通知');
    });
  });

  describe('档案通知', () => {
    it('应该成功发送档案邀请通知', async () => {
      Notification.mockImplementation(() => mockNotification);
      User.findById = jest.fn().mockResolvedValue(mockUser);
      emailService.sendProfileInvitation = jest.fn().mockResolvedValue({ success: true });

      const inviteData = {
        profileId: new mongoose.Types.ObjectId(),
        profileName: '我的旅行档案',
        inviterName: 'Alice',
        inviterId: new mongoose.Types.ObjectId(),
        role: 'editor',
        inviteLink: 'http://localhost:3000/invite?token=abc123'
      };

      const result = await notificationService.sendProfileInviteNotification(
        mockUser._id,
        inviteData
      );

      expect(result.success).toBe(true);
      expect(mockNotification.save).toHaveBeenCalled();
      expect(emailService.sendProfileInvitation).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.displayName || mockUser.username,
        inviteData
      );
    });

    it('应该成功发送档案协作者变更通知', async () => {
      Notification.mockImplementation(() => mockNotification);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const changeData = {
        profileId: new mongoose.Types.ObjectId(),
        profileName: '我的旅行档案',
        action: 'role_changed',
        newRole: 'admin',
        changerName: 'Alice'
      };

      const result = await notificationService.sendProfileCollaboratorNotification(
        mockUser._id,
        changeData
      );

      expect(result.success).toBe(true);
      expect(mockNotification.save).toHaveBeenCalled();
    });

    it('应该在用户禁用档案通知时跳过发送', async () => {
      mockUser.settings.notifications.profiles = false;
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const inviteData = {
        profileId: new mongoose.Types.ObjectId(),
        profileName: '我的旅行档案',
        inviterName: 'Alice',
        role: 'editor'
      };

      const result = await notificationService.sendProfileInviteNotification(
        mockUser._id,
        inviteData
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('用户已禁用档案通知');
    });
  });

  describe('系统通知', () => {
    it('应该成功发送系统通知', async () => {
      Notification.mockImplementation(() => mockNotification);
      User.findById = jest.fn().mockResolvedValue(mockUser);
      emailService.sendNotificationEmail = jest.fn().mockResolvedValue({ success: true });

      const systemData = {
        title: '系统维护通知',
        message: '系统将于今晚进行维护，预计持续2小时',
        priority: 'high',
        actionUrl: 'http://localhost:3000/maintenance'
      };

      const result = await notificationService.sendSystemNotification(
        mockUser._id,
        systemData
      );

      expect(result.success).toBe(true);
      expect(mockNotification.save).toHaveBeenCalled();
      expect(emailService.sendNotificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.displayName || mockUser.username,
        systemData.title,
        systemData.message,
        systemData.actionUrl
      );
    });

    it('应该在用户禁用系统通知时跳过发送', async () => {
      mockUser.settings.notifications.system = false;
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const systemData = {
        title: '系统维护通知',
        message: '系统将于今晚进行维护',
        priority: 'high'
      };

      const result = await notificationService.sendSystemNotification(
        mockUser._id,
        systemData
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('用户已禁用系统通知');
    });
  });

  describe('批量通知', () => {
    it('应该成功发送批量通知', async () => {
      const userIds = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ];

      Notification.insertMany = jest.fn().mockResolvedValue([
        { _id: new mongoose.Types.ObjectId() },
        { _id: new mongoose.Types.ObjectId() },
        { _id: new mongoose.Types.ObjectId() }
      ]);

      const notificationData = {
        type: 'system',
        title: '系统公告',
        message: '欢迎使用新功能！',
        priority: 'medium'
      };

      const result = await notificationService.sendBatchNotifications(
        userIds,
        notificationData
      );

      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
      expect(Notification.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId: userIds[0],
            ...notificationData
          }),
          expect.objectContaining({
            userId: userIds[1],
            ...notificationData
          }),
          expect.objectContaining({
            userId: userIds[2],
            ...notificationData
          })
        ])
      );
    });

    it('应该处理批量通知创建失败', async () => {
      const userIds = [new mongoose.Types.ObjectId()];
      const batchError = new Error('批量插入失败');
      Notification.insertMany = jest.fn().mockRejectedValue(batchError);

      const notificationData = {
        type: 'system',
        title: '系统公告',
        message: '欢迎使用新功能！'
      };

      const result = await notificationService.sendBatchNotifications(
        userIds,
        notificationData
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('批量插入失败');
    });
  });

  describe('通知查询', () => {
    it('应该成功获取用户通知列表', async () => {
      const mockNotifications = [
        {
          _id: new mongoose.Types.ObjectId(),
          type: 'achievement',
          title: '新成就',
          isRead: false,
          createdAt: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: 'moment',
          title: '新点赞',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000)
        }
      ];

      Notification.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue(mockNotifications)
          })
        })
      });

      const result = await notificationService.getUserNotifications(
        mockUser._id,
        { page: 1, limit: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.notifications).toEqual(mockNotifications);
      expect(Notification.find).toHaveBeenCalledWith({ userId: mockUser._id });
    });

    it('应该成功获取未读通知数量', async () => {
      Notification.countDocuments = jest.fn().mockResolvedValue(5);

      const result = await notificationService.getUnreadCount(mockUser._id);

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
      expect(Notification.countDocuments).toHaveBeenCalledWith({
        userId: mockUser._id,
        isRead: false
      });
    });

    it('应该成功按类型获取通知', async () => {
      const mockNotifications = [
        {
          _id: new mongoose.Types.ObjectId(),
          type: 'achievement',
          title: '新成就1'
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: 'achievement',
          title: '新成就2'
        }
      ];

      Notification.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockNotifications)
      });

      const result = await notificationService.getNotificationsByType(
        mockUser._id,
        'achievement'
      );

      expect(result.success).toBe(true);
      expect(result.notifications).toEqual(mockNotifications);
      expect(Notification.find).toHaveBeenCalledWith({
        userId: mockUser._id,
        type: 'achievement'
      });
    });
  });

  describe('通知管理', () => {
    it('应该成功标记通知为已读', async () => {
      const notificationId = new mongoose.Types.ObjectId();
      Notification.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: notificationId,
        isRead: true
      });

      const result = await notificationService.markAsRead(
        notificationId,
        mockUser._id
      );

      expect(result.success).toBe(true);
      expect(Notification.findByIdAndUpdate).toHaveBeenCalledWith(
        notificationId,
        { isRead: true, readAt: expect.any(Date) },
        { new: true }
      );
    });

    it('应该成功批量标记通知为已读', async () => {
      const notificationIds = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ];

      Notification.updateMany = jest.fn().mockResolvedValue({
        modifiedCount: 2
      });

      const result = await notificationService.markMultipleAsRead(
        notificationIds,
        mockUser._id
      );

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(Notification.updateMany).toHaveBeenCalledWith(
        {
          _id: { $in: notificationIds },
          userId: mockUser._id
        },
        {
          isRead: true,
          readAt: expect.any(Date)
        }
      );
    });

    it('应该成功标记所有通知为已读', async () => {
      Notification.updateMany = jest.fn().mockResolvedValue({
        modifiedCount: 10
      });

      const result = await notificationService.markAllAsRead(mockUser._id);

      expect(result.success).toBe(true);
      expect(result.count).toBe(10);
      expect(Notification.updateMany).toHaveBeenCalledWith(
        {
          userId: mockUser._id,
          isRead: false
        },
        {
          isRead: true,
          readAt: expect.any(Date)
        }
      );
    });

    it('应该成功删除通知', async () => {
      const notificationId = new mongoose.Types.ObjectId();
      Notification.findByIdAndDelete = jest.fn().mockResolvedValue({
        _id: notificationId
      });

      const result = await notificationService.deleteNotification(
        notificationId,
        mockUser._id
      );

      expect(result.success).toBe(true);
      expect(Notification.findByIdAndDelete).toHaveBeenCalledWith({
        _id: notificationId,
        userId: mockUser._id
      });
    });

    it('应该成功清理过期通知', async () => {
      Notification.deleteMany = jest.fn().mockResolvedValue({
        deletedCount: 5
      });

      const result = await notificationService.cleanupExpiredNotifications();

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
      expect(Notification.deleteMany).toHaveBeenCalledWith({
        expiresAt: { $lt: expect.any(Date) }
      });
    });
  });

  describe('通知设置', () => {
    it('应该成功更新用户通知设置', async () => {
      const newSettings = {
        email: false,
        push: true,
        achievements: false,
        moments: true,
        profiles: true,
        system: false
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...mockUser,
        settings: {
          ...mockUser.settings,
          notifications: newSettings
        }
      });

      const result = await notificationService.updateNotificationSettings(
        mockUser._id,
        newSettings
      );

      expect(result.success).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        {
          $set: {
            'settings.notifications': newSettings
          }
        },
        { new: true }
      );
    });

    it('应该成功获取用户通知设置', async () => {
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          settings: {
            notifications: mockUser.settings.notifications
          }
        })
      });

      const result = await notificationService.getNotificationSettings(mockUser._id);

      expect(result.success).toBe(true);
      expect(result.settings).toEqual(mockUser.settings.notifications);
    });
  });

  describe('通知统计', () => {
    it('应该成功获取通知统计信息', async () => {
      const mockStats = [
        { _id: 'achievement', count: 5 },
        { _id: 'moment', count: 10 },
        { _id: 'profile', count: 3 },
        { _id: 'system', count: 2 }
      ];

      Notification.aggregate = jest.fn().mockResolvedValue(mockStats);

      const result = await notificationService.getNotificationStats(mockUser._id);

      expect(result.success).toBe(true);
      expect(result.stats).toEqual({
        achievement: 5,
        moment: 10,
        profile: 3,
        system: 2,
        total: 20
      });
    });

    it('应该成功获取系统通知统计', async () => {
      const mockSystemStats = [
        {
          _id: { type: 'achievement', isRead: false },
          count: 100
        },
        {
          _id: { type: 'achievement', isRead: true },
          count: 500
        },
        {
          _id: { type: 'moment', isRead: false },
          count: 200
        },
        {
          _id: { type: 'moment', isRead: true },
          count: 800
        }
      ];

      Notification.aggregate = jest.fn().mockResolvedValue(mockSystemStats);

      const result = await notificationService.getSystemNotificationStats();

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalSent).toBe(1600);
      expect(result.stats.totalUnread).toBe(300);
    });
  });

  describe('推送通知', () => {
    it('应该成功发送推送通知', async () => {
      // Mock push notification service
      const mockPushService = {
        sendToUser: jest.fn().mockResolvedValue({ success: true })
      };
      
      // 假设有推送服务
      notificationService.setPushService(mockPushService);

      const pushData = {
        title: '新消息',
        body: '您有一条新的通知',
        data: {
          type: 'achievement',
          id: new mongoose.Types.ObjectId()
        }
      };

      const result = await notificationService.sendPushNotification(
        mockUser._id,
        pushData
      );

      expect(result.success).toBe(true);
      expect(mockPushService.sendToUser).toHaveBeenCalledWith(
        mockUser._id,
        pushData
      );
    });

    it('应该在用户禁用推送通知时跳过发送', async () => {
      mockUser.settings.notifications.push = false;
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const pushData = {
        title: '新消息',
        body: '您有一条新的通知'
      };

      const result = await notificationService.sendPushNotification(
        mockUser._id,
        pushData
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('用户已禁用推送通知');
    });
  });

  describe('错误处理', () => {
    it('应该处理数据库连接错误', async () => {
      const dbError = new Error('数据库连接失败');
      Notification.mockImplementation(() => {
        throw dbError;
      });

      const notificationData = {
        userId: mockUser._id,
        type: 'achievement',
        title: '新成就解锁',
        message: '您获得了新成就'
      };

      const result = await notificationService.createNotification(notificationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('数据库连接失败');
    });

    it('应该处理邮件发送失败', async () => {
      Notification.mockImplementation(() => mockNotification);
      User.findById = jest.fn().mockResolvedValue(mockUser);
      emailService.sendAchievementNotification = jest.fn().mockResolvedValue({
        success: false,
        error: '邮件发送失败'
      });

      const achievementData = {
        name: '第一条记录',
        description: '创建了您的第一条时光记录',
        points: 10
      };

      const result = await notificationService.sendAchievementNotification(
        mockUser._id,
        achievementData
      );

      // 应该创建通知但邮件发送失败
      expect(result.success).toBe(true); // 通知创建成功
      expect(result.emailSent).toBe(false); // 邮件发送失败
      expect(mockNotification.save).toHaveBeenCalled();
    });

    it('应该处理无效的用户ID', async () => {
      const invalidUserId = 'invalid-user-id';

      const notificationData = {
        userId: invalidUserId,
        type: 'achievement',
        title: '新成就解锁',
        message: '您获得了新成就'
      };

      const result = await notificationService.createNotification(notificationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的用户ID');
    });
  });
});