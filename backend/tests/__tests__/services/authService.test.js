const authService = require('../../../src/services/authService');
const User = require('../../../src/models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Mock emailService
jest.mock('../../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

const emailService = require('../../../src/services/emailService');

describe('Auth Service', () => {
  let testUser;
  let testUserData;

  beforeEach(async () => {
    testUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      nickname: '测试用户'
    };
    
    testUser = await createTestUser();
    
    // 清除所有mock调用记录
    jest.clearAllMocks();
  });

  describe('用户注册', () => {
    it('应该成功注册新用户', async () => {
      const result = await authService.register({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        nickname: '新用户'
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe('newuser');
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.nickname).toBe('新用户');
      expect(result.user.password).toBeUndefined(); // 密码不应该返回
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // 验证邮件应该被发送
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'newuser@example.com',
        expect.any(String)
      );
    });

    it('应该拒绝重复的用户名', async () => {
      const result = await authService.register({
        username: testUser.username,
        email: 'different@example.com',
        password: 'password123',
        nickname: '不同用户'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('用户名已存在');
    });

    it('应该拒绝重复的邮箱', async () => {
      const result = await authService.register({
        username: 'differentuser',
        email: testUser.email,
        password: 'password123',
        nickname: '不同用户'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('邮箱已存在');
    });

    it('应该拒绝无效的邮箱格式', async () => {
      const result = await authService.register({
        username: 'newuser',
        email: 'invalid-email',
        password: 'password123',
        nickname: '新用户'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('邮箱格式无效');
    });

    it('应该拒绝过短的密码', async () => {
      const result = await authService.register({
        username: 'newuser',
        email: 'newuser@example.com',
        password: '123',
        nickname: '新用户'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('密码长度至少6位');
    });

    it('应该处理数据库错误', async () => {
      // Mock数据库错误
      const originalSave = User.prototype.save;
      User.prototype.save = jest.fn().mockRejectedValue(new Error('数据库错误'));

      const result = await authService.register({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        nickname: '新用户'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('注册失败');

      // 恢复原始方法
      User.prototype.save = originalSave;
    });
  });

  describe('用户登录', () => {
    beforeEach(async () => {
      // 确保测试用户邮箱已验证
      testUser.isEmailVerified = true;
      await testUser.save();
    });

    it('应该成功登录（使用用户名）', async () => {
      const result = await authService.login({
        identifier: testUser.username,
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe(testUser.username);
      expect(result.user.password).toBeUndefined();
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // 验证JWT token
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(testUser._id.toString());
    });

    it('应该成功登录（使用邮箱）', async () => {
      const result = await authService.login({
        identifier: testUser.email,
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe(testUser.email);
    });

    it('应该拒绝错误的密码', async () => {
      const result = await authService.login({
        identifier: testUser.username,
        password: 'wrongpassword'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('密码错误');
    });

    it('应该拒绝不存在的用户', async () => {
      const result = await authService.login({
        identifier: 'nonexistentuser',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('用户不存在');
    });

    it('应该拒绝未验证邮箱的用户', async () => {
      testUser.isEmailVerified = false;
      await testUser.save();

      const result = await authService.login({
        identifier: testUser.username,
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('请先验证邮箱');
    });

    it('应该拒绝被停用的用户', async () => {
      testUser.isActive = false;
      await testUser.save();

      const result = await authService.login({
        identifier: testUser.username,
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('账户已被停用');
    });

    it('应该更新最后登录时间和IP', async () => {
      const loginIP = '192.168.1.1';
      const beforeLogin = new Date();

      const result = await authService.login({
        identifier: testUser.username,
        password: 'password123',
        ip: loginIP
      });

      expect(result.success).toBe(true);

      // 重新获取用户数据
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLoginAt.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
      expect(updatedUser.lastLoginIP).toBe(loginIP);
    });
  });

  describe('刷新令牌', () => {
    let refreshToken;

    beforeEach(async () => {
      // 生成有效的刷新令牌
      refreshToken = jwt.sign(
        { userId: testUser._id, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    });

    it('应该成功刷新令牌', async () => {
      const result = await authService.refreshToken(refreshToken);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.token).not.toBe(refreshToken); // 新令牌应该不同

      // 验证新令牌
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(testUser._id.toString());
    });

    it('应该拒绝无效的刷新令牌', async () => {
      const result = await authService.refreshToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.message).toContain('无效的刷新令牌');
    });

    it('应该拒绝过期的刷新令牌', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '-1d' } // 已过期
      );

      const result = await authService.refreshToken(expiredToken);

      expect(result.success).toBe(false);
      expect(result.message).toContain('刷新令牌已过期');
    });

    it('应该拒绝非刷新类型的令牌', async () => {
      const accessToken = jwt.sign(
        { userId: testUser._id, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const result = await authService.refreshToken(accessToken);

      expect(result.success).toBe(false);
      expect(result.message).toContain('无效的刷新令牌');
    });

    it('应该拒绝不存在用户的令牌', async () => {
      const fakeUserId = '507f1f77bcf86cd799439011';
      const fakeToken = jwt.sign(
        { userId: fakeUserId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const result = await authService.refreshToken(fakeToken);

      expect(result.success).toBe(false);
      expect(result.message).toContain('用户不存在');
    });
  });

  describe('忘记密码', () => {
    it('应该成功发送密码重置邮件', async () => {
      const result = await authService.forgotPassword(testUser.email);

      expect(result.success).toBe(true);
      expect(result.message).toContain('密码重置邮件已发送');

      // 验证用户的重置令牌已设置
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.resetPasswordToken).toBeDefined();
      expect(updatedUser.resetPasswordExpires).toBeDefined();
      expect(updatedUser.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());

      // 验证邮件已发送
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        testUser.email,
        expect.any(String)
      );
    });

    it('应该拒绝不存在的邮箱', async () => {
      const result = await authService.forgotPassword('nonexistent@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('邮箱不存在');
    });

    it('应该处理邮件发送失败', async () => {
      emailService.sendPasswordResetEmail.mockRejectedValueOnce(new Error('邮件发送失败'));

      const result = await authService.forgotPassword(testUser.email);

      expect(result.success).toBe(false);
      expect(result.message).toContain('邮件发送失败');
    });
  });

  describe('重置密码', () => {
    let resetToken;

    beforeEach(async () => {
      // 设置有效的重置令牌
      resetToken = crypto.randomBytes(32).toString('hex');
      testUser.resetPasswordToken = resetToken;
      testUser.resetPasswordExpires = new Date(Date.now() + 3600000); // 1小时后过期
      await testUser.save();
    });

    it('应该成功重置密码', async () => {
      const newPassword = 'newpassword123';
      const result = await authService.resetPassword(resetToken, newPassword);

      expect(result.success).toBe(true);
      expect(result.message).toContain('密码重置成功');

      // 验证密码已更改
      const updatedUser = await User.findById(testUser._id);
      const isNewPasswordValid = await updatedUser.comparePassword(newPassword);
      expect(isNewPasswordValid).toBe(true);

      // 验证重置令牌已清除
      expect(updatedUser.resetPasswordToken).toBeUndefined();
      expect(updatedUser.resetPasswordExpires).toBeUndefined();
    });

    it('应该拒绝无效的重置令牌', async () => {
      const result = await authService.resetPassword('invalid-token', 'newpassword123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('无效或已过期的重置令牌');
    });

    it('应该拒绝过期的重置令牌', async () => {
      testUser.resetPasswordExpires = new Date(Date.now() - 3600000); // 1小时前过期
      await testUser.save();

      const result = await authService.resetPassword(resetToken, 'newpassword123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('无效或已过期的重置令牌');
    });

    it('应该拒绝过短的新密码', async () => {
      const result = await authService.resetPassword(resetToken, '123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('密码长度至少6位');
    });
  });

  describe('邮箱验证', () => {
    let verificationToken;

    beforeEach(async () => {
      // 设置有效的验证令牌
      verificationToken = crypto.randomBytes(32).toString('hex');
      testUser.emailVerificationToken = verificationToken;
      testUser.isEmailVerified = false;
      await testUser.save();
    });

    it('应该成功验证邮箱', async () => {
      const result = await authService.verifyEmail(verificationToken);

      expect(result.success).toBe(true);
      expect(result.message).toContain('邮箱验证成功');

      // 验证用户状态已更新
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.emailVerificationToken).toBeUndefined();

      // 验证欢迎邮件已发送
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        testUser.email,
        testUser.nickname || testUser.username
      );
    });

    it('应该拒绝无效的验证令牌', async () => {
      const result = await authService.verifyEmail('invalid-token');

      expect(result.success).toBe(false);
      expect(result.message).toContain('无效的验证令牌');
    });

    it('应该拒绝已验证的邮箱', async () => {
      testUser.isEmailVerified = true;
      await testUser.save();

      const result = await authService.verifyEmail(verificationToken);

      expect(result.success).toBe(false);
      expect(result.message).toContain('邮箱已验证');
    });
  });

  describe('重新发送验证邮件', () => {
    beforeEach(async () => {
      testUser.isEmailVerified = false;
      await testUser.save();
    });

    it('应该成功重新发送验证邮件', async () => {
      const result = await authService.resendVerificationEmail(testUser.email);

      expect(result.success).toBe(true);
      expect(result.message).toContain('验证邮件已重新发送');

      // 验证新的验证令牌已设置
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.emailVerificationToken).toBeDefined();

      // 验证邮件已发送
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        testUser.email,
        expect.any(String)
      );
    });

    it('应该拒绝已验证的邮箱', async () => {
      testUser.isEmailVerified = true;
      await testUser.save();

      const result = await authService.resendVerificationEmail(testUser.email);

      expect(result.success).toBe(false);
      expect(result.message).toContain('邮箱已验证');
    });

    it('应该拒绝不存在的邮箱', async () => {
      const result = await authService.resendVerificationEmail('nonexistent@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('邮箱不存在');
    });
  });

  describe('令牌验证', () => {
    let validToken;

    beforeEach(() => {
      validToken = jwt.sign(
        { userId: testUser._id, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('应该成功验证有效令牌', async () => {
      const result = await authService.verifyToken(validToken);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user._id.toString()).toBe(testUser._id.toString());
      expect(result.user.password).toBeUndefined();
    });

    it('应该拒绝无效令牌', async () => {
      const result = await authService.verifyToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.message).toContain('无效的令牌');
    });

    it('应该拒绝过期令牌', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // 已过期
      );

      const result = await authService.verifyToken(expiredToken);

      expect(result.success).toBe(false);
      expect(result.message).toContain('令牌已过期');
    });

    it('应该拒绝不存在用户的令牌', async () => {
      const fakeUserId = '507f1f77bcf86cd799439011';
      const fakeToken = jwt.sign(
        { userId: fakeUserId, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const result = await authService.verifyToken(fakeToken);

      expect(result.success).toBe(false);
      expect(result.message).toContain('用户不存在');
    });

    it('应该拒绝被停用用户的令牌', async () => {
      testUser.isActive = false;
      await testUser.save();

      const result = await authService.verifyToken(validToken);

      expect(result.success).toBe(false);
      expect(result.message).toContain('账户已被停用');
    });
  });

  describe('更改密码', () => {
    it('应该成功更改密码', async () => {
      const result = await authService.changePassword(
        testUser._id,
        'password123',
        'newpassword123'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('密码更改成功');

      // 验证新密码有效
      const updatedUser = await User.findById(testUser._id);
      const isNewPasswordValid = await updatedUser.comparePassword('newpassword123');
      expect(isNewPasswordValid).toBe(true);

      // 验证旧密码无效
      const isOldPasswordValid = await updatedUser.comparePassword('password123');
      expect(isOldPasswordValid).toBe(false);
    });

    it('应该拒绝错误的当前密码', async () => {
      const result = await authService.changePassword(
        testUser._id,
        'wrongpassword',
        'newpassword123'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('当前密码错误');
    });

    it('应该拒绝过短的新密码', async () => {
      const result = await authService.changePassword(
        testUser._id,
        'password123',
        '123'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('新密码长度至少6位');
    });

    it('应该拒绝不存在的用户', async () => {
      const fakeUserId = '507f1f77bcf86cd799439011';
      const result = await authService.changePassword(
        fakeUserId,
        'password123',
        'newpassword123'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('用户不存在');
    });
  });

  describe('登出', () => {
    it('应该成功登出用户', async () => {
      const result = await authService.logout(testUser._id);

      expect(result.success).toBe(true);
      expect(result.message).toContain('登出成功');
    });

    it('应该处理不存在的用户', async () => {
      const fakeUserId = '507f1f77bcf86cd799439011';
      const result = await authService.logout(fakeUserId);

      expect(result.success).toBe(true); // 登出总是成功
      expect(result.message).toContain('登出成功');
    });
  });

  describe('工具方法', () => {
    describe('generateTokens', () => {
      it('应该生成访问令牌和刷新令牌', () => {
        const tokens = authService.generateTokens(testUser._id);

        expect(tokens.accessToken).toBeDefined();
        expect(tokens.refreshToken).toBeDefined();

        // 验证访问令牌
        const accessDecoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
        expect(accessDecoded.userId).toBe(testUser._id.toString());
        expect(accessDecoded.type).toBe('access');

        // 验证刷新令牌
        const refreshDecoded = jwt.verify(tokens.refreshToken, process.env.JWT_SECRET);
        expect(refreshDecoded.userId).toBe(testUser._id.toString());
        expect(refreshDecoded.type).toBe('refresh');
      });
    });

    describe('generateRandomToken', () => {
      it('应该生成随机令牌', () => {
        const token1 = authService.generateRandomToken();
        const token2 = authService.generateRandomToken();

        expect(token1).toBeDefined();
        expect(token2).toBeDefined();
        expect(token1).not.toBe(token2);
        expect(token1.length).toBe(64); // 32字节的hex字符串
      });
    });

    describe('hashPassword', () => {
      it('应该正确哈希密码', async () => {
        const password = 'testpassword123';
        const hashedPassword = await authService.hashPassword(password);

        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(password);
        expect(hashedPassword.startsWith('$2a$')).toBe(true); // bcrypt格式

        // 验证哈希密码可以被验证
        const isValid = await bcrypt.compare(password, hashedPassword);
        expect(isValid).toBe(true);
      });
    });

    describe('validatePassword', () => {
      it('应该验证有效密码', () => {
        const validPasswords = [
          'password123',
          'mySecurePassword!',
          '123456',
          'a'.repeat(100)
        ];

        validPasswords.forEach(password => {
          const result = authService.validatePassword(password);
          expect(result.isValid).toBe(true);
        });
      });

      it('应该拒绝无效密码', () => {
        const invalidPasswords = [
          '', // 空密码
          '12345', // 太短
          null,
          undefined
        ];

        invalidPasswords.forEach(password => {
          const result = authService.validatePassword(password);
          expect(result.isValid).toBe(false);
          expect(result.message).toBeDefined();
        });
      });
    });

    describe('validateEmail', () => {
      it('应该验证有效邮箱', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'user123@test-domain.com'
        ];

        validEmails.forEach(email => {
          const result = authService.validateEmail(email);
          expect(result.isValid).toBe(true);
        });
      });

      it('应该拒绝无效邮箱', () => {
        const invalidEmails = [
          '', // 空邮箱
          'invalid-email',
          '@example.com',
          'test@',
          'test..test@example.com',
          null,
          undefined
        ];

        invalidEmails.forEach(email => {
          const result = authService.validateEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.message).toBeDefined();
        });
      });
    });
  });
});