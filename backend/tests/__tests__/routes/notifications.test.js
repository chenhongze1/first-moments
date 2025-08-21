const request = require('supertest');
const express = require('express');
const notificationRoutes = require('../../../src/routes/notifications');
const Notification = require('../../../src/models/Notification');
const User = require('../../../src/models/User');
const { authenticateToken } = require('../../../src/middleware/auth');

// Mock dependencies
jest.mock('../../../src/models/Notification');
jest.mock('../../../src/models/User');
jest.mock('../../../src/middleware/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

describe('Notification Routes', () => {
  let mockUser;
  let mockNotification;

  beforeEach(() => {
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      settings: {
        notifications: {
          email: true,
          push: true,
          achievements: true,
          comments: true,
          likes: true,
          follows: true
        }
      }
    };

    mockNotification = {
      _id: '507f1f77bcf86cd799439015',
      recipient: mockUser._id,
      sender: '507f1f77bcf86cd799439012',
      type: 'like',
      title: 'New Like',
      message: 'Someone liked your moment',
      data: {
        momentId: '507f1f77bcf86cd799439016',
        momentTitle: 'Beautiful sunset'
      },
      isRead: false,
      isDelivered: true,
      deliveryMethod: 'push',
      priority: 'normal',
      category: 'social',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(this),
      populate: jest.fn().mockResolvedValue(this)
    };

    // Mock authentication middleware
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('应该成功获取通知列表', async () => {
      const mockNotifications = [mockNotification];

      Notification.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue(mockNotifications)
            })
          })
        })
      });

      Notification.countDocuments = jest.fn().mockResolvedValue(1);

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
      expect(Notification.find).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: mockUser._id
        })
      );
    });

    it('应该支持按类型筛选', async () => {
      const type = 'like';

      Notification.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockNotification])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/notifications?type=${type}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Notification.find).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: mockUser._id,
          type: type
        })
      );
    });

    it('应该支持按分类筛选', async () => {
      const category = 'social';

      Notification.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockNotification])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/notifications?category=${category}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Notification.find).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: mockUser._id,
          category: category
        })
      );
    });

    it('应该支持按读取状态筛选', async () => {
      const isRead = false;

      Notification.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockNotification])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/notifications?isRead=${isRead}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Notification.find).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: mockUser._id,
          isRead: isRead
        })
      );
    });

    it('应该支持按优先级筛选', async () => {
      const priority = 'high';

      Notification.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockNotification])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/notifications?priority=${priority}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Notification.find).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: mockUser._id,
          priority: priority
        })
      );
    });

    it('应该支持分页查询', async () => {
      const page = 2;
      const limit = 5;

      Notification.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      Notification.countDocuments = jest.fn().mockResolvedValue(15);

      const response = await request(app)
        .get(`/api/notifications?page=${page}&limit=${limit}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(page);
      expect(response.body.data.pagination.limit).toBe(limit);
      expect(response.body.data.pagination.totalPages).toBe(3);
    });

    it('应该自动过滤过期通知', async () => {
      Notification.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockNotification])
            })
          })
        })
      });

      await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(Notification.find).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: mockUser._id,
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: expect.any(Date) } }
          ]
        })
      );
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('应该成功获取通知详情', async () => {
      Notification.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockNotification)
      });

      const response = await request(app)
        .get(`/api/notifications/${mockNotification._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification).toBeDefined();
      expect(Notification.findById).toHaveBeenCalledWith(mockNotification._id);
    });

    it('应该在通知不存在时返回404', async () => {
      Notification.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get('/api/notifications/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('通知不存在');
    });

    it('应该检查用户访问权限', async () => {
      const otherUserNotification = {
        ...mockNotification,
        recipient: 'other-user-id'
      };

      Notification.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(otherUserNotification)
      });

      const response = await request(app)
        .get(`/api/notifications/${mockNotification._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限访问此通知');
    });

    it('应该自动标记通知为已读', async () => {
      const unreadNotification = {
        ...mockNotification,
        isRead: false,
        save: jest.fn().mockResolvedValue(this)
      };

      Notification.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(unreadNotification)
      });

      const response = await request(app)
        .get(`/api/notifications/${mockNotification._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(unreadNotification.isRead).toBe(true);
      expect(unreadNotification.save).toHaveBeenCalled();
    });
  });

  describe('POST /api/notifications', () => {
    it('应该成功创建通知', async () => {
      const notificationData = {
        recipientId: '507f1f77bcf86cd799439012',
        type: 'comment',
        title: 'New Comment',
        message: 'Someone commented on your moment',
        data: {
          momentId: '507f1f77bcf86cd799439016'
        },
        priority: 'normal',
        category: 'social'
      };

      const newNotification = {
        ...mockNotification,
        ...notificationData,
        recipient: notificationData.recipientId,
        sender: mockUser._id
      };

      User.findById = jest.fn().mockResolvedValue({
        _id: notificationData.recipientId,
        settings: mockUser.settings
      });
      Notification.prototype.save = jest.fn().mockResolvedValue(newNotification);
      Notification.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(newNotification)
      });

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('通知创建成功');
      expect(response.body.data.notification.title).toBe(notificationData.title);
    });

    it('应该验证必填字段', async () => {
      const incompleteData = {
        type: 'comment',
        message: 'Missing recipient and title'
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('接收者ID是必填项');
    });

    it('应该验证接收者存在', async () => {
      const notificationData = {
        recipientId: 'nonexistent-user-id',
        type: 'comment',
        title: 'New Comment',
        message: 'Test message'
      };

      User.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(notificationData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('接收者不存在');
    });

    it('应该验证通知类型', async () => {
      const invalidData = {
        recipientId: '507f1f77bcf86cd799439012',
        type: 'invalid-type',
        title: 'Test Title',
        message: 'Test message'
      };

      User.findById = jest.fn().mockResolvedValue({
        _id: invalidData.recipientId,
        settings: mockUser.settings
      });

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的通知类型');
    });

    it('应该验证标题长度', async () => {
      const invalidData = {
        recipientId: '507f1f77bcf86cd799439012',
        type: 'comment',
        title: 'a'.repeat(201), // 太长
        message: 'Test message'
      };

      User.findById = jest.fn().mockResolvedValue({
        _id: invalidData.recipientId,
        settings: mockUser.settings
      });

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('标题长度不能超过');
    });

    it('应该验证消息长度', async () => {
      const invalidData = {
        recipientId: '507f1f77bcf86cd799439012',
        type: 'comment',
        title: 'Test Title',
        message: 'a'.repeat(1001) // 太长
      };

      User.findById = jest.fn().mockResolvedValue({
        _id: invalidData.recipientId,
        settings: mockUser.settings
      });

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('消息长度不能超过');
    });

    it('应该检查用户通知设置', async () => {
      const notificationData = {
        recipientId: '507f1f77bcf86cd799439012',
        type: 'comment',
        title: 'New Comment',
        message: 'Test message'
      };

      const userWithDisabledComments = {
        _id: notificationData.recipientId,
        settings: {
          notifications: {
            ...mockUser.settings.notifications,
            comments: false // 禁用评论通知
          }
        }
      };

      User.findById = jest.fn().mockResolvedValue(userWithDisabledComments);

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(notificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('用户已禁用此类型通知');
    });

    it('应该防止给自己发送通知', async () => {
      const notificationData = {
        recipientId: mockUser._id, // 给自己发送
        type: 'comment',
        title: 'New Comment',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(notificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('不能给自己发送通知');
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('应该成功标记通知为已读', async () => {
      const unreadNotification = {
        ...mockNotification,
        isRead: false,
        save: jest.fn().mockResolvedValue(this)
      };

      Notification.findById = jest.fn().mockResolvedValue(unreadNotification);

      const response = await request(app)
        .put(`/api/notifications/${mockNotification._id}/read`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('通知已标记为已读');
      expect(unreadNotification.isRead).toBe(true);
      expect(unreadNotification.save).toHaveBeenCalled();
    });

    it('应该检查通知访问权限', async () => {
      const otherUserNotification = {
        ...mockNotification,
        recipient: 'other-user-id'
      };

      Notification.findById = jest.fn().mockResolvedValue(otherUserNotification);

      const response = await request(app)
        .put(`/api/notifications/${mockNotification._id}/read`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限修改此通知');
    });

    it('应该在通知不存在时返回404', async () => {
      Notification.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/notifications/nonexistent-id/read')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('通知不存在');
    });

    it('应该处理已读通知', async () => {
      const readNotification = {
        ...mockNotification,
        isRead: true,
        save: jest.fn().mockResolvedValue(this)
      };

      Notification.findById = jest.fn().mockResolvedValue(readNotification);

      const response = await request(app)
        .put(`/api/notifications/${mockNotification._id}/read`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('通知已标记为已读');
      expect(readNotification.save).not.toHaveBeenCalled(); // 已读状态未改变
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('应该成功标记所有通知为已读', async () => {
      const updateResult = {
        modifiedCount: 5
      };

      Notification.updateMany = jest.fn().mockResolvedValue(updateResult);

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('所有通知已标记为已读');
      expect(response.body.data.updatedCount).toBe(updateResult.modifiedCount);
      expect(Notification.updateMany).toHaveBeenCalledWith(
        {
          recipient: mockUser._id,
          isRead: false
        },
        {
          isRead: true,
          readAt: expect.any(Date)
        }
      );
    });

    it('应该处理没有未读通知的情况', async () => {
      const updateResult = {
        modifiedCount: 0
      };

      Notification.updateMany = jest.fn().mockResolvedValue(updateResult);

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('没有未读通知');
      expect(response.body.data.updatedCount).toBe(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('应该成功删除通知', async () => {
      Notification.findById = jest.fn().mockResolvedValue(mockNotification);
      Notification.findByIdAndDelete = jest.fn().mockResolvedValue(mockNotification);

      const response = await request(app)
        .delete(`/api/notifications/${mockNotification._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('通知删除成功');
      expect(Notification.findByIdAndDelete).toHaveBeenCalledWith(mockNotification._id);
    });

    it('应该检查删除权限', async () => {
      const otherUserNotification = {
        ...mockNotification,
        recipient: 'other-user-id'
      };

      Notification.findById = jest.fn().mockResolvedValue(otherUserNotification);

      const response = await request(app)
        .delete(`/api/notifications/${mockNotification._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限删除此通知');
    });

    it('应该在通知不存在时返回404', async () => {
      Notification.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/notifications/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('通知不存在');
    });

    it('应该处理删除失败', async () => {
      Notification.findById = jest.fn().mockResolvedValue(mockNotification);
      Notification.findByIdAndDelete = jest.fn().mockRejectedValue(
        new Error('删除失败')
      );

      const response = await request(app)
        .delete(`/api/notifications/${mockNotification._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('删除通知失败');
    });
  });

  describe('DELETE /api/notifications/clear-all', () => {
    it('应该成功清空所有通知', async () => {
      const deleteResult = {
        deletedCount: 10
      };

      Notification.deleteMany = jest.fn().mockResolvedValue(deleteResult);

      const response = await request(app)
        .delete('/api/notifications/clear-all')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('所有通知已清空');
      expect(response.body.data.deletedCount).toBe(deleteResult.deletedCount);
      expect(Notification.deleteMany).toHaveBeenCalledWith({
        recipient: mockUser._id
      });
    });

    it('应该处理没有通知的情况', async () => {
      const deleteResult = {
        deletedCount: 0
      };

      Notification.deleteMany = jest.fn().mockResolvedValue(deleteResult);

      const response = await request(app)
        .delete('/api/notifications/clear-all')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('没有通知需要清空');
      expect(response.body.data.deletedCount).toBe(0);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('应该成功获取未读通知数量', async () => {
      const unreadCount = 5;

      Notification.countDocuments = jest.fn().mockResolvedValue(unreadCount);

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unreadCount).toBe(unreadCount);
      expect(Notification.countDocuments).toHaveBeenCalledWith({
        recipient: mockUser._id,
        isRead: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: expect.any(Date) } }
        ]
      });
    });

    it('应该支持按类型统计', async () => {
      const type = 'like';
      const unreadCount = 3;

      Notification.countDocuments = jest.fn().mockResolvedValue(unreadCount);

      const response = await request(app)
        .get(`/api/notifications/unread-count?type=${type}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unreadCount).toBe(unreadCount);
      expect(Notification.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: mockUser._id,
          isRead: false,
          type: type
        })
      );
    });
  });

  describe('GET /api/notifications/stats', () => {
    it('应该成功获取通知统计信息', async () => {
      const mockStats = {
        totalNotifications: 50,
        unreadNotifications: 5,
        readNotifications: 45,
        byType: {
          like: 20,
          comment: 15,
          follow: 10,
          achievement: 5
        },
        byCategory: {
          social: 35,
          system: 10,
          achievement: 5
        }
      };

      Notification.countDocuments = jest.fn()
        .mockResolvedValueOnce(mockStats.totalNotifications)
        .mockResolvedValueOnce(mockStats.unreadNotifications)
        .mockResolvedValueOnce(mockStats.readNotifications);

      Notification.aggregate = jest.fn()
        .mockResolvedValueOnce([
          { _id: 'like', count: 20 },
          { _id: 'comment', count: 15 },
          { _id: 'follow', count: 10 },
          { _id: 'achievement', count: 5 }
        ])
        .mockResolvedValueOnce([
          { _id: 'social', count: 35 },
          { _id: 'system', count: 10 },
          { _id: 'achievement', count: 5 }
        ]);

      const response = await request(app)
        .get('/api/notifications/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalNotifications).toBe(mockStats.totalNotifications);
      expect(response.body.data.stats.byType).toBeDefined();
      expect(response.body.data.stats.byCategory).toBeDefined();
    });
  });

  describe('POST /api/notifications/test', () => {
    it('应该成功发送测试通知', async () => {
      const testData = {
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification'
      };

      const testNotification = {
        ...mockNotification,
        ...testData,
        recipient: mockUser._id,
        sender: null
      };

      Notification.prototype.save = jest.fn().mockResolvedValue(testNotification);

      const response = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', 'Bearer valid-token')
        .send(testData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('测试通知发送成功');
      expect(response.body.data.notification.title).toBe(testData.title);
    });

    it('应该验证测试通知数据', async () => {
      const invalidData = {
        type: 'invalid-type',
        title: '',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('错误处理', () => {
    it('应该处理数据库连接错误', async () => {
      Notification.find = jest.fn().mockRejectedValue(
        new Error('数据库连接失败')
      );

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('服务器错误');
    });

    it('应该处理无效的ObjectId', async () => {
      const response = await request(app)
        .get('/api/notifications/invalid-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的通知ID');
    });

    it('应该处理未认证的请求', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        return res.status(401).json({
          success: false,
          message: '未认证'
        });
      });

      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未认证');
    });
  });

  describe('输入验证', () => {
    it('应该验证通知优先级', async () => {
      const invalidData = {
        recipientId: '507f1f77bcf86cd799439012',
        type: 'comment',
        title: 'Test Title',
        message: 'Test message',
        priority: 'invalid-priority'
      };

      User.findById = jest.fn().mockResolvedValue({
        _id: invalidData.recipientId,
        settings: mockUser.settings
      });

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的优先级');
    });

    it('应该验证通知分类', async () => {
      const invalidData = {
        recipientId: '507f1f77bcf86cd799439012',
        type: 'comment',
        title: 'Test Title',
        message: 'Test message',
        category: 'invalid-category'
      };

      User.findById = jest.fn().mockResolvedValue({
        _id: invalidData.recipientId,
        settings: mockUser.settings
      });

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的分类');
    });

    it('应该验证过期时间', async () => {
      const invalidData = {
        recipientId: '507f1f77bcf86cd799439012',
        type: 'comment',
        title: 'Test Title',
        message: 'Test message',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 过去的时间
      };

      User.findById = jest.fn().mockResolvedValue({
        _id: invalidData.recipientId,
        settings: mockUser.settings
      });

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('过期时间不能是过去的时间');
    });

    it('应该验证附加数据格式', async () => {
      const invalidData = {
        recipientId: '507f1f77bcf86cd799439012',
        type: 'comment',
        title: 'Test Title',
        message: 'Test message',
        data: 'invalid-data-format' // 应该是对象
      };

      User.findById = jest.fn().mockResolvedValue({
        _id: invalidData.recipientId,
        settings: mockUser.settings
      });

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('附加数据必须是对象格式');
    });
  });
});