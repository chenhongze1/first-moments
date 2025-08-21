const mongoose = require('mongoose');

// 成就模板模式
const achievementTemplateSchema = new mongoose.Schema({
  // 成就名称
  name: {
    type: String,
    required: [true, '成就名称不能为空'],
    trim: true,
    maxlength: [50, '成就名称不能超过50个字符']
  },
  
  // 成就描述
  description: {
    type: String,
    required: [true, '成就描述不能为空'],
    trim: true,
    maxlength: [200, '成就描述不能超过200个字符']
  },
  
  // 成就图标
  icon: {
    type: String,
    required: [true, '成就图标不能为空']
  },
  
  // 成就类型
  type: {
    type: String,
    enum: ['milestone', 'streak', 'collection', 'social', 'special'],
    required: [true, '成就类型不能为空']
  },
  
  // 成就分类
  category: {
    type: String,
    enum: ['moments', 'photos', 'videos', 'locations', 'social', 'time', 'special'],
    required: [true, '成就分类不能为空']
  },
  
  // 成就等级
  level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  
  // 成就条件
  conditions: {
    // 条件类型
    type: {
      type: String,
      enum: ['count', 'streak', 'date', 'location', 'social', 'custom'],
      required: true
    },
    
    // 目标值
    target: {
      type: Number,
      required: true
    },
    
    // 统计字段
    field: {
      type: String,
      required: true
    },
    
    // 时间范围（天）
    timeRange: {
      type: Number,
      default: null
    },
    
    // 额外条件
    extra: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  // 奖励积分
  points: {
    type: Number,
    default: 10,
    min: [1, '积分不能少于1']
  },
  
  // 是否隐藏（隐藏成就在未解锁前不显示）
  isHidden: {
    type: Boolean,
    default: false
  },
  
  // 是否可重复获得
  isRepeatable: {
    type: Boolean,
    default: false
  },
  
  // 前置成就
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AchievementTemplate'
  }],
  
  // 排序权重
  sortOrder: {
    type: Number,
    default: 0
  },
  
  // 是否启用
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 用户成就模式
const userAchievementSchema = new mongoose.Schema({
  // 用户ID
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  
  // 成就模板ID
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AchievementTemplate',
    required: [true, '成就模板ID不能为空']
  },
  
  // 解锁时间
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  
  // 当前进度
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  
  // 是否已解锁
  isUnlocked: {
    type: Boolean,
    default: false
  },
  
  // 解锁次数（可重复成就）
  unlockCount: {
    type: Number,
    default: 0
  },
  
  // 相关数据（触发成就的具体记录等）
  relatedData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // 最后更新时间
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 成就统计模式
const achievementStatsSchema = new mongoose.Schema({
  // 用户ID
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空'],
    unique: true
  },
  
  // 总成就数
  totalAchievements: {
    type: Number,
    default: 0
  },
  
  // 已解锁成就数
  unlockedAchievements: {
    type: Number,
    default: 0
  },
  
  // 总积分
  totalPoints: {
    type: Number,
    default: 0
  },
  
  // 各等级成就数量
  levelCounts: {
    bronze: {
      type: Number,
      default: 0
    },
    silver: {
      type: Number,
      default: 0
    },
    gold: {
      type: Number,
      default: 0
    },
    platinum: {
      type: Number,
      default: 0
    },
    diamond: {
      type: Number,
      default: 0
    }
  },
  
  // 各分类成就数量
  categoryCounts: {
    moments: {
      type: Number,
      default: 0
    },
    photos: {
      type: Number,
      default: 0
    },
    videos: {
      type: Number,
      default: 0
    },
    locations: {
      type: Number,
      default: 0
    },
    social: {
      type: Number,
      default: 0
    },
    time: {
      type: Number,
      default: 0
    },
    special: {
      type: Number,
      default: 0
    }
  },
  
  // 最近解锁的成就
  recentUnlocks: [{
    achievement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AchievementTemplate'
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 成就排名
  rank: {
    type: Number,
    default: 0
  },
  
  // 最后更新时间
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
achievementTemplateSchema.index({ type: 1, category: 1 });
achievementTemplateSchema.index({ level: 1 });
achievementTemplateSchema.index({ isActive: 1, sortOrder: 1 });

userAchievementSchema.index({ user: 1, template: 1 }, { unique: true });
userAchievementSchema.index({ user: 1, isUnlocked: 1 });
userAchievementSchema.index({ user: 1, unlockedAt: -1 });

achievementStatsSchema.index({ user: 1 }, { unique: true });
achievementStatsSchema.index({ totalPoints: -1 });
achievementStatsSchema.index({ rank: 1 });

// 中间件：更新进度百分比
userAchievementSchema.pre('save', function(next) {
  if (this.isModified('progress.current') || this.isModified('progress.target')) {
    this.progress.percentage = Math.min(100, Math.round((this.progress.current / this.progress.target) * 100));
    
    // 检查是否达成成就
    if (this.progress.current >= this.progress.target && !this.isUnlocked) {
      this.isUnlocked = true;
      this.unlockedAt = new Date();
      this.unlockCount += 1;
    }
  }
  
  this.lastUpdated = new Date();
  next();
});

// 实例方法：更新进度
userAchievementSchema.methods.updateProgress = function(value) {
  this.progress.current = Math.max(0, value);
  return this.save();
};

// 实例方法：增加进度
userAchievementSchema.methods.incrementProgress = function(amount = 1) {
  this.progress.current = Math.min(this.progress.target, this.progress.current + amount);
  return this.save();
};

// 静态方法：检查用户成就进度
userAchievementSchema.statics.checkUserAchievements = async function(userId) {
  const achievements = await this.find({ user: userId, isUnlocked: false })
    .populate('template');
  
  const updates = [];
  
  for (const achievement of achievements) {
    // 这里可以根据成就模板的条件检查进度
    // 具体实现需要根据业务逻辑来定制
  }
  
  return updates;
};

// 静态方法：获取用户成就排行榜
achievementStatsSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find()
    .sort({ totalPoints: -1, unlockedAchievements: -1 })
    .limit(limit)
    .populate('user', 'username nickname avatar');
};

// 创建模型（避免重复编译）
const AchievementTemplate = mongoose.models.AchievementTemplate || mongoose.model('AchievementTemplate', achievementTemplateSchema);
const UserAchievement = mongoose.models.UserAchievement || mongoose.model('UserAchievement', userAchievementSchema);
const AchievementStats = mongoose.models.AchievementStats || mongoose.model('AchievementStats', achievementStatsSchema);

module.exports = {
  AchievementTemplate,
  UserAchievement,
  AchievementStats
};