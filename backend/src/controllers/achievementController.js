const { validationResult } = require('express-validator');
const AchievementTemplate = require('../models/AchievementTemplate');
const UserAchievement = require('../models/UserAchievement');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ==================== 成就模板管理 ====================

// 获取成就模板列表
const getAchievementTemplates = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      difficulty,
      status = 'active',
      includeHidden = false,
      search
    } = req.query;

    // 构建查询条件
    const query = { status };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (!includeHidden) query.isHidden = false;
    
    // 搜索条件
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // 分页设置
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 执行查询
    const [templates, total] = await Promise.all([
      AchievementTemplate.find(query)
        .populate('createdBy', 'username')
        .populate('prerequisites', 'name icon difficulty')
        .sort({ difficulty: 1, points: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AchievementTemplate.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      message: '获取成就模板列表成功',
      data: {
        templates,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

    logger.info(`获取成就模板列表，共 ${templates.length} 个模板`);
  } catch (error) {
    logger.error('获取成就模板列表错误:', error);
    next(error);
  }
};

// 创建成就模板（管理员功能）
const createAchievementTemplate = async (req, res, next) => {
  try {
    // 验证输入数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('输入数据验证失败', 400, errors.array()));
    }

    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return next(new AppError('只有管理员可以创建成就模板', 403));
    }

    const templateData = {
      ...req.body,
      createdBy: req.user._id
    };

    // 检查成就名称是否已存在
    const existingTemplate = await AchievementTemplate.findOne({
      name: templateData.name.trim()
    });

    if (existingTemplate) {
      return next(new AppError('成就名称已存在', 400));
    }

    // 创建成就模板
    const template = new AchievementTemplate(templateData);
    await template.save();

    // 填充关联数据
    await template.populate([
      { path: 'createdBy', select: 'username' },
      { path: 'prerequisites', select: 'name icon difficulty' }
    ]);

    res.status(201).json({
      success: true,
      message: '成就模板创建成功',
      data: {
        template
      }
    });

    logger.info(`管理员 ${req.user.email} 创建了成就模板: ${template.name}`);
  } catch (error) {
    logger.error('创建成就模板错误:', error);
    next(error);
  }
};

// 更新成就模板（管理员功能）
const updateAchievementTemplate = async (req, res, next) => {
  try {
    // 验证输入数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('输入数据验证失败', 400, errors.array()));
    }

    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return next(new AppError('只有管理员可以更新成就模板', 403));
    }

    const { id } = req.params;
    const updateData = req.body;

    // 查找成就模板
    const template = await AchievementTemplate.findById(id);
    if (!template) {
      return next(new AppError('成就模板不存在', 404));
    }

    // 如果要修改名称，检查是否重复
    if (updateData.name && updateData.name.trim() !== template.name) {
      const existingTemplate = await AchievementTemplate.findOne({
        name: updateData.name.trim(),
        _id: { $ne: id }
      });

      if (existingTemplate) {
        return next(new AppError('成就名称已存在', 400));
      }
    }

    // 更新成就模板
    const updatedTemplate = await AchievementTemplate.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'username')
    .populate('prerequisites', 'name icon difficulty');

    res.status(200).json({
      success: true,
      message: '成就模板更新成功',
      data: {
        template: updatedTemplate
      }
    });

    logger.info(`管理员 ${req.user.email} 更新了成就模板: ${updatedTemplate.name}`);
  } catch (error) {
    logger.error('更新成就模板错误:', error);
    next(error);
  }
};

// 删除成就模板（管理员功能）
const deleteAchievementTemplate = async (req, res, next) => {
  try {
    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return next(new AppError('只有管理员可以删除成就模板', 403));
    }

    const { id } = req.params;
    const { permanent = false } = req.query;

    // 查找成就模板
    const template = await AchievementTemplate.findById(id);
    if (!template) {
      return next(new AppError('成就模板不存在', 404));
    }

    if (permanent === 'true') {
      // 永久删除
      await AchievementTemplate.findByIdAndDelete(id);
      // 同时删除相关的用户成就记录
      await UserAchievement.deleteMany({ template: id });
      
      res.status(200).json({
        success: true,
        message: '成就模板已永久删除'
      });

      logger.warn(`管理员 ${req.user.email} 永久删除了成就模板: ${template.name}`);
    } else {
      // 软删除（设置为不活跃）
      const deletedTemplate = await AchievementTemplate.findByIdAndUpdate(
        id,
        { status: 'deprecated', updatedAt: new Date() },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: '成就模板已停用',
        data: {
          template: {
            _id: deletedTemplate._id,
            name: deletedTemplate.name,
            status: deletedTemplate.status
          }
        }
      });

      logger.info(`管理员 ${req.user.email} 停用了成就模板: ${template.name}`);
    }
  } catch (error) {
    logger.error('删除成就模板错误:', error);
    next(error);
  }
};

