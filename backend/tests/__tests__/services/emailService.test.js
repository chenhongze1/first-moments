const emailService = require('../../../src/services/emailService');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');

describe('Email Service', () => {
  let mockTransporter;
  let mockSendMail;

  beforeEach(() => {
    mockSendMail = jest.fn();
    mockTransporter = {
      sendMail: mockSendMail
    };
    nodemailer.createTransporter = jest.fn().mockReturnValue(mockTransporter);
    
    // 重置环境变量
    process.env.EMAIL_HOST = 'smtp.example.com';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'password123';
    process.env.EMAIL_FROM = 'noreply@firstmoments.com';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('邮件发送', () => {
    it('应该成功发送验证邮件', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 Message accepted'
      });

      const result = await emailService.sendVerificationEmail(
        'user@example.com',
        'John Doe',
        'http://localhost:3000/verify?token=abc123'
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: 'user@example.com',
        subject: '验证您的邮箱地址 - First Moments',
        html: expect.stringContaining('John Doe'),
        text: expect.stringContaining('验证链接')
      });
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
    });

    it('应该成功发送密码重置邮件', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'reset-message-id',
        response: '250 Message accepted'
      });

      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'John Doe',
        'http://localhost:3000/reset?token=xyz789'
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: 'user@example.com',
        subject: '重置您的密码 - First Moments',
        html: expect.stringContaining('John Doe'),
        text: expect.stringContaining('重置链接')
      });
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('reset-message-id');
    });

    it('应该成功发送欢迎邮件', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'welcome-message-id',
        response: '250 Message accepted'
      });

      const result = await emailService.sendWelcomeEmail(
        'user@example.com',
        'John Doe'
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: 'user@example.com',
        subject: '欢迎加入 First Moments！',
        html: expect.stringContaining('John Doe'),
        text: expect.stringContaining('欢迎')
      });
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('welcome-message-id');
    });

    it('应该成功发送成就通知邮件', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'achievement-message-id',
        response: '250 Message accepted'
      });

      const achievementData = {
        name: '第一条记录',
        description: '创建了您的第一条时光记录',
        points: 10,
        icon: '🎉'
      };

      const result = await emailService.sendAchievementNotification(
        'user@example.com',
        'John Doe',
        achievementData
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: 'user@example.com',
        subject: '🎉 您获得了新成就！',
        html: expect.stringContaining('第一条记录'),
        text: expect.stringContaining('成就')
      });
      expect(result.success).toBe(true);
    });

    it('应该成功发送档案邀请邮件', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'invite-message-id',
        response: '250 Message accepted'
      });

      const inviteData = {
        profileName: '我的旅行档案',
        inviterName: 'Alice',
        role: 'editor',
        inviteLink: 'http://localhost:3000/invite?token=invite123'
      };

      const result = await emailService.sendProfileInvitation(
        'user@example.com',
        'John Doe',
        inviteData
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: 'user@example.com',
        subject: '档案协作邀请 - First Moments',
        html: expect.stringContaining('我的旅行档案'),
        text: expect.stringContaining('邀请')
      });
      expect(result.success).toBe(true);
    });

    it('应该成功发送通用通知邮件', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'notification-message-id',
        response: '250 Message accepted'
      });

      const result = await emailService.sendNotificationEmail(
        'user@example.com',
        'John Doe',
        '系统通知',
        '这是一条系统通知消息',
        'http://localhost:3000/notifications'
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: 'user@example.com',
        subject: '系统通知',
        html: expect.stringContaining('这是一条系统通知消息'),
        text: expect.stringContaining('通知')
      });
      expect(result.success).toBe(true);
    });
  });

  describe('邮件发送失败处理', () => {
    it('应该处理SMTP连接错误', async () => {
      const smtpError = new Error('SMTP connection failed');
      smtpError.code = 'ECONNECTION';
      mockSendMail.mockRejectedValue(smtpError);

      const result = await emailService.sendVerificationEmail(
        'user@example.com',
        'John Doe',
        'http://localhost:3000/verify?token=abc123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP connection failed');
      expect(result.code).toBe('ECONNECTION');
    });

    it('应该处理认证错误', async () => {
      const authError = new Error('Invalid login credentials');
      authError.code = 'EAUTH';
      mockSendMail.mockRejectedValue(authError);

      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'John Doe',
        'http://localhost:3000/reset?token=xyz789'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid login credentials');
      expect(result.code).toBe('EAUTH');
    });

    it('应该处理邮箱地址无效错误', async () => {
      const addressError = new Error('Invalid recipient address');
      addressError.code = 'EENVELOPE';
      mockSendMail.mockRejectedValue(addressError);

      const result = await emailService.sendWelcomeEmail(
        'invalid-email',
        'John Doe'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid recipient address');
      expect(result.code).toBe('EENVELOPE');
    });

    it('应该处理邮件内容过大错误', async () => {
      const sizeError = new Error('Message size exceeds limit');
      sizeError.code = 'EMESSAGE';
      mockSendMail.mockRejectedValue(sizeError);

      const result = await emailService.sendNotificationEmail(
        'user@example.com',
        'John Doe',
        '大文件通知',
        'a'.repeat(10000), // 很长的内容
        'http://localhost:3000/notifications'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Message size exceeds limit');
      expect(result.code).toBe('EMESSAGE');
    });

    it('应该处理未知错误', async () => {
      const unknownError = new Error('Unknown error occurred');
      mockSendMail.mockRejectedValue(unknownError);

      const result = await emailService.sendVerificationEmail(
        'user@example.com',
        'John Doe',
        'http://localhost:3000/verify?token=abc123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });
  });

  describe('邮件模板', () => {
    it('应该生成正确的验证邮件HTML模板', () => {
      const html = emailService.generateVerificationEmailTemplate(
        'John Doe',
        'http://localhost:3000/verify?token=abc123'
      );

      expect(html).toContain('John Doe');
      expect(html).toContain('验证您的邮箱地址');
      expect(html).toContain('http://localhost:3000/verify?token=abc123');
      expect(html).toContain('First Moments');
    });

    it('应该生成正确的密码重置邮件HTML模板', () => {
      const html = emailService.generatePasswordResetEmailTemplate(
        'John Doe',
        'http://localhost:3000/reset?token=xyz789'
      );

      expect(html).toContain('John Doe');
      expect(html).toContain('重置您的密码');
      expect(html).toContain('http://localhost:3000/reset?token=xyz789');
      expect(html).toContain('24小时内有效');
    });

    it('应该生成正确的欢迎邮件HTML模板', () => {
      const html = emailService.generateWelcomeEmailTemplate('John Doe');

      expect(html).toContain('John Doe');
      expect(html).toContain('欢迎加入');
      expect(html).toContain('First Moments');
      expect(html).toContain('开始您的时光记录之旅');
    });

    it('应该生成正确的成就通知邮件HTML模板', () => {
      const achievementData = {
        name: '第一条记录',
        description: '创建了您的第一条时光记录',
        points: 10,
        icon: '🎉'
      };

      const html = emailService.generateAchievementEmailTemplate(
        'John Doe',
        achievementData
      );

      expect(html).toContain('John Doe');
      expect(html).toContain('第一条记录');
      expect(html).toContain('创建了您的第一条时光记录');
      expect(html).toContain('10');
      expect(html).toContain('🎉');
    });

    it('应该生成正确的档案邀请邮件HTML模板', () => {
      const inviteData = {
        profileName: '我的旅行档案',
        inviterName: 'Alice',
        role: 'editor',
        inviteLink: 'http://localhost:3000/invite?token=invite123'
      };

      const html = emailService.generateProfileInvitationTemplate(
        'John Doe',
        inviteData
      );

      expect(html).toContain('John Doe');
      expect(html).toContain('我的旅行档案');
      expect(html).toContain('Alice');
      expect(html).toContain('编辑者');
      expect(html).toContain('http://localhost:3000/invite?token=invite123');
    });
  });

  describe('邮件配置', () => {
    it('应该使用正确的SMTP配置', () => {
      const config = emailService.getEmailConfig();

      expect(config.host).toBe('smtp.example.com');
      expect(config.port).toBe(587);
      expect(config.secure).toBe(false); // 587端口通常使用STARTTLS
      expect(config.auth.user).toBe('test@example.com');
      expect(config.auth.pass).toBe('password123');
    });

    it('应该在SSL端口使用安全连接', () => {
      process.env.EMAIL_PORT = '465';
      const config = emailService.getEmailConfig();

      expect(config.port).toBe(465);
      expect(config.secure).toBe(true); // 465端口使用SSL
    });

    it('应该处理缺失的环境变量', () => {
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;

      expect(() => {
        emailService.getEmailConfig();
      }).toThrow('邮件服务配置不完整');
    });
  });

  describe('邮件验证', () => {
    it('应该验证邮箱地址格式', () => {
      expect(emailService.validateEmail('user@example.com')).toBe(true);
      expect(emailService.validateEmail('user.name@example.com')).toBe(true);
      expect(emailService.validateEmail('user+tag@example.com')).toBe(true);
      expect(emailService.validateEmail('user@subdomain.example.com')).toBe(true);
      
      expect(emailService.validateEmail('invalid-email')).toBe(false);
      expect(emailService.validateEmail('user@')).toBe(false);
      expect(emailService.validateEmail('@example.com')).toBe(false);
      expect(emailService.validateEmail('user@.com')).toBe(false);
      expect(emailService.validateEmail('')).toBe(false);
      expect(emailService.validateEmail(null)).toBe(false);
      expect(emailService.validateEmail(undefined)).toBe(false);
    });

    it('应该验证邮件内容长度', () => {
      expect(emailService.validateEmailContent('正常内容')).toBe(true);
      expect(emailService.validateEmailContent('a'.repeat(1000))).toBe(true);
      
      expect(emailService.validateEmailContent('')).toBe(false);
      expect(emailService.validateEmailContent('a'.repeat(10001))).toBe(false); // 超过10000字符
      expect(emailService.validateEmailContent(null)).toBe(false);
      expect(emailService.validateEmailContent(undefined)).toBe(false);
    });

    it('应该验证邮件主题长度', () => {
      expect(emailService.validateEmailSubject('正常主题')).toBe(true);
      expect(emailService.validateEmailSubject('a'.repeat(100))).toBe(true);
      
      expect(emailService.validateEmailSubject('')).toBe(false);
      expect(emailService.validateEmailSubject('a'.repeat(201))).toBe(false); // 超过200字符
      expect(emailService.validateEmailSubject(null)).toBe(false);
      expect(emailService.validateEmailSubject(undefined)).toBe(false);
    });
  });

  describe('邮件队列', () => {
    it('应该能添加邮件到发送队列', async () => {
      const emailData = {
        to: 'user@example.com',
        subject: '测试邮件',
        html: '<p>测试内容</p>',
        text: '测试内容'
      };

      const result = await emailService.addToQueue(emailData);
      expect(result.success).toBe(true);
      expect(result.queueId).toBeDefined();
    });

    it('应该能批量发送邮件', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'batch-message-id',
        response: '250 Message accepted'
      });

      const emails = [
        {
          to: 'user1@example.com',
          subject: '批量邮件1',
          html: '<p>内容1</p>'
        },
        {
          to: 'user2@example.com',
          subject: '批量邮件2',
          html: '<p>内容2</p>'
        }
      ];

      const results = await emailService.sendBatchEmails(emails);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it('应该处理批量发送中的部分失败', async () => {
      mockSendMail
        .mockResolvedValueOnce({
          messageId: 'success-message-id',
          response: '250 Message accepted'
        })
        .mockRejectedValueOnce(new Error('发送失败'));

      const emails = [
        {
          to: 'user1@example.com',
          subject: '成功邮件',
          html: '<p>内容1</p>'
        },
        {
          to: 'user2@example.com',
          subject: '失败邮件',
          html: '<p>内容2</p>'
        }
      ];

      const results = await emailService.sendBatchEmails(emails);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('发送失败');
    });
  });

  describe('邮件统计', () => {
    it('应该能记录邮件发送统计', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'stats-message-id',
        response: '250 Message accepted'
      });

      await emailService.sendVerificationEmail(
        'user@example.com',
        'John Doe',
        'http://localhost:3000/verify?token=abc123'
      );

      const stats = emailService.getEmailStats();
      expect(stats.totalSent).toBeGreaterThan(0);
      expect(stats.verificationEmails).toBeGreaterThan(0);
    });

    it('应该能记录邮件发送失败统计', async () => {
      mockSendMail.mockRejectedValue(new Error('发送失败'));

      await emailService.sendVerificationEmail(
        'user@example.com',
        'John Doe',
        'http://localhost:3000/verify?token=abc123'
      );

      const stats = emailService.getEmailStats();
      expect(stats.totalFailed).toBeGreaterThan(0);
    });

    it('应该能重置邮件统计', () => {
      emailService.resetEmailStats();
      const stats = emailService.getEmailStats();
      
      expect(stats.totalSent).toBe(0);
      expect(stats.totalFailed).toBe(0);
      expect(stats.verificationEmails).toBe(0);
      expect(stats.passwordResetEmails).toBe(0);
      expect(stats.welcomeEmails).toBe(0);
      expect(stats.achievementEmails).toBe(0);
      expect(stats.invitationEmails).toBe(0);
      expect(stats.notificationEmails).toBe(0);
    });
  });
});