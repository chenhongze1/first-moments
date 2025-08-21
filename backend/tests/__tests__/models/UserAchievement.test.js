const mongoose = require('mongoose');
const UserAchievement = require('../../../src/models/UserAchievement');
const User = require('../../../src/models/User');
const AchievementTemplate = require('../../../src/models/AchievementTemplate');

describe('UserAchievement Model', () => {
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
      category: 'milestone',
      icon: 'trophy',
      points: 100,
      conditions: {
        type: 'count',
        target: 10,
        metric: 'moments_created'
      }
    });
    await achievementTemplate.save();
  });

  afterEach(async () => {
    await UserAchievement.deleteMany({});
    await User.deleteMany({});
    await AchievementTemplate.deleteMany({});
  });

  describe('用户成就创建', () => {
    it('应该成功创建用户成就', async () => {
      const userAchievementData = {
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: 5,
        isCompleted: false
      };

      const userAchievement = new UserAchievement(userAchievementData);
      const savedUserAchievement = await userAchievement.save();

      expect(savedUserAchievement._id).toBeDefined();
      expect(savedUserAchievement.userId.toString()).toBe(user._id.toString());
      expect(savedUserAchievement.templateId.toString()).toBe(achievementTemplate._id.toString());
      expect(savedUserAchievement.progress).toBe(5);
      expect(savedUserAchievement.isCompleted).toBe(false);
      expect(savedUserAchievement.createdAt).toBeDefined();
      expect(savedUserAchievement.updatedAt).toBeDefined();
    });

    it('应该设置默认值', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id
      });
      const savedUserAchievement = await userAchievement.save();

      expect(savedUserAchievement.progress).toBe(0);
      expect(savedUserAchievement.isCompleted).toBe(false);
      expect(savedUserAchievement.completedAt).toBeUndefined();
      expect(savedUserAchievement.notifiedAt).toBeUndefined();
    });

    it('应该拒绝重复的用户-模板组合', async () => {
      const userAchievementData = {
        userId: user._id,
        templateId: achievementTemplate._id
      };

      await new UserAchievement(userAchievementData).save();

      const duplicateUserAchievement = new UserAchievement(userAchievementData);
      await expect(duplicateUserAchievement.save()).rejects.toThrow();
    });
  });

  describe('数据验证', () => {
    it('应该要求必填字段', async () => {
      const userAchievement = new UserAchievement({});
      const error = userAchievement.validateSync();

      expect(error.errors.userId).toBeDefined();
      expect(error.errors.templateId).toBeDefined();
    });

    it('应该验证userId格式', async () => {
      const userAchievement = new UserAchievement({
        userId: 'invalid-id',
        templateId: achievementTemplate._id
      });
      const error = userAchievement.validateSync();

      expect(error.errors.userId).toBeDefined();
    });

    it('应该验证templateId格式', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: 'invalid-id'
      });
      const error = userAchievement.validateSync();

      expect(error.errors.templateId).toBeDefined();
    });

    it('应该验证progress为非负数', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: -1
      });
      const error = userAchievement.validateSync();

      expect(error.errors.progress).toBeDefined();
    });

    it('应该验证currentStreak为非负数', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        currentStreak: -1
      });
      const error = userAchievement.validateSync();

      expect(error.errors.currentStreak).toBeDefined();
    });

    it('应该验证bestStreak为非负数', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        bestStreak: -1
      });
      const error = userAchievement.validateSync();

      expect(error.errors.bestStreak).toBeDefined();
    });
  });

  describe('成就进度', () => {
    it('应该正确更新进度', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: 5
      });
      await userAchievement.save();

      userAchievement.progress = 8;
      const updatedUserAchievement = await userAchievement.save();

      expect(updatedUserAchievement.progress).toBe(8);
    });

    it('应该支持连续记录', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        currentStreak: 5,
        bestStreak: 7,
        lastStreakDate: new Date()
      });
      const savedUserAchievement = await userAchievement.save();

      expect(savedUserAchievement.currentStreak).toBe(5);
      expect(savedUserAchievement.bestStreak).toBe(7);
      expect(savedUserAchievement.lastStreakDate).toBeDefined();
    });

    it('应该支持里程碑数据', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        milestones: [
          {
            value: 5,
            achievedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          {
            value: 10,
            achievedAt: new Date()
          }
        ]
      });
      const savedUserAchievement = await userAchievement.save();

      expect(savedUserAchievement.milestones).toHaveLength(2);
      expect(savedUserAchievement.milestones[0].value).toBe(5);
      expect(savedUserAchievement.milestones[1].value).toBe(10);
    });
  });

  describe('成就完成', () => {
    it('应该正确标记成就为已完成', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: 10,
        isCompleted: true,
        completedAt: new Date()
      });
      const savedUserAchievement = await userAchievement.save();

      expect(savedUserAchievement.isCompleted).toBe(true);
      expect(savedUserAchievement.completedAt).toBeDefined();
    });

    it('应该记录通知时间', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: 10,
        isCompleted: true,
        completedAt: new Date(),
        notifiedAt: new Date()
      });
      const savedUserAchievement = await userAchievement.save();

      expect(savedUserAchievement.notifiedAt).toBeDefined();
    });

    it('应该支持完成时的额外数据', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: 10,
        isCompleted: true,
        completedAt: new Date(),
        completionData: {
          finalValue: 10,
          timeSpent: 3600, // 1小时
          difficulty: 'medium'
        }
      });
      const savedUserAchievement = await userAchievement.save();

      expect(savedUserAchievement.completionData.finalValue).toBe(10);
      expect(savedUserAchievement.completionData.timeSpent).toBe(3600);
      expect(savedUserAchievement.completionData.difficulty).toBe('medium');
    });
  });

  describe('索引', () => {
    it('应该有userId和templateId的复合唯一索引', async () => {
      const indexes = await UserAchievement.collection.getIndexes();
      const compositeIndex = Object.keys(indexes).find(key => 
        key.includes('userId') && key.includes('templateId')
      );
      expect(compositeIndex).toBeDefined();
    });

    it('应该有userId索引', async () => {
      const indexes = await UserAchievement.collection.getIndexes();
      expect(indexes).toHaveProperty('userId_1');
    });

    it('应该有templateId索引', async () => {
      const indexes = await UserAchievement.collection.getIndexes();
      expect(indexes).toHaveProperty('templateId_1');
    });

    it('应该有isCompleted索引', async () => {
      const indexes = await UserAchievement.collection.getIndexes();
      expect(indexes).toHaveProperty('isCompleted_1');
    });

    it('应该有completedAt索引', async () => {
      const indexes = await UserAchievement.collection.getIndexes();
      expect(indexes).toHaveProperty('completedAt_1');
    });
  });

  describe('中间件', () => {
    it('应该在保存时自动更新updatedAt字段', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id
      });
      const savedUserAchievement = await userAchievement.save();
      const originalUpdatedAt = savedUserAchievement.updatedAt;

      // 等待一毫秒确保时间差异
      await new Promise(resolve => setTimeout(resolve, 1));
      
      savedUserAchievement.progress = 5;
      const updatedUserAchievement = await savedUserAchievement.save();

      expect(updatedUserAchievement.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('应该在完成时自动设置completedAt', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: 5
      });
      await userAchievement.save();

      userAchievement.isCompleted = true;
      const updatedUserAchievement = await userAchievement.save();

      expect(updatedUserAchievement.completedAt).toBeDefined();
    });
  });

  describe('查询方法', () => {
    beforeEach(async () => {
      // 创建另一个用户和模板
      const anotherUser = new User({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123'
      });
      await anotherUser.save();

      const anotherTemplate = new AchievementTemplate({
        name: '另一个成就',
        description: '另一个测试成就',
        category: 'habit',
        conditions: {
          type: 'streak',
          target: 7,
          metric: 'daily_moments'
        }
      });
      await anotherTemplate.save();

      // 创建测试数据
      await UserAchievement.create([
        {
          userId: user._id,
          templateId: achievementTemplate._id,
          progress: 5,
          isCompleted: false
        },
        {
          userId: user._id,
          templateId: anotherTemplate._id,
          progress: 7,
          isCompleted: true,
          completedAt: new Date()
        },
        {
          userId: anotherUser._id,
          templateId: achievementTemplate._id,
          progress: 10,
          isCompleted: true,
          completedAt: new Date()
        }
      ]);
    });

    it('应该能按用户查找成就', async () => {
      const userAchievements = await UserAchievement.find({ userId: user._id });
      expect(userAchievements).toHaveLength(2);
    });

    it('应该能按模板查找成就', async () => {
      const templateAchievements = await UserAchievement.find({ templateId: achievementTemplate._id });
      expect(templateAchievements).toHaveLength(2);
    });

    it('应该能按完成状态查找成就', async () => {
      const completedAchievements = await UserAchievement.find({ isCompleted: true });
      const incompleteAchievements = await UserAchievement.find({ isCompleted: false });
      
      expect(completedAchievements).toHaveLength(2);
      expect(incompleteAchievements).toHaveLength(1);
    });

    it('应该能按进度范围查找成就', async () => {
      const achievements = await UserAchievement.find({ 
        progress: { $gte: 5, $lte: 10 } 
      });
      expect(achievements).toHaveLength(3);
    });

    it('应该能按完成时间排序', async () => {
      const achievements = await UserAchievement.find({ isCompleted: true }).sort({ completedAt: -1 });
      expect(achievements).toHaveLength(2);
    });
  });

  describe('虚拟字段', () => {
    it('应该计算进度百分比', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: 5
      });
      
      // 模拟populate模板数据
      userAchievement.templateId = {
        conditions: { target: 10 }
      };
      
      expect(userAchievement.progressPercentage).toBe(50);
    });

    it('应该计算完成天数', async () => {
      const completedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5天前
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: 10,
        isCompleted: true,
        completedAt: completedAt
      });
      
      expect(userAchievement.daysSinceCompletion).toBe(5);
    });

    it('应该判断是否为最近完成', async () => {
      const recentAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: 10,
        isCompleted: true,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2天前
      });
      
      const oldAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: 10,
        isCompleted: true,
        completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10天前
      });
      
      expect(recentAchievement.isRecentlyCompleted).toBe(true);
      expect(oldAchievement.isRecentlyCompleted).toBe(false);
    });
  });

  describe('JSON序列化', () => {
    it('应该包含虚拟字段', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: 5
      });
      const savedUserAchievement = await userAchievement.save();
      const json = savedUserAchievement.toJSON();

      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  describe('成就统计', () => {
    beforeEach(async () => {
      // 创建多个成就模板
      const templates = await AchievementTemplate.create([
        {
          name: '习惯成就1',
          description: '习惯类成就',
          category: 'habit',
          points: 50,
          conditions: { type: 'streak', target: 7, metric: 'daily_moments' }
        },
        {
          name: '社交成就1',
          description: '社交类成就',
          category: 'social',
          points: 75,
          conditions: { type: 'count', target: 5, metric: 'friends_added' }
        }
      ]);

      await UserAchievement.create([
        {
          userId: user._id,
          templateId: achievementTemplate._id,
          progress: 10,
          isCompleted: true,
          completedAt: new Date()
        },
        {
          userId: user._id,
          templateId: templates[0]._id,
          progress: 7,
          isCompleted: true,
          completedAt: new Date()
        },
        {
          userId: user._id,
          templateId: templates[1]._id,
          progress: 3,
          isCompleted: false
        }
      ]);
    });

    it('应该能统计用户完成的成就数量', async () => {
      const completedCount = await UserAchievement.countDocuments({
        userId: user._id,
        isCompleted: true
      });
      expect(completedCount).toBe(2);
    });

    it('应该能统计用户总成就数量', async () => {
      const totalCount = await UserAchievement.countDocuments({
        userId: user._id
      });
      expect(totalCount).toBe(3);
    });

    it('应该能计算用户总积分', async () => {
      const achievements = await UserAchievement.find({ 
        userId: user._id,
        isCompleted: true 
      }).populate('templateId');
      
      const totalPoints = achievements.reduce((sum, achievement) => {
        return sum + (achievement.templateId?.points || 0);
      }, 0);
      
      expect(totalPoints).toBe(150); // 100 + 50
    });

    it('应该能按类别统计成就', async () => {
      const achievements = await UserAchievement.find({ 
        userId: user._id 
      }).populate('templateId');
      
      const categoryStats = achievements.reduce((stats, achievement) => {
        const category = achievement.templateId?.category || 'unknown';
        stats[category] = (stats[category] || 0) + 1;
        return stats;
      }, {});
      
      expect(categoryStats.milestone).toBe(1);
      expect(categoryStats.habit).toBe(1);
      expect(categoryStats.social).toBe(1);
    });
  });

  describe('成就管理', () => {
    it('应该能更新连续记录', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        currentStreak: 3,
        bestStreak: 5
      });
      await userAchievement.save();

      userAchievement.currentStreak = 6;
      userAchievement.bestStreak = 6;
      userAchievement.lastStreakDate = new Date();
      const updatedUserAchievement = await userAchievement.save();

      expect(updatedUserAchievement.currentStreak).toBe(6);
      expect(updatedUserAchievement.bestStreak).toBe(6);
    });

    it('应该能添加里程碑', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        milestones: []
      });
      await userAchievement.save();

      userAchievement.milestones.push({
        value: 5,
        achievedAt: new Date()
      });
      const updatedUserAchievement = await userAchievement.save();

      expect(updatedUserAchievement.milestones).toHaveLength(1);
      expect(updatedUserAchievement.milestones[0].value).toBe(5);
    });

    it('应该能重置进度', async () => {
      const userAchievement = new UserAchievement({
        userId: user._id,
        templateId: achievementTemplate._id,
        progress: 8,
        currentStreak: 5
      });
      await userAchievement.save();

      userAchievement.progress = 0;
      userAchievement.currentStreak = 0;
      const resetUserAchievement = await userAchievement.save();

      expect(resetUserAchievement.progress).toBe(0);
      expect(resetUserAchievement.currentStreak).toBe(0);
    });
  });
});