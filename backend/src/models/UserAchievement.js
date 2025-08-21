const mongoose = require('mongoose');

// 用户成就Schema
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
  
  // 成就状态
  status: {
    type: String,
    enum: {
      values: ['not_started', 'in_progress', 'achieved', 'expired'],
      message: '成就状态必须是: not_started, in_progress, achieved, expired 之一'
    },
    default: 'not_started'
  },
  
  // 当前进度
  progress: {
    // 当前值
    current: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // 目标值（从模板复制）
    target: {
      type: Number,
      required: true,
      min: 1
    },
    
    // 进度百分比
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // 开始时间
  startedAt: {
    type: Date
  },
  
  // 完成时间
  achievedAt: {
    type: Date
  },
  
  // 过期时间
  expiredAt: {
    type: Date
  },
  
  // 进度历史记录
  progressHistory: [{
    value: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    // 触发进度更新的事件
    trigger: {
      type: String,
      enum: ['record_created', 'profile_updated', 'social_interaction', 'location_visit', 'manual'],
      default: 'manual'
    },
    // 相关记录ID
    relatedRecord: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'progressHistory.relatedModel'
    },
    relatedModel: {
      type: String,
      enum: ['Record', 'Profile', 'User']
    }
  }],
  
  // 成就获得时的快照数据
  achievementSnapshot: {
    // 成就模板快照
    template: {
      name: String,
      description: String,
      icon: String,
      badge: String,
      points: Number,
      difficulty: String
    },
    
    // 获得成就时的用户等级
    userLevel: Number,
    
    // 获得成就时的总积分
    userTotalPoints: Number
  },
  
  // 成就相关的额外数据
  metadata: {
    // 连续天数（用于streak类型成就）
    streakDays: Number,
    
    // 最后活动时间
    lastActivityAt: Date,
    
    // 地理位置相关数据
    locations: [{
      name: String,
      coordinates: [Number],
      visitedAt: Date
    }],
    
    // 社交相关数据
    socialData: {
      likesReceived: Number,
      commentsReceived: Number,
      sharesGiven: Number
    },
    
    // 自定义数据
    custom: mongoose.Schema.Types.Mixed
  },
  
  // 是否已通知用户
  notified: {
    type: Boolean,
    default: false
  },
  
  // 是否为手动授予
  isManuallyGranted: {
    type: Boolean,
    default: false
  },
  
  // 手动授予的管理员
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 授予原因（手动授予时）
  grantReason: {
    type: String,
    maxlength: [200, '授予原因不能超过200个字符']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 复合索引
userAchievementSchema.index({ user: 1, template: 1 }, { unique: true });
userAchievementSchema.index({ user: 1, status: 1 });
userAchievementSchema.index({ template: 1, status: 1 });
userAchievementSchema.index({ status: 1, achievedAt: -1 });
userAchievementSchema.index({ user: 1, achievedAt: -1 });
userAchievementSchema.index({ 'metadata.lastActivityAt': 1 });

// 虚拟字段：是否已完成
userAchievementSchema.virtual('isCompleted').get(function() {
  return this.status === 'achieved';
});

// 虚拟字段：是否进行中
userAchievementSchema.virtual('isInProgress').get(function() {
  return this.status === 'in_progress';
});

// 虚拟字段：剩余进度
userAchievementSchema.virtual('remainingProgress').get(function() {
  return Math.max(0, this.progress.target - this.progress.current);
});

// 虚拟字段：预计完成时间（基于历史进度）
userAchievementSchema.virtual('estimatedCompletion').get(function() {
  if (this.status === 'achieved' || this.progressHistory.length < 2) {
    return null;
  }
  
  const recentHistory = this.progressHistory.slice(-5); // 取最近5次记录
  if (recentHistory.length < 2) return null;
  
  const timeSpan = recentHistory[recentHistory.length - 1].timestamp - recentHistory[0].timestamp;
  const progressSpan = recentHistory[recentHistory.length - 1].value - recentHistory[0].value;
  
  if (progressSpan <= 0) return null;
  
  const avgProgressPerMs = progressSpan / timeSpan;
  const remainingProgress = this.progress.target - this.progress.current;
  const estimatedMs = remainingProgress / avgProgressPerMs;
  
  return new Date(Date.now() + estimatedMs);
});

// 中间件：保存前更新进度百分比
userAchievementSchema.pre('save', function(next) {
  // 更新进度百分比
  if (this.progress.target > 0) {
    this.progress.percentage = Math.min(100, (this.progress.current / this.progress.target) * 100);
  }
  
  // 自动更新状态
  if (this.progress.current >= this.progress.target && this.status !== 'achieved') {
    this.status = 'achieved';
    this.achievedAt = new Date();
  } else if (this.progress.current > 0 && this.progress.current < this.progress.target && this.status !== 'achieved') {
    this.status = 'in_progress';
    if (!this.startedAt) {
      this.startedAt = new Date();
    }
  } else if (this.progress.current === 0 && this.status !== 'achieved') {
    this.status = 'not_started';
    this.startedAt = undefined;
  }
  
  next();
});

// 中间件：成就完成后的处理
userAchievementSchema.post('save', async function(doc) {
  if (doc.status === 'achieved' && !doc.achievementSnapshot.template) {
    // 创建成就快照
    try {
      const template = await mongoose.model('AchievementTemplate').findById(doc.template);
      const user = await mongoose.model('User').findById(doc.user);
      
      if (template && user) {
        doc.achievementSnapshot = {
          template: {
            name: template.name,
            description: template.description,
            icon: template.icon,
            badge: template.badge,
            points: template.points,
            difficulty: template.difficulty
          },
          userLevel: user.level || 1,
          userTotalPoints: user.totalPoints || 0
        };
        
        // 更新用户积分
        await mongoose.model('User').findByIdAndUpdate(doc.user, {
          $inc: { totalPoints: template.points }
        });
        
        // 更新模板统计
        await template.updateStats();
        
        await doc.save();
      }
    } catch (error) {
      console.error('更新成就快照失败:', error);
    }
  }
});

// 静态方法：获取用户的成就统计
userAchievementSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalPoints: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'achieved'] },
              '$achievementSnapshot.template.points',
              0
            ]
          }
        }
      }
    }
  ]);
  
  const result = {
    total: 0,
    achieved: 0,
    inProgress: 0,
    notStarted: 0,
    totalPoints: 0
  };
  
  stats.forEach(stat => {
    result.total += stat.count;
    result[stat._id.replace('_', '')] = stat.count;
    result.totalPoints += stat.totalPoints || 0;
  });
  
  return result;
};

