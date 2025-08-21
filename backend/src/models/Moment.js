const mongoose = require('mongoose');

// 媒体文件模式
const mediaSchema = new mongoose.Schema({
  // 文件类型
  type: {
    type: String,
    enum: ['image', 'video', 'audio'],
    required: true
  },
  
  // 文件URL
  url: {
    type: String,
    required: true
  },
  
  // 缩略图URL（视频和图片）
  thumbnail: {
    type: String,
    default: null
  },
  
  // 文件大小（字节）
  size: {
    type: Number,
    required: true
  },
  
  // 文件名
  filename: {
    type: String,
    required: true
  },
  
  // MIME类型
  mimeType: {
    type: String,
    required: true
  },
  
  // 媒体元数据
  metadata: {
    // 图片/视频尺寸
    width: Number,
    height: Number,
    // 视频/音频时长（秒）
    duration: Number,
    // 拍摄设备信息
    device: String,
    // GPS信息
    location: {
      latitude: Number,
      longitude: Number
    }
  }
});

// 时光记录模式
const momentSchema = new mongoose.Schema({
  // 标题
  title: {
    type: String,
    trim: true,
    maxlength: [100, '标题不能超过100个字符']
  },
  
  // 内容描述
  content: {
    type: String,
    trim: true,
    maxlength: [2000, '内容不能超过2000个字符']
  },
  
  // 所属档案
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: [true, '记录必须属于某个档案']
  },
  
  // 创建者
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '记录必须有创建者']
  },
  
  // 记录时间（可以是过去的时间）
  momentDate: {
    type: Date,
    required: [true, '记录时间不能为空'],
    default: Date.now
  },
  
  // 媒体文件
  media: [mediaSchema],
  
  // 标签
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签不能超过20个字符']
  }],
  
  // 位置信息
  location: {
    // 地理坐标
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    },
    // 地址信息
    address: {
      // 详细地址
      formatted: String,
      // 国家
      country: String,
      // 省/州
      state: String,
      // 城市
      city: String,
      // 区/县
      district: String,
      // 街道
      street: String
    },
    // 地点名称（如：家、公司、学校等）
    placeName: String
  },
  
  // 心情/情绪
  mood: {
    type: String,
    enum: ['happy', 'sad', 'excited', 'calm', 'angry', 'surprised', 'love', 'grateful', 'proud', 'other'],
    default: null
  },
  
  // 天气信息
  weather: {
    condition: {
      type: String,
      enum: ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'foggy', 'stormy']
    },
    temperature: Number,
    humidity: Number
  },
  
  // 隐私设置
  privacy: {
    type: String,
    enum: ['public', 'private', 'friends'],
    default: 'private'
  },
  
  // 评论
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, '评论不能超过500个字符']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    // 回复的评论ID
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  }],
  
  // 点赞
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 统计信息
  stats: {
    viewCount: {
      type: Number,
      default: 0
    },
    likeCount: {
      type: Number,
      default: 0
    },
    commentCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    }
  },
  
  // 是否置顶
  isPinned: {
    type: Boolean,
    default: false
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
momentSchema.index({ profile: 1, momentDate: -1 });
momentSchema.index({ creator: 1 });
momentSchema.index({ momentDate: -1 });
momentSchema.index({ tags: 1 });
momentSchema.index({ 'location.coordinates': '2dsphere' });
momentSchema.index({ privacy: 1 });
momentSchema.index({ isDeleted: 1 });
momentSchema.index({ isPinned: -1, momentDate: -1 });

// 虚拟字段：点赞数
momentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// 虚拟字段：评论数
momentSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// 中间件：查询时排除已删除的记录
momentSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// 中间件：保存前更新统计信息
momentSchema.pre('save', function(next) {
  if (this.isModified('likes')) {
    this.stats.likeCount = this.likes.length;
  }
  if (this.isModified('comments')) {
    this.stats.commentCount = this.comments.length;
  }
  next();
});

// 实例方法：检查用户是否点赞
momentSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// 实例方法：切换点赞状态
momentSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId.toString());
  
  if (likeIndex > -1) {
    // 取消点赞
    this.likes.splice(likeIndex, 1);
  } else {
    // 添加点赞
    this.likes.push({ user: userId });
  }
  
  return this.save();
};

// 实例方法：添加评论
momentSchema.methods.addComment = function(userId, content, replyTo = null) {
  this.comments.push({
    user: userId,
    content,
    replyTo
  });
  return this.save();
};

// 实例方法：删除评论
momentSchema.methods.removeComment = function(commentId) {
  this.comments = this.comments.filter(comment => comment._id.toString() !== commentId.toString());
  return this.save();
};

// 实例方法：增加浏览次数
momentSchema.methods.incrementView = function() {
  this.stats.viewCount += 1;
  return this.save();
};

// 实例方法：软删除
momentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// 静态方法：获取附近的记录
momentSchema.statics.findNearby = function(latitude, longitude, maxDistance = 1000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// 静态方法：按标签搜索
momentSchema.statics.findByTags = function(tags) {
  return this.find({
    tags: { $in: tags }
  });
};

module.exports = mongoose.models.Moment || mongoose.model('Moment', momentSchema);