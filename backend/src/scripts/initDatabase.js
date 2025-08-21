const mongoose = require('mongoose');
require('dotenv').config();

const { AchievementTemplate } = require('../models/Achievement');
const logger = require('../utils/logger');

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('数据库连接成功');
  } catch (error) {
    logger.error('数据库连接失败:', error);
    process.exit(1);
  }
};

// 默认成就模板数据
const defaultAchievements = [
  // 记录相关成就
  {
    name: '初次记录',
    description: '创建你的第一个时光记录',
    icon: '🎉',
    type: 'milestone',
    category: 'moments',
    level: 'bronze',
    conditions: {
      type: 'count',
      target: 1,
      field: 'moments'
    },
    points: 10,
    sortOrder: 1
  },
  {
    name: '记录达人',
    description: '创建10个时光记录',
    icon: '📝',
    type: 'milestone',
    category: 'moments',
    level: 'silver',
    conditions: {
      type: 'count',
      target: 10,
      field: 'moments'
    },
    points: 50,
    sortOrder: 2
  },
  {
    name: '记录专家',
    description: '创建50个时光记录',
    icon: '🏆',
    type: 'milestone',
    category: 'moments',
    level: 'gold',
    conditions: {
      type: 'count',
      target: 50,
      field: 'moments'
    },
    points: 200,
    sortOrder: 3
  },
  {
    name: '记录大师',
    description: '创建100个时光记录',
    icon: '👑',
    type: 'milestone',
    category: 'moments',
    level: 'platinum',
    conditions: {
      type: 'count',
      target: 100,
      field: 'moments'
    },
    points: 500,
    sortOrder: 4
  },
  
  // 照片相关成就
  {
    name: '摄影新手',
    description: '上传你的第一张照片',
    icon: '📷',
    type: 'milestone',
    category: 'photos',
    level: 'bronze',
    conditions: {
      type: 'count',
      target: 1,
      field: 'photos'
    },
    points: 10,
    sortOrder: 10
  },
  {
    name: '摄影爱好者',
    description: '上传25张照片',
    icon: '📸',
    type: 'milestone',
    category: 'photos',
    level: 'silver',
    conditions: {
      type: 'count',
      target: 25,
      field: 'photos'
    },
    points: 75,
    sortOrder: 11
  },
  {
    name: '摄影师',
    description: '上传100张照片',
    icon: '🎨',
    type: 'milestone',
    category: 'photos',
    level: 'gold',
    conditions: {
      type: 'count',
      target: 100,
      field: 'photos'
    },
    points: 300,
    sortOrder: 12
  },
  
  // 视频相关成就
  {
    name: '视频制作者',
    description: '上传你的第一个视频',
    icon: '🎬',
    type: 'milestone',
    category: 'videos',
    level: 'bronze',
    conditions: {
      type: 'count',
      target: 1,
      field: 'videos'
    },
    points: 15,
    sortOrder: 20
  },
  {
    name: '视频达人',
    description: '上传10个视频',
    icon: '🎥',
    type: 'milestone',
    category: 'videos',
    level: 'silver',
    conditions: {
      type: 'count',
      target: 10,
      field: 'videos'
    },
    points: 100,
    sortOrder: 21
  },
  
  // 位置相关成就
  {
    name: '探索者',
    description: '记录你的第一个位置',
    icon: '🗺️',
    type: 'milestone',
    category: 'locations',
    level: 'bronze',
    conditions: {
      type: 'count',
      target: 1,
      field: 'locations'
    },
    points: 10,
    sortOrder: 30
  },
  {
    name: '旅行家',
    description: '访问10个不同的地点',
    icon: '✈️',
    type: 'milestone',
    category: 'locations',
    level: 'silver',
    conditions: {
      type: 'count',
      target: 10,
      field: 'unique_locations'
    },
    points: 80,
    sortOrder: 31
  },
  {
    name: '环球旅行者',
    description: '访问5个不同的城市',
    icon: '🌍',
    type: 'milestone',
    category: 'locations',
    level: 'gold',
    conditions: {
      type: 'count',
      target: 5,
      field: 'unique_cities'
    },
    points: 200,
    sortOrder: 32
  },
  
  // 时间相关成就
  {
    name: '坚持一周',
    description: '连续7天记录时光',
    icon: '📅',
    type: 'streak',
    category: 'time',
    level: 'bronze',
    conditions: {
      type: 'streak',
      target: 7,
      field: 'daily_moments'
    },
    points: 30,
    sortOrder: 40
  },
  {
    name: '坚持一月',
    description: '连续30天记录时光',
    icon: '🗓️',
    type: 'streak',
    category: 'time',
    level: 'silver',
    conditions: {
      type: 'streak',
      target: 30,
      field: 'daily_moments'
    },
    points: 150,
    sortOrder: 41
  },
  {
    name: '坚持一年',
    description: '连续365天记录时光',
    icon: '🎊',
    type: 'streak',
    category: 'time',
    level: 'diamond',
    conditions: {
      type: 'streak',
      target: 365,
      field: 'daily_moments'
    },
    points: 1000,
    sortOrder: 42
  },
  
  // 社交相关成就
  {
    name: '社交新手',
    description: '获得第一个点赞',
    icon: '👍',
    type: 'milestone',
    category: 'social',
    level: 'bronze',
    conditions: {
      type: 'count',
      target: 1,
      field: 'likes_received'
    },
    points: 10,
    sortOrder: 50
  },
  {
    name: '受欢迎的人',
    description: '获得50个点赞',
    icon: '❤️',
    type: 'milestone',
    category: 'social',
    level: 'silver',
    conditions: {
      type: 'count',
      target: 50,
      field: 'likes_received'
    },
    points: 100,
    sortOrder: 51
  },
  {
    name: '评论家',
    description: '发表10条评论',
    icon: '💬',
    type: 'milestone',
    category: 'social',
    level: 'bronze',
    conditions: {
      type: 'count',
      target: 10,
      field: 'comments_made'
    },
    points: 25,
    sortOrder: 52
  },
  
  // 特殊成就
  {
    name: '早起鸟',
    description: '在早上6点前记录时光',
    icon: '🌅',
    type: 'special',
    category: 'special',
    level: 'bronze',
    conditions: {
      type: 'custom',
      target: 1,
      field: 'early_morning_moments',
      extra: { hour: 6 }
    },
    points: 20,
    sortOrder: 60
  },
  {
    name: '夜猫子',
    description: '在晚上11点后记录时光',
    icon: '🌙',
    type: 'special',
    category: 'special',
    level: 'bronze',
    conditions: {
      type: 'custom',
      target: 1,
      field: 'late_night_moments',
      extra: { hour: 23 }
    },
    points: 20,
    sortOrder: 61
  },
  {
    name: '生日快乐',
    description: '在生日当天记录时光',
    icon: '🎂',
    type: 'special',
    category: 'special',
    level: 'gold',
    conditions: {
      type: 'date',
      target: 1,
      field: 'birthday_moments'
    },
    points: 100,
    isRepeatable: true,
    sortOrder: 62
  },
  {
    name: '新年新开始',
    description: '在新年第一天记录时光',
    icon: '🎆',
    type: 'special',
    category: 'special',
    level: 'gold',
    conditions: {
      type: 'date',
      target: 1,
      field: 'new_year_moments'
    },
    points: 50,
    isRepeatable: true,
    sortOrder: 63
  }
];