// ==================== 用户成就管理 ====================

// 获取用户成就列表
const getUserAchievements = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const {
      status,
      type,
      difficulty,
      page = 1,
      limit = 20,
      sortBy = 'achievedAt',
      sortOrder = 'desc'
    } = req.query;

    // 权限检查：只能查看自己的成就，除非是管理员
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('无权查看其他用户的成就', 403));
    }

    // 构建查询条件
    const query = { user: userId };
    if (status) query.status = status;

    // 构建聚合管道
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'achievementtemplates',
          localField: 'template',
          foreignField: '_id',
          as: 'templateInfo'
        }
      },
      { $unwind: '$templateInfo' }
    ];

    // 添加过滤条件
    if (type) {
      pipeline.push({ $match: { 'templateInfo.type': type } });
    }
    if (difficulty) {
      pipeline.push({ $match: { 'templateInfo.difficulty': difficulty } });
    }

    // 添加排序
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortOptions });

    // 添加分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    // 执行聚合查询
    const [achievements, total] = await Promise.all([
      UserAchievement.aggregate(pipeline),
      UserAchievement.countDocuments(query)
    ]);

    // 获取用户成就统计
    const stats = await UserAchievement.getUserStats(userId);

    res.status(200).json({
      success: true,
      message: '获取用户成就列表成功',
      data: {
        achievements,
        stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

    logger.info(`获取用户 ${userId} 的成就列表，共 ${achievements.length} 个成就`);
  } catch (error) {
    logger.error('获取用户成就列表错误:', error);
    next(error);
  }
};

// 初始化用户成就
const initializeUserAchievements = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 获取所有活跃的成就模板
    const templates = await AchievementTemplate.getActiveTemplates();

    // 检查用户已有的成就记录
    const existingAchievements = await UserAchievement.find({
      user: userId
    }).select('template');

    const existingTemplateIds = existingAchievements.map(a => a.template.toString());

    // 创建新的成就记录
    const newAchievements = [];
    for (const template of templates) {
      if (!existingTemplateIds.includes(template._id.toString())) {
        // 检查前置条件
        const canStart = await template.checkPrerequisites(userId);
        if (canStart) {
          newAchievements.push({
            user: userId,
            template: template._id,
            progress: {
              current: 0,
              target: template.conditions.target
            },
            status: 'not_started'
          });
        }
      }
    }

    if (newAchievements.length > 0) {
      await UserAchievement.insertMany(newAchievements);
    }

    res.status(200).json({
      success: true,
      message: '用户成就初始化成功',
      data: {
        initialized: newAchievements.length,
        total: templates.length
      }
    });

    logger.info(`用户 ${req.user.email} 初始化了 ${newAchievements.length} 个新成就`);
  } catch (error) {
    logger.error('初始化用户成就错误:', error);
    next(error);
  }
};

