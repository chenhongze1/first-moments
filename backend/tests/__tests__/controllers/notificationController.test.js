const request = require('supertest');
const app = require('../../testApp');
const Notification = require('../../../src/models/Notification');
const NotificationSettings = require('../../../src/models/NotificationSettings');

describe('Notification Controller', () => {
  let testUser;
  let authToken;
  let testProfile;
  let testNotification;
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    testUser = await createTestUser();
    authToken = generateAuthToken(testUser._id);
    testProfile = await createTestProfile(testUser._id);
    
    // 创建管理员用户
    adminUser = await createTestUser();
    adminUser.email = 'admin@example.com';
    adminUser.username = 'admin';
    adminUser.role = 'admin';
    await adminUser.save();
    adminToken = generateAuthToken(adminUser._id);
    
    // 创建测试通知
    testNotification = new Notification({
      userId: testUser._id,
      type: 'achievement',
      title: '测试通知',
      message: '这是一个测试通知',
      data: {
        achievementId: '507f1f77bcf86cd799439011',
        achievementName: '测试成就'
      },
      isRead: false,
      priority: 'normal'
    });
    await testNotification.save();
  });

  describe('GET /api/notifications', () => {
    it('应该获取用户的通知列表', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].title).toBe('测试通知');
      expect(response.body.data.total).toBe(1);
    });

    it('应该支持按类型筛选通知', async () => {
      // 创建不同类型的通知
      const systemNotification = new Notification({
        userId: testUser._id,
        type: 'system',
        title: '系统通知',
        message: '系统消息',
        isRead: false
      });
      await systemNotification.save();

      const response = await request(app)
        .get('/api/notifications?type=system')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].type).toBe('system');
    });

    it('应该支持按已读状态筛选通知', async () => {
      const response = await request(app)
        .get('/api/notifications?isRead=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].isRead).toBe(false);
    });

    it('应该支持按优先级筛选通知', async () => {
      // 创建高优先级通知
      const urgentNotification = new Notification({
        userId: testUser._id,
        type: 'system',
        title: '紧急通知',
        message: '紧急消息',
        priority: 'high',
        isRead: false
      });
      await urgentNotification.save();

      const response = await request(app)
        .get('/api/notifications?priority=high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].priority).toBe('high');
    });

    it('应该支持分页查询', async () => {
      // 创建更多通知
      for (let i = 0; i < 5; i++) {
        const notification = new Notification({
          userId: testUser._id,
          type: 'system',
          title: `通知${i}`,
          message: `消息${i}`,
          isRead: false
        });
        await notification.save();
      }

      const response = await request(app)
        .get('/api/notifications?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(3);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(3);
    });

    it('应该拒绝未认证的请求', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供认证令牌');
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('应该获取指定通知详情', async () => {
      const response = await request(app)
        .get(`/api/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('测试通知');
      expect(response.body.data.message).toBe('这是一个测试通知');
      expect(response.body.data.type).toBe('achievement');
      expect(response.body.data.data.achievementName).toBe('测试成就');
    });

    it('应该拒绝访问不存在的通知', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/notifications/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('通知不存在');
    });

    it('应该拒绝访问他人的通知', async () => {
      // 创建另一个用户的通知
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherNotification = new Notification({
        userId: anotherUser._id,
        type: 'system',
        title: '他人通知',
        message: '他人消息',
        isRead: false
      });
      await anotherNotification.save();

      const response = await request(app)
        .get(`/api/notifications/${anotherNotification._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限访问此通知');
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('应该成功标记通知为已读', async () => {
      const response = await request(app)
        .put(`/api/notifications/${testNotification._id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('通知已标记为已读');

      // 验证数据库中的状态已更新
      const updatedNotification = await Notification.findById(testNotification._id);
      expect(updatedNotification.isRead).toBe(true);
      expect(updatedNotification.readAt).toBeDefined();
    });

    it('应该拒绝标记不存在的通知', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('通知不存在');
    });

    it('应该拒绝标记他人的通知', async () => {
      // 创建另一个用户的通知
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherNotification = new Notification({
        userId: anotherUser._id,
        type: 'system',
        title: '他人通知',
        message: '他人消息',
        isRead: false
      });
      await anotherNotification.save();

      const response = await request(app)
        .put(`/api/notifications/${anotherNotification._id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限操作此通知');
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('应该成功标记所有通知为已读', async () => {
      // 创建更多未读通知
      for (let i = 0; i < 3; i++) {
        const notification = new Notification({
          userId: testUser._id,
          type: 'system',
          title: `通知${i}`,
          message: `消息${i}`,
          isRead: false
        });
        await notification.save();
      }

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modifiedCount).toBe(4); // 包括初始的testNotification
      expect(response.body.message).toContain('所有通知已标记为已读');

      // 验证所有通知都已标记为已读
      const unreadCount = await Notification.countDocuments({
        userId: testUser._id,
        isRead: false
      });
      expect(unreadCount).toBe(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('应该成功删除通知', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('通知删除成功');

      // 验证通知已从数据库中删除
      const deletedNotification = await Notification.findById(testNotification._id);
      expect(deletedNotification).toBeNull();
    });

    it('应该拒绝删除不存在的通知', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/notifications/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('通知不存在');
    });

    it('应该拒绝删除他人的通知', async () => {
      // 创建另一个用户的通知
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherNotification = new Notification({
        userId: anotherUser._id,
        type: 'system',
        title: '他人通知',
        message: '他人消息',
        isRead: false
      });
      await anotherNotification.save();

      const response = await request(app)
        .delete(`/api/notifications/${anotherNotification._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限删除此通知');
    });
  });

  describe('DELETE /api/notifications/batch', () => {
    it('应该成功批量删除通知', async () => {
      // 创建更多通知
      const notifications = [];
      for (let i = 0; i < 3; i++) {
        const notification = new Notification({
          userId: testUser._id,
          type: 'system',
          title: `通知${i}`,
          message: `消息${i}`,
          isRead: false
        });
        await notification.save();
        notifications.push(notification._id.toString());
      }

      const response = await request(app)
        .delete('/api/notifications/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notificationIds: notifications })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCount).toBe(3);
      expect(response.body.message).toContain('批量删除成功');

      // 验证通知已从数据库中删除
      for (const id of notifications) {
        const deletedNotification = await Notification.findById(id);
        expect(deletedNotification).toBeNull();
      }
    });

    it('应该拒绝删除他人的通知', async () => {
      // 创建另一个用户的通知
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherNotification = new Notification({
        userId: anotherUser._id,
        type: 'system',
        title: '他人通知',
        message: '他人消息',
        isRead: false
      });
      await anotherNotification.save();

      const response = await request(app)
        .delete('/api/notifications/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notificationIds: [anotherNotification._id.toString()] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCount).toBe(0); // 没有删除任何通知
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('应该获取未读通知数量', async () => {
      // 创建更多未读通知
      for (let i = 0; i < 3; i++) {
        const notification = new Notification({
          userId: testUser._id,
          type: 'system',
          title: `通知${i}`,
          message: `消息${i}`,
          isRead: false
        });
        await notification.save();
      }

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(4); // 包括初始的testNotification
    });
  });

  describe('GET /api/notifications/stats', () => {
    it('应该获取通知统计信息', async () => {
      // 创建不同类型和状态的通知
      const notifications = [
        { type: 'system', isRead: true },
        { type: 'achievement', isRead: false },
        { type: 'social', isRead: true },
        { type: 'system', isRead: false }
      ];

      for (const notifData of notifications) {
        const notification = new Notification({
          userId: testUser._id,
          type: notifData.type,
          title: '统计通知',
          message: '统计消息',
          isRead: notifData.isRead
        });
        await notification.save();
      }

      const response = await request(app)
        .get('/api/notifications/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(5); // 包括初始的testNotification
      expect(response.body.data.unread).toBe(3);
      expect(response.body.data.read).toBe(2);
      expect(response.body.data.typeStats).toBeDefined();
    });
  });

  describe('POST /api/notifications (Admin)', () => {
    it('应该允许管理员创建通知', async () => {
      const notificationData = {
        userId: testUser._id.toString(),
        type: 'system',
        title: '管理员通知',
        message: '这是管理员发送的通知',
        priority: 'high',
        data: {
          adminMessage: true
        }
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(notificationData.title);
      expect(response.body.data.message).toBe(notificationData.message);
      expect(response.body.data.priority).toBe(notificationData.priority);
      expect(response.body.data.userId).toBe(testUser._id.toString());

      // 验证通知已保存到数据库
      const savedNotification = await Notification.findById(response.body.data._id);
      expect(savedNotification).toBeTruthy();
      expect(savedNotification.title).toBe(notificationData.title);
    });

    it('应该拒绝普通用户创建通知', async () => {
      const notificationData = {
        userId: testUser._id.toString(),
        type: 'system',
        title: '尝试创建通知',
        message: '普通用户尝试创建通知'
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('需要管理员权限');
    });

    it('应该拒绝无效的通知数据', async () => {
      const invalidData = {
        userId: testUser._id.toString(),
        type: 'invalid-type', // 无效类型
        title: '', // 空标题
        message: 'a'.repeat(1001) // 消息太长
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('POST /api/notifications/push (Admin)', () => {
    it('应该允许管理员发送推送通知', async () => {
      const pushData = {
        userIds: [testUser._id.toString()],
        title: '推送通知',
        message: '这是一条推送通知',
        data: {
          action: 'open_app'
        }
      };

      const response = await request(app)
        .post('/api/notifications/push')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pushData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sentCount).toBe(1);
      expect(response.body.message).toContain('推送通知发送成功');
    });

    it('应该拒绝普通用户发送推送通知', async () => {
      const pushData = {
        userIds: [testUser._id.toString()],
        title: '尝试推送',
        message: '普通用户尝试推送'
      };

      const response = await request(app)
        .post('/api/notifications/push')
        .set('Authorization', `Bearer ${authToken}`)
        .send(pushData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('需要管理员权限');
    });
  });

  describe('GET /api/notifications/settings', () => {
    it('应该获取用户通知设置', async () => {
      // 创建用户通知设置
      const settings = new NotificationSettings({
        userId: testUser._id,
        globalEnabled: true,
        silentHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00'
        },
        types: {
          achievement: {
            enabled: true,
            push: true,
            email: false,
            inApp: true
          },
          system: {
            enabled: true,
            push: true,
            email: true,
            inApp: true
          }
        }
      });
      await settings.save();

      const response = await request(app)
        .get('/api/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.globalEnabled).toBe(true);
      expect(response.body.data.silentHours.enabled).toBe(true);
      expect(response.body.data.types.achievement.enabled).toBe(true);
    });

    it('应该返回默认设置当用户没有自定义设置时', async () => {
      const response = await request(app)
        .get('/api/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.globalEnabled).toBe(true); // 默认值
      expect(response.body.data.types).toBeDefined();
    });
  });

  describe('PUT /api/notifications/settings', () => {
    it('应该成功更新通知设置', async () => {
      const settingsData = {
        globalEnabled: false,
        silentHours: {
          enabled: true,
          startTime: '23:00',
          endTime: '07:00'
        },
        types: {
          achievement: {
            enabled: true,
            push: false,
            email: true,
            inApp: true
          },
          system: {
            enabled: false,
            push: false,
            email: false,
            inApp: false
          }
        }
      };

      const response = await request(app)
        .put('/api/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.globalEnabled).toBe(false);
      expect(response.body.data.silentHours.startTime).toBe('23:00');
      expect(response.body.data.types.achievement.push).toBe(false);
      expect(response.body.data.types.system.enabled).toBe(false);

      // 验证数据库中的设置已更新
      const updatedSettings = await NotificationSettings.findOne({ userId: testUser._id });
      expect(updatedSettings.globalEnabled).toBe(false);
      expect(updatedSettings.types.achievement.push).toBe(false);
    });

    it('应该拒绝无效的设置数据', async () => {
      const invalidData = {
        globalEnabled: 'invalid', // 应该是布尔值
        silentHours: {
          startTime: '25:00' // 无效时间
        }
      };

      const response = await request(app)
        .put('/api/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('POST /api/notifications/push-token', () => {
    it('应该成功添加推送令牌', async () => {
      const tokenData = {
        token: 'test-push-token-123',
        deviceId: 'test-device-123',
        platform: 'ios'
      };

      const response = await request(app)
        .post('/api/notifications/push-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tokenData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('推送令牌添加成功');
    });

    it('应该拒绝无效的令牌数据', async () => {
      const invalidData = {
        token: '', // 空令牌
        deviceId: '',
        platform: 'invalid-platform' // 无效平台
      };

      const response = await request(app)
        .post('/api/notifications/push-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('DELETE /api/notifications/push-token/:deviceId', () => {
    it('应该成功移除推送令牌', async () => {
      const deviceId = 'test-device-123';

      const response = await request(app)
        .delete(`/api/notifications/push-token/${deviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('推送令牌移除成功');
    });

    it('应该拒绝无效的设备ID', async () => {
      const invalidDeviceId = '';

      const response = await request(app)
        .delete(`/api/notifications/push-token/${invalidDeviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });
});