// 初始化成就模板
const initAchievements = async () => {
  try {
    logger.info('开始初始化成就模板...');
    
    // 检查是否已经有成就模板
    const existingCount = await AchievementTemplate.countDocuments();
    if (existingCount > 0) {
      logger.info(`已存在 ${existingCount} 个成就模板，跳过初始化`);
      return;
    }
    
    // 批量插入成就模板
    const result = await AchievementTemplate.insertMany(defaultAchievements);
    logger.info(`成功创建 ${result.length} 个成就模板`);
    
    // 按分类统计
    const stats = {};
    result.forEach(achievement => {
      const category = achievement.category;
      stats[category] = (stats[category] || 0) + 1;
    });
    
    logger.info('成就模板分类统计:', stats);
    
  } catch (error) {
    logger.error('初始化成就模板失败:', error);
    throw error;
  }
};

// 创建索引
const createIndexes = async () => {
  try {
    logger.info('开始创建数据库索引...');
    
    // 这里可以添加额外的索引创建逻辑
    // MongoDB会自动创建模型中定义的索引
    
    logger.info('数据库索引创建完成');
  } catch (error) {
    logger.error('创建数据库索引失败:', error);
    throw error;
  }
};

// 主初始化函数
const initDatabase = async () => {
  try {
    logger.info('开始初始化数据库...');
    
    await connectDB();
    await createIndexes();
    await initAchievements();
    
    logger.info('数据库初始化完成');
  } catch (error) {
    logger.error('数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('数据库连接已关闭');
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase();
}

module.exports = {
  initDatabase,
  initAchievements,
  createIndexes,
  defaultAchievements
};