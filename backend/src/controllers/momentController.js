const Moment = require('../models/Moment');
const Profile = require('../models/Profile');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/moments');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mp3|wav|m4a/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new AppError('只允许上传图片、视频或音频文件', 400));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: fileFilter
});

// 获取时光记录列表
const getMoments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      profileId,
      tags,
      mood,
      privacy,
      startDate,
      endDate,
      search,
      sortBy = 'momentDate',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query = { isDeleted: false };

    // 档案筛选
    if (profileId) {
      query.profile = profileId;
    }

    // 标签筛选
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    // 心情筛选
    if (mood) {
      query.mood = mood;
    }

    // 隐私筛选
    if (privacy) {
      query.privacy = privacy;
    }

    // 日期范围筛选
    if (startDate || endDate) {
      query.momentDate = {};
      if (startDate) query.momentDate.$gte = new Date(startDate);
      if (endDate) query.momentDate.$lte = new Date(endDate);
    }

    // 搜索
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // 权限检查：只能查看自己的记录或公开记录
    if (!profileId) {
      query.$or = [
        { creator: req.user.id },
        { privacy: 'public' }
      ];
    } else {
      // 检查档案权限
      const profile = await Profile.findById(profileId);
      if (!profile) {
        return next(new AppError('档案不存在', 404));
      }
      
      if (profile.owner.toString() !== req.user.id && profile.privacy === 'private') {
        return next(new AppError('无权访问此档案的记录', 403));
      }
    }

    // 分页和排序
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const moments = await Moment.find(query)
      .populate('profile', 'name avatar')
      .populate('creator', 'username avatar')
      .populate('comments.user', 'username avatar')
      .populate('likes.user', 'username avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Moment.countDocuments(query);

    logger.info(`用户 ${req.user.id} 获取时光记录列表，共 ${moments.length} 条`);

    res.status(200).json({
      success: true,
      data: {
        moments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('获取时光记录列表错误:', error);
    next(error);
  }
};

// 创建新记录
const createMoment = async (req, res, next) => {
  try {
    const {
      title,
      content,
      profileId,
      momentDate,
      tags,
      location,
      mood,
      weather,
      privacy = 'private'
    } = req.body;

    // 验证档案权限
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return next(new AppError('档案不存在', 404));
    }

    if (profile.owner.toString() !== req.user.id) {
      return next(new AppError('无权在此档案下创建记录', 403));
    }

    // 处理媒体文件
    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const mediaItem = {
          type: file.mimetype.startsWith('image/') ? 'image' : 
                file.mimetype.startsWith('video/') ? 'video' : 'audio',
          url: `/uploads/moments/${file.filename}`,
          filename: file.filename,
          size: file.size,
          mimeType: file.mimetype
        };

        // 为图片生成缩略图
        if (mediaItem.type === 'image') {
          try {
            const thumbnailPath = path.join(
              path.dirname(file.path),
              'thumb_' + file.filename
            );
            await sharp(file.path)
              .resize(300, 300, { fit: 'cover' })
              .jpeg({ quality: 80 })
              .toFile(thumbnailPath);
            mediaItem.thumbnail = `/uploads/moments/thumb_${file.filename}`;
          } catch (thumbError) {
            logger.warn('生成缩略图失败:', thumbError);
          }
        }

        media.push(mediaItem);
      }
    }

    // 创建记录
    const moment = new Moment({
      title,
      content,
      profile: profileId,
      creator: req.user.id,
      momentDate: momentDate ? new Date(momentDate) : new Date(),
      media,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [],
      location,
      mood,
      weather,
      privacy
    });

    await moment.save();
    await moment.populate('profile', 'name avatar');
    await moment.populate('creator', 'username avatar');

    logger.info(`用户 ${req.user.id} 创建时光记录: ${moment._id}`);

    res.status(201).json({
      success: true,
      data: { moment },
      message: '时光记录创建成功'
    });
  } catch (error) {
    logger.error('创建时光记录错误:', error);
    next(error);
  }
};

// 获取指定记录
const getMoment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const moment = await Moment.findOne({ _id: id, isDeleted: false })
      .populate('profile', 'name avatar privacy')
      .populate('creator', 'username avatar')
      .populate('comments.user', 'username avatar')
      .populate('likes.user', 'username avatar');

    if (!moment) {
      return next(new AppError('记录不存在', 404));
    }

    // 权限检查
    if (moment.privacy === 'private' && moment.creator._id.toString() !== req.user.id) {
      return next(new AppError('无权访问此记录', 403));
    }

    // 增加浏览次数
    if (moment.creator._id.toString() !== req.user.id) {
      await moment.incrementView();
    }

    logger.info(`用户 ${req.user.id} 查看时光记录: ${moment._id}`);

    res.status(200).json({
      success: true,
      data: { moment }
    });
  } catch (error) {
    logger.error('获取指定时光记录错误:', error);
    next(error);
  }
};

