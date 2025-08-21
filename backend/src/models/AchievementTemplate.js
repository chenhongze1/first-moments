const mongoose = require('mongoose');

// 成就模板Schema
const achievementTemplateSchema = new mongoose.Schema({
  // 基本信息
  name: {
    type: String,
    required: [true, '成就名称不能为空'],
    trim: true,
    maxlength: [100, '成就名称不能超过100个字符']
  },
  
  description: {
    type: String,
    required: [true, '成就描述不能为空'],
    trim: true,
    maxlength: [500, '成就描述不能超过500个字符']
  },
  
  // 成就类型
  type: {
    type: String,
    required: true,
    enum: {
      values: ['milestone', 'streak', 'collection', 'social', 'exploration', 'creative'],
      message: '成就类型必须是: milestone, streak, collection, social, exploration, creative 之一'
    }
  },
  
  // 成就分类
  category: {
    type: String,
    required: true,
    enum: {
      values: ['records', 'social', 'exploration', 'creativity', 'persistence', 'milestone'],
      message: '成就分类无效'
    }
  },
  
  // 难度等级
  difficulty: {
    type: String,
    required: true,
    enum: {
      values: ['easy', 'medium', 'hard', 'legendary'],
      message: '难度等级必须是: easy, medium, hard, legendary 之一'
    },
    default: 'easy'
  },
  
  // 成就图标
  icon: {
    type: String,
    required: true,
    trim: true
  },
  
  // 成就徽章图片
  badge: {
    type: String,
    trim: true
  },
  
  // 奖励积分
  points: {
    type: Number,
    required: true,
    min: [0, '积分不能为负数'],
    default: 10
  },
  
  // 解锁条件
  conditions: {
    // 条件类型
    type: {
      type: String,
      required: true,
      enum: {
        values: ['count', 'streak', 'time', 'location', 'social', 'custom'],
        message: '条件类型无效'
      }
    },
    
    // 目标值
    target: {
      type: Number,
      required: true,
      min: [1, '目标值必须大于0']
    },
    
    // 条件参数
    params: {
      // 统计字段
      field: String,
      
      // 时间范围（天）
      timeRange: Number,
      
      // 地理位置条件
      location: {
        type: String,
        coordinates: [Number]
      },
      
      // 自定义条件
      custom: mongoose.Schema.Types.Mixed
    }
  },
  
  // 前置成就要求
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AchievementTemplate'
  }],
  
  // 成就状态
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'deprecated'],
      message: '成就状态无效'
    },
    default: 'active'
  },
  
  // 是否为隐藏成就
  isHidden: {
    type: Boolean,
    default: false
  },
  
  // 是否为限时成就
  isLimited: {
    type: Boolean,
    default: false
  },
  
  // 限时成就的有效期
  validFrom: {
    type: Date
  },
  
  validTo: {
    type: Date
  },
  
  // 成就标签
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签长度不能超过20个字符']
  }],
  
  // 创建者（管理员）
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 统计信息
  stats: {
    // 获得此成就的用户数
    achievedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // 正在进行此成就的用户数
    inProgressCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // 多语言支持
  localization: {
    en: {
      name: String,
      description: String
    },
    zh: {
      name: String,
      description: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
achievementTemplateSchema.index({ type: 1, category: 1 });
achievementTemplateSchema.index({ difficulty: 1 });
achievementTemplateSchema.index({ status: 1 });
achievementTemplateSchema.index({ tags: 1 });
achievementTemplateSchema.index({ 'conditions.type': 1 });
achievementTemplateSchema.index({ createdAt: -1 });

// 虚拟字段：完成率
achievementTemplateSchema.virtual('completionRate').get(function() {
  const total = this.stats.achievedCount + this.stats.inProgressCount;
  return total > 0 ? (this.stats.achievedCount / total * 100).toFixed(2) : 0;
});

// 虚拟字段：是否过期
achievementTemplateSchema.virtual('isExpired').get(function() {
  if (!this.isLimited || !this.validTo) return false;
  return new Date() > this.validTo;
});

// 虚拟字段：是否可用
achievementTemplateSchema.virtual('isAvailable').get(function() {
  if (this.status !== 'active') return false;
  if (this.isLimited) {
    const now = new Date();
    if (this.validFrom && now < this.validFrom) return false;
    if (this.validTo && now > this.validTo) return false;
  }
  return true;
});

// 中间件：保存前验证
achievementTemplateSchema.pre('save', function(next) {
  // 验证限时成就的时间范围
  if (this.isLimited) {
    if (!this.validFrom || !this.validTo) {
      return next(new Error('限时成就必须设置有效期'));
    }
    if (this.validFrom >= this.validTo) {
      return next(new Error('开始时间必须早于结束时间'));
    }
  }
  
  // 验证条件参数
  if (this.conditions.type === 'time' && !this.conditions.params.timeRange) {
    return next(new Error('时间类型条件必须设置时间范围'));
  }
  
  if (this.conditions.type === 'location' && !this.conditions.params.location) {
    return next(new Error('位置类型条件必须设置地理位置'));
  }
  
  next();
});

// 静态方法：获取活跃的成就模板
achievementTemplateSchema.statics.getActiveTemplates = function(filters = {}) {
  const query = {
    status: 'active',
    ...filters
  };
  
  // 过滤过期的限时成就
  const now = new Date();
  query.$or = [
    { isLimited: false },
    {
      isLimited: true,
      validFrom: { $lte: now },
      validTo: { $gte: now }
    }
  ];
  
  return this.find(query).sort({ difficulty: 1, points: 1 });
};

// 静态方法：根据类型获取成就模板
achievementTemplateSchema.statics.getByType = function(type, includeHidden = false) {
  const query = {
    type,
    status: 'active'
  };
  
  if (!includeHidden) {
    query.isHidden = false;
  }
  
  return this.find(query).sort({ difficulty: 1, points: 1 });
};

// 实例方法：检查用户是否满足前置条件
achievementTemplateSchema.methods.checkPrerequisites = async function(userId) {
  if (!this.prerequisites || this.prerequisites.length === 0) {
    return true;
  }
  
  const UserAchievement = mongoose.model('UserAchievement');
  const achievedCount = await UserAchievement.countDocuments({
    user: userId,
    template: { $in: this.prerequisites },
    status: 'achieved'
  });
  
  return achievedCount === this.prerequisites.length;
};

// 实例方法：更新统计信息
achievementTemplateSchema.methods.updateStats = async function() {
  const UserAchievement = mongoose.model('UserAchievement');
  
  const [achievedCount, inProgressCount] = await Promise.all([
    UserAchievement.countDocuments({
      template: this._id,
      status: 'achieved'
    }),
    UserAchievement.countDocuments({
      template: this._id,
      status: 'in_progress'
    })
  ]);
  
  this.stats.achievedCount = achievedCount;
  this.stats.inProgressCount = inProgressCount;
  
  return this.save();
};

module.exports = mongoose.models.AchievementTemplate || mongoose.model('AchievementTemplate', achievementTemplateSchema);