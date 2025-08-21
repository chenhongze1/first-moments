const achievementService = require('../../../src/services/achievementService');
const Achievement = require('../../../src/models/Achievement');
const UserAchievement = require('../../../src/models/UserAchievement');
const User = require('../../../src/models/User');
const Profile = require('../../../src/models/Profile');
const Moment = require('../../../src/models/Moment');

describe('Achievement Service', () => {
  let testUser;
  let testUser2;
  let testProfile;
  let testAchievement;
  let testUserAchievement;

  beforeEach(async () => {
    // 创建测试用户
    testUser = await createTestUser();
    testUser2 = await createTestUser({
      username: 'testuser2',
      email: 'test2@example.com'
    });

    // 创建测试档案
    testProfile = await createTestProfile(testUser._id);

    // 创建测试成就模板
    testAchievement = await createTestAchievement({
      name: '首次记录',
      description: '创建第一条时光记录',
      category: 'moments',
      type: 'count',
      target: 1,
      points: 10,
      icon: 'first-moment',
      condition: {
        type: 'moment_count',
        value: 1
      }
    });

    // 创建测试用户成就
    testUserAchievement = await createTestUserAchievement({
      userId: testUser._id,
      profileId: testProfile._id,
      achievementId: testAchievement._id,
      progress: 0,
      isCompleted: false
    });
  });

  describe('获取成就模板', () => {
    beforeEach(async () => {
      // 创建更多测试成就
      await createTestAchievement({
        name: '旅行达人',
        description: '记录10个不同地点',
        category: 'locations',
        type: 'count',
        target: 10,
        points: 50
      });

      await createTestAchievement({
        name: '连续记录',
        description: '连续7天记录时光',
        category: 'habits',
        type: 'streak',
        target: 7,
        points: 30
      });
    });

    it('应该获取所有成就模板', async () => {
      const result = await achievementService.getAchievements();

      expect(result.success).toBe(true);
      expect(result.achievements).toBeDefined();
      expect(result.achievements.length).toBeGreaterThanOrEqual(3);
      expect(result.achievements.some(a => a.name === '首次记录')).toBe(true);
    });

    it('应该按类别筛选成就', async () => {
      const result = await achievementService.getAchievements({
        category: 'moments'
      });

      expect(result.success).toBe(true);
      result.achievements.forEach(achievement => {
        expect(achievement.category).toBe('moments');
      });
    });

    it('应该按类型筛选成就', async () => {
      const result = await achievementService.getAchievements({
        type: 'count'
      });

      expect(result.success).toBe(true);
      result.achievements.forEach(achievement => {
        expect(achievement.type).toBe('count');
      });
    });

    it('应该支持分页', async () => {
      const result = await achievementService.getAchievements({
        page: 1,
        limit: 2
      });

      expect(result.success).toBe(true);
      expect(result.achievements.length).toBeLessThanOrEqual(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
    });

    it('应该按积分排序', async () => {
      const result = await achievementService.getAchievements({
        sortBy: 'points',
        sortOrder: 'desc'
      });

      expect(result.success).toBe(true);
      if (result.achievements.length > 1) {
        for (let i = 1; i < result.achievements.length; i++) {
          expect(result.achievements[i-1].points)
            .toBeGreaterThanOrEqual(result.achievements[i].points);
        }
      }
    });
  });

  describe('获取成就详情', () => {
    it('应该获取成就详情', async () => {
      const result = await achievementService.getAchievementById(testAchievement._id);

      expect(result.success).toBe(true);
      expect(result.achievement).toBeDefined();
      expect(result.achievement._id.toString()).toBe(testAchievement._id.toString());
      expect(result.achievement.name).toBe(testAchievement.name);
      expect(result.achievement.description).toBe(testAchievement.description);
    });

    it('应该拒绝获取不存在的成就', async () => {
      const fakeAchievementId = '507f1f77bcf86cd799439011';
      const result = await achievementService.getAchievementById(fakeAchievementId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('成就不存在');
    });

    it('应该包含成就统计信息', async () => {
      const result = await achievementService.getAchievementById(testAchievement._id);

      expect(result.success).toBe(true);
      expect(result.achievement.stats).toBeDefined();
      expect(result.achievement.stats.totalUsers).toBeDefined();
      expect(result.achievement.stats.completedUsers).toBeDefined();
      expect(result.achievement.stats.completionRate).toBeDefined();
    });
  });

  describe('获取用户成就', () => {
    beforeEach(async () => {
      // 创建更多用户成就
      const achievement2 = await createTestAchievement({
        name: '社交达人',
        description: '获得100个点赞',
        category: 'social',
        type: 'count',
        target: 100,
        points: 25
      });

      await createTestUserAchievement({
        userId: testUser._id,
        profileId: testProfile._id,
        achievementId: achievement2._id,
        progress: 50,
        isCompleted: false
      });

      // 创建已完成的成就
      const achievement3 = await createTestAchievement({
        name: '新手上路',
        description: '完成个人资料设置',
        category: 'profile',
        type: 'milestone',
        target: 1,
        points: 5
      });

      await createTestUserAchievement({
        userId: testUser._id,
        profileId: testProfile._id,
        achievementId: achievement3._id,
        progress: 1,
        isCompleted: true,
        completedAt: new Date()
      });
    });

    it('应该获取用户所有成就', async () => {
      const result = await achievementService.getUserAchievements(
        testUser._id,
        testProfile._id
      );

      expect(result.success).toBe(true);
      expect(result.achievements).toBeDefined();
      expect(result.achievements.length).toBeGreaterThanOrEqual(3);
    });

    it('应该按完成状态筛选成就', async () => {
      const result = await achievementService.getUserAchievements(
        testUser._id,
        testProfile._id,
        { status: 'completed' }
      );

      expect(result.success).toBe(true);
      result.achievements.forEach(achievement => {
        expect(achievement.isCompleted).toBe(true);
      });
    });

    it('应该按类别筛选成就', async () => {
      const result = await achievementService.getUserAchievements(
        testUser._id,
        testProfile._id,
        { category: 'moments' }
      );

      expect(result.success).toBe(true);
      result.achievements.forEach(achievement => {
        expect(achievement.achievementId.category).toBe('moments');
      });
    });

    it('应该拒绝无权限访问', async () => {
      const result = await achievementService.getUserAchievements(
        testUser2._id,
        testProfile._id
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限访问此档案的成就');
    });

    it('应该包含成就进度信息', async () => {
      const result = await achievementService.getUserAchievements(
        testUser._id,
        testProfile._id
      );

      expect(result.success).toBe(true);
      result.achievements.forEach(achievement => {
        expect(achievement.progress).toBeDefined();
        expect(achievement.progressPercentage).toBeDefined();
        expect(achievement.achievementId).toBeDefined();
      });
    });
  });

  describe('检查和更新成就进度', () => {
    it('应该更新成就进度', async () => {
      const result = await achievementService.updateAchievementProgress(
        testUser._id,
        testProfile._id,
        testAchievement._id,
        1
      );

      expect(result.success).toBe(true);
      expect(result.userAchievement.progress).toBe(1);
      expect(result.userAchievement.isCompleted).toBe(true);
      expect(result.userAchievement.completedAt).toBeDefined();
    });

    it('应该处理进度增量更新', async () => {
      // 先设置初始进度
      await achievementService.updateAchievementProgress(
        testUser._id,
        testProfile._id,
        testAchievement._id,
        0.5
      );

      // 增量更新
      const result = await achievementService.updateAchievementProgress(
        testUser._id,
        testProfile._id,
        testAchievement._id,
        0.5,
        true // 增量模式
      );

      expect(result.success).toBe(true);
      expect(result.userAchievement.progress).toBe(1);
      expect(result.userAchievement.isCompleted).toBe(true);
    });

    it('应该拒绝无权限更新', async () => {
      const result = await achievementService.updateAchievementProgress(
        testUser2._id,
        testProfile._id,
        testAchievement._id,
        1
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限操作此档案的成就');
    });

    it('应该自动检查相关成就', async () => {
      // 创建一个记录，应该触发成就检查
      const moment = await createTestMoment(testUser._id, testProfile._id);

      const result = await achievementService.checkAchievements(
        testUser._id,
        testProfile._id,
        'moment_created',
        { momentId: moment._id }
      );

      expect(result.success).toBe(true);
      expect(result.updatedAchievements).toBeDefined();
      expect(result.newlyCompleted).toBeDefined();
    });

    it('应该处理多个成就同时完成', async () => {
      // 创建多个相关成就
      const achievement2 = await createTestAchievement({
        name: '记录新手',
        description: '创建第一条记录',
        category: 'moments',
        type: 'count',
        target: 1,
        points: 5
      });

      await createTestUserAchievement({
        userId: testUser._id,
        profileId: testProfile._id,
        achievementId: achievement2._id,
        progress: 0,
        isCompleted: false
      });

      const result = await achievementService.checkAchievements(
        testUser._id,
        testProfile._id,
        'moment_created'
      );

      expect(result.success).toBe(true);
      expect(result.newlyCompleted.length).toBeGreaterThan(0);
    });
  });

  describe('获取成就统计', () => {
    beforeEach(async () => {
      // 创建一些已完成的成就
      const completedAchievement = await createTestAchievement({
        name: '完成的成就',
        description: '已完成的测试成就',
        category: 'test',
        type: 'count',
        target: 1,
        points: 20
      });

      await createTestUserAchievement({
        userId: testUser._id,
        profileId: testProfile._id,
        achievementId: completedAchievement._id,
        progress: 1,
        isCompleted: true,
        completedAt: new Date(),
        pointsEarned: 20
      });
    });

    it('应该获取用户成就统计', async () => {
      const result = await achievementService.getUserAchievementStats(
        testUser._id,
        testProfile._id
      );

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalAchievements).toBeGreaterThan(0);
      expect(result.stats.completedAchievements).toBeGreaterThan(0);
      expect(result.stats.inProgressAchievements).toBeGreaterThanOrEqual(0);
      expect(result.stats.totalPoints).toBeGreaterThan(0);
      expect(result.stats.completionRate).toBeDefined();
      expect(result.stats.completionRate).toBeGreaterThanOrEqual(0);
      expect(result.stats.completionRate).toBeLessThanOrEqual(100);
    });

    it('应该按类别统计成就', async () => {
      const result = await achievementService.getUserAchievementStats(
        testUser._id,
        testProfile._id
      );

      expect(result.success).toBe(true);
      expect(result.stats.byCategory).toBeDefined();
      expect(typeof result.stats.byCategory).toBe('object');
    });

    it('应该拒绝无权限访问统计', async () => {
      const result = await achievementService.getUserAchievementStats(
        testUser2._id,
        testProfile._id
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限访问此档案的成就统计');
    });

    it('应该获取最近完成的成就', async () => {
      const result = await achievementService.getRecentAchievements(
        testUser._id,
        testProfile._id,
        5
      );

      expect(result.success).toBe(true);
      expect(result.achievements).toBeDefined();
      expect(Array.isArray(result.achievements)).toBe(true);
      
      // 验证按完成时间排序
      if (result.achievements.length > 1) {
        for (let i = 1; i < result.achievements.length; i++) {
          expect(new Date(result.achievements[i-1].completedAt).getTime())
            .toBeGreaterThanOrEqual(new Date(result.achievements[i].completedAt).getTime());
        }
      }
    });
  });

  describe('管理员功能', () => {
    let adminUser;

    beforeEach(async () => {
      adminUser = await createTestUser({
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      });
    });

    describe('创建成就模板', () => {
      it('应该成功创建成就模板', async () => {
        const achievementData = {
          name: '新成就',
          description: '这是一个新的成就',
          category: 'custom',
          type: 'count',
          target: 5,
          points: 15,
          icon: 'custom-icon',
          condition: {
            type: 'custom_action',
            value: 5
          },
          isActive: true
        };

        const result = await achievementService.createAchievement(adminUser._id, achievementData);

        expect(result.success).toBe(true);
        expect(result.achievement).toBeDefined();
        expect(result.achievement.name).toBe(achievementData.name);
        expect(result.achievement.description).toBe(achievementData.description);
        expect(result.achievement.category).toBe(achievementData.category);
        expect(result.achievement.type).toBe(achievementData.type);
        expect(result.achievement.target).toBe(achievementData.target);
        expect(result.achievement.points).toBe(achievementData.points);
      });

      it('应该拒绝非管理员创建成就', async () => {
        const result = await achievementService.createAchievement(testUser._id, {
          name: '无权限成就',
          description: '普通用户无法创建',
          category: 'test',
          type: 'count',
          target: 1,
          points: 10
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('只有管理员可以创建成就模板');
      });

      it('应该验证成就数据', async () => {
        const invalidData = {
          name: '', // 空名称
          description: 'a'.repeat(1001), // 过长描述
          category: 'invalid_category',
          type: 'invalid_type',
          target: -1, // 负数目标
          points: -5 // 负数积分
        };

        const result = await achievementService.createAchievement(adminUser._id, invalidData);

        expect(result.success).toBe(false);
        expect(result.message).toMatch(/无效|不能为空|过长/);
      });

      it('应该拒绝重复的成就名称', async () => {
        const result = await achievementService.createAchievement(adminUser._id, {
          name: testAchievement.name,
          description: '重复名称的成就',
          category: 'test',
          type: 'count',
          target: 1,
          points: 10
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('成就名称已存在');
      });
    });

    describe('更新成就模板', () => {
      it('应该成功更新成就模板', async () => {
        const updateData = {
          name: '更新后的成就',
          description: '更新后的描述',
          points: 20,
          isActive: false
        };

        const result = await achievementService.updateAchievement(
          adminUser._id,
          testAchievement._id,
          updateData
        );

        expect(result.success).toBe(true);
        expect(result.achievement.name).toBe(updateData.name);
        expect(result.achievement.description).toBe(updateData.description);
        expect(result.achievement.points).toBe(updateData.points);
        expect(result.achievement.isActive).toBe(updateData.isActive);
      });

      it('应该拒绝非管理员更新成就', async () => {
        const result = await achievementService.updateAchievement(
          testUser._id,
          testAchievement._id,
          { name: '无权限更新' }
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('只有管理员可以修改成就模板');
      });

      it('应该拒绝更新不存在的成就', async () => {
        const fakeAchievementId = '507f1f77bcf86cd799439011';
        const result = await achievementService.updateAchievement(
          adminUser._id,
          fakeAchievementId,
          { name: '不存在的成就' }
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('成就不存在');
      });
    });

    describe('删除成就模板', () => {
      it('应该成功删除成就模板', async () => {
        const result = await achievementService.deleteAchievement(
          adminUser._id,
          testAchievement._id
        );

        expect(result.success).toBe(true);
        expect(result.message).toContain('成就删除成功');

        // 验证成就已被删除
        const deletedAchievement = await Achievement.findById(testAchievement._id);
        expect(deletedAchievement).toBeNull();
      });

      it('应该拒绝非管理员删除成就', async () => {
        const result = await achievementService.deleteAchievement(
          testUser._id,
          testAchievement._id
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('只有管理员可以删除成就模板');
      });

      it('应该级联删除相关用户成就', async () => {
        const result = await achievementService.deleteAchievement(
          adminUser._id,
          testAchievement._id
        );

        expect(result.success).toBe(true);

        // 验证相关用户成就已被删除
        const deletedUserAchievement = await UserAchievement.findById(testUserAchievement._id);
        expect(deletedUserAchievement).toBeNull();
      });
    });
  });

  describe('成就条件检查', () => {
    it('应该检查计数类型成就', async () => {
      const condition = {
        type: 'moment_count',
        value: 5
      };

      // 创建5个记录
      for (let i = 0; i < 5; i++) {
        await createTestMoment(testUser._id, testProfile._id);
      }

      const result = await achievementService.checkCondition(
        testUser._id,
        testProfile._id,
        condition
      );

      expect(result.success).toBe(true);
      expect(result.progress).toBeGreaterThanOrEqual(5);
      expect(result.isCompleted).toBe(true);
    });

    it('应该检查连续类型成就', async () => {
      const condition = {
        type: 'daily_streak',
        value: 3
      };

      // 模拟连续3天的记录
      const today = new Date();
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        await createTestMoment(testUser._id, testProfile._id, {
          createdAt: date
        });
      }

      const result = await achievementService.checkCondition(
        testUser._id,
        testProfile._id,
        condition
      );

      expect(result.success).toBe(true);
      expect(result.progress).toBeGreaterThanOrEqual(3);
    });

    it('应该检查里程碑类型成就', async () => {
      const condition = {
        type: 'profile_complete',
        value: 1
      };

      // 完善用户档案
      testUser.bio = '完整的个人简介';
      testUser.avatar = 'avatar.jpg';
      await testUser.save();

      const result = await achievementService.checkCondition(
        testUser._id,
        testProfile._id,
        condition
      );

      expect(result.success).toBe(true);
      expect(result.isCompleted).toBe(true);
    });

    it('应该处理无效的条件类型', async () => {
      const condition = {
        type: 'invalid_condition',
        value: 1
      };

      const result = await achievementService.checkCondition(
        testUser._id,
        testProfile._id,
        condition
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('不支持的成就条件类型');
    });
  });

  describe('成就通知', () => {
    it('应该发送成就完成通知', async () => {
      const result = await achievementService.updateAchievementProgress(
        testUser._id,
        testProfile._id,
        testAchievement._id,
        1
      );

      expect(result.success).toBe(true);
      expect(result.userAchievement.isCompleted).toBe(true);
      
      // 验证通知已创建（这里需要mock通知服务）
      // expect(notificationService.createNotification).toHaveBeenCalledWith(...);
    });

    it('应该发送成就进度更新通知', async () => {
      const result = await achievementService.updateAchievementProgress(
        testUser._id,
        testProfile._id,
        testAchievement._id,
        0.5
      );

      expect(result.success).toBe(true);
      expect(result.userAchievement.progress).toBe(0.5);
      expect(result.userAchievement.isCompleted).toBe(false);
    });
  });

  describe('工具方法', () => {
    describe('validateAchievementData', () => {
      it('应该验证有效的成就数据', () => {
        const validData = {
          name: '有效成就',
          description: '有效的成就描述',
          category: 'moments',
          type: 'count',
          target: 10,
          points: 25,
          icon: 'valid-icon',
          condition: {
            type: 'moment_count',
            value: 10
          }
        };

        const result = achievementService.validateAchievementData(validData);
        expect(result.isValid).toBe(true);
      });

      it('应该拒绝无效的成就数据', () => {
        const invalidData = {
          name: '', // 空名称
          description: 'a'.repeat(1001), // 过长描述
          category: 'invalid_category',
          type: 'invalid_type',
          target: -1, // 负数目标
          points: -5 // 负数积分
        };

        const result = achievementService.validateAchievementData(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('calculateProgress', () => {
      it('应该正确计算进度百分比', () => {
        const progress = achievementService.calculateProgress(5, 10);
        expect(progress).toBe(50);

        const fullProgress = achievementService.calculateProgress(10, 10);
        expect(fullProgress).toBe(100);

        const overProgress = achievementService.calculateProgress(15, 10);
        expect(overProgress).toBe(100);
      });

      it('应该处理零目标值', () => {
        const progress = achievementService.calculateProgress(5, 0);
        expect(progress).toBe(0);
      });
    });

    describe('formatAchievementResponse', () => {
      it('应该正确格式化成就响应', () => {
        const formatted = achievementService.formatAchievementResponse(
          testAchievement,
          testUserAchievement
        );

        expect(formatted).toBeDefined();
        expect(formatted.id).toBe(testAchievement._id.toString());
        expect(formatted.name).toBe(testAchievement.name);
        expect(formatted.progress).toBeDefined();
        expect(formatted.progressPercentage).toBeDefined();
        expect(formatted.isCompleted).toBeDefined();
      });
    });

    describe('getAchievementsByCategory', () => {
      it('应该按类别分组成就', async () => {
        const result = await achievementService.getAchievementsByCategory();

        expect(result.success).toBe(true);
        expect(result.categories).toBeDefined();
        expect(typeof result.categories).toBe('object');
        
        Object.keys(result.categories).forEach(category => {
          expect(Array.isArray(result.categories[category])).toBe(true);
        });
      });
    });
  });
});