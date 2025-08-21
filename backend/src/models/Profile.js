const mongoose = require('mongoose');

// 档案模式
const profileSchema = new mongoose.Schema({
  // 档案名称
  name: {
    type: String,
    required: [true, '档案名称不能为空'],
    trim: true,
    maxlength: [50, '档案名称不能超过50个字符']
  },
  
  // 档案描述
  description: {
    type: String,
    trim: true,
    maxlength: [500, '档案描述不能超过500个字符']
  },
  
  // 档案封面图片
  coverImage: {
    type: String,
    default: null
  },
  
  // 档案类型
  type: {
    type: String,
    enum: ['baby', 'pet', 'travel', 'hobby', 'other'],
    default: 'other'
  },
  
  // 档案所有者
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '档案必须有所有者']
  },
  
  // 档案成员（可以查看和编辑的用户）
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 隐私设置
  privacy: {
    type: String,
    enum: ['public', 'private', 'friends'],
    default: 'private'
  },
  
  // 档案设置
  settings: {
    // 是否允许评论
    allowComments: {
      type: Boolean,
      default: true
    },
    // 是否允许分享
    allowSharing: {
      type: Boolean,
      default: true
    },
    // 时间线排序方式
    timelineSort: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'desc'
    }
  },
  
  // 统计信息
  stats: {
    // 记录数量
    momentCount: {
      type: Number,
      default: 0
    },
    // 照片数量
    photoCount: {
      type: Number,
      default: 0
    },
    // 视频数量
    videoCount: {
      type: Number,
      default: 0
    },
    // 最后更新时间
    lastMomentAt: {
      type: Date,
      default: null
    }
  },
  
  // 是否已删除（软删除）
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // 删除时间
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
profileSchema.index({ owner: 1 });
profileSchema.index({ 'members.user': 1 });
profileSchema.index({ type: 1 });
profileSchema.index({ privacy: 1 });
profileSchema.index({ isDeleted: 1 });
profileSchema.index({ createdAt: -1 });

// 虚拟字段：档案的记录
profileSchema.virtual('moments', {
  ref: 'Moment',
  localField: '_id',
  foreignField: 'profile'
});

// 中间件：查询时排除已删除的档案
profileSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// 实例方法：检查用户是否有权限访问档案
profileSchema.methods.hasAccess = function(userId, requiredRole = 'viewer') {
  // 所有者拥有所有权限
  if (this.owner.toString() === userId.toString()) {
    return true;
  }
  
  // 检查成员权限
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) {
    return this.privacy === 'public';
  }
  
  // 权限级别：viewer < editor < admin
  const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
  return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
};

// 实例方法：添加成员
profileSchema.methods.addMember = function(userId, role = 'viewer') {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (existingMember) {
    existingMember.role = role;
  } else {
    this.members.push({ user: userId, role });
  }
  return this.save();
};

// 实例方法：移除成员
profileSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(m => m.user.toString() !== userId.toString());
  return this.save();
};

// 实例方法：软删除
profileSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// 静态方法：获取用户可访问的档案
profileSchema.statics.getAccessibleProfiles = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'members.user': userId },
      { privacy: 'public' }
    ]
  }).populate('owner', 'username nickname avatar')
    .populate('members.user', 'username nickname avatar');
};

module.exports = mongoose.models.Profile || mongoose.model('Profile', profileSchema);