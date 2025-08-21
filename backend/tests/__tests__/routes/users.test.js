const request = require('supertest');
const express = require('express');
const userRoutes = require('../../../src/routes/users');
const User = require('../../../src/models/User');
const Profile = require('../../../src/models/Profile');
const { authenticateToken } = require('../../../src/middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Profile');
jest.mock('../../../src/middleware/auth');
jest.mock('multer');
jest.mock('fs');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  let mockUser;
  let mockProfile;

  beforeEach(() => {
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      avatar: 'avatar.jpg',
      bio: 'Test bio',
      birthday: new Date('1990-01-01'),
      location: 'Test City',
      website: 'https://test.com',
      isActive: true,
      isEmailVerified: true,
      role: 'user',
      settings: {
        privacy: 'public',
        notifications: {
          email: true,
          push: true,
          achievements: true,
          moments: true
        },
        theme: 'light',
        language: 'zh-CN'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(this),
      toJSON: jest.fn().mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User'
      })
    };

    mockProfile = {
      _id: '507f1f77bcf86cd799439012',
      name: 'Test Profile',
      description: 'Test profile description',
      owner: mockUser._id,
      collaborators: [],
      isPublic: true,
      createdAt: new Date()
    };

    // Mock authentication middleware
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/users/profile', () => {
    it('应该成功获取用户资料', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toBe('testuser');
      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
    });

    it('应该在用户不存在时返回404', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('用户不存在');
    });

    it('应该在未认证时返回401', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        return res.status(401).json({ success: false, message: '未认证' });
      });

      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('应该成功更新用户资料', async () => {
      const updateData = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
        location: 'Updated City',
        website: 'https://updated.com'
      };

      const updatedUser = {
        ...mockUser,
        ...updateData,
        save: jest.fn().mockResolvedValue(this)
      };

      User.findById = jest.fn().mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('资料更新成功');
      expect(updatedUser.save).toHaveBeenCalled();
    });

    it('应该验证输入数据', async () => {
      const invalidData = {
        displayName: '', // 空名称
        website: 'invalid-url', // 无效URL
        bio: 'a'.repeat(501) // 超长bio
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });

    it('应该验证生日格式', async () => {
      const invalidData = {
        birthday: 'invalid-date'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('生日格式无效');
    });

    it('应该验证网站URL格式', async () => {
      const invalidData = {
        website: 'not-a-url'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('网站URL格式无效');
    });

    it('应该处理数据库更新错误', async () => {
      const updateData = {
        displayName: 'Updated Name'
      };

      User.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        save: jest.fn().mockRejectedValue(new Error('数据库错误'))
      });

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('更新失败');
    });
  });

  describe('POST /api/users/avatar', () => {
    beforeEach(() => {
      // Mock multer middleware
      const mockMulter = {
        single: jest.fn().mockReturnValue((req, res, next) => {
          req.file = {
            filename: 'avatar-123.jpg',
            path: '/uploads/avatars/avatar-123.jpg',
            mimetype: 'image/jpeg',
            size: 1024000
          };
          next();
        })
      };
      multer.mockReturnValue(mockMulter);
    });

    it('应该成功上传头像', async () => {
      const updatedUser = {
        ...mockUser,
        avatar: 'avatar-123.jpg',
        save: jest.fn().mockResolvedValue(this)
      };

      User.findById = jest.fn().mockResolvedValue(updatedUser);
      fs.existsSync = jest.fn().mockReturnValue(false); // 旧头像不存在

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', Buffer.from('fake image data'), 'avatar.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('头像上传成功');
      expect(response.body.data.avatar).toBe('avatar-123.jpg');
      expect(updatedUser.save).toHaveBeenCalled();
    });

    it('应该在没有文件时返回错误', async () => {
      // Mock no file uploaded
      const mockMulter = {
        single: jest.fn().mockReturnValue((req, res, next) => {
          req.file = null;
          next();
        })
      };
      multer.mockReturnValue(mockMulter);

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('请选择要上传的头像文件');
    });

    it('应该验证文件类型', async () => {
      const mockMulter = {
        single: jest.fn().mockReturnValue((req, res, next) => {
          req.file = {
            filename: 'avatar-123.txt',
            path: '/uploads/avatars/avatar-123.txt',
            mimetype: 'text/plain',
            size: 1024
          };
          next();
        })
      };
      multer.mockReturnValue(mockMulter);

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', Buffer.from('text content'), 'avatar.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('只支持图片文件格式');
    });

    it('应该验证文件大小', async () => {
      const mockMulter = {
        single: jest.fn().mockReturnValue((req, res, next) => {
          req.file = {
            filename: 'avatar-123.jpg',
            path: '/uploads/avatars/avatar-123.jpg',
            mimetype: 'image/jpeg',
            size: 10 * 1024 * 1024 // 10MB，超过限制
          };
          next();
        })
      };
      multer.mockReturnValue(mockMulter);

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', Buffer.from('large image data'), 'avatar.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('文件大小不能超过5MB');
    });

    it('应该删除旧头像文件', async () => {
      const updatedUser = {
        ...mockUser,
        avatar: 'old-avatar.jpg',
        save: jest.fn().mockResolvedValue(this)
      };

      User.findById = jest.fn().mockResolvedValue(updatedUser);
      fs.existsSync = jest.fn().mockReturnValue(true); // 旧头像存在
      fs.unlinkSync = jest.fn(); // Mock删除文件

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', Buffer.from('fake image data'), 'avatar.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('PUT /api/users/settings', () => {
    it('应该成功更新用户设置', async () => {
      const settingsData = {
        privacy: 'private',
        notifications: {
          email: false,
          push: true,
          achievements: true,
          moments: false
        },
        theme: 'dark',
        language: 'en-US'
      };

      const updatedUser = {
        ...mockUser,
        settings: settingsData,
        save: jest.fn().mockResolvedValue(this)
      };

      User.findById = jest.fn().mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/settings')
        .set('Authorization', 'Bearer valid-token')
        .send(settingsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('设置更新成功');
      expect(response.body.data.settings).toEqual(settingsData);
      expect(updatedUser.save).toHaveBeenCalled();
    });

    it('应该验证设置数据格式', async () => {
      const invalidSettings = {
        privacy: 'invalid-privacy', // 无效的隐私设置
        theme: 'invalid-theme', // 无效的主题
        language: 'invalid-lang' // 无效的语言
      };

      const response = await request(app)
        .put('/api/users/settings')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidSettings)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('设置数据格式无效');
    });

    it('应该支持部分设置更新', async () => {
      const partialSettings = {
        theme: 'dark'
      };

      const updatedUser = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(this)
      };

      User.findById = jest.fn().mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/settings')
        .set('Authorization', 'Bearer valid-token')
        .send(partialSettings)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(updatedUser.settings.theme).toBe('dark');
      expect(updatedUser.save).toHaveBeenCalled();
    });
  });

  describe('PUT /api/users/password', () => {
    it('应该成功修改密码', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      bcrypt.hash = jest.fn().mockResolvedValue('new-hashed-password');

      const updatedUser = {
        ...mockUser,
        password: 'old-hashed-password',
        save: jest.fn().mockResolvedValue(this)
      };

      User.findById = jest.fn().mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', 'Bearer valid-token')
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('密码修改成功');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        passwordData.currentPassword,
        updatedUser.password
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(passwordData.newPassword, 12);
      expect(updatedUser.save).toHaveBeenCalled();
    });

    it('应该验证当前密码', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', 'Bearer valid-token')
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('当前密码错误');
    });

    it('应该验证新密码确认', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword'
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', 'Bearer valid-token')
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('新密码确认不匹配');
    });

    it('应该验证新密码强度', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: '123', // 太短
        confirmPassword: '123'
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', 'Bearer valid-token')
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码长度至少6位');
    });

    it('应该防止使用相同的新密码', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'password123', // 与当前密码相同
        confirmPassword: 'password123'
      };

      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', 'Bearer valid-token')
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('新密码不能与当前密码相同');
    });
  });

  describe('GET /api/users/stats', () => {
    it('应该成功获取用户统计信息', async () => {
      const mockStats = {
        profilesCount: 5,
        momentsCount: 25,
        achievementsCount: 10,
        locationsCount: 8,
        totalLikes: 50,
        totalComments: 30
      };

      // Mock各种统计查询
      Profile.countDocuments = jest.fn().mockResolvedValue(mockStats.profilesCount);
      
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.profilesCount).toBe(mockStats.profilesCount);
    });

    it('应该处理统计查询错误', async () => {
      Profile.countDocuments = jest.fn().mockRejectedValue(
        new Error('数据库查询失败')
      );

      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('获取统计信息失败');
    });
  });

  describe('GET /api/users/profiles', () => {
    it('应该成功获取用户档案列表', async () => {
      const mockProfiles = [
        mockProfile,
        {
          ...mockProfile,
          _id: '507f1f77bcf86cd799439013',
          name: 'Another Profile'
        }
      ];

      Profile.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue(mockProfiles)
            })
          })
        })
      });

      Profile.countDocuments = jest.fn().mockResolvedValue(2);

      const response = await request(app)
        .get('/api/users/profiles')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profiles).toHaveLength(2);
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
        .get(`/api/users/profiles?page=${page}&limit=${limit}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(page);
      expect(response.body.data.pagination.limit).toBe(limit);
      expect(response.body.data.pagination.totalPages).toBe(3);
    });

    it('应该支持按类型筛选', async () => {
      const type = 'public';

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
        .get(`/api/users/profiles?type=${type}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Profile.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { owner: mockUser._id },
            { collaborators: mockUser._id }
          ]),
          isPublic: true
        })
      );
    });
  });

  describe('DELETE /api/users/account', () => {
    it('应该成功删除用户账户', async () => {
      const deleteData = {
        password: 'password123',
        confirmText: '删除我的账户'
      };

      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      User.findById = jest.fn().mockResolvedValue(mockUser);
      User.findByIdAndDelete = jest.fn().mockResolvedValue(mockUser);
      Profile.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 3 });

      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', 'Bearer valid-token')
        .send(deleteData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('账户删除成功');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        deleteData.password,
        mockUser.password
      );
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(mockUser._id);
      expect(Profile.deleteMany).toHaveBeenCalledWith({
        $or: [
          { owner: mockUser._id },
          { collaborators: mockUser._id }
        ]
      });
    });

    it('应该验证密码', async () => {
      const deleteData = {
        password: 'wrongpassword',
        confirmText: '删除我的账户'
      };

      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', 'Bearer valid-token')
        .send(deleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('密码错误');
    });

    it('应该验证确认文本', async () => {
      const deleteData = {
        password: 'password123',
        confirmText: '错误的确认文本'
      };

      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', 'Bearer valid-token')
        .send(deleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('确认文本不正确');
    });

    it('应该处理删除失败', async () => {
      const deleteData = {
        password: 'password123',
        confirmText: '删除我的账户'
      };

      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      User.findById = jest.fn().mockResolvedValue(mockUser);
      User.findByIdAndDelete = jest.fn().mockRejectedValue(
        new Error('删除失败')
      );

      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', 'Bearer valid-token')
        .send(deleteData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('删除账户失败');
    });
  });

  describe('GET /api/users/search', () => {
    it('应该成功搜索用户', async () => {
      const query = 'test';
      const mockUsers = [
        {
          _id: '507f1f77bcf86cd799439011',
          username: 'testuser1',
          displayName: 'Test User 1',
          avatar: 'avatar1.jpg'
        },
        {
          _id: '507f1f77bcf86cd799439012',
          username: 'testuser2',
          displayName: 'Test User 2',
          avatar: 'avatar2.jpg'
        }
      ];

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockUsers)
        })
      });

      const response = await request(app)
        .get(`/api/users/search?q=${query}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
      expect(User.find).toHaveBeenCalledWith({
        $and: [
          {
            $or: [
              { username: { $regex: query, $options: 'i' } },
              { displayName: { $regex: query, $options: 'i' } }
            ]
          },
          { isActive: true },
          { _id: { $ne: mockUser._id } } // 排除自己
        ]
      });
    });

    it('应该验证搜索关键词长度', async () => {
      const shortQuery = 'a'; // 太短

      const response = await request(app)
        .get(`/api/users/search?q=${shortQuery}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('搜索关键词至少2个字符');
    });

    it('应该限制搜索结果数量', async () => {
      const query = 'test';

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      await request(app)
        .get(`/api/users/search?q=${query}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(User.find().select().limit).toHaveBeenCalledWith(20); // 默认限制20个结果
    });

    it('应该处理空搜索结果', async () => {
      const query = 'nonexistent';

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      const response = await request(app)
        .get(`/api/users/search?q=${query}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(0);
      expect(response.body.message).toBe('未找到匹配的用户');
    });
  });

  describe('POST /api/users/verify-email', () => {
    it('应该成功验证邮箱', async () => {
      const verifyData = {
        token: 'valid-verification-token'
      };

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({
        userId: mockUser._id,
        email: mockUser.email,
        type: 'email-verification'
      });

      const unverifiedUser = {
        ...mockUser,
        isEmailVerified: false,
        save: jest.fn().mockResolvedValue(this)
      };

      User.findById = jest.fn().mockResolvedValue(unverifiedUser);

      const response = await request(app)
        .post('/api/users/verify-email')
        .send(verifyData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('邮箱验证成功');
      expect(unverifiedUser.isEmailVerified).toBe(true);
      expect(unverifiedUser.save).toHaveBeenCalled();
    });

    it('应该拒绝无效的验证令牌', async () => {
      const verifyData = {
        token: 'invalid-token'
      };

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/users/verify-email')
        .send(verifyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('验证令牌无效或已过期');
    });

    it('应该处理已验证的邮箱', async () => {
      const verifyData = {
        token: 'valid-verification-token'
      };

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({
        userId: mockUser._id,
        email: mockUser.email,
        type: 'email-verification'
      });

      User.findById = jest.fn().mockResolvedValue(mockUser); // 已验证

      const response = await request(app)
        .post('/api/users/verify-email')
        .send(verifyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('邮箱已经验证过了');
    });
  });

  describe('POST /api/users/resend-verification', () => {
    it('应该成功重新发送验证邮件', async () => {
      const unverifiedUser = {
        ...mockUser,
        isEmailVerified: false
      };

      User.findById = jest.fn().mockResolvedValue(unverifiedUser);
      
      const emailService = require('../../../src/services/emailService');
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({
        success: true
      });

      const response = await request(app)
        .post('/api/users/resend-verification')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('验证邮件已重新发送');
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        unverifiedUser.email,
        unverifiedUser.username,
        expect.any(String)
      );
    });

    it('应该处理已验证的邮箱', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUser); // 已验证

      const response = await request(app)
        .post('/api/users/resend-verification')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('邮箱已经验证过了');
    });

    it('应该处理邮件发送失败', async () => {
      const unverifiedUser = {
        ...mockUser,
        isEmailVerified: false
      };

      User.findById = jest.fn().mockResolvedValue(unverifiedUser);
      
      const emailService = require('../../../src/services/emailService');
      emailService.sendVerificationEmail = jest.fn().mockRejectedValue(
        new Error('邮件发送失败')
      );

      const response = await request(app)
        .post('/api/users/resend-verification')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('发送验证邮件失败');
    });
  });

  describe('错误处理', () => {
    it('应该处理数据库连接错误', async () => {
      User.findById = jest.fn().mockRejectedValue(
        new Error('数据库连接失败')
      );

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('服务器错误');
    });

    it('应该处理无效的JWT令牌', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        return res.status(401).json({
          success: false,
          message: 'JWT令牌无效'
        });
      });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('JWT令牌无效');
    });

    it('应该处理缺失的Authorization头', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        return res.status(401).json({
          success: false,
          message: '缺少认证令牌'
        });
      });

      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('缺少认证令牌');
    });
  });

  describe('输入验证', () => {
    it('应该验证邮箱格式', async () => {
      const invalidData = {
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱格式无效');
    });

    it('应该验证用户名格式', async () => {
      const invalidData = {
        username: 'a' // 太短
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名长度');
    });

    it('应该验证生日格式', async () => {
      const invalidData = {
        birthday: '2025-01-01' // 未来日期
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('生日不能是未来日期');
    });
  });
});