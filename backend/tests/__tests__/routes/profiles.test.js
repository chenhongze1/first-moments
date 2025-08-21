const request = require('supertest');
const express = require('express');
const profileRoutes = require('../../../src/routes/profiles');
const Profile = require('../../../src/models/Profile');
const User = require('../../../src/models/User');
const Moment = require('../../../src/models/Moment');
const Achievement = require('../../../src/models/Achievement');
const { authenticateToken } = require('../../../src/middleware/auth');

// Mock dependencies
jest.mock('../../../src/models/Profile');
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Moment');
jest.mock('../../../src/models/Achievement');
jest.mock('../../../src/middleware/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/profiles', profileRoutes);

describe('Profile Routes', () => {
  let mockUser;
  let mockProfile;
  let mockCollaborator;

  beforeEach(() => {
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    mockCollaborator = {
      _id: '507f1f77bcf86cd799439012',
      username: 'collaborator',
      email: 'collaborator@example.com',
      displayName: 'Collaborator User'
    };

    mockProfile = {
      _id: '507f1f77bcf86cd799439013',
      name: 'Test Profile',
      description: 'Test profile description',
      owner: mockUser._id,
      collaborators: [],
      isPublic: true,
      settings: {
        allowComments: true,
        allowLikes: true,
        showLocation: true,
        theme: 'default'
      },
      stats: {
        momentsCount: 10,
        achievementsCount: 5,
        likesCount: 25,
        commentsCount: 15
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(this),
      populate: jest.fn().mockResolvedValue(this),
      toJSON: jest.fn().mockReturnValue({
        id: '507f1f77bcf86cd799439013',
        name: 'Test Profile',
        description: 'Test profile description'
      })
    };

    // Mock authentication middleware
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/profiles', () => {
    it('应该成功获取档案列表', async () => {
      const mockProfiles = [mockProfile];

      Profile.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue(mockProfiles)
            })
          })
        })
      });

      Profile.countDocuments = jest.fn().mockResolvedValue(1);

      const response = await request(app)
        .get('/api/profiles')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profiles).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('应该支持分页查询', async () => {
      const page = 2;
      const limit = 5;

      Profile.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      Profile.countDocuments = jest.fn().mockResolvedValue(15);

      const response = await request(app)
        .get(`/api/profiles?page=${page}&limit=${limit}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(page);
      expect(response.body.data.pagination.limit).toBe(limit);
      expect(response.body.data.pagination.totalPages).toBe(3);
    });

    it('应该支持按类型筛选', async () => {
      const type = 'owned';

      Profile.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockProfile])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/profiles?type=${type}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Profile.find).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: mockUser._id
        })
      );
    });

    it('应该支持搜索功能', async () => {
      const search = 'test';

      Profile.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockProfile])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/profiles?search=${search}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Profile.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $and: expect.arrayContaining([
            {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
              ]
            }
          ])
        })
      );
    });

    it('应该只返回用户有权限访问的档案', async () => {
      Profile.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockProfile])
            })
          })
        })
      });

      await request(app)
        .get('/api/profiles')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(Profile.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { owner: mockUser._id },
            { collaborators: mockUser._id },
            { isPublic: true }
          ]
        })
      );
    });
  });

  describe('GET /api/profiles/:id', () => {
    it('应该成功获取档案详情', async () => {
      Profile.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProfile)
      });

      const response = await request(app)
        .get(`/api/profiles/${mockProfile._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profile).toBeDefined();
      expect(Profile.findById).toHaveBeenCalledWith(mockProfile._id);
    });

    it('应该在档案不存在时返回404', async () => {
      Profile.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get('/api/profiles/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('档案不存在');
    });

    it('应该检查用户访问权限', async () => {
      const privateProfile = {
        ...mockProfile,
        isPublic: false,
        owner: 'other-user-id',
        collaborators: []
      };

      Profile.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(privateProfile)
      });

      const response = await request(app)
        .get(`/api/profiles/${mockProfile._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限访问此档案');
    });

    it('应该允许所有者访问私有档案', async () => {
      const privateProfile = {
        ...mockProfile,
        isPublic: false,
        owner: mockUser._id
      };

      Profile.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(privateProfile)
      });

      const response = await request(app)
        .get(`/api/profiles/${mockProfile._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该允许协作者访问私有档案', async () => {
      const privateProfile = {
        ...mockProfile,
        isPublic: false,
        owner: 'other-user-id',
        collaborators: [mockUser._id]
      };

      Profile.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(privateProfile)
      });

      const response = await request(app)
        .get(`/api/profiles/${mockProfile._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/profiles', () => {
    it('应该成功创建档案', async () => {
      const profileData = {
        name: 'New Profile',
        description: 'New profile description',
        isPublic: true
      };

      const newProfile = {
        ...mockProfile,
        ...profileData,
        owner: mockUser._id
      };

      Profile.prototype.save = jest.fn().mockResolvedValue(newProfile);
      Profile.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(newProfile)
      });

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(profileData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('档案创建成功');
      expect(response.body.data.profile.name).toBe(profileData.name);
    });

    it('应该验证必填字段', async () => {
      const incompleteData = {
        description: 'Missing name'
      };

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('档案名称是必填项');
    });

    it('应该验证档案名称长度', async () => {
      const invalidData = {
        name: 'a', // 太短
        description: 'Valid description'
      };

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('档案名称长度');
    });

    it('应该验证描述长度', async () => {
      const invalidData = {
        name: 'Valid Name',
        description: 'a'.repeat(1001) // 太长
      };

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('描述长度不能超过');
    });

    it('应该检查用户档案数量限制', async () => {
      Profile.countDocuments = jest.fn().mockResolvedValue(10); // 假设限制是10个

      const profileData = {
        name: 'New Profile',
        description: 'New profile description'
      };

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(profileData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('档案数量已达上限');
    });

    it('应该处理数据库保存错误', async () => {
      const profileData = {
        name: 'New Profile',
        description: 'New profile description'
      };

      Profile.countDocuments = jest.fn().mockResolvedValue(5);
      Profile.prototype.save = jest.fn().mockRejectedValue(
        new Error('数据库保存失败')
      );

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(profileData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('创建档案失败');
    });
  });

  describe('PUT /api/profiles/:id', () => {
    it('应该成功更新档案', async () => {
      const updateData = {
        name: 'Updated Profile',
        description: 'Updated description',
        isPublic: false
      };

      const updatedProfile = {
        ...mockProfile,
        ...updateData,
        save: jest.fn().mockResolvedValue(this)
      };

      Profile.findById = jest.fn().mockResolvedValue(updatedProfile);

      const response = await request(app)
        .put(`/api/profiles/${mockProfile._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('档案更新成功');
      expect(updatedProfile.save).toHaveBeenCalled();
    });

    it('应该检查更新权限', async () => {
      const updateData = {
        name: 'Updated Profile'
      };

      const otherUserProfile = {
        ...mockProfile,
        owner: 'other-user-id',
        collaborators: []
      };

      Profile.findById = jest.fn().mockResolvedValue(otherUserProfile);

      const response = await request(app)
        .put(`/api/profiles/${mockProfile._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限修改此档案');
    });

    it('应该允许协作者更新档案', async () => {
      const updateData = {
        name: 'Updated Profile'
      };

      const collaboratorProfile = {
        ...mockProfile,
        owner: 'other-user-id',
        collaborators: [mockUser._id],
        save: jest.fn().mockResolvedValue(this)
      };

      Profile.findById = jest.fn().mockResolvedValue(collaboratorProfile);

      const response = await request(app)
        .put(`/api/profiles/${mockProfile._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该在档案不存在时返回404', async () => {
      const updateData = {
        name: 'Updated Profile'
      };

      Profile.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/profiles/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('档案不存在');
    });

    it('应该验证更新数据', async () => {
      const invalidData = {
        name: '', // 空名称
        description: 'a'.repeat(1001) // 太长
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .put(`/api/profiles/${mockProfile._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('DELETE /api/profiles/:id', () => {
    it('应该成功删除档案', async () => {
      Profile.findById = jest.fn().mockResolvedValue(mockProfile);
      Profile.findByIdAndDelete = jest.fn().mockResolvedValue(mockProfile);
      Moment.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });
      Achievement.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 3 });

      const response = await request(app)
        .delete(`/api/profiles/${mockProfile._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('档案删除成功');
      expect(Profile.findByIdAndDelete).toHaveBeenCalledWith(mockProfile._id);
      expect(Moment.deleteMany).toHaveBeenCalledWith({ profile: mockProfile._id });
      expect(Achievement.deleteMany).toHaveBeenCalledWith({ profile: mockProfile._id });
    });

    it('应该检查删除权限', async () => {
      const otherUserProfile = {
        ...mockProfile,
        owner: 'other-user-id'
      };

      Profile.findById = jest.fn().mockResolvedValue(otherUserProfile);

      const response = await request(app)
        .delete(`/api/profiles/${mockProfile._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('只有档案所有者可以删除档案');
    });

    it('应该在档案不存在时返回404', async () => {
      Profile.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/profiles/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('档案不存在');
    });

    it('应该处理删除失败', async () => {
      Profile.findById = jest.fn().mockResolvedValue(mockProfile);
      Profile.findByIdAndDelete = jest.fn().mockRejectedValue(
        new Error('删除失败')
      );

      const response = await request(app)
        .delete(`/api/profiles/${mockProfile._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('删除档案失败');
    });
  });

  describe('POST /api/profiles/:id/collaborators', () => {
    it('应该成功添加协作者', async () => {
      const collaboratorData = {
        userId: mockCollaborator._id
      };

      const profileWithCollaborator = {
        ...mockProfile,
        collaborators: [mockCollaborator._id],
        save: jest.fn().mockResolvedValue(this)
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);
      User.findById = jest.fn().mockResolvedValue(mockCollaborator);
      mockProfile.save = jest.fn().mockResolvedValue(profileWithCollaborator);

      const response = await request(app)
        .post(`/api/profiles/${mockProfile._id}/collaborators`)
        .set('Authorization', 'Bearer valid-token')
        .send(collaboratorData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('协作者添加成功');
      expect(mockProfile.collaborators).toContain(mockCollaborator._id);
      expect(mockProfile.save).toHaveBeenCalled();
    });

    it('应该检查添加协作者的权限', async () => {
      const collaboratorData = {
        userId: mockCollaborator._id
      };

      const otherUserProfile = {
        ...mockProfile,
        owner: 'other-user-id'
      };

      Profile.findById = jest.fn().mockResolvedValue(otherUserProfile);

      const response = await request(app)
        .post(`/api/profiles/${mockProfile._id}/collaborators`)
        .set('Authorization', 'Bearer valid-token')
        .send(collaboratorData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('只有档案所有者可以添加协作者');
    });

    it('应该验证用户存在', async () => {
      const collaboratorData = {
        userId: 'nonexistent-user-id'
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);
      User.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/profiles/${mockProfile._id}/collaborators`)
        .set('Authorization', 'Bearer valid-token')
        .send(collaboratorData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('用户不存在');
    });

    it('应该防止重复添加协作者', async () => {
      const collaboratorData = {
        userId: mockCollaborator._id
      };

      const profileWithExistingCollaborator = {
        ...mockProfile,
        collaborators: [mockCollaborator._id]
      };

      Profile.findById = jest.fn().mockResolvedValue(profileWithExistingCollaborator);
      User.findById = jest.fn().mockResolvedValue(mockCollaborator);

      const response = await request(app)
        .post(`/api/profiles/${mockProfile._id}/collaborators`)
        .set('Authorization', 'Bearer valid-token')
        .send(collaboratorData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('用户已经是协作者');
    });

    it('应该防止所有者添加自己为协作者', async () => {
      const collaboratorData = {
        userId: mockUser._id
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post(`/api/profiles/${mockProfile._id}/collaborators`)
        .set('Authorization', 'Bearer valid-token')
        .send(collaboratorData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('不能添加自己为协作者');
    });
  });

  describe('DELETE /api/profiles/:id/collaborators/:userId', () => {
    it('应该成功移除协作者', async () => {
      const profileWithCollaborator = {
        ...mockProfile,
        collaborators: [mockCollaborator._id],
        save: jest.fn().mockResolvedValue(this)
      };

      Profile.findById = jest.fn().mockResolvedValue(profileWithCollaborator);

      const response = await request(app)
        .delete(`/api/profiles/${mockProfile._id}/collaborators/${mockCollaborator._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('协作者移除成功');
      expect(profileWithCollaborator.collaborators).not.toContain(mockCollaborator._id);
      expect(profileWithCollaborator.save).toHaveBeenCalled();
    });

    it('应该检查移除协作者的权限', async () => {
      const otherUserProfile = {
        ...mockProfile,
        owner: 'other-user-id',
        collaborators: [mockCollaborator._id]
      };

      Profile.findById = jest.fn().mockResolvedValue(otherUserProfile);

      const response = await request(app)
        .delete(`/api/profiles/${mockProfile._id}/collaborators/${mockCollaborator._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('只有档案所有者可以移除协作者');
    });

    it('应该在协作者不存在时返回404', async () => {
      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .delete(`/api/profiles/${mockProfile._id}/collaborators/${mockCollaborator._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('协作者不存在');
    });
  });

  describe('PUT /api/profiles/:id/settings', () => {
    it('应该成功更新档案设置', async () => {
      const settingsData = {
        allowComments: false,
        allowLikes: true,
        showLocation: false,
        theme: 'dark'
      };

      const updatedProfile = {
        ...mockProfile,
        settings: settingsData,
        save: jest.fn().mockResolvedValue(this)
      };

      Profile.findById = jest.fn().mockResolvedValue(updatedProfile);

      const response = await request(app)
        .put(`/api/profiles/${mockProfile._id}/settings`)
        .set('Authorization', 'Bearer valid-token')
        .send(settingsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('档案设置更新成功');
      expect(response.body.data.settings).toEqual(settingsData);
      expect(updatedProfile.save).toHaveBeenCalled();
    });

    it('应该检查更新设置的权限', async () => {
      const settingsData = {
        allowComments: false
      };

      const otherUserProfile = {
        ...mockProfile,
        owner: 'other-user-id',
        collaborators: []
      };

      Profile.findById = jest.fn().mockResolvedValue(otherUserProfile);

      const response = await request(app)
        .put(`/api/profiles/${mockProfile._id}/settings`)
        .set('Authorization', 'Bearer valid-token')
        .send(settingsData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限修改此档案设置');
    });

    it('应该验证设置数据格式', async () => {
      const invalidSettings = {
        allowComments: 'invalid', // 应该是布尔值
        theme: 'invalid-theme' // 无效主题
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .put(`/api/profiles/${mockProfile._id}/settings`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidSettings)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('设置数据格式无效');
    });
  });

  describe('GET /api/profiles/:id/stats', () => {
    it('应该成功获取档案统计信息', async () => {
      const mockStats = {
        momentsCount: 15,
        achievementsCount: 8,
        likesCount: 45,
        commentsCount: 25,
        collaboratorsCount: 3
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);
      Moment.countDocuments = jest.fn().mockResolvedValue(mockStats.momentsCount);
      Achievement.countDocuments = jest.fn().mockResolvedValue(mockStats.achievementsCount);

      const response = await request(app)
        .get(`/api/profiles/${mockProfile._id}/stats`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.momentsCount).toBe(mockStats.momentsCount);
      expect(response.body.data.stats.achievementsCount).toBe(mockStats.achievementsCount);
    });

    it('应该检查访问权限', async () => {
      const privateProfile = {
        ...mockProfile,
        isPublic: false,
        owner: 'other-user-id',
        collaborators: []
      };

      Profile.findById = jest.fn().mockResolvedValue(privateProfile);

      const response = await request(app)
        .get(`/api/profiles/${mockProfile._id}/stats`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限访问此档案统计');
    });
  });

  describe('错误处理', () => {
    it('应该处理数据库连接错误', async () => {
      Profile.find = jest.fn().mockRejectedValue(
        new Error('数据库连接失败')
      );

      const response = await request(app)
        .get('/api/profiles')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('服务器错误');
    });

    it('应该处理无效的ObjectId', async () => {
      const response = await request(app)
        .get('/api/profiles/invalid-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的档案ID');
    });

    it('应该处理未认证的请求', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        return res.status(401).json({
          success: false,
          message: '未认证'
        });
      });

      const response = await request(app)
        .get('/api/profiles')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未认证');
    });
  });

  describe('输入验证', () => {
    it('应该验证档案名称格式', async () => {
      const invalidData = {
        name: 'a'.repeat(101), // 太长
        description: 'Valid description'
      };

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('档案名称长度');
    });

    it('应该验证描述格式', async () => {
      const invalidData = {
        name: 'Valid Name',
        description: 'a'.repeat(1001) // 太长
      };

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('描述长度');
    });

    it('应该验证布尔值字段', async () => {
      const invalidData = {
        name: 'Valid Name',
        description: 'Valid description',
        isPublic: 'not-a-boolean'
      };

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('isPublic必须是布尔值');
    });
  });
});