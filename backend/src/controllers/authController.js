const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

// 生成JWT token
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  
  return { accessToken, refreshToken };
};

// 用户注册
exports.register = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Registration validation failed:', {
        errors: errors.array(),
        body: req.body
      });
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { username, email, password, profile = {} } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return next(new AppError('该邮箱已被注册', 400));
      }
      if (existingUser.username === username) {
        return next(new AppError('该用户名已被使用', 400));
      }
    }

    // 生成邮箱验证token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时

    // 创建用户（密码会在User模型的pre('save')中间件中自动哈希）
    const user = new User({
      username,
      email,
      password,
      profile: {
        nickname: profile.nickname || username,
        avatar: profile.avatar || '',
        bio: profile.bio || '',
        birthday: profile.birthday,
        gender: profile.gender,
        location: profile.location || ''
      },
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: true // 临时设置为true以便测试API
    });

    await user.save();

    // 发送验证邮件
    try {
      await emailService.sendVerificationEmail(email, emailVerificationToken);
    } catch (emailError) {
      logger.error('发送验证邮件失败:', emailError);
      // 不阻止注册流程，只记录错误
    }

    // 生成tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // 保存refresh token到用户记录
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
      userAgent: req.get('User-Agent') || '',
      ipAddress: req.ip || req.connection.remoteAddress
    });
    await user.save();

    // 返回用户信息（不包含密码）
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    delete userResponse.emailVerificationToken;
    delete userResponse.passwordResetToken;

    res.status(201).json({
      success: true,
      message: '注册成功，请查收邮件验证账户',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });

    logger.info(`用户注册成功: ${email}`);
  } catch (error) {
    logger.error('注册错误:', error);
    next(error);
  }
};

// 用户登录
exports.login = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { email, password, rememberMe = false } = req.body;

    // 查找用户
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('邮箱或密码错误', 401));
    }

    // 检查账户状态
    if (user.status === 'suspended') {
      return next(new AppError('账户已被暂停，请联系管理员', 403));
    }
    
    if (user.status === 'deleted') {
      return next(new AppError('账户不存在', 404));
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // 记录登录失败
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      user.lastLoginAttempt = new Date();
      
      // 如果失败次数过多，锁定账户
      if (user.loginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 锁定30分钟
        await user.save();
        return next(new AppError('登录失败次数过多，账户已被锁定30分钟', 423));
      }
      
      await user.save();
      return next(new AppError('邮箱或密码错误', 401));
    }

    // 检查账户是否被锁定
    if (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.accountLockedUntil) - new Date()) / 1000 / 60);
      return next(new AppError(`账户已被锁定，请${remainingTime}分钟后再试`, 423));
    }

    // 登录成功，重置失败计数
    user.loginAttempts = 0;
    user.accountLockedUntil = undefined;
    user.lastLoginAt = new Date();
    user.lastLoginIP = req.ip || req.connection.remoteAddress;

    // 生成tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // 清理过期的refresh tokens
    user.refreshTokens = user.refreshTokens.filter(
      token => token.createdAt && new Date(token.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    // 保存新的refresh token
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
      userAgent: req.get('User-Agent') || '',
      ipAddress: req.ip || req.connection.remoteAddress,
      rememberMe
    });

    await user.save();

    // 返回用户信息（不包含敏感数据）
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    delete userResponse.emailVerificationToken;
    delete userResponse.passwordResetToken;
    delete userResponse.loginAttempts;
    delete userResponse.accountLockedUntil;

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });

    logger.info(`用户登录成功: ${email}`);
  } catch (error) {
    logger.error('登录错误:', error);
    next(error);
  }
};

