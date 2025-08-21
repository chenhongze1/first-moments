const { validationResult } = require('express-validator');
const Profile = require('../models/Profile');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// 获取用户档案列表
const getProfiles = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 10,
      search,
      type,
      privacy,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query = {
      $or: [
        { owner: userId },
        { members: userId },
        { privacy: 'public' }
      ],
      isDeleted: false
    };

    // 搜索条件
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // 类型过滤
    if (type) {
      query.type = type;
    }

    // 隐私设置过滤
    if (privacy) {
      query.privacy = privacy;
    }

    // 分页设置
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 执行查询
    const [profiles, total] = await Promise.all([
      Profile.find(query)
        .populate('owner', 'username avatar')
        .populate('members', 'username avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Profile.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      message: '获取档案列表成功',
      data: {
        profiles,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });

    logger.info(`用户 ${req.user.email} 获取档案列表，共 ${profiles.length} 个档案`);
  } catch (error) {
    logger.error('获取档案列表错误:', error);
    next(error);
  }
};

// 创建新档案
const createProfile = async (req, res, next) => {
  try {
    // 验证输入数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('输入数据验证失败', 400, errors.array()));
    }

    const userId = req.user._id;
    const {
      name,
      description,
      type = 'personal',
      privacy = 'private',
      avatar,
      coverImage,
      settings = {},
      members = []
    } = req.body;

    // 检查档案名称是否已存在（同一用户下）
    const existingProfile = await Profile.findOne({
      owner: userId,
      name: name.trim(),
      isDeleted: false
    });

    if (existingProfile) {
      return next(new AppError('档案名称已存在', 400));
    }

    // 创建新档案
    const profileData = {
      name: name.trim(),
      description: description?.trim(),
      type,
      privacy,
      owner: userId,
      avatar,
      coverImage,
      settings: {
        allowComments: settings.allowComments !== false,
        allowSharing: settings.allowSharing !== false,
        showStats: settings.showStats !== false,
        ...settings
      },
      members: type === 'shared' ? [...new Set([userId, ...members])] : [userId],
      stats: {
        recordsCount: 0,
        achievementsCount: 0,
        viewsCount: 0,
        likesCount: 0
      }
    };

    const profile = new Profile(profileData);
    await profile.save();

    // 填充关联数据
    await profile.populate([
      { path: 'owner', select: 'username avatar' },
      { path: 'members', select: 'username avatar' }
    ]);

    res.status(201).json({
      success: true,
      message: '档案创建成功',
      data: {
        profile
      }
    });

    logger.info(`用户 ${req.user.email} 创建了新档案: ${profile.name}`);
  } catch (error) {
    logger.error('创建档案错误:', error);
    next(error);
  }
};

// 获取指定档案
const getProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // 查找档案
    const profile = await Profile.findOne({
      _id: id,
      isDeleted: false
    })
    .populate('owner', 'username avatar email')
    .populate('members', 'username avatar')
    .lean();

    if (!profile) {
      return next(new AppError('档案不存在', 404));
    }

    // 检查访问权限
    const isOwner = profile.owner._id.toString() === userId.toString();
    const isMember = profile.members.some(member => member._id.toString() === userId.toString());
    const isPublic = profile.privacy === 'public';

    if (!isOwner && !isMember && !isPublic) {
      return next(new AppError('无权访问此档案', 403));
    }

    // 如果不是所有者或成员，增加浏览量
    if (!isOwner && !isMember && isPublic) {
      await Profile.findByIdAndUpdate(id, {
        $inc: { 'stats.viewsCount': 1 }
      });
      profile.stats.viewsCount += 1;
    }

    // 根据权限返回不同的数据
    const responseData = {
      ...profile,
      permissions: {
        canEdit: isOwner,
        canDelete: isOwner,
        canInvite: isOwner,
        canView: true,
        canComment: profile.settings.allowComments && (isOwner || isMember || isPublic),
        canShare: profile.settings.allowSharing
      }
    };

    // 如果不是所有者或成员，隐藏敏感信息
    if (!isOwner && !isMember) {
      delete responseData.settings;
      responseData.owner = {
        _id: profile.owner._id,
        username: profile.owner.username,
        avatar: profile.owner.avatar
      };
    }

    res.status(200).json({
      success: true,
      message: '获取档案成功',
      data: {
        profile: responseData
      }
    });

    logger.info(`用户 ${req.user.email} 访问档案: ${profile.name}`);
  } catch (error) {
    logger.error('获取指定档案错误:', error);
    next(error);
  }
};

// 更新档案
const updateProfile = async (req, res, next) => {
  try {
    // 验证输入数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('输入数据验证失败', 400, errors.array()));
    }

    const { id } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    // 查找档案并检查权限
    const profile = await Profile.findOne({
      _id: id,
      isDeleted: false
    });

    if (!profile) {
      return next(new AppError('档案不存在', 404));
    }

    // 检查是否为所有者
    if (profile.owner.toString() !== userId.toString()) {
      return next(new AppError('无权修改此档案', 403));
    }

    // 如果要修改名称，检查是否重复
    if (updateData.name && updateData.name.trim() !== profile.name) {
      const existingProfile = await Profile.findOne({
        owner: userId,
        name: updateData.name.trim(),
        _id: { $ne: id },
        isDeleted: false
      });

      if (existingProfile) {
        return next(new AppError('档案名称已存在', 400));
      }
    }

    // 构建更新数据
    const allowedFields = [
      'name', 'description', 'privacy', 'avatar', 'coverImage', 'settings'
    ];
    
    const filteredUpdateData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'name' || field === 'description') {
          filteredUpdateData[field] = updateData[field]?.trim();
        } else if (field === 'settings') {
          filteredUpdateData[field] = {
            ...profile.settings,
            ...updateData[field]
          };
        } else {
          filteredUpdateData[field] = updateData[field];
        }
      }
    });

    // 更新档案
    const updatedProfile = await Profile.findByIdAndUpdate(
      id,
      {
        ...filteredUpdateData,
        updatedAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    )
    .populate('owner', 'username avatar')
    .populate('members', 'username avatar');

    res.status(200).json({
      success: true,
      message: '档案更新成功',
      data: {
        profile: updatedProfile
      }
    });

    logger.info(`用户 ${req.user.email} 更新了档案: ${updatedProfile.name}`);
  } catch (error) {
    logger.error('更新档案错误:', error);
    next(error);
  }
};

// 删除档案
const deleteProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { permanent = false } = req.query;

    // 查找档案并检查权限
    const profile = await Profile.findOne({
      _id: id,
      isDeleted: false
    });

    if (!profile) {
      return next(new AppError('档案不存在', 404));
    }

    // 检查是否为所有者
    if (profile.owner.toString() !== userId.toString()) {
      return next(new AppError('无权删除此档案', 403));
    }

    if (permanent === 'true') {
      // 永久删除（需要管理员权限或特殊情况）
      await Profile.findByIdAndDelete(id);
      
      res.status(200).json({
        success: true,
        message: '档案已永久删除'
      });

      logger.warn(`用户 ${req.user.email} 永久删除了档案: ${profile.name}`);
    } else {
      // 软删除
      const deletedProfile = await Profile.findByIdAndUpdate(
        id,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: '档案已删除',
        data: {
          profile: {
            _id: deletedProfile._id,
            name: deletedProfile.name,
            deletedAt: deletedProfile.deletedAt
          }
        }
      });

      logger.info(`用户 ${req.user.email} 删除了档案: ${profile.name}`);
    }
  } catch (error) {
    logger.error('删除档案错误:', error);
    next(error);
  }
};

module.exports = {
  getProfiles,
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile
};