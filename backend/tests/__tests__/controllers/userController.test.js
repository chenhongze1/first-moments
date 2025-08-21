const request = require('supertest');
const app = require('../../testApp');
const User = require('../../../src/models/User');
const Profile = require('../../../src/models/Profile');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../../../src/utils/auth');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Profile');
jest.mock('../../../src/utils/auth');

describe('User Controller', () => {
  let mockUser;
  let authToken;

  beforeEach(() => {
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      bio: '这是一个测试用户',
      birthday: new Date('1990-01-01'),
      isActive: true,
      isEmailVerified: true,
      role: 'user',
      settings: {
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showBirthday: true
        },
        notifications: {
          email: true,
          push: true,
          achievements: true,
          moments: true,
          profiles: true,
          system: true
        },
        preferences: {
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          theme: 'light'
        }
      },
      statistics: {
        totalMoments: 10,
        totalProfiles: 2,
        totalAchievements: 5,
        totalPoints: 150
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

    authToken = 'valid-jwt-token';
    generateToken.mockReturnValue(authToken);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/users/profile', () => {
    it('应该成功获取当前用户资料', async () => {
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toBe('testuser');
    });

    it('应该在未认证时返回401', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未授权');
    });

    it('应该处理用户不存在的情况', async () => {
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('用户不存在');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('应该成功更新用户资料', async () => {
      const updateData = {
        displayName: '新的显示名称',
        bio: '更新的个人简介',
        birthday: '1991-01-01'
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...mockUser,
        ...updateData
      });

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.displayName).toBe('新的显示名称');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        expect.objectContaining(updateData),
        { new: true, runValidators: true }
      );
    });

    it('应该验证输入数据', async () => {
      const invalidData = {
        displayName: '', // 空的显示名称
        bio: 'a'.repeat(501), // 超长的个人简介
        birthday: 'invalid-date' // 无效日期
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });

    it('应该处理数据库更新错误', async () => {
      const updateData = {
        displayName: '新的显示名称'
      };

      User.findByIdAndUpdate = jest.fn().mockRejectedValue(
        new Error('数据库更新失败')
      );

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('更新失败');
    });
  });

  describe('POST /api/users/upload-avatar', () => {
    it('应该成功上传头像', async () => {
      const avatarUrl = 'https://example.com/new-avatar.jpg';
      
      // Mock file upload
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
        buffer: Buffer.from('fake-image-data')
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...mockUser,
        avatar: avatarUrl
      });

      const response = await request(app)
        .post('/api/users/upload-avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', mockFile.buffer, mockFile.originalname)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.avatarUrl).toBeDefined();
    });

    it('应该验证文件类型', async () => {
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024000,
        buffer: Buffer.from('fake-pdf-data')
      };

      const response = await request(app)
        .post('/api/users/upload-avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', mockFile.buffer, mockFile.originalname)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('文件类型不支持');
    });

    it('应该验证文件大小', async () => {
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'large-image.jpg',
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB
        buffer: Buffer.from('fake-large-image-data')
      };

      const response = await request(app)
        .post('/api/users/upload-avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', mockFile.buffer, mockFile.originalname)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('文件大小超出限制');
    });
  });

  describe('PUT /api/users/settings', () => {
    it('应该成功更新用户设置', async () => {
      const newSettings = {
        privacy: {
          profileVisibility: 'private',
          showEmail: true,
          showBirthday: false
        },
        notifications: {
          email: false,
          push: true,
          achievements: false,
          moments: true,
          profiles: false,
          system: true
        },
        preferences: {
          language: 'en-US',
          timezone: 'America/New_York',
          theme: 'dark'
        }
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...mockUser,
        settings: newSettings
      });

      const response = await request(app)
        .put('/api/users/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newSettings)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toEqual(newSettings);
    });

    it('应该验证设置数据格式', async () => {
      const invalidSettings = {
        privacy: {
          profileVisibility: 'invalid-visibility', // 无效值
          showEmail: 'not-boolean' // 应该是布尔值
        }
      };

      const response = await request(app)
        .put('/api/users/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSettings)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('设置格式无效');
    });
  });

  describe('POST /api/users/change-password', () => {
    it('应该成功修改密码', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      // Mock password verification
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      bcrypt.hash = jest.fn().mockResolvedValue('hashed-new-password');
      
      User.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        password: 'hashed-old-password'
      });
      
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('密码修改成功');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'oldpassword123',
        'hashed-old-password'
      );
    });

    it('应该验证当前密码', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      bcrypt.compare = jest.fn().mockResolvedValue(false);
      User.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        password: 'hashed-old-password'
      });

      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('当前密码不正确');
    });

    it('应该验证新密码确认', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword'
      };

      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
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
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码强度不足');
    });
  });

  describe('GET /api/users/statistics', () => {
    it('应该成功获取用户统计信息', async () => {
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          statistics: mockUser.statistics
        })
      });

      const response = await request(app)
        .get('/api/users/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toEqual(mockUser.statistics);
    });
  });

  describe('GET /api/users/profiles', () => {
    it('应该成功获取用户档案列表', async () => {
      const mockProfiles = [
        {
          _id: '507f1f77bcf86cd799439012',
          name: '我的旅行档案',
          description: '记录旅行时光',
          isPublic: true,
          createdAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439013',
          name: '工作记录',
          description: '工作相关的记录',
          isPublic: false,
          createdAt: new Date()
        }
      ];

      Profile.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue(mockProfiles)
          })
        })
      });

      Profile.countDocuments = jest.fn().mockResolvedValue(2);

      const response = await request(app)
        .get('/api/users/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profiles).toEqual(mockProfiles);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('应该支持分页查询', async () => {
      Profile.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([])
          })
        })
      });

      Profile.countDocuments = jest.fn().mockResolvedValue(0);

      const response = await request(app)
        .get('/api/users/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 2, limit: 5 })
        .expect(200);

      expect(Profile.find().sort().limit).toHaveBeenCalledWith(5);
      expect(Profile.find().sort().limit().skip).toHaveBeenCalledWith(5);
    });
  });

  describe('DELETE /api/users/account', () => {
    it('应该成功删除用户账户', async () => {
      const deleteData = {
        password: 'password123',
        confirmation: 'DELETE'
      };

      bcrypt.compare = jest.fn().mockResolvedValue(true);
      User.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        password: 'hashed-password'
      });
      
      User.findByIdAndDelete = jest.fn().mockResolvedValue(mockUser);
      Profile.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 2 });

      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('账户删除成功');
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(mockUser._id);
      expect(Profile.deleteMany).toHaveBeenCalledWith({ owner: mockUser._id });
    });

    it('应该验证密码', async () => {
      const deleteData = {
        password: 'wrongpassword',
        confirmation: 'DELETE'
      };

      bcrypt.compare = jest.fn().mockResolvedValue(false);
      User.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        password: 'hashed-password'
      });

      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('密码不正确');
    });

    it('应该验证确认文本', async () => {
      const deleteData = {
        password: 'password123',
        confirmation: 'WRONG'
      };

      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('确认文本不正确');
    });
  });

  describe('GET /api/users/search', () => {
    it('应该成功搜索用户', async () => {
      const mockUsers = [
        {
          _id: '507f1f77bcf86cd799439014',
          username: 'searchuser1',
          displayName: 'Search User 1',
          avatar: 'https://example.com/avatar1.jpg'
        },
        {
          _id: '507f1f77bcf86cd799439015',
          username: 'searchuser2',
          displayName: 'Search User 2',
          avatar: 'https://example.com/avatar2.jpg'
        }
      ];

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockUsers)
        })
      });

      const response = await request(app)
        .get('/api/users/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'search', limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toEqual(mockUsers);
      expect(User.find).toHaveBeenCalledWith({
        $or: [
          { username: { $regex: 'search', $options: 'i' } },
          { displayName: { $regex: 'search', $options: 'i' } }
        ],
        isActive: true
      });
    });

    it('应该验证搜索关键词长度', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'a' }) // 太短
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('搜索关键词至少需要2个字符');
    });

    it('应该限制搜索结果数量', async () => {
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      const response = await request(app)
        .get('/api/users/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'search', limit: 100 }) // 超过限制
        .expect(200);

      expect(User.find().select().limit).toHaveBeenCalledWith(50); // 最大限制
    });
  });

  describe('POST /api/users/verify-email', () => {
    it('应该成功验证邮箱', async () => {
      const verificationData = {
        token: 'valid-verification-token'
      };

      // Mock JWT verification
      jwt.verify = jest.fn().mockReturnValue({
        userId: mockUser._id,
        email: mockUser.email
      });

      User.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...mockUser,
        isEmailVerified: true
      });

      const response = await request(app)
        .post('/api/users/verify-email')
        .send(verificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('邮箱验证成功');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { isEmailVerified: true },
        { new: true }
      );
    });

    it('应该处理无效的验证令牌', async () => {
      const verificationData = {
        token: 'invalid-token'
      };

      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/users/verify-email')
        .send(verificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('验证令牌无效或已过期');
    });
  });

  describe('POST /api/users/resend-verification', () => {
    it('应该成功重新发送验证邮件', async () => {
      User.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        isEmailVerified: false
      });

      // Mock email service
      const emailService = require('../../../src/services/emailService');
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({
        success: true
      });

      const response = await request(app)
        .post('/api/users/resend-verification')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('验证邮件已重新发送');
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('应该处理已验证的邮箱', async () => {
      User.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        isEmailVerified: true
      });

      const response = await request(app)
        .post('/api/users/resend-verification')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('邮箱已经验证过了');
    });
  });

  describe('错误处理', () => {
    it('应该处理数据库连接错误', async () => {
      User.findById = jest.fn().mockRejectedValue(
        new Error('数据库连接失败')
      );

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('服务器内部错误');
    });

    it('应该处理无效的JWT令牌', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('令牌无效');
    });

    it('应该处理缺失的Authorization头', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供认证令牌');
    });
  });

  describe('输入验证', () => {
    it('应该验证邮箱格式', async () => {
      const invalidData = {
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
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
        .set('Authorization', `Bearer ${authToken}`)
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
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('生日不能是未来日期');
    });
  });
});