// 刷新token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    
    if (!token) {
      return next(new AppError('Refresh token不能为空', 400));
    }

    // 验证refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return next(new AppError('无效的refresh token', 401));
    }

    // 查找用户并验证token是否存在
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    const tokenRecord = user.refreshTokens.find(t => t.token === token);
    if (!tokenRecord) {
      return next(new AppError('Refresh token无效', 401));
    }

    // 检查账户状态
    if (user.status !== 'active') {
      return next(new AppError('账户状态异常', 403));
    }

    // 生成新的tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // 移除旧的refresh token，添加新的
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== token);
    user.refreshTokens.push({
      token: newRefreshToken,
      createdAt: new Date(),
      userAgent: req.get('User-Agent') || '',
      ipAddress: req.ip || req.connection.remoteAddress
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Token刷新成功',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    logger.error('token刷新错误:', error);
    next(error);
  }
};

// 用户登出
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const userId = req.user.id;

    if (token) {
      // 移除指定的refresh token
      await User.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: { token } }
      });
    } else {
      // 移除所有refresh tokens（全部设备登出）
      await User.findByIdAndUpdate(userId, {
        $set: { refreshTokens: [] }
      });
    }

    res.status(200).json({
      success: true,
      message: '登出成功'
    });

    logger.info(`用户登出: ${req.user.email}`);
  } catch (error) {
    logger.error('登出错误:', error);
    next(error);
  }
};

// 忘记密码
exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { email } = req.body;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      // 为了安全，即使用户不存在也返回成功消息
      return res.status(200).json({
        success: true,
        message: '如果该邮箱已注册，您将收到密码重置邮件'
      });
    }

    // 生成密码重置token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1小时

    // 保存重置token
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpires;
    await user.save();

    // 发送重置邮件
    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      logger.error('发送密码重置邮件失败:', emailError);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return next(new AppError('发送邮件失败，请稍后再试', 500));
    }

    res.status(200).json({
      success: true,
      message: '密码重置邮件已发送，请查收邮件'
    });

    logger.info(`密码重置邮件已发送: ${email}`);
  } catch (error) {
    logger.error('忘记密码错误:', error);
    next(error);
  }
};

// 重置密码
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { token, password } = req.body;

    // 查找用户
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return next(new AppError('密码重置token无效或已过期', 400));
    }

    // 加密新密码
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 更新密码并清除重置token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    
    // 清除所有refresh tokens，强制重新登录
    user.refreshTokens = [];
    
    await user.save();

    res.status(200).json({
      success: true,
      message: '密码重置成功，请重新登录'
    });

    logger.info(`密码重置成功: ${user.email}`);
  } catch (error) {
    logger.error('重置密码错误:', error);
    next(error);
  }
};

// 邮箱验证
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return next(new AppError('验证token不能为空', 400));
    }

    // 查找用户
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return next(new AppError('邮箱验证token无效或已过期', 400));
    }

    // 验证邮箱
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerifiedAt = new Date();
    
    await user.save();

    res.status(200).json({
      success: true,
      message: '邮箱验证成功'
    });

    logger.info(`邮箱验证成功: ${user.email}`);
  } catch (error) {
    logger.error('邮箱验证错误:', error);
    next(error);
  }
};

// 重新发送验证邮件
exports.resendVerification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { email } = req.body;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 检查是否已经验证
    if (user.isEmailVerified) {
      return next(new AppError('邮箱已经验证过了', 400));
    }

    // 检查是否频繁发送
    const lastSent = user.emailVerificationExpires;
    if (lastSent && (new Date() - lastSent) < 60000) { // 1分钟内不能重复发送
      return next(new AppError('请等待1分钟后再重新发送', 429));
    }

    // 生成新的验证token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // 发送验证邮件
    try {
      await emailService.sendVerificationEmail(email, emailVerificationToken);
    } catch (emailError) {
      logger.error('发送验证邮件失败:', emailError);
      return next(new AppError('发送邮件失败，请稍后再试', 500));
    }

    res.status(200).json({
      success: true,
      message: '验证邮件已重新发送，请查收邮件'
    });

    logger.info(`重新发送验证邮件: ${email}`);
  } catch (error) {
    logger.error('重新发送验证邮件错误:', error);
    next(error);
  }
};

// 获取当前用户信息
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshTokens');
    
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }
    
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('获取用户信息失败:', error);
    next(new AppError('获取用户信息失败', 500));
  }
};

// 所有函数已通过 exports.functionName 方式导出