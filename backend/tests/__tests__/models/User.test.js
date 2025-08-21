const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      bio: '这是一个测试用户',
      birthday: new Date('1990-01-01'),
      gender: 'male',
      location: '北京市',
      website: 'https://example.com',
      phone: '13800138000'
    };
  });

  describe('用户创建', () => {
    it('应该成功创建用户', async () => {
      const user = new User(testUser);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(testUser.username);
      expect(savedUser.email).toBe(testUser.email);
      expect(savedUser.nickname).toBe(testUser.nickname);
      expect(savedUser.role).toBe('user'); // 默认角色
      expect(savedUser.isEmailVerified).toBe(false); // 默认未验证
      expect(savedUser.isActive).toBe(true); // 默认激活
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('应该自动加密密码', async () => {
      const user = new User(testUser);
      const savedUser = await user.save();

      expect(savedUser.password).not.toBe(testUser.password);
      expect(savedUser.password.length).toBeGreaterThan(50); // bcrypt哈希长度
    });

    it('应该拒绝重复的用户名', async () => {
      const user1 = new User(testUser);
      await user1.save();

      const user2 = new User({
        ...testUser,
        email: 'another@example.com'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('应该拒绝重复的邮箱', async () => {
      const user1 = new User(testUser);
      await user1.save();

      const user2 = new User({
        ...testUser,
        username: 'anotheruser'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('应该拒绝无效的邮箱格式', async () => {
      const user = new User({
        ...testUser,
        email: 'invalid-email'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('应该拒绝过短的密码', async () => {
      const user = new User({
        ...testUser,
        password: '123' // 少于6位
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('应该拒绝无效的用户名格式', async () => {
      const user = new User({
        ...testUser,
        username: 'a' // 少于2位
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('应该拒绝无效的性别值', async () => {
      const user = new User({
        ...testUser,
        gender: 'invalid'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('应该拒绝无效的角色值', async () => {
      const user = new User({
        ...testUser,
        role: 'invalid'
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('密码验证方法', () => {
    let savedUser;

    beforeEach(async () => {
      const user = new User(testUser);
      savedUser = await user.save();
    });

    it('应该正确验证密码', async () => {
      const isValid = await savedUser.comparePassword('password123');
      expect(isValid).toBe(true);
    });

    it('应该拒绝错误的密码', async () => {
      const isValid = await savedUser.comparePassword('wrongpassword');
      expect(isValid).toBe(false);
    });

    it('应该处理空密码', async () => {
      const isValid = await savedUser.comparePassword('');
      expect(isValid).toBe(false);
    });

    it('应该处理null密码', async () => {
      const isValid = await savedUser.comparePassword(null);
      expect(isValid).toBe(false);
    });
  });

  describe('JSON序列化', () => {
    let savedUser;

    beforeEach(async () => {
      const user = new User(testUser);
      savedUser = await user.save();
    });

    it('应该在JSON中隐藏密码', () => {
      const userJSON = savedUser.toJSON();
      expect(userJSON.password).toBeUndefined();
      expect(userJSON.username).toBe(testUser.username);
      expect(userJSON.email).toBe(testUser.email);
    });

    it('应该在JSON中隐藏敏感字段', () => {
      const userJSON = savedUser.toJSON();
      expect(userJSON.__v).toBeUndefined();
      expect(userJSON.resetPasswordToken).toBeUndefined();
      expect(userJSON.resetPasswordExpires).toBeUndefined();
      expect(userJSON.emailVerificationToken).toBeUndefined();
    });
  });

  describe('虚拟字段', () => {
    let savedUser;

    beforeEach(async () => {
      const user = new User(testUser);
      savedUser = await user.save();
    });

    it('应该正确计算年龄', () => {
      const currentYear = new Date().getFullYear();
      const birthYear = testUser.birthday.getFullYear();
      const expectedAge = currentYear - birthYear;
      
      expect(savedUser.age).toBe(expectedAge);
    });

    it('应该处理未设置生日的情况', async () => {
      const userWithoutBirthday = new User({
        ...testUser,
        birthday: undefined
      });
      const saved = await userWithoutBirthday.save();
      
      expect(saved.age).toBeNull();
    });
  });

  describe('索引', () => {
    it('应该在用户名上有唯一索引', async () => {
      const indexes = await User.collection.getIndexes();
      const usernameIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'username')
      );
      expect(usernameIndex).toBeDefined();
    });

    it('应该在邮箱上有唯一索引', async () => {
      const indexes = await User.collection.getIndexes();
      const emailIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'email')
      );
      expect(emailIndex).toBeDefined();
    });
  });

  describe('中间件', () => {
    it('应该在保存前自动加密密码', async () => {
      const user = new User(testUser);
      const originalPassword = user.password;
      
      await user.save();
      
      expect(user.password).not.toBe(originalPassword);
      expect(user.password.startsWith('$2a$')).toBe(true); // bcrypt格式
    });

    it('应该在密码未修改时不重新加密', async () => {
      const user = new User(testUser);
      await user.save();
      
      const hashedPassword = user.password;
      user.nickname = '更新的昵称';
      await user.save();
      
      expect(user.password).toBe(hashedPassword);
    });

    it('应该在密码修改时重新加密', async () => {
      const user = new User(testUser);
      await user.save();
      
      const originalHashedPassword = user.password;
      user.password = 'newpassword123';
      await user.save();
      
      expect(user.password).not.toBe(originalHashedPassword);
      expect(user.password.startsWith('$2a$')).toBe(true);
    });

    it('应该自动更新updatedAt字段', async () => {
      const user = new User(testUser);
      await user.save();
      
      const originalUpdatedAt = user.updatedAt;
      
      // 等待一毫秒确保时间不同
      await new Promise(resolve => setTimeout(resolve, 1));
      
      user.nickname = '更新的昵称';
      await user.save();
      
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('查询方法', () => {
    let users;

    beforeEach(async () => {
      users = [
        new User({ ...testUser, username: 'user1', email: 'user1@example.com' }),
        new User({ ...testUser, username: 'user2', email: 'user2@example.com', isActive: false }),
        new User({ ...testUser, username: 'user3', email: 'user3@example.com', role: 'admin' })
      ];
      
      for (const user of users) {
        await user.save();
      }
    });

    it('应该能按用户名查找用户', async () => {
      const user = await User.findOne({ username: 'user1' });
      expect(user).toBeTruthy();
      expect(user.username).toBe('user1');
    });

    it('应该能按邮箱查找用户', async () => {
      const user = await User.findOne({ email: 'user2@example.com' });
      expect(user).toBeTruthy();
      expect(user.email).toBe('user2@example.com');
    });

    it('应该能查找活跃用户', async () => {
      const activeUsers = await User.find({ isActive: true });
      expect(activeUsers.length).toBe(2);
    });

    it('应该能查找管理员用户', async () => {
      const adminUsers = await User.find({ role: 'admin' });
      expect(adminUsers.length).toBe(1);
      expect(adminUsers[0].username).toBe('user3');
    });
  });

  describe('数据验证', () => {
    it('应该验证必填字段', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    it('应该验证邮箱格式', async () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example'
      ];

      for (const email of invalidEmails) {
        const user = new User({ ...testUser, email, username: `user_${Math.random()}` });
        await expect(user.save()).rejects.toThrow();
      }
    });

    it('应该验证用户名格式', async () => {
      const invalidUsernames = [
        'a', // 太短
        'a'.repeat(31), // 太长
        'user name', // 包含空格
        'user@name', // 包含特殊字符
        '123user' // 以数字开头
      ];

      for (const username of invalidUsernames) {
        const user = new User({ ...testUser, username, email: `${Math.random()}@example.com` });
        await expect(user.save()).rejects.toThrow();
      }
    });

    it('应该验证密码长度', async () => {
      const shortPassword = '12345'; // 少于6位
      const user = new User({ ...testUser, password: shortPassword });
      
      await expect(user.save()).rejects.toThrow();
    });

    it('应该验证手机号格式', async () => {
      const invalidPhones = [
        '123', // 太短
        '12345678901234567890', // 太长
        'abcdefghijk', // 非数字
        '1234567890a' // 包含字母
      ];

      for (const phone of invalidPhones) {
        const user = new User({ 
          ...testUser, 
          phone, 
          username: `user_${Math.random()}`,
          email: `${Math.random()}@example.com`
        });
        await expect(user.save()).rejects.toThrow();
      }
    });

    it('应该验证网站URL格式', async () => {
      const invalidWebsites = [
        'invalid-url',
        'ftp://example.com', // 不支持的协议
        'http://', // 不完整的URL
        'https://'
      ];

      for (const website of invalidWebsites) {
        const user = new User({ 
          ...testUser, 
          website, 
          username: `user_${Math.random()}`,
          email: `${Math.random()}@example.com`
        });
        await expect(user.save()).rejects.toThrow();
      }
    });
  });

  describe('密码重置功能', () => {
    let savedUser;

    beforeEach(async () => {
      const user = new User(testUser);
      savedUser = await user.save();
    });

    it('应该能设置密码重置令牌', async () => {
      const resetToken = 'reset-token-123';
      const expiresAt = new Date(Date.now() + 3600000); // 1小时后
      
      savedUser.resetPasswordToken = resetToken;
      savedUser.resetPasswordExpires = expiresAt;
      await savedUser.save();
      
      expect(savedUser.resetPasswordToken).toBe(resetToken);
      expect(savedUser.resetPasswordExpires).toEqual(expiresAt);
    });

    it('应该能清除密码重置令牌', async () => {
      savedUser.resetPasswordToken = 'reset-token-123';
      savedUser.resetPasswordExpires = new Date();
      await savedUser.save();
      
      savedUser.resetPasswordToken = undefined;
      savedUser.resetPasswordExpires = undefined;
      await savedUser.save();
      
      expect(savedUser.resetPasswordToken).toBeUndefined();
      expect(savedUser.resetPasswordExpires).toBeUndefined();
    });
  });

  describe('邮箱验证功能', () => {
    let savedUser;

    beforeEach(async () => {
      const user = new User(testUser);
      savedUser = await user.save();
    });

    it('应该能设置邮箱验证令牌', async () => {
      const verificationToken = 'verification-token-123';
      
      savedUser.emailVerificationToken = verificationToken;
      await savedUser.save();
      
      expect(savedUser.emailVerificationToken).toBe(verificationToken);
    });

    it('应该能标记邮箱为已验证', async () => {
      savedUser.isEmailVerified = true;
      savedUser.emailVerificationToken = undefined;
      await savedUser.save();
      
      expect(savedUser.isEmailVerified).toBe(true);
      expect(savedUser.emailVerificationToken).toBeUndefined();
    });
  });

  describe('用户状态管理', () => {
    let savedUser;

    beforeEach(async () => {
      const user = new User(testUser);
      savedUser = await user.save();
    });

    it('应该能激活用户', async () => {
      savedUser.isActive = false;
      await savedUser.save();
      
      savedUser.isActive = true;
      await savedUser.save();
      
      expect(savedUser.isActive).toBe(true);
    });

    it('应该能停用用户', async () => {
      savedUser.isActive = false;
      await savedUser.save();
      
      expect(savedUser.isActive).toBe(false);
    });

    it('应该能更改用户角色', async () => {
      savedUser.role = 'admin';
      await savedUser.save();
      
      expect(savedUser.role).toBe('admin');
    });
  });

  describe('最后登录时间', () => {
    let savedUser;

    beforeEach(async () => {
      const user = new User(testUser);
      savedUser = await user.save();
    });

    it('应该能更新最后登录时间', async () => {
      const loginTime = new Date();
      
      savedUser.lastLoginAt = loginTime;
      await savedUser.save();
      
      expect(savedUser.lastLoginAt).toEqual(loginTime);
    });

    it('应该能记录登录IP', async () => {
      const loginIP = '192.168.1.1';
      
      savedUser.lastLoginIP = loginIP;
      await savedUser.save();
      
      expect(savedUser.lastLoginIP).toBe(loginIP);
    });
  });
});