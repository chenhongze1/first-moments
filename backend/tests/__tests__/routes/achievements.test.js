const request = require('supertest');
const express = require('express');
const achievementRoutes = require('../../../src/routes/achievements');
const Achievement = require('../../../src/models/Achievement');
const AchievementTemplate = require('../../../src/models/AchievementTemplate');
const Profile = require('../../../src/models/Profile');
const User = require('../../../src/models/User');
const { authenticateToken } = require('../../../src/middleware/auth');

// Mock dependencies
jest.mock('../../../src/models/Achievement');
jest.mock('../../../src/models/AchievementTemplate');
jest.mock('../../../src/models/Profile');
jest.mock('../../../src/models/User');
jest.mock('../../../src/middleware/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/achievements', achievementRoutes);

describe('Achievement Routes', () => {
  let mockUser;
  let mockProfile;
  let mockAchievement;
  let mockTemplate;

  beforeEach(() => {
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    mockProfile = {
      _id: '507f1f77bcf86cd799439013',
      name: 'Test Profile',
      owner: mockUser._id,
      collaborators: [],
      isPublic: true
    };

    mockTemplate = {
      _id: '507f1f77bcf86cd799439014',
      name: 'First Moment',
      description: 'Create your first moment',
      category: 'milestone',
      icon: 'star',
      points: 10,
      criteria: {
        type: 'moment_count',
        value: 1
      },
      isActive: true,
      createdAt: new Date()
    };

    mockAchievement = {
      _id: '507f1f77bcf86cd799439015',
      user: mockUser._id,
      profile: mockProfile._id,
      template: mockTemplate._id,
      unlockedAt: new Date(),
      progress: {
        current: 1,
        target: 1,
        percentage: 100
      },
      isVisible: true,
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

  describe('GET /api/achievements', () => {
    it('应该成功获取成就列表', async () => {
      const mockAchievements = [mockAchievement];

      Achievement.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue(mockAchievements)
            })
          })
        })
      });

      Achievement.countDocuments = jest.fn().mockResolvedValue(1);

      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.achievements).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('应该支持按档案筛选', async () => {
      const profileId = mockProfile._id;

      Achievement.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockAchievement])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/achievements?profile=${profileId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Achievement.find).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: profileId
        })
      );
    });

    it('应该支持按类别筛选', async () => {
      const category = 'milestone';

      Achievement.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockAchievement])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/achievements?category=${category}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该支持按解锁状态筛选', async () => {
      const unlocked = 'true';

      Achievement.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockAchievement])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/achievements?unlocked=${unlocked}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Achievement.find).toHaveBeenCalledWith(
        expect.objectContaining({
          unlockedAt: { $exists: true }
        })
      );
    });

    it('应该支持分页查询', async () => {
      const page = 2;
      const limit = 5;

      Achievement.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      Achievement.countDocuments = jest.fn().mockResolvedValue(15);

      const response = await request(app)
        .get(`/api/achievements?page=${page}&limit=${limit}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(page);
      expect(response.body.data.pagination.limit).toBe(limit);
      expect(response.body.data.pagination.totalPages).toBe(3);
    });

    it('应该只返回用户有权限访问的成就', async () => {
      Achievement.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockAchievement])
            })
          })
        })
      });

      await request(app)
        .get('/api/achievements')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(Achievement.find).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser._id
        })
      );
    });
  });

  describe('GET /api/achievements/:id', () => {
    it('应该成功获取成就详情', async () => {
      Achievement.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAchievement)
      });

      const response = await request(app)
        .get(`/api/achievements/${mockAchievement._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.achievement).toBeDefined();
      expect(Achievement.findById).toHaveBeenCalledWith(mockAchievement._id);
    });

    it('应该在成就不存在时返回404', async () => {
      Achievement.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get('/api/achievements/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('成就不存在');
    });

    it('应该检查用户访问权限', async () => {
      const otherUserAchievement = {
        ...mockAchievement,
        user: 'other-user-id'
      };

      Achievement.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(otherUserAchievement)
      });

      const response = await request(app)
        .get(`/api/achievements/${mockAchievement._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限访问此成就');
    });
  });

  describe('POST /api/achievements', () => {
    it('应该成功创建成就', async () => {
      const achievementData = {
        templateId: mockTemplate._id,
        profileId: mockProfile._id
      };

      const newAchievement = {
        ...mockAchievement,
        user: mockUser._id,
        template: mockTemplate._id,
        profile: mockProfile._id
      };

      AchievementTemplate.findById = jest.fn().mockResolvedValue(mockTemplate);
      Profile.findById = jest.fn().mockResolvedValue(mockProfile);
      Achievement.findOne = jest.fn().mockResolvedValue(null); // 不存在重复成就
      Achievement.prototype.save = jest.fn().mockResolvedValue(newAchievement);
      Achievement.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(newAchievement)
      });

      const response = await request(app)
        .post('/api/achievements')
        .set('Authorization', 'Bearer valid-token')
        .send(achievementData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('成就创建成功');
      expect(response.body.data.achievement).toBeDefined();
    });

    it('应该验证必填字段', async () => {
      const incompleteData = {
        profileId: mockProfile._id
        // 缺少 templateId
      };

      const response = await request(app)
        .post('/api/achievements')
        .set('Authorization', 'Bearer valid-token')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('成就模板ID是必填项');
    });

    it('应该验证成就模板存在', async () => {
      const achievementData = {
        templateId: 'nonexistent-template-id',
        profileId: mockProfile._id
      };

      AchievementTemplate.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/achievements')
        .set('Authorization', 'Bearer valid-token')
        .send(achievementData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('成就模板不存在');
    });

    it('应该验证档案存在和权限', async () => {
      const achievementData = {
        templateId: mockTemplate._id,
        profileId: 'nonexistent-profile-id'
      };

      AchievementTemplate.findById = jest.fn().mockResolvedValue(mockTemplate);
      Profile.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/achievements')
        .set('Authorization', 'Bearer valid-token')
        .send(achievementData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('档案不存在');
    });

    it('应该检查档案访问权限', async () => {
      const achievementData = {
        templateId: mockTemplate._id,
        profileId: mockProfile._id
      };

      const otherUserProfile = {
        ...mockProfile,
        owner: 'other-user-id',
        collaborators: []
      };

      AchievementTemplate.findById = jest.fn().mockResolvedValue(mockTemplate);
      Profile.findById = jest.fn().mockResolvedValue(otherUserProfile);

      const response = await request(app)
        .post('/api/achievements')
        .set('Authorization', 'Bearer valid-token')
        .send(achievementData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限在此档案中创建成就');
    });

    it('应该防止重复创建成就', async () => {
      const achievementData = {
        templateId: mockTemplate._id,
        profileId: mockProfile._id
      };

      AchievementTemplate.findById = jest.fn().mockResolvedValue(mockTemplate);
      Profile.findById = jest.fn().mockResolvedValue(mockProfile);
      Achievement.findOne = jest.fn().mockResolvedValue(mockAchievement); // 已存在

      const response = await request(app)
        .post('/api/achievements')
        .set('Authorization', 'Bearer valid-token')
        .send(achievementData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('该成就已存在');
    });

    it('应该验证成就模板是否激活', async () => {
      const achievementData = {
        templateId: mockTemplate._id,
        profileId: mockProfile._id
      };

      const inactiveTemplate = {
        ...mockTemplate,
        isActive: false
      };

      AchievementTemplate.findById = jest.fn().mockResolvedValue(inactiveTemplate);
      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/achievements')
        .set('Authorization', 'Bearer valid-token')
        .send(achievementData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('成就模板未激活');
    });
  });

  describe('PUT /api/achievements/:id', () => {
    it('应该成功更新成就', async () => {
      const updateData = {
        isVisible: false,
        notes: 'Personal achievement note'
      };

      const updatedAchievement = {
        ...mockAchievement,
        ...updateData,
        save: jest.fn().mockResolvedValue(this)
      };

      Achievement.findById = jest.fn().mockResolvedValue(updatedAchievement);

      const response = await request(app)
        .put(`/api/achievements/${mockAchievement._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('成就更新成功');
      expect(updatedAchievement.save).toHaveBeenCalled();
    });

    it('应该检查更新权限', async () => {
      const updateData = {
        isVisible: false
      };

      const otherUserAchievement = {
        ...mockAchievement,
        user: 'other-user-id'
      };

      Achievement.findById = jest.fn().mockResolvedValue(otherUserAchievement);

      const response = await request(app)
        .put(`/api/achievements/${mockAchievement._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限修改此成就');
    });

    it('应该在成就不存在时返回404', async () => {
      const updateData = {
        isVisible: false
      };

      Achievement.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/achievements/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('成就不存在');
    });

    it('应该验证更新数据', async () => {
      const invalidData = {
        isVisible: 'not-a-boolean',
        notes: 'a'.repeat(1001) // 太长
      };

      Achievement.findById = jest.fn().mockResolvedValue(mockAchievement);

      const response = await request(app)
        .put(`/api/achievements/${mockAchievement._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });

    it('应该防止修改只读字段', async () => {
      const invalidData = {
        user: 'other-user-id', // 只读字段
        template: 'other-template-id', // 只读字段
        unlockedAt: new Date() // 只读字段
      };

      Achievement.findById = jest.fn().mockResolvedValue(mockAchievement);

      const response = await request(app)
        .put(`/api/achievements/${mockAchievement._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不允许修改只读字段');
    });
  });

  describe('DELETE /api/achievements/:id', () => {
    it('应该成功删除成就', async () => {
      Achievement.findById = jest.fn().mockResolvedValue(mockAchievement);
      Achievement.findByIdAndDelete = jest.fn().mockResolvedValue(mockAchievement);

      const response = await request(app)
        .delete(`/api/achievements/${mockAchievement._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('成就删除成功');
      expect(Achievement.findByIdAndDelete).toHaveBeenCalledWith(mockAchievement._id);
    });

    it('应该检查删除权限', async () => {
      const otherUserAchievement = {
        ...mockAchievement,
        user: 'other-user-id'
      };

      Achievement.findById = jest.fn().mockResolvedValue(otherUserAchievement);

      const response = await request(app)
        .delete(`/api/achievements/${mockAchievement._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限删除此成就');
    });

    it('应该在成就不存在时返回404', async () => {
      Achievement.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/achievements/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('成就不存在');
    });

    it('应该处理删除失败', async () => {
      Achievement.findById = jest.fn().mockResolvedValue(mockAchievement);
      Achievement.findByIdAndDelete = jest.fn().mockRejectedValue(
        new Error('删除失败')
      );

      const response = await request(app)
        .delete(`/api/achievements/${mockAchievement._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('删除成就失败');
    });
  });

  describe('POST /api/achievements/:id/unlock', () => {
    it('应该成功解锁成就', async () => {
      const lockedAchievement = {
        ...mockAchievement,
        unlockedAt: null,
        progress: {
          current: 1,
          target: 1,
          percentage: 100
        },
        save: jest.fn().mockResolvedValue(this)
      };

      Achievement.findById = jest.fn().mockResolvedValue(lockedAchievement);

      const response = await request(app)
        .post(`/api/achievements/${mockAchievement._id}/unlock`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('成就解锁成功');
      expect(lockedAchievement.unlockedAt).toBeDefined();
      expect(lockedAchievement.save).toHaveBeenCalled();
    });

    it('应该检查解锁权限', async () => {
      const otherUserAchievement = {
        ...mockAchievement,
        user: 'other-user-id',
        unlockedAt: null
      };

      Achievement.findById = jest.fn().mockResolvedValue(otherUserAchievement);

      const response = await request(app)
        .post(`/api/achievements/${mockAchievement._id}/unlock`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限解锁此成就');
    });

    it('应该检查成就是否已解锁', async () => {
      Achievement.findById = jest.fn().mockResolvedValue(mockAchievement); // 已解锁

      const response = await request(app)
        .post(`/api/achievements/${mockAchievement._id}/unlock`)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('成就已经解锁');
    });

    it('应该检查解锁条件', async () => {
      const incompleteAchievement = {
        ...mockAchievement,
        unlockedAt: null,
        progress: {
          current: 0,
          target: 1,
          percentage: 0
        }
      };

      Achievement.findById = jest.fn().mockResolvedValue(incompleteAchievement);

      const response = await request(app)
        .post(`/api/achievements/${mockAchievement._id}/unlock`)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('成就解锁条件未满足');
    });
  });

  describe('PUT /api/achievements/:id/progress', () => {
    it('应该成功更新成就进度', async () => {
      const progressData = {
        current: 5,
        target: 10
      };

      const achievementWithProgress = {
        ...mockAchievement,
        unlockedAt: null,
        progress: {
          current: 3,
          target: 10,
          percentage: 30
        },
        save: jest.fn().mockResolvedValue(this)
      };

      Achievement.findById = jest.fn().mockResolvedValue(achievementWithProgress);

      const response = await request(app)
        .put(`/api/achievements/${mockAchievement._id}/progress`)
        .set('Authorization', 'Bearer valid-token')
        .send(progressData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('成就进度更新成功');
      expect(achievementWithProgress.progress.current).toBe(progressData.current);
      expect(achievementWithProgress.progress.percentage).toBe(50);
      expect(achievementWithProgress.save).toHaveBeenCalled();
    });

    it('应该在进度达到100%时自动解锁成就', async () => {
      const progressData = {
        current: 10,
        target: 10
      };

      const achievementWithProgress = {
        ...mockAchievement,
        unlockedAt: null,
        progress: {
          current: 9,
          target: 10,
          percentage: 90
        },
        save: jest.fn().mockResolvedValue(this)
      };

      Achievement.findById = jest.fn().mockResolvedValue(achievementWithProgress);

      const response = await request(app)
        .put(`/api/achievements/${mockAchievement._id}/progress`)
        .set('Authorization', 'Bearer valid-token')
        .send(progressData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(achievementWithProgress.progress.percentage).toBe(100);
      expect(achievementWithProgress.unlockedAt).toBeDefined();
    });

    it('应该验证进度数据', async () => {
      const invalidData = {
        current: -1, // 负数
        target: 0 // 零
      };

      Achievement.findById = jest.fn().mockResolvedValue(mockAchievement);

      const response = await request(app)
        .put(`/api/achievements/${mockAchievement._id}/progress`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('进度数据无效');
    });

    it('应该防止超过目标值', async () => {
      const progressData = {
        current: 15, // 超过目标
        target: 10
      };

      const achievementWithProgress = {
        ...mockAchievement,
        unlockedAt: null,
        progress: {
          current: 5,
          target: 10,
          percentage: 50
        }
      };

      Achievement.findById = jest.fn().mockResolvedValue(achievementWithProgress);

      const response = await request(app)
        .put(`/api/achievements/${mockAchievement._id}/progress`)
        .set('Authorization', 'Bearer valid-token')
        .send(progressData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('当前进度不能超过目标值');
    });
  });

  describe('GET /api/achievements/templates', () => {
    it('应该成功获取成就模板列表', async () => {
      const mockTemplates = [mockTemplate];

      AchievementTemplate.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue(mockTemplates)
          })
        })
      });

      AchievementTemplate.countDocuments = jest.fn().mockResolvedValue(1);

      const response = await request(app)
        .get('/api/achievements/templates')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('应该支持按类别筛选模板', async () => {
      const category = 'milestone';

      AchievementTemplate.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([mockTemplate])
          })
        })
      });

      const response = await request(app)
        .get(`/api/achievements/templates?category=${category}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(AchievementTemplate.find).toHaveBeenCalledWith(
        expect.objectContaining({
          category: category,
          isActive: true
        })
      );
    });

    it('应该只返回激活的模板', async () => {
      AchievementTemplate.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([mockTemplate])
          })
        })
      });

      await request(app)
        .get('/api/achievements/templates')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(AchievementTemplate.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true
        })
      );
    });
  });

  describe('GET /api/achievements/stats', () => {
    it('应该成功获取成就统计信息', async () => {
      const mockStats = {
        totalAchievements: 15,
        unlockedAchievements: 8,
        totalPoints: 120,
        categoryStats: {
          milestone: 5,
          social: 3,
          exploration: 2
        }
      };

      Achievement.countDocuments = jest.fn()
        .mockResolvedValueOnce(mockStats.totalAchievements)
        .mockResolvedValueOnce(mockStats.unlockedAchievements);

      Achievement.aggregate = jest.fn().mockResolvedValue([
        { _id: null, totalPoints: mockStats.totalPoints }
      ]);

      const response = await request(app)
        .get('/api/achievements/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalAchievements).toBe(mockStats.totalAchievements);
      expect(response.body.data.stats.unlockedAchievements).toBe(mockStats.unlockedAchievements);
    });

    it('应该支持按档案筛选统计', async () => {
      const profileId = mockProfile._id;

      Achievement.countDocuments = jest.fn().mockResolvedValue(5);
      Achievement.aggregate = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/achievements/stats?profile=${profileId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Achievement.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser._id,
          profile: profileId
        })
      );
    });
  });

  describe('错误处理', () => {
    it('应该处理数据库连接错误', async () => {
      Achievement.find = jest.fn().mockRejectedValue(
        new Error('数据库连接失败')
      );

      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('服务器错误');
    });

    it('应该处理无效的ObjectId', async () => {
      const response = await request(app)
        .get('/api/achievements/invalid-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的成就ID');
    });

    it('应该处理未认证的请求', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        return res.status(401).json({
          success: false,
          message: '未认证'
        });
      });

      const response = await request(app)
        .get('/api/achievements')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未认证');
    });
  });

  describe('输入验证', () => {
    it('应该验证成就模板ID格式', async () => {
      const invalidData = {
        templateId: 'invalid-id',
        profileId: mockProfile._id
      };

      const response = await request(app)
        .post('/api/achievements')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的模板ID格式');
    });

    it('应该验证档案ID格式', async () => {
      const invalidData = {
        templateId: mockTemplate._id,
        profileId: 'invalid-id'
      };

      const response = await request(app)
        .post('/api/achievements')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的档案ID格式');
    });

    it('应该验证进度值范围', async () => {
      const invalidData = {
        current: 1000000, // 过大的值
        target: 10
      };

      Achievement.findById = jest.fn().mockResolvedValue(mockAchievement);

      const response = await request(app)
        .put(`/api/achievements/${mockAchievement._id}/progress`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('进度值超出有效范围');
    });
  });
});