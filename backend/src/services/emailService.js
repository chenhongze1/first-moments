const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  // 初始化邮件传输器
  initTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // 验证连接配置
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('邮件服务配置错误:', error);
        } else {
          logger.info('邮件服务已就绪');
        }
      });
    } catch (error) {
      logger.error('邮件传输器初始化失败:', error);
    }
  }

  // 发送邮箱验证邮件
  async sendVerificationEmail(email, token) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'First Moments'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '邮箱验证 - First Moments',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">First Moments</h1>
              <p style="color: #666; font-size: 16px;">欢迎加入我们！</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">验证您的邮箱</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                感谢您注册 First Moments！请点击下面的按钮验证您的邮箱地址：
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: #007bff; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;
                          font-weight: bold;">验证邮箱</a>
              </div>
              
              <p style="color: #999; font-size: 14px; margin-top: 20px;">
                如果按钮无法点击，请复制以下链接到浏览器：<br>
                <a href="${verificationUrl}" style="color: #007bff;">${verificationUrl}</a>
              </p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p>此邮件由系统自动发送，请勿回复。</p>
              <p>验证链接将在24小时后失效。</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`验证邮件发送成功: ${email}`);
      return result;
    } catch (error) {
      logger.error(`验证邮件发送失败: ${email}`, error);
      throw error;
    }
  }

  // 发送密码重置邮件
  async sendPasswordResetEmail(email, token) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'First Moments'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '密码重置 - First Moments',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">First Moments</h1>
              <p style="color: #666; font-size: 16px;">密码重置请求</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">重置您的密码</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                我们收到了您的密码重置请求。请点击下面的按钮重置您的密码：
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: #dc3545; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;
                          font-weight: bold;">重置密码</a>
              </div>
              
              <p style="color: #999; font-size: 14px; margin-top: 20px;">
                如果按钮无法点击，请复制以下链接到浏览器：<br>
                <a href="${resetUrl}" style="color: #dc3545;">${resetUrl}</a>
              </p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>安全提示：</strong>如果您没有请求重置密码，请忽略此邮件。您的密码不会被更改。
              </p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p>此邮件由系统自动发送，请勿回复。</p>
              <p>重置链接将在10分钟后失效。</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`密码重置邮件发送成功: ${email}`);
      return result;
    } catch (error) {
      logger.error(`密码重置邮件发送失败: ${email}`, error);
      throw error;
    }
  }

  // 发送欢迎邮件
  async sendWelcomeEmail(email, username) {
    try {
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'First Moments'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '欢迎加入 First Moments！',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">First Moments</h1>
              <p style="color: #666; font-size: 16px;">记录生活中的美好时光</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">欢迎，${username}！</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                恭喜您成功加入 First Moments！现在您可以开始记录和分享生活中的美好时光了。
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #333; margin-bottom: 15px;">您可以开始：</h3>
                <ul style="color: #666; line-height: 1.8;">
                  <li>创建您的第一个档案</li>
                  <li>记录珍贵的时光瞬间</li>
                  <li>上传照片和视频</li>
                  <li>在地图上标记特殊地点</li>
                  <li>解锁各种成就徽章</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}" 
                   style="background: #28a745; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;
                          font-weight: bold;">开始使用</a>
              </div>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p>感谢您选择 First Moments</p>
              <p>如有任何问题，请联系我们的客服团队</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`欢迎邮件发送成功: ${email}`);
      return result;
    } catch (error) {
      logger.error(`欢迎邮件发送失败: ${email}`, error);
      throw error;
    }
  }

  // 发送通知邮件
  async sendNotificationEmail(email, subject, content) {
    try {
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'First Moments'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">First Moments</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
              ${content}
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p>此邮件由系统自动发送，请勿回复。</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`通知邮件发送成功: ${email}`);
      return result;
    } catch (error) {
      logger.error(`通知邮件发送失败: ${email}`, error);
      throw error;
    }
  }

  // 批量发送邮件
  async sendBulkEmails(emails, subject, content) {
    const results = [];
    const batchSize = 10; // 每批发送10封邮件
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(email => 
        this.sendNotificationEmail(email, subject, content)
          .catch(error => ({ email, error }))
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // 批次间延迟，避免发送过快
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

// 创建单例实例
const emailService = new EmailService();

module.exports = emailService;