// 手动更新成就进度（管理员功能）
const updateAchievementProgress = async (req, res, next) => {
  try {
    // 验证输入数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('输入数据验证失败', 400, errors.array()));
    }

    const { id } = req.params;
    const { progress, reason } = req.body;
    const isAdmin = req.user.role === 'admin';

    // 查找用户成就
    const userAchievement = await UserAchievement.findById(id)
      .populate('template', 'name conditions')
      .populate('user', 'username email');

    if (!userAchievement) {
      return next(new AppError('用户成就记录不存在', 404));
    }

    // 权限检查
    if (!isAdmin && userAchievement.user._id.toString() !== req.user._id.toString()) {
      return next(new AppError('无权修改其他用户的成就进度', 403));
    }

    // 更新进度
    await userAchievement.updateProgress(
      progress,
      isAdmin ? 'manual' : 'user_update',
      null,
      null
    );

    // 如果是管理员手动更新，记录原因
    if (isAdmin && reason) {
      userAchievement.grantReason = reason;
      await userAchievement.save();
    }

    res.status(200).json({
      success: true,
      message: '成就进度更新成功',
      data: {
        achievement: userAchievement
      }
    });

    logger.info(`${isAdmin ? '管理员' : '用户'} ${req.user.email} 更新了成就进度: ${userAchievement.template.name}`);
  } catch (error) {
    logger.error('更新成就进度错误:', error);
    next(error);
  }
};

// 手动授予成就（管理员功能）
const grantAchievement = async (req, res, next) => {
  try {
    // 验证输入数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('输入数据验证失败', 400, errors.array()));
    }

    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return next(new AppError('只有管理员可以手动授予成就', 403));
    }

    const { userId, templateId, reason } = req.body;

    // 查找或创建用户成就记录
    let userAchievement = await UserAchievement.findOne({
      user: userId,
      template: templateId
    }).populate('template', 'name conditions');

    if (!userAchievement) {
      // 创建新的成就记录
      const template = await AchievementTemplate.findById(templateId);
      if (!template) {
        return next(new AppError('成就模板不存在', 404));
      }

      userAchievement = new UserAchievement({
        user: userId,
        template: templateId,
        progress: {
          current: 0,
          target: template.conditions.target
        }
      });
    }

    // 手动授予成就
    await userAchievement.grantManually(req.user._id, reason);

    res.status(200).json({
      success: true,
      message: '成就授予成功',
      data: {
        achievement: userAchievement
      }
    });

    logger.info(`管理员 ${req.user.email} 手动授予成就: ${userAchievement.template.name}`);
  } catch (error) {
    logger.error('手动授予成就错误:', error);
    next(error);
  }
};

// 获取成就排行榜
const getAchievementLeaderboard = async (req, res, next) => {
  try {
    const {
      type = 'total_points',
      period = 'all_time',
      limit = 50
    } = req.query;

    let matchStage = {};
    
    // 时间范围过滤
    if (period !== 'all_time') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        matchStage.achievedAt = { $gte: startDate };
      }
    }

    // 构建聚合管道
    let pipeline = [
      { $match: { status: 'achieved', ...matchStage } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' }
    ];

    // 根据排行榜类型分组
    if (type === 'total_points') {
      pipeline.push({
        $group: {
          _id: '$user',
          username: { $first: '$userInfo.username' },
          avatar: { $first: '$userInfo.avatar' },
          totalPoints: { $sum: '$achievementSnapshot.template.points' },
          achievementCount: { $sum: 1 }
        }
      });
      pipeline.push({ $sort: { totalPoints: -1, achievementCount: -1 } });
    } else if (type === 'achievement_count') {
      pipeline.push({
        $group: {
          _id: '$user',
          username: { $first: '$userInfo.username' },
          avatar: { $first: '$userInfo.avatar' },
          achievementCount: { $sum: 1 },
          totalPoints: { $sum: '$achievementSnapshot.template.points' }
        }
      });
      pipeline.push({ $sort: { achievementCount: -1, totalPoints: -1 } });
    }

    pipeline.push({ $limit: parseInt(limit) });

    // 执行聚合查询
    const leaderboard = await UserAchievement.aggregate(pipeline);

    // 添加排名
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));

    res.status(200).json({
      success: true,
      message: '获取成就排行榜成功',
      data: {
        leaderboard: rankedLeaderboard,
        type,
        period
      }
    });

    logger.info(`获取成就排行榜，类型: ${type}，时间: ${period}`);
  } catch (error) {
    logger.error('获取成就排行榜错误:', error);
    next(error);
  }
};

module.exports = {
  // 成就模板管理
  getAchievementTemplates,
  createAchievementTemplate,
  updateAchievementTemplate,
  deleteAchievementTemplate,
  
  // 用户成就管理
  getUserAchievements,
  initializeUserAchievements,
  updateAchievementProgress,
  grantAchievement,
  getAchievementLeaderboard
};