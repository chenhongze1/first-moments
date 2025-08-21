const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const User = require('../models/User');
const logger = require('../utils/logger');

// JWT认证中间件
const auth = async (req, res, next) => {
  try {
    // 获取token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('未提供访问token，请先登录', 401));
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 检查用户是否仍然存在
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
      return next(new AppError('该token对应的用户不存在', 401));
    }

    // 检查用户是否已激活
    if (!currentUser.isActive) {
      return next(new AppError('用户账户已被禁用', 401));
    }

    // 检查用户是否已验证邮箱
    if (!currentUser.isEmailVerified) {
      return next(new AppError('请先验证邮箱', 401));
    }

    // 检查密码是否在token签发后被修改
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = parseInt(currentUser.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) {
        return next(new AppError('密码已被修改，请重新登录', 401));
      }
    }

    // 将用户信息添加到请求对象
    req.user = currentUser;
    next();
  } catch (error) {
    logger.error('认证中间件错误:', error);
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('无效的token', 401));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('token已过期，请重新登录', 401));
    }
    return next(new AppError('认证失败', 401));
  }
};

// 权限检查中间件
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('您没有权限执行此操作', 403));
    }
    next();
  };
};

// 可选认证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id).select('-password');
      if (currentUser && currentUser.isActive && currentUser.isEmailVerified) {
        req.user = currentUser;
      }
    }
    next();
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    next();
  }
};

// 检查用户是否为资源所有者或管理员
const checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('请先登录', 401));
    }
    
    // 管理员可以访问所有资源
    if (req.user.role === 'admin') {
      return next();
    }
    
    // 检查资源所有权
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      return next(new AppError('无法确定资源所有者', 400));
    }
    
    if (req.user._id.toString() !== resourceUserId.toString()) {
      return next(new AppError('您只能访问自己的资源', 403));
    }
    
    next();
  };
};

// 限制登录尝试中间件
const rateLimitLogin = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next();
    }
    
    const user = await User.findOne({ email });
    
    if (user && user.loginAttempts >= 5) {
      const lockTime = 15 * 60 * 1000; // 15分钟
      const timeSinceLastAttempt = Date.now() - user.lastLoginAttempt.getTime();
      
      if (timeSinceLastAttempt < lockTime) {
        const remainingTime = Math.ceil((lockTime - timeSinceLastAttempt) / 60000);
        return next(new AppError(`账户已被锁定，请在${remainingTime}分钟后重试`, 429));
      } else {
        // 重置登录尝试次数
        user.loginAttempts = 0;
        await user.save();
      }
    }
    
    next();
  } catch (error) {
    logger.error('登录限制中间件错误:', error);
    next();
  }
};

// 验证刷新令牌中间件
const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return next(new AppError('刷新令牌不能为空', 400));
    }
    
    // 验证刷新令牌格式
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('刷新令牌已过期，请重新登录', 401));
      } else {
        return next(new AppError('无效的刷新令牌', 401));
      }
    }
    
    // 查找用户并验证刷新令牌
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('用户不存在', 401));
    }
    
    // 检查刷新令牌是否存在于用户的令牌列表中
    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      return next(new AppError('刷新令牌无效或已被撤销', 401));
    }
    
    req.user = user;
    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    logger.error('刷新令牌验证中间件错误:', error);
    next(new AppError('刷新令牌验证失败', 500));
  }
};

// 管理员认证中间件
const adminAuth = [auth, restrictTo('admin')];

module.exports = {
  auth,
  restrictTo,
  optionalAuth,
  checkOwnership,
  rateLimitLogin,
  validateRefreshToken,
  adminAuth
};