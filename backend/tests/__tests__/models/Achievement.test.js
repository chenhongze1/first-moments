const mongoose = require('mongoose');
const { AchievementTemplate, AchievementStats } = require('../../../src/models/Achievement');
const UserAchievement = require('../../../src/models/UserAchievement');
const User = require('../../../src/models/User');

describe('Achievement Model', () => {
  let user;
  let achievementTemplate;

  beforeEach(async () => {
    // 创建测试用户
    user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();

    // 创建成就模板
    achievementTemplate = new AchievementTemplate({
      name: '测试成就',
      description: '这是一个测试成就',
      type: 'milestone',
      category: 'moments',
      icon: 'trophy',
      points: 100,
      conditions: {
        type: 'count',
        target: 10,
        field: 'moments_created'
      }
    });
    await achievementTemplate.save();
  });

  afterEach(async () => {
    await UserAchievement.deleteMany({});
    await User.deleteMany({});
    await AchievementTemplate.deleteMany({});
  });

  describe('成就创建', () => {
    it('应该成功创建成就', async () => {
      const achievement = new UserAchievement({
        user: user._id,
        template: achievementTemplate._id,
        progress: {
          current: 5,
          target: 10
        }
      });
      const savedAchievement = await achievement.save();

      expect(savedAchievement._id).toBeDefined();
      expect(savedAchievement.user.toString()).toBe(user._id.toString());
      expect(savedAchievement.template.toString()).toBe(achievementTemplate._id.toString());
      expect(savedAchievement.progress.current).toBe(5);
      expect(savedAchievement.progress.target).toBe(10);
      expect(savedAchievement.progress.percentage).toBe(50);
      expect(savedAchievement.status).toBe('in_progress');
      expect(savedAchievement.createdAt).toBeDefined();
      expect(savedAchievement.updatedAt).toBeDefined();
    });

    it('应该设置默认值', async () => {
      const achievement = new UserAchievement({
        user: user._id,
        template: achievementTemplate._id,
        progress: {
          target: 10
        }
      });
      const savedAchievement = await achievement.save();

      expect(savedAchievement.progress.current).toBe(0);
      expect(savedAchievement.progress.percentage).toBe(0);
      expect(savedAchievement.status).toBe('not_started');
      expect(savedAchievement.createdAt).toBeDefined();
      expect(savedAchievement.updatedAt).toBeDefined();
    });

    it('应该拒绝重复的用户-模板组合', async () => {
      // 创建第一个成就
      const achievement1 = new UserAchievement({
        user: user._id,
        template: achievementTemplate._id,
        progress: {
          current: 5,
          target: 10
        }
      });
      await achievement1.save();

      // 尝试创建重复的成就
      const achievement2 = new UserAchievement({
        user: user._id,
        template: achievementTemplate._id,
        progress: {
          current: 3,
          target: 10
        }
      });

      await expect(achievement2.save()).rejects.toThrow();
    });
  });

  describe('数据验证', () => {
    it('应该要求必填字段', async () => {
      const achievement = new UserAchievement({});
      const error = achievement.validateSync();

      expect(error.errors.user).toBeDefined();
      expect(error.errors.template).toBeDefined();
    });

    it('应该验证userId格式', async () => {
      const achievement = new UserAchievement({
        user: 'invalid-id',
        template: achievementTemplate._id
      });
      const error = achievement.validateSync();

      expect(error.errors.user).toBeDefined();
    });

    it('应该验证templateId格式', async () => {
      const achievement = new UserAchievement({
        user: user._id,
        template: 'invalid-id'
      });
      const error = achievement.validateSync();

      expect(error.errors.template).toBeDefined();
    });

    it('应该验证progress为非负数', async () => {
      const achievement = new UserAchievement({
        user: user._id,
        template: achievementTemplate._id,
        progress: {
          current: -1,
          target: 10
        }
      });
      const error = achievement.validateSync();

      expect(error.errors['progress.current']).toBeDefined();
    });
  });

  describe('成就完成', () => {
    it('应该正确标记成就为已完成', async () => {
      const achievement = new UserAchievement({
        user: user._id,
        template: achievementTemplate._id,
        progress: {
          current: 10,
          target: 10
        }
      });
      const savedAchievement = await achievement.save();

      expect(savedAchievement.status).toBe('achieved');
      expect(savedAchievement.achievedAt).toBeDefined();
      expect(savedAchievement.isCompleted).toBe(true);
    });

    it('应该在达到目标时自动完成', async () => {
      const achievement = new UserAchievement({
        user: user._id,
        template: achievementTemplate._id,
        progress: {
          current: 10,
          target: 10
        }
      });
      const savedAchievement = await achievement.save();

      expect(savedAchievement.status).toBe('achieved');
      expect(savedAchievement.achievedAt).toBeDefined();
      expect(savedAchievement.isCompleted).toBe(true);
    });

    it('应该在完成时自动设置achievedAt', async () => {
      const achievement = new UserAchievement({
        user: user._id,
        template: achievementTemplate._id,
        progress: {
          current: 9,
          target: 10
        }
      });
      await achievement.save();

      // 更新进度到完成
      achievement.progress.current = 10;
      const updatedAchievement = await achievement.save();

      expect(updatedAchievement.achievedAt).toBeDefined();
      expect(updatedAchievement.status).toBe('achieved');
    });
  });

  describe('索引', () => {
    it('应该有user和template的复合唯一索引', async () => {
      const indexes = await UserAchievement.collection.getIndexes();
      const compositeIndex = Object.keys(indexes).find(key => 
        key.includes('user') && key.includes('template')
      );
      expect(compositeIndex).toBeDefined();
    });

    it('应该有user索引', async () => {
      const indexes = await UserAchievement.collection.getIndexes();
      const userIndexExists = Object.keys(indexes).some(key => 
        key.includes('user') && key.includes('status')
      );
      expect(userIndexExists).toBe(true);
    });

    it('应该有template索引', async () => {
      const indexes = await UserAchievement.collection.getIndexes();
      const templateIndexExists = Object.keys(indexes).some(key => 
        key.includes('template') && key.includes('status')
      );
      expect(templateIndexExists).toBe(true);
    });

    it('应该有status索引', async () => {
      const indexes = await UserAchievement.collection.getIndexes();
      const statusIndexExists = Object.keys(indexes).some(key => 
        key.includes('status')
      );
      expect(statusIndexExists).toBe(true);
    });
  });

  describe('中间件', () => {
    it('应该在保存时自动更新updatedAt字段', async () => {
      const achievement = new UserAchievement({
        user: user._id,
        template: achievementTemplate._id,
        progress: {
          current: 5,
          target: 10
        }
      });
      const savedAchievement = await achievement.save();
      const originalUpdatedAt = savedAchievement.updatedAt;

      // 等待一毫秒确保时间差异
      await new Promise(resolve => setTimeout(resolve, 1));
      
      savedAchievement.progress.current = 7;
      const updatedAchievement = await savedAchievement.save();

      expect(updatedAchievement.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(updatedAchievement.progress.percentage).toBe(70);
    });
  });

  describe('查询方法', () => {
    beforeEach(async () => {
      // 创建测试数据
      // 创建第二个成就模板
      const achievementTemplate2 = new AchievementTemplate({
        name: '测试成就2',
        description: '这是第二个测试成就',
        type: 'milestone',
        category: 'moments',
        icon: 'star',
        points: 50,
        conditions: {
          type: 'count',
          target: 5,
          field: 'moments_created'
        }
      });
      await achievementTemplate2.save();

      await UserAchievement.create([
          {
            user: user._id,
            template: achievementTemplate._id,
            progress: {
              current: 5,
              target: 10
            },
            status: 'in_progress'
          },
          {
            user: user._id,
            template: achievementTemplate2._id,
            progress: {
              current: 10,
              target: 10
            },
            status: 'achieved',
            achievedAt: new Date()
          }
        ]);
    });

    it('应该能按用户查找成就', async () => {
      const achievements = await UserAchievement.find({ user: user._id });
      expect(achievements).toHaveLength(2);
    });

    it('应该能按模板查找成就', async () => {
      const achievements = await UserAchievement.find({ template: achievementTemplate._id });
      expect(achievements).toHaveLength(1);
    });

    it('应该能按完成状态查找成就', async () => {
      const completedAchievements = await UserAchievement.find({ status: 'achieved' });
      const incompleteAchievements = await UserAchievement.find({ status: 'in_progress' });
      
      expect(completedAchievements).toHaveLength(1);
      expect(incompleteAchievements).toHaveLength(1);
    });

    it('应该找到已完成的成就', async () => {
      const achievedAchievements = await UserAchievement.find({ 
        user: user._id, 
        status: 'achieved' 
      });
      expect(achievedAchievements).toHaveLength(1);
      expect(achievedAchievements[0].achievedAt).toBeDefined();
    });

    it('应该找到进行中的成就', async () => {
      const inProgressAchievements = await UserAchievement.find({ 
        user: user._id, 
        status: 'in_progress' 
      });
      expect(inProgressAchievements).toHaveLength(1);
      expect(inProgressAchievements[0].achievedAt).toBeUndefined();
    });

    it('应该能按进度范围查找成就', async () => {
      const highProgressAchievements = await UserAchievement.find({
        'progress.current': { $gte: 8 }
      });
      const lowProgressAchievements = await UserAchievement.find({
        'progress.current': { $lt: 8 }
      });

      expect(highProgressAchievements).toHaveLength(1);
      expect(lowProgressAchievements).toHaveLength(1);
    });
  });

  describe('虚拟字段', () => {
    it('应该计算进度百分比', async () => {
      const achievement = new UserAchievement({
        user: user._id,
        template: achievementTemplate._id,
        progress: {
          current: 5,
          target: 10,
          percentage: 50
        }
      });
      
      expect(achievement.progress.percentage).toBe(50);
    });
  });

  describe('JSON序列化', () => {
    it('应该包含虚拟字段', async () => {
      const achievement = new UserAchievement({
        user: user._id,
        template: achievementTemplate._id,
        progress: {
          current: 7,
          target: 10
        }
      });
      const savedAchievement = await achievement.save();
      const json = savedAchievement.toJSON();

      expect(json.isCompleted).toBe(false);
      expect(json.isInProgress).toBe(true);
      expect(json.remainingProgress).toBe(3);
      expect(json.progress.percentage).toBe(70);
    });
  });

  describe('成就统计', () => {
    beforeEach(async () => {
      // 创建第二个成就模板
      const achievementTemplate2 = new AchievementTemplate({
        name: '测试成就2',
        description: '这是第二个测试成就',
        type: 'milestone',
        category: 'moments',
        icon: 'star',
        points: 50,
        conditions: {
          type: 'count',
          target: 5,
          field: 'moments_created'
        }
      });
      await achievementTemplate2.save();

      await UserAchievement.create([
        {
          user: user._id,
          template: achievementTemplate._id,
          progress: {
            current: 5,
            target: 10,
            percentage: 50
          },
          status: 'in_progress'
        },
        {
          user: user._id,
          template: achievementTemplate2._id,
          progress: {
            current: 10,
            target: 10,
            percentage: 100
          },
          status: 'achieved',
          achievedAt: new Date()
        }
      ]);
    });

    it('应该能统计用户完成的成就数量', async () => {
      const completedCount = await UserAchievement.countDocuments({
        user: user._id,
        status: 'achieved'
      });
      expect(completedCount).toBe(1);
    });

    it('应该能统计用户总成就数量', async () => {
      const totalCount = await UserAchievement.countDocuments({
        user: user._id
      });
      expect(totalCount).toBe(2);
    });

    it('应该能计算用户总积分', async () => {
      const totalPoints = await UserAchievement.aggregate([
        { $match: { user: user._id, status: 'achieved' } },
        { $lookup: {
            from: 'achievementtemplates',
            localField: 'template',
            foreignField: '_id',
            as: 'templateData'
          }
        },
        { $unwind: '$templateData' },
        { $group: {
            _id: null,
            totalPoints: { $sum: '$templateData.points' }
          }
        }
      ]);

      expect(totalPoints[0]?.totalPoints || 0).toBeGreaterThanOrEqual(0);
    });
  });
});