// 静态方法：获取用户最近的成就
userAchievementSchema.statics.getRecentAchievements = function(userId, limit = 10) {
  return this.find({
    user: userId,
    status: 'achieved'
  })
  .populate('template', 'name description icon badge points difficulty')
  .sort({ achievedAt: -1 })
  .limit(limit);
};

// 静态方法：获取用户进行中的成就
userAchievementSchema.statics.getInProgressAchievements = function(userId) {
  return this.find({
    user: userId,
    status: 'in_progress'
  })
  .populate('template', 'name description icon points difficulty conditions')
  .sort({ 'progress.percentage': -1 });
};

// 实例方法：更新进度
userAchievementSchema.methods.updateProgress = function(value, trigger = 'manual', relatedRecord = null, relatedModel = null) {
  const oldValue = this.progress.current;
  this.progress.current = Math.max(0, value);
  
  // 添加进度历史
  this.progressHistory.push({
    value: this.progress.current,
    trigger,
    relatedRecord,
    relatedModel
  });
  
  // 更新最后活动时间
  this.metadata.lastActivityAt = new Date();
  
  return this.save();
};

// 实例方法：增加进度
userAchievementSchema.methods.incrementProgress = function(increment = 1, trigger = 'manual', relatedRecord = null, relatedModel = null) {
  return this.updateProgress(this.progress.current + increment, trigger, relatedRecord, relatedModel);
};

// 实例方法：重置进度
userAchievementSchema.methods.resetProgress = function() {
  this.progress.current = 0;
  this.progress.percentage = 0;
  this.status = 'not_started';
  this.startedAt = undefined;
  this.achievedAt = undefined;
  this.progressHistory = [];
  
  return this.save();
};

// 实例方法：手动授予成就
userAchievementSchema.methods.grantManually = function(adminId, reason) {
  this.status = 'achieved';
  this.achievedAt = new Date();
  this.progress.current = this.progress.target;
  this.progress.percentage = 100;
  this.isManuallyGranted = true;
  this.grantedBy = adminId;
  this.grantReason = reason;
  
  return this.save();
};

// 删除已存在的模型以确保使用最新的 schema
if (mongoose.models.UserAchievement) {
  delete mongoose.models.UserAchievement;
}

module.exports = mongoose.model('UserAchievement', userAchievementSchema);