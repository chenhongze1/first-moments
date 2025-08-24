const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// 获取当前用户信息
const getMe = async (req, res, next) => {
  try {
    // req.user 已经通过 auth 中间件设置
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        birthDate: user.birthDate,
        gender: user.gender,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        privacySettings: user.privacySettings,
        notificationSettings: user.notificationSettings,
        securitySettings: user.securitySettings,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    logger.error('获取用户信息错误:', error);
    next(error);
  }
};

// 更新用户信息
const updateMe = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;
    
    // 过滤不允许更新的字段
    const allowedFields = ['username', 'bio', 'location', 'website', 'birthDate', 'gender', 'phone', 'avatar'];
    const filteredData = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });
    
    const User = require('../models/User');
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      filteredData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return next(new AppError('用户不存在', 404));
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: '用户信息更新成功'
    });
  } catch (error) {
    logger.error('更新用户信息错误:', error);
    next(error);
  }
};

// 删除用户账户
const deleteMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: '删除用户账户功能待实现'
    });
  } catch (error) {
    logger.error('删除用户账户错误:', error);
    next(error);
  }
};

// 获取用户列表
const getUsers = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: '获取用户列表功能待实现'
    });
  } catch (error) {
    logger.error('获取用户列表错误:', error);
    next(error);
  }
};

// 获取指定用户信息
const getUser = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: '获取指定用户信息功能待实现'
    });
  } catch (error) {
    logger.error('获取指定用户信息错误:', error);
    next(error);
  }
};

// 更新隐私设置
const updatePrivacySettings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const privacySettings = req.body;
    
    const User = require('../models/User');
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { privacySettings },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return next(new AppError('用户不存在', 404));
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser.privacySettings,
      message: '隐私设置更新成功'
    });
  } catch (error) {
    logger.error('更新隐私设置错误:', error);
    next(error);
  }
};

// 更新安全设置
const updateSecuritySettings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const securitySettings = req.body;
    
    const User = require('../models/User');
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { securitySettings },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return next(new AppError('用户不存在', 404));
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser.securitySettings,
      message: '安全设置更新成功'
    });
  } catch (error) {
    logger.error('更新安全设置错误:', error);
    next(error);
  }
};

// 更新通知设置
const updateNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notificationSettings = req.body;
    
    const User = require('../models/User');
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { notificationSettings },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return next(new AppError('用户不存在', 404));
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser.notificationSettings,
      message: '通知设置更新成功'
    });
  } catch (error) {
    logger.error('更新通知设置错误:', error);
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
  deleteMe,
  getUsers,
  getUser,
  updatePrivacySettings,
  updateSecuritySettings,
  updateNotificationSettings
};