// 更新记录
const updateMoment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      momentDate,
      tags,
      location,
      mood,
      weather,
      privacy,
      isPinned
    } = req.body;

    const moment = await Moment.findOne({ _id: id, isDeleted: false });
    if (!moment) {
      return next(new AppError('记录不存在', 404));
    }

    // 权限检查
    if (moment.creator.toString() !== req.user.id) {
      return next(new AppError('无权修改此记录', 403));
    }

    // 更新字段
    const allowedFields = {
      title,
      content,
      momentDate: momentDate ? new Date(momentDate) : moment.momentDate,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : moment.tags,
      location: location || moment.location,
      mood: mood || moment.mood,
      weather: weather || moment.weather,
      privacy: privacy || moment.privacy,
      isPinned: isPinned !== undefined ? isPinned : moment.isPinned
    };

    // 过滤undefined值
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key] !== undefined) {
        moment[key] = allowedFields[key];
      }
    });

    await moment.save();
    await moment.populate('profile', 'name avatar');
    await moment.populate('creator', 'username avatar');

    logger.info(`用户 ${req.user.id} 更新时光记录: ${moment._id}`);

    res.status(200).json({
      success: true,
      data: { moment },
      message: '记录更新成功'
    });
  } catch (error) {
    logger.error('更新时光记录错误:', error);
    next(error);
  }
};

// 删除记录
const deleteMoment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const moment = await Moment.findById(id);
    if (!moment) {
      return next(new AppError('记录不存在', 404));
    }

    // 权限检查
    if (moment.creator.toString() !== req.user.id) {
      return next(new AppError('无权删除此记录', 403));
    }

    if (permanent === 'true') {
      // 永久删除
      await Moment.findByIdAndDelete(id);
      logger.info(`用户 ${req.user.id} 永久删除时光记录: ${id}`);
      
      res.status(200).json({
        success: true,
        message: '记录已永久删除'
      });
    } else {
      // 软删除
      await moment.softDelete();
      logger.info(`用户 ${req.user.id} 软删除时光记录: ${id}`);
      
      res.status(200).json({
        success: true,
        message: '记录已删除'
      });
    }
  } catch (error) {
    logger.error('删除时光记录错误:', error);
    next(error);
  }
};

// 点赞/取消点赞
const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;

    const moment = await Moment.findOne({ _id: id, isDeleted: false });
    if (!moment) {
      return next(new AppError('记录不存在', 404));
    }

    // 权限检查
    if (moment.privacy === 'private' && moment.creator.toString() !== req.user.id) {
      return next(new AppError('无权访问此记录', 403));
    }

    const result = await moment.toggleLike(req.user.id);
    await moment.save();

    logger.info(`用户 ${req.user.id} ${result.action} 时光记录: ${id}`);

    res.status(200).json({
      success: true,
      data: {
        action: result.action,
        likeCount: moment.likes.length
      },
      message: result.action === 'liked' ? '点赞成功' : '取消点赞成功'
    });
  } catch (error) {
    logger.error('点赞操作错误:', error);
    next(error);
  }
};

// 添加评论
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, replyTo } = req.body;

    const moment = await Moment.findOne({ _id: id, isDeleted: false });
    if (!moment) {
      return next(new AppError('记录不存在', 404));
    }

    // 权限检查
    if (moment.privacy === 'private' && moment.creator.toString() !== req.user.id) {
      return next(new AppError('无权访问此记录', 403));
    }

    const comment = await moment.addComment(req.user.id, content, replyTo);
    await moment.save();
    await moment.populate('comments.user', 'username avatar');

    logger.info(`用户 ${req.user.id} 评论时光记录: ${id}`);

    res.status(201).json({
      success: true,
      data: { comment },
      message: '评论添加成功'
    });
  } catch (error) {
    logger.error('添加评论错误:', error);
    next(error);
  }
};

// 删除评论
const deleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;

    const moment = await Moment.findOne({ _id: id, isDeleted: false });
    if (!moment) {
      return next(new AppError('记录不存在', 404));
    }

    const comment = moment.comments.id(commentId);
    if (!comment) {
      return next(new AppError('评论不存在', 404));
    }

    // 权限检查：只有评论作者或记录作者可以删除评论
    if (comment.user.toString() !== req.user.id && moment.creator.toString() !== req.user.id) {
      return next(new AppError('无权删除此评论', 403));
    }

    await moment.removeComment(commentId);
    await moment.save();

    logger.info(`用户 ${req.user.id} 删除评论: ${commentId}`);

    res.status(200).json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    logger.error('删除评论错误:', error);
    next(error);
  }
};

// 上传媒体文件
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('请选择要上传的文件', 400));
    }

    const mediaFiles = [];
    for (const file of req.files) {
      const mediaItem = {
        type: file.mimetype.startsWith('image/') ? 'image' : 
              file.mimetype.startsWith('video/') ? 'video' : 'audio',
        url: `/uploads/moments/${file.filename}`,
        filename: file.filename,
        size: file.size,
        mimeType: file.mimetype
      };

      // 为图片生成缩略图
      if (mediaItem.type === 'image') {
        try {
          const thumbnailPath = path.join(
            path.dirname(file.path),
            'thumb_' + file.filename
          );
          await sharp(file.path)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
          mediaItem.thumbnail = `/uploads/moments/thumb_${file.filename}`;
        } catch (thumbError) {
          logger.warn('生成缩略图失败:', thumbError);
        }
      }

      mediaFiles.push(mediaItem);
    }

    logger.info(`用户 ${req.user.id} 上传 ${mediaFiles.length} 个媒体文件`);

    res.status(200).json({
      success: true,
      data: { media: mediaFiles },
      message: '文件上传成功'
    });
  } catch (error) {
    logger.error('上传媒体文件错误:', error);
    next(error);
  }
};

module.exports = {
  getMoments,
  createMoment,
  getMoment,
  updateMoment,
  deleteMoment,
  toggleLike,
  addComment,
  deleteComment,
  uploadMedia,
  upload // multer中间件
};