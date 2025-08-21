const request = require('supertest');
const app = require('../../testApp');
const Achievement = require('../../../src/models/Achievement');
const UserAchievement = require('../../../src/models/UserAchievement');

describe('Achievement Controller', () => {
  let testUser;
  let authToken;
  let testProfile;
  let testAchievement;

  beforeEach(async () => {
    testUser = await createTestUser();
    authToken = generateAuthToken(testUser._id);
    testProfile = await createTestProfile(testUser._id);
    
    // 创建测试成就模板
    testAchievement = new Achievement({
      name: '测试成就',
      description: '这是一个测试成就',
      category: 'milestone',
      type: 'count',
      condition: {
        target: 10,
        field: 'moments_count'
      },
      rewards: {
        points: 100,
        badge: 'first_milestone'
      },
      isActive: true
    });
    await testAchievement.save();
  });

  describe('GET /api/achievements', () => {
    it('应该获取成就模板列表', async () => {
      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.achievements).toHaveLength(1);
      expect(response.body.data.achievements[0].name).toBe('测试成就');
      expect(response.body.data.total).toBe(1);
    });

    it('应该支持按类别筛选成就', async () => {
      // 创建不同类别的成就
      const socialAchievement = new Achievement({
        name: '社交成就',
        description: '社交类成就',
        category: 'social',
        type: 'count',
        condition: { target: 5, field: 'shares_count' },
        rewards: { points: 50 },
        isActive: true
      });
      await socialAchievement.save();

      const response = await request(app)
        .get('/api/achievements?category=social')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.achievements).toHaveLength(1);
      expect(response.body.data.achievements[0].category).toBe('social');
    });

    it('应该支持分页查询', async () => {
      // 创建更多成就
      for (let i = 0; i < 5; i++) {
        const achievement = new Achievement({
          name: `成就${i}`,
          description: `描述${i}`,
          category: 'milestone',
          type: 'count',
          condition: { target: i + 1, field: 'moments_count' },
          rewards: { points: (i + 1) * 10 },
          isActive: true
        });
        await achievement.save();
      }

      const response = await request(app)
        .get('/api/achievements?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.achievements).toHaveLength(3);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(3);
    });
  });

  describe('GET /api/achievements/:id', () => {
    it('应该获取指定成就详情', async () => {
      const response = await request(app)
        .get(`/api/achievements/${testAchievement._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('测试成就');
      expect(response.body.data.category).toBe('milestone');
      expect(response.body.data.condition.target).toBe(10);
    });

    it('应该拒绝访问不存在的成就', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/achievements/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('成就不存在');
    });
  });

  describe('GET /api/achievements/user/:profileId', () => {
    it('应该获取用户成就列表', async () => {
      // 创建用户成就
      const userAchievement = new UserAchievement({
        userId: testUser._id,
        profileId: testProfile._id,
        achievementId: testAchievement._id,
        progress: 5,
        isCompleted: false,
        completedAt: null
      });
      await userAchievement.save();

      const response = await request(app)
        .get(`/api/achievements/user/${testProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.achievements).toHaveLength(1);
      expect(response.body.data.achievements[0].progress).toBe(5);
      expect(response.body.data.achievements[0].isCompleted).toBe(false);
    });

    it('应该支持按完成状态筛选', async () => {
      // 创建已完成的用户成就
      const completedAchievement = new UserAchievement({
        userId: testUser._id,
        profileId: testProfile._id,
        achievementId: testAchievement._id,
        progress: 10,
        isCompleted: true,
        completedAt: new Date()
      });
      await completedAchievement.save();

      const response = await request(app)
        .get(`/api/achievements/user/${testProfile._id}?status=completed`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.achievements).toHaveLength(1);
      expect(response.body.data.achievements[0].isCompleted).toBe(true);
    });

    it('应该拒绝访问无权限的档案成就', async () => {
      // 创建另一个用户的档案
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);

      const response = await request(app)
        .get(`/api/achievements/user/${anotherProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限访问此档案的成就');
    });
  });

  describe('POST /api/achievements/check/:profileId', () => {
    it('应该检查并更新用户成就进度', async () => {
      // 创建用户成就
      const userAchievement = new UserAchievement({
        userId: testUser._id,
        profileId: testProfile._id,
        achievementId: testAchievement._id,
        progress: 8,
        isCompleted: false
      });
      await userAchievement.save();

      const response = await request(app)
        .post(`/api/achievements/check/${testProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.checkedCount).toBeGreaterThanOrEqual(0);
      expect(response.body.data.newlyCompleted).toBeDefined();
    });

    it('应该拒绝检查无权限的档案成就', async () => {
      // 创建另一个用户的档案
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);

      const response = await request(app)
        .post(`/api/achievements/check/${anotherProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限操作此档案的成就');
    });
  });

  describe('GET /api/achievements/stats/:profileId', () => {
    it('应该获取用户成就统计', async () => {
      // 创建多个用户成就
      const achievements = [];
      for (let i = 0; i < 3; i++) {
        const achievement = new Achievement({
          name: `成就${i}`,
          description: `描述${i}`,
          category: 'milestone',
          type: 'count',
          condition: { target: 10, field: 'moments_count' },
          rewards: { points: 100 },
          isActive: true
        });
        await achievement.save();
        achievements.push(achievement);
      }

      // 创建用户成就记录
      for (let i = 0; i < 3; i++) {
        const userAchievement = new UserAchievement({
          userId: testUser._id,
          profileId: testProfile._id,
          achievementId: achievements[i]._id,
          progress: i < 2 ? 10 : 5,
          isCompleted: i < 2,
          completedAt: i < 2 ? new Date() : null
        });
        await userAchievement.save();
      }

      const response = await request(app)
        .get(`/api/achievements/stats/${testProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAchievements).toBeGreaterThanOrEqual(3);
      expect(response.body.data.completedAchievements).toBe(2);
      expect(response.body.data.inProgressAchievements).toBe(1);
      expect(response.body.data.totalPoints).toBeGreaterThanOrEqual(200);
      expect(response.body.data.completionRate).toBeCloseTo(66.67, 1);
    });

    it('应该拒绝访问无权限的档案统计', async () => {
      // 创建另一个用户的档案
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);

      const response = await request(app)
        .get(`/api/achievements/stats/${anotherProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限访问此档案的成就统计');
    });
  });

  describe('POST /api/achievements (Admin)', () => {
    let adminUser;
    let adminToken;

    beforeEach(async () => {
      adminUser = await createTestUser();
      adminUser.email = 'admin@example.com';
      adminUser.username = 'admin';
      adminUser.role = 'admin';
      await adminUser.save();
      adminToken = generateAuthToken(adminUser._id);
    });

    it('应该允许管理员创建成就模板', async () => {
      const achievementData = {
        name: '新成就',
        description: '这是一个新成就',
        category: 'social',
        type: 'count',
        condition: {
          target: 5,
          field: 'shares_count'
        },
        rewards: {
          points: 50,
          badge: 'social_butterfly'
        },
        isActive: true
      };

      const response = await request(app)
        .post('/api/achievements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(achievementData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(achievementData.name);
      expect(response.body.data.category).toBe(achievementData.category);
      expect(response.body.data.condition.target).toBe(5);

      // 验证成就已保存到数据库
      const savedAchievement = await Achievement.findById(response.body.data._id);
      expect(savedAchievement).toBeTruthy();
      expect(savedAchievement.name).toBe(achievementData.name);
    });

    it('应该拒绝普通用户创建成就模板', async () => {
      const achievementData = {
        name: '新成就',
        description: '这是一个新成就',
        category: 'social',
        type: 'count',
        condition: { target: 5, field: 'shares_count' },
        rewards: { points: 50 },
        isActive: true
      };

      const response = await request(app)
        .post('/api/achievements')
        .set('Authorization', `Bearer ${authToken}`)
        .send(achievementData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('需要管理员权限');
    });

    it('应该拒绝无效的成就数据', async () => {
      const invalidData = {
        name: '', // 空名称
        category: 'invalid-category', // 无效类别
        type: 'invalid-type', // 无效类型
        condition: {}, // 缺少必要字段
        rewards: {} // 缺少奖励
      };

      const response = await request(app)
        .post('/api/achievements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('PUT /api/achievements/:id (Admin)', () => {
    let adminUser;
    let adminToken;

    beforeEach(async () => {
      adminUser = await createTestUser();
      adminUser.email = 'admin@example.com';
      adminUser.username = 'admin';
      adminUser.role = 'admin';
      await adminUser.save();
      adminToken = generateAuthToken(adminUser._id);
    });

    it('应该允许管理员更新成就模板', async () => {
      const updateData = {
        name: '更新后的成就',
        description: '更新后的描述',
        rewards: {
          points: 200,
          badge: 'updated_badge'
        },
        isActive: false
      };

      const response = await request(app)
        .put(`/api/achievements/${testAchievement._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.rewards.points).toBe(200);
      expect(response.body.data.isActive).toBe(false);

      // 验证数据库中的数据已更新
      const updatedAchievement = await Achievement.findById(testAchievement._id);
      expect(updatedAchievement.name).toBe(updateData.name);
      expect(updatedAchievement.isActive).toBe(false);
    });

    it('应该拒绝普通用户更新成就模板', async () => {
      const updateData = { name: '尝试更新' };

      const response = await request(app)
        .put(`/api/achievements/${testAchievement._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('需要管理员权限');
    });
  });

  describe('DELETE /api/achievements/:id (Admin)', () => {
    let adminUser;
    let adminToken;

    beforeEach(async () => {
      adminUser = await createTestUser();
      adminUser.email = 'admin@example.com';
      adminUser.username = 'admin';
      adminUser.role = 'admin';
      await adminUser.save();
      adminToken = generateAuthToken(adminUser._id);
    });

    it('应该允许管理员删除成就模板', async () => {
      const response = await request(app)
        .delete(`/api/achievements/${testAchievement._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('成就删除成功');

      // 验证成就已从数据库中删除
      const deletedAchievement = await Achievement.findById(testAchievement._id);
      expect(deletedAchievement).toBeNull();
    });

    it('应该拒绝普通用户删除成就模板', async () => {
      const response = await request(app)
        .delete(`/api/achievements/${testAchievement._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('需要管理员权限');
    });
  });
});