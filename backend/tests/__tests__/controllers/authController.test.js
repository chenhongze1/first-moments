const request = require('supertest');
const app = require('../../testApp');
const User = require('../../../src/models/User');
const bcrypt = require('bcryptjs');

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.profiles).toBeDefined();

      // 验证用户已保存到数据库
      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeTruthy();
      expect(savedUser.username).toBe(userData.username);
    });

    it('应该拒绝重复的邮箱', async () => {
      // 先创建一个用户
      await createTestUser();

      const userData = {
        username: 'anotheruser',
        email: 'test@example.com', // 使用已存在的邮箱
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户已存在');
    });

    it('应该拒绝无效的输入数据', async () => {
      const invalidData = {
        username: 'a', // 太短
        email: 'invalid-email', // 无效邮箱
        password: '123' // 太短
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
    });

    it('应该成功登录', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.profiles).toBeDefined();
    });

    it('应该拒绝错误的密码', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱或密码错误');
    });

    it('应该拒绝不存在的用户', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱或密码错误');
    });

    it('应该拒绝未验证邮箱的用户', async () => {
      // 创建未验证邮箱的用户
      const unverifiedUser = new User({
        username: 'unverified',
        email: 'unverified@example.com',
        password: await bcrypt.hash('password123', 10),
        isEmailVerified: false
      });
      await unverifiedUser.save();

      const loginData = {
        email: 'unverified@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('请先验证邮箱');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await createTestUser();
      authToken = generateAuthToken(testUser._id);
    });

    it('应该成功刷新令牌', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.token).not.toBe(authToken); // 新令牌应该不同
    });

    it('应该拒绝无效的令牌', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的令牌');
    });

    it('应该拒绝缺少令牌的请求', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供认证令牌');
    });
  });

  describe('POST /api/auth/logout', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await createTestUser();
      authToken = generateAuthToken(testUser._id);
    });

    it('应该成功登出', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('登出成功');
    });

    it('应该拒绝未认证的请求', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供认证令牌');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
    });

    it('应该发送密码重置邮件', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('密码重置邮件已发送');

      // 验证用户的重置令牌已设置
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.resetPasswordToken).toBeDefined();
      expect(updatedUser.resetPasswordExpires).toBeDefined();
    });

    it('应该处理不存在的邮箱', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户不存在');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let testUser;
    let resetToken;

    beforeEach(async () => {
      testUser = await createTestUser();
      resetToken = 'test-reset-token';
      
      // 设置重置令牌
      testUser.resetPasswordToken = await bcrypt.hash(resetToken, 10);
      testUser.resetPasswordExpires = new Date(Date.now() + 3600000); // 1小时后过期
      await testUser.save();
    });

    it('应该成功重置密码', async () => {
      const newPassword = 'newpassword123';
      
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('密码重置成功');

      // 验证密码已更新
      const updatedUser = await User.findById(testUser._id);
      const isPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
      expect(isPasswordValid).toBe(true);
      
      // 验证重置令牌已清除
      expect(updatedUser.resetPasswordToken).toBeUndefined();
      expect(updatedUser.resetPasswordExpires).toBeUndefined();
    });

    it('应该拒绝无效的重置令牌', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效或过期的重置令牌');
    });

    it('应该拒绝过期的重置令牌', async () => {
      // 设置过期的重置令牌
      testUser.resetPasswordExpires = new Date(Date.now() - 3600000); // 1小时前过期
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效或过期的重置令牌');
    });
  });
});