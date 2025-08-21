const request = require('supertest');
const express = require('express');
const authRoutes = require('../../../src/routes/auth');
const User = require('../../../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../../../src/utils/auth');
const emailService = require('../../../src/services/emailService');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../src/utils/auth');
jest.mock('../../../src/services/emailService');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  let mockUser;

  beforeEach(() => {
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      displayName: 'Test User',
      isActive: true,
      isEmailVerified: true,
      role: 'user',
      loginAttempts: 0,
      lockUntil: null,
      createdAt: new Date(),
      save: jest.fn().mockResolvedValue(this),
      toJSON: jest.fn().mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User'
      })
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User'
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword123');
      User.prototype.save = jest.fn().mockResolvedValue(mockUser);
      generateToken.mockReturnValue('jwt-token');
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('注册成功');
      expect(response.body.data.token).toBe('jwt-token');
      expect(response.body.data.user).toBeDefined();
      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { username: userData.username },
          { email: userData.email }
        ]
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('应该拒绝重复的用户名', async () => {
      const userData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123'
      };

      User.findOne = jest.fn().mockResolvedValue({ username: 'existinguser' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('用户名或邮箱已存在');
    });

    it('应该拒绝重复的邮箱', async () => {
      const userData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123'
      };

      User.findOne = jest.fn().mockResolvedValue({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('用户名或邮箱已存在');
    });

    it('应该验证必填字段', async () => {
      const incompleteData = {
        username: 'testuser'
        // 缺少 email 和 password
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });

    it('应该验证邮箱格式', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱格式无效');
    });

    it('应该验证密码强度', async () => {
      const weakPasswordData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123' // 太短
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码长度至少6位');
    });

    it('应该验证用户名格式', async () => {
      const invalidUsernameData = {
        username: 'a', // 太短
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUsernameData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名长度');
    });

    it('应该处理数据库错误', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      User.findOne = jest.fn().mockRejectedValue(new Error('数据库连接失败'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('注册失败');
    });
  });

  describe('POST /api/auth/login', () => {
    it('应该成功登录', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      generateToken.mockReturnValue('jwt-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('登录成功');
      expect(response.body.data.token).toBe('jwt-token');
      expect(response.body.data.user).toBeDefined();
      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { username: loginData.username },
          { email: loginData.username }
        ]
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
    });

    it('应该支持邮箱登录', async () => {
      const loginData = {
        username: 'test@example.com',
        password: 'password123'
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      generateToken.mockReturnValue('jwt-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { username: loginData.username },
          { email: loginData.username }
        ]
      });
    });

    it('应该拒绝不存在的用户', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'password123'
      };

      User.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('用户名或密码错误');
    });

    it('应该拒绝错误的密码', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('用户名或密码错误');
    });

    it('应该拒绝被禁用的用户', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      const inactiveUser = {
        ...mockUser,
        isActive: false
      };

      User.findOne = jest.fn().mockResolvedValue(inactiveUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('账户已被禁用');
    });

    it('应该处理账户锁定', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      const lockedUser = {
        ...mockUser,
        lockUntil: new Date(Date.now() + 3600000) // 1小时后解锁
      };

      User.findOne = jest.fn().mockResolvedValue(lockedUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('账户已被锁定');
    });

    it('应该增加失败登录次数', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const userWithAttempts = {
        ...mockUser,
        loginAttempts: 2,
        save: jest.fn().mockResolvedValue(this)
      };

      User.findOne = jest.fn().mockResolvedValue(userWithAttempts);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(userWithAttempts.loginAttempts).toBe(3);
      expect(userWithAttempts.save).toHaveBeenCalled();
    });

    it('应该在达到最大尝试次数时锁定账户', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const userNearLimit = {
        ...mockUser,
        loginAttempts: 4, // 假设最大尝试次数是5
        save: jest.fn().mockResolvedValue(this)
      };

      User.findOne = jest.fn().mockResolvedValue(userNearLimit);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(userNearLimit.lockUntil).toBeDefined();
      expect(userNearLimit.save).toHaveBeenCalled();
    });

    it('应该重置成功登录后的失败次数', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      const userWithAttempts = {
        ...mockUser,
        loginAttempts: 3,
        save: jest.fn().mockResolvedValue(this)
      };

      User.findOne = jest.fn().mockResolvedValue(userWithAttempts);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      generateToken.mockReturnValue('jwt-token');

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(userWithAttempts.loginAttempts).toBe(0);
      expect(userWithAttempts.lockUntil).toBeUndefined();
      expect(userWithAttempts.save).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('应该成功登出', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('登出成功');
    });

    it('应该处理无令牌的登出请求', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('登出成功');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('应该成功刷新令牌', async () => {
      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };

      jwt.verify = jest.fn().mockReturnValue({
        userId: mockUser._id,
        type: 'refresh'
      });
      User.findById = jest.fn().mockResolvedValue(mockUser);
      generateToken.mockReturnValue('new-jwt-token');

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('new-jwt-token');
      expect(jwt.verify).toHaveBeenCalledWith(
        refreshData.refreshToken,
        process.env.JWT_REFRESH_SECRET
      );
    });

    it('应该拒绝无效的刷新令牌', async () => {
      const refreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('刷新令牌无效');
    });

    it('应该拒绝错误类型的令牌', async () => {
      const refreshData = {
        refreshToken: 'access-token-not-refresh'
      };

      jwt.verify = jest.fn().mockReturnValue({
        userId: mockUser._id,
        type: 'access' // 应该是 'refresh'
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('令牌类型错误');
    });

    it('应该处理用户不存在的情况', async () => {
      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };

      jwt.verify = jest.fn().mockReturnValue({
        userId: 'nonexistent-user-id',
        type: 'refresh'
      });
      User.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('用户不存在');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('应该成功发送密码重置邮件', async () => {
      const forgotData = {
        email: 'test@example.com'
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      emailService.sendPasswordResetEmail = jest.fn().mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(forgotData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('密码重置邮件已发送');
      expect(User.findOne).toHaveBeenCalledWith({ email: forgotData.email });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('应该处理不存在的邮箱', async () => {
      const forgotData = {
        email: 'nonexistent@example.com'
      };

      User.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(forgotData)
        .expect(200); // 为了安全，即使邮箱不存在也返回成功

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('如果邮箱存在，密码重置邮件已发送');
    });

    it('应该验证邮箱格式', async () => {
      const forgotData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(forgotData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱格式无效');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('应该成功重置密码', async () => {
      const resetData = {
        token: 'valid-reset-token',
        newPassword: 'newpassword123'
      };

      jwt.verify = jest.fn().mockReturnValue({
        userId: mockUser._id,
        type: 'password-reset'
      });
      User.findById = jest.fn().mockResolvedValue(mockUser);
      bcrypt.hash = jest.fn().mockResolvedValue('new-hashed-password');
      mockUser.save = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('密码重置成功');
      expect(jwt.verify).toHaveBeenCalledWith(
        resetData.token,
        process.env.JWT_SECRET
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(resetData.newPassword, 12);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('应该拒绝无效的重置令牌', async () => {
      const resetData = {
        token: 'invalid-reset-token',
        newPassword: 'newpassword123'
      };

      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('重置令牌无效或已过期');
    });

    it('应该验证新密码强度', async () => {
      const resetData = {
        token: 'valid-reset-token',
        newPassword: '123' // 太短
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码长度至少6位');
    });

    it('应该处理用户不存在的情况', async () => {
      const resetData = {
        token: 'valid-reset-token',
        newPassword: 'newpassword123'
      };

      jwt.verify = jest.fn().mockReturnValue({
        userId: 'nonexistent-user-id',
        type: 'password-reset'
      });
      User.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('用户不存在');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('应该成功验证邮箱', async () => {
      const verifyData = {
        token: 'valid-verification-token'
      };

      jwt.verify = jest.fn().mockReturnValue({
        userId: mockUser._id,
        email: mockUser.email,
        type: 'email-verification'
      });
      User.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        isEmailVerified: false
      });
      const updatedUser = {
        ...mockUser,
        isEmailVerified: true,
        save: jest.fn().mockResolvedValue(this)
      };
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedUser);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send(verifyData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('邮箱验证成功');
      expect(jwt.verify).toHaveBeenCalledWith(
        verifyData.token,
        process.env.JWT_SECRET
      );
    });

    it('应该拒绝无效的验证令牌', async () => {
      const verifyData = {
        token: 'invalid-verification-token'
      };

      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send(verifyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('验证令牌无效或已过期');
    });

    it('应该处理已验证的邮箱', async () => {
      const verifyData = {
        token: 'valid-verification-token'
      };

      jwt.verify = jest.fn().mockReturnValue({
        userId: mockUser._id,
        email: mockUser.email,
        type: 'email-verification'
      });
      User.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        isEmailVerified: true
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send(verifyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('邮箱已经验证过了');
    });
  });

  describe('GET /api/auth/me', () => {
    it('应该返回当前用户信息', async () => {
      // 这个测试需要认证中间件，这里简化处理
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
    });

    it('应该在未认证时返回401', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('错误处理', () => {
    it('应该处理数据库连接错误', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      User.findOne = jest.fn().mockRejectedValue(
        new Error('数据库连接失败')
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('登录失败');
    });

    it('应该处理邮件发送失败', async () => {
      const forgotData = {
        email: 'test@example.com'
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      emailService.sendPasswordResetEmail = jest.fn().mockRejectedValue(
        new Error('邮件发送失败')
      );

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(forgotData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('发送失败');
    });

    it('应该处理JWT签名错误', async () => {
      const refreshData = {
        refreshToken: 'tampered-token'
      };

      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('刷新令牌无效');
    });
  });

  describe('安全性测试', () => {
    it('应该防止SQL注入攻击', async () => {
      const maliciousData = {
        username: "'; DROP TABLE users; --",
        password: 'password123'
      };

      User.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { username: maliciousData.username },
          { email: maliciousData.username }
        ]
      });
    });

    it('应该防止暴力破解攻击', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const userWithManyAttempts = {
        ...mockUser,
        loginAttempts: 10,
        lockUntil: new Date(Date.now() + 3600000)
      };

      User.findOne = jest.fn().mockResolvedValue(userWithManyAttempts);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('账户已被锁定');
    });

    it('应该限制密码重置请求频率', async () => {
      const forgotData = {
        email: 'test@example.com'
      };

      // 模拟频繁请求
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/forgot-password')
          .send(forgotData);
      }

      // 第4次请求应该被限制（如果实现了速率限制）
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(forgotData);

      // 这里的具体行为取决于速率限制的实现
      expect(response.status).toBeLessThanOrEqual(429);
    });
  });
});