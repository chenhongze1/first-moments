const mongoose = require('mongoose');
const Notification = require('../../../src/models/Notification');
const User = require('../../../src/models/User');

describe('Notification Model', () => {
  let user;
  let sender;

  beforeEach(async () => {
    // 创建测试用户
    user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();

    sender = new User({
      username: 'sender',
      email: 'sender@example.com',
      password: 'password123'
    });
    await sender.save();
  });

  afterEach(async () => {
    await Notification.deleteMany({});
    await User.deleteMany({});
  });

  describe('通知创建', () => {
    it('应该成功创建通知', async () => {
      const notificationData = {
        userId: user._id,
        type: 'system',
        title: '系统通知',
        message: '这是一条系统通知',
        priority: 'medium'
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification._id).toBeDefined();
      expect(savedNotification.userId.toString()).toBe(user._id.toString());
      expect(savedNotification.type).toBe('system');
      expect(savedNotification.title).toBe('系统通知');
      expect(savedNotification.message).toBe('这是一条系统通知');
      expect(savedNotification.priority).toBe('medium');
      expect(savedNotification.createdAt).toBeDefined();
      expect(savedNotification.updatedAt).toBeDefined();
    });

    it('应该设置默认值', async () => {
      const notification = new Notification({
        userId: user._id,
        type: 'system',
        title: '测试通知',
        message: '测试消息'
      });
      const savedNotification = await notification.save();

      expect(savedNotification.priority).toBe('low');
      expect(savedNotification.isRead).toBe(false);
      expect(savedNotification.readAt).toBeUndefined();
    });

    it('应该支持不同的通知类型', async () => {
      const types = ['system', 'achievement', 'social', 'reminder', 'update'];
      
      for (const type of types) {
        const notification = new Notification({
          userId: user._id,
          type: type,
          title: `${type}通知`,
          message: `这是${type}类型的通知`
        });
        const savedNotification = await notification.save();
        expect(savedNotification.type).toBe(type);
      }
    });

    it('应该支持不同的优先级', async () => {
      const priorities = ['low', 'medium', 'high', 'urgent'];
      
      for (const priority of priorities) {
        const notification = new Notification({
          userId: user._id,
          type: 'system',
          title: '测试通知',
          message: '测试消息',
          priority: priority
        });
        const savedNotification = await notification.save();
        expect(savedNotification.priority).toBe(priority);
      }
    });
  });

  describe('数据验证', () => {
    it('应该要求必填字段', async () => {
      const notification = new Notification({});
      const error = notification.validateSync();

      expect(error.errors.userId).toBeDefined();
      expect(error.errors.type).toBeDefined();
      expect(error.errors.title).toBeDefined();
      expect(error.errors.message).toBeDefined();
    });

    it('应该验证userId格式', async () => {
      const notification = new Notification({
        userId: 'invalid-id',
        type: 'system',
        title: '测试通知',
        message: '测试消息'
      });
      const error = notification.validateSync();

      expect(error.errors.userId).toBeDefined();
    });

    it('应该验证senderId格式', async () => {
      const notification = new Notification({
        userId: user._id,
        senderId: 'invalid-id',
        type: 'social',
        title: '测试通知',
        message: '测试消息'
      });
      const error = notification.validateSync();

      expect(error.errors.senderId).toBeDefined();
    });

    it('应该验证标题长度', async () => {
      const notification = new Notification({
        userId: user._id,
        type: 'system',
        title: 'a'.repeat(201), // 超过200字符
        message: '测试消息'
      });
      const error = notification.validateSync();

      expect(error.errors.title).toBeDefined();
    });

    it('应该验证消息长度', async () => {
      const notification = new Notification({
        userId: user._id,
        type: 'system',
        title: '测试通知',
        message: 'a'.repeat(1001) // 超过1000字符
      });
      const error = notification.validateSync();

      expect(error.errors.message).toBeDefined();
    });

    it('应该验证类型枚举值', async () => {
      const notification = new Notification({
        userId: user._id,
        type: 'invalid_type',
        title: '测试通知',
        message: '测试消息'
      });
      const error = notification.validateSync();

      expect(error.errors.type).toBeDefined();
    });

    it('应该验证优先级枚举值', async () => {
      const notification = new Notification({
        userId: user._id,
        type: 'system',
        title: '测试通知',
        message: '测试消息',
        priority: 'invalid_priority'
      });
      const error = notification.validateSync();

      expect(error.errors.priority).toBeDefined();
    });
  });

  describe('通知数据', () => {
    it('应该支持附加数据', async () => {
      const notification = new Notification({
        userId: user._id,
        type: 'achievement',
        title: '成就解锁',
        message: '恭喜您解锁新成就！',
        data: {
          achievementId: new mongoose.Types.ObjectId(),
          points: 100,
          category: 'milestone'
        }
      });
      const savedNotification = await notification.save();

      expect(savedNotification.data.achievementId).toBeDefined();
      expect(savedNotification.data.points).toBe(100);
      expect(savedNotification.data.category).toBe('milestone');
    });

    it('应该支持动作按钮', async () => {
      const notification = new Notification({
        userId: user._id,
        type: 'social',
        title: '好友请求',
        message: '有人想加您为好友',
        actions: [
          {
            label: '接受',
            action: 'accept_friend',
            style: 'primary'
          },
          {
            label: '拒绝',
            action: 'reject_friend',
            style: 'secondary'
          }
        ]
      });
      const savedNotification = await notification.save();

      expect(savedNotification.actions).toHaveLength(2);
      expect(savedNotification.actions[0].label).toBe('接受');
      expect(savedNotification.actions[0].action).toBe('accept_friend');
      expect(savedNotification.actions[0].style).toBe('primary');
    });
  });

  describe('通知状态', () => {
    it('应该能标记为已读', async () => {
      const notification = new Notification({
        userId: user._id,
        type: 'system',
        title: '测试通知',
        message: '测试消息'
      });
      await notification.save();

      notification.isRead = true;
      notification.readAt = new Date();
      const updatedNotification = await notification.save();

      expect(updatedNotification.isRead).toBe(true);
      expect(updatedNotification.readAt).toBeDefined();
    });

    it('应该能设置过期时间', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后
      const notification = new Notification({
        userId: user._id,
        type: 'system',
        title: '临时通知',
        message: '这是一个临时通知',
        expiresAt: expiresAt
      });
      const savedNotification = await notification.save();

      expect(savedNotification.expiresAt).toEqual(expiresAt);
    });
  });

  describe('索引', () => {
    it('应该有userId索引', async () => {
      const indexes = await Notification.collection.getIndexes();
      expect(indexes).toHaveProperty('userId_1');
    });

    it('应该有type索引', async () => {
      const indexes = await Notification.collection.getIndexes();
      expect(indexes).toHaveProperty('type_1');
    });

    it('应该有isRead索引', async () => {
      const indexes = await Notification.collection.getIndexes();
      expect(indexes).toHaveProperty('isRead_1');
    });

    it('应该有priority索引', async () => {
      const indexes = await Notification.collection.getIndexes();
      expect(indexes).toHaveProperty('priority_1');
    });

    it('应该有createdAt索引', async () => {
      const indexes = await Notification.collection.getIndexes();
      expect(indexes).toHaveProperty('createdAt_1');
    });

    it('应该有expiresAt的TTL索引', async () => {
      const indexes = await Notification.collection.getIndexes();
      expect(indexes).toHaveProperty('expiresAt_1');
    });
  });

  describe('中间件', () => {
    it('应该在保存时自动更新updatedAt字段', async () => {
      const notification = new Notification({
        userId: user._id,
        type: 'system',
        title: '测试通知',
        message: '测试消息'
      });
      const savedNotification = await notification.save();
      const originalUpdatedAt = savedNotification.updatedAt;

      // 等待一毫秒确保时间差异
      await new Promise(resolve => setTimeout(resolve, 1));
      
      savedNotification.isRead = true;
      const updatedNotification = await savedNotification.save();

      expect(updatedNotification.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('查询方法', () => {
    beforeEach(async () => {
      // 创建测试数据
      await Notification.create([
        {
          userId: user._id,
          type: 'system',
          title: '系统通知1',
          message: '系统消息1',
          priority: 'high',
          isRead: false
        },
        {
          userId: user._id,
          type: 'achievement',
          title: '成就通知',
          message: '成就消息',
          priority: 'medium',
          isRead: true,
          readAt: new Date()
        },
        {
          userId: user._id,
          senderId: sender._id,
          type: 'social',
          title: '社交通知',
          message: '社交消息',
          priority: 'low',
          isRead: false
        }
      ]);
    });

    it('应该能按用户查找通知', async () => {
      const notifications = await Notification.find({ userId: user._id });
      expect(notifications).toHaveLength(3);
    });

    it('应该能按类型查找通知', async () => {
      const systemNotifications = await Notification.find({ type: 'system' });
      const achievementNotifications = await Notification.find({ type: 'achievement' });
      const socialNotifications = await Notification.find({ type: 'social' });
      
      expect(systemNotifications).toHaveLength(1);
      expect(achievementNotifications).toHaveLength(1);
      expect(socialNotifications).toHaveLength(1);
    });

    it('应该能按已读状态查找通知', async () => {
      const unreadNotifications = await Notification.find({ isRead: false });
      const readNotifications = await Notification.find({ isRead: true });
      
      expect(unreadNotifications).toHaveLength(2);
      expect(readNotifications).toHaveLength(1);
    });

    it('应该能按优先级查找通知', async () => {
      const highPriorityNotifications = await Notification.find({ priority: 'high' });
      const mediumPriorityNotifications = await Notification.find({ priority: 'medium' });
      const lowPriorityNotifications = await Notification.find({ priority: 'low' });
      
      expect(highPriorityNotifications).toHaveLength(1);
      expect(mediumPriorityNotifications).toHaveLength(1);
      expect(lowPriorityNotifications).toHaveLength(1);
    });

    it('应该能按发送者查找通知', async () => {
      const senderNotifications = await Notification.find({ senderId: sender._id });
      expect(senderNotifications).toHaveLength(1);
    });

    it('应该能按创建时间排序', async () => {
      const notifications = await Notification.find({}).sort({ createdAt: -1 });
      expect(notifications).toHaveLength(3);
      expect(notifications[0].createdAt.getTime()).toBeGreaterThanOrEqual(notifications[1].createdAt.getTime());
    });

    it('应该能按优先级排序', async () => {
      const notifications = await Notification.find({}).sort({ priority: 1 });
      const priorityOrder = ['low', 'medium', 'high', 'urgent'];
      
      for (let i = 0; i < notifications.length - 1; i++) {
        const currentIndex = priorityOrder.indexOf(notifications[i].priority);
        const nextIndex = priorityOrder.indexOf(notifications[i + 1].priority);
        expect(currentIndex).toBeLessThanOrEqual(nextIndex);
      }
    });
  });

  describe('虚拟字段', () => {
    it('应该计算通知年龄', async () => {
      const notification = new Notification({
        userId: user._id,
        type: 'system',
        title: '测试通知',
        message: '测试消息',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1天前
      });
      
      expect(notification.age).toBeGreaterThan(0);
    });

    it('应该判断是否过期', async () => {
      const expiredNotification = new Notification({
        userId: user._id,
        type: 'system',
        title: '过期通知',
        message: '过期消息',
        expiresAt: new Date(Date.now() - 1000) // 1秒前过期
      });
      
      const activeNotification = new Notification({
        userId: user._id,
        type: 'system',
        title: '活跃通知',
        message: '活跃消息',
        expiresAt: new Date(Date.now() + 1000) // 1秒后过期
      });
      
      expect(expiredNotification.isExpired).toBe(true);
      expect(activeNotification.isExpired).toBe(false);
    });
  });

  describe('JSON序列化', () => {
    it('应该包含虚拟字段', async () => {
      const notification = new Notification({
        userId: user._id,
        type: 'system',
        title: '测试通知',
        message: '测试消息'
      });
      const savedNotification = await notification.save();
      const json = savedNotification.toJSON();

      expect(json.id).toBeDefined();
      expect(json.age).toBeDefined();
      expect(json.isExpired).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  describe('通知统计', () => {
    beforeEach(async () => {
      await Notification.create([
        {
          userId: user._id,
          type: 'system',
          title: '系统通知1',
          message: '系统消息1',
          priority: 'high',
          isRead: false
        },
        {
          userId: user._id,
          type: 'achievement',
          title: '成就通知',
          message: '成就消息',
          priority: 'medium',
          isRead: true
        },
        {
          userId: user._id,
          type: 'social',
          title: '社交通知',
          message: '社交消息',
          priority: 'low',
          isRead: false
        }
      ]);
    });

    it('应该能统计未读通知数量', async () => {
      const unreadCount = await Notification.countDocuments({
        userId: user._id,
        isRead: false
      });
      expect(unreadCount).toBe(2);
    });

    it('应该能统计总通知数量', async () => {
      const totalCount = await Notification.countDocuments({ userId: user._id });
      expect(totalCount).toBe(3);
    });

    it('应该能按类型统计通知数量', async () => {
      const stats = await Notification.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);
      
      expect(stats).toHaveLength(3);
      const typeStats = stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});
      
      expect(typeStats.system).toBe(1);
      expect(typeStats.achievement).toBe(1);
      expect(typeStats.social).toBe(1);
    });

    it('应该能按优先级统计通知数量', async () => {
      const stats = await Notification.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]);
      
      expect(stats).toHaveLength(3);
      const priorityStats = stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});
      
      expect(priorityStats.high).toBe(1);
      expect(priorityStats.medium).toBe(1);
      expect(priorityStats.low).toBe(1);
    });
  });

  describe('通知管理', () => {
    it('应该能批量标记为已读', async () => {
      await Notification.create([
        {
          userId: user._id,
          type: 'system',
          title: '通知1',
          message: '消息1',
          isRead: false
        },
        {
          userId: user._id,
          type: 'system',
          title: '通知2',
          message: '消息2',
          isRead: false
        }
      ]);

      await Notification.updateMany(
        { userId: user._id, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      const unreadCount = await Notification.countDocuments({
        userId: user._id,
        isRead: false
      });
      expect(unreadCount).toBe(0);
    });

    it('应该能删除过期通知', async () => {
      await Notification.create([
        {
          userId: user._id,
          type: 'system',
          title: '过期通知',
          message: '过期消息',
          expiresAt: new Date(Date.now() - 1000)
        },
        {
          userId: user._id,
          type: 'system',
          title: '活跃通知',
          message: '活跃消息'
        }
      ]);

      await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      const remainingCount = await Notification.countDocuments({ userId: user._id });
      expect(remainingCount).toBe(1);
    });
  });
});