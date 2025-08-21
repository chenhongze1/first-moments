const mongoose = require('mongoose');

// 通知模式
const notificationSchema = new mongoose.Schema({
  // 接收者
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '接收者不能为空']
  },
  
  // 发送者（可选，系统通知没有发送者）
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // 通知类型
  type: {
    type: String,
    enum: [
      'like',           // 点赞
      'comment',        // 评论
      'follow',         // 关注
      'mention',        // 提及
      'share',          // 分享
      'achievement',    // 成就解锁
      'reminder',       // 提醒
      'system',         // 系统通知
      'update',         // 更新通知
      'security',       // 安全通知
      'invitation',     // 邀请
      'milestone'       // 里程碑
    ],
    required: [true, '通知类型不能为空']
  },
  
  // 通知标题
  title: {
    type: String,
    required: [true, '通知标题不能为空'],
    trim: true,
    maxlength: [100, '通知标题不能超过100个字符']
  },
  
  // 通知内容
  content: {
    type: String,
    required: [true, '通知内容不能为空'],
    trim: true,
    maxlength: [500, '通知内容不能超过500个字符']
  },
  
  // 通知数据（相关的对象ID等）
  data: {
    // 相关对象类型
    objectType: {
      type: String,
      enum: ['moment', 'profile', 'user', 'achievement', 'comment', 'location', 'system'],
      default: null
    },
    // 相关对象ID
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    // 额外数据
    extra: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  // 通知图标
  icon: {
    type: String,
    default: null
  },
  
  // 通知图片
  image: {
    type: String,
    default: null
  },
  
  // 跳转链接
  actionUrl: {
    type: String,
    default: null
  },
  
  // 操作按钮
  actions: [{
    label: {
      type: String,
      required: true,
      maxlength: [20, '按钮标签不能超过20个字符']
    },
    action: {
      type: String,
      required: true
    },
    style: {
      type: String,
      enum: ['primary', 'secondary', 'success', 'warning', 'danger'],
      default: 'primary'
    }
  }],
  
  // 是否已读
  isRead: {
    type: Boolean,
    default: false
  },
  
  // 阅读时间
  readAt: {
    type: Date,
    default: null
  },
  
  // 优先级
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // 通知渠道
  channels: [{
    type: String,
    enum: ['push', 'email', 'sms', 'in_app'],
    default: ['in_app']
  }],
  
  // 推送状态
  pushStatus: {
    // 应用内通知状态
    inApp: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: {
        type: Date,
        default: null
      }
    },
    // 推送通知状态
    push: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: {
        type: Date,
        default: null
      },
      messageId: {
        type: String,
        default: null
      },
      error: {
        type: String,
        default: null
      }
    },
    // 邮件通知状态
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: {
        type: Date,
        default: null
      },
      messageId: {
        type: String,
        default: null
      },
      error: {
        type: String,
        default: null
      }
    },
    // 短信通知状态
    sms: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: {
        type: Date,
        default: null
      },
      messageId: {
        type: String,
        default: null
      },
      error: {
        type: String,
        default: null
      }
    }
  },
  
  // 过期时间
  expiresAt: {
    type: Date,
    default: null
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
  },
  
  // 批次ID（批量通知）
  batchId: {
    type: String,
    default: null
  },
  
  // 重试次数
  retryCount: {
    type: Number,
    default: 0,
    max: [3, '重试次数不能超过3次']
  },
  
  // 下次重试时间
  nextRetryAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 通知设置模式
const notificationSettingsSchema = new mongoose.Schema({
  // 用户ID
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空'],
    unique: true
  },
  
  // 全局设置
  global: {
    // 是否启用通知
    enabled: {
      type: Boolean,
      default: true
    },
    // 免打扰时间段
    quietHours: {
      enabled: {
        type: Boolean,
        default: false
      },
      start: {
        type: String, // HH:mm 格式
        default: '22:00'
      },
      end: {
        type: String, // HH:mm 格式
        default: '08:00'
      }
    }
  },
  
  // 各类型通知设置
  types: {
    like: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['push', 'email', 'sms', 'in_app'],
        default: ['in_app', 'push']
      }]
    },
    comment: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['push', 'email', 'sms', 'in_app'],
        default: ['in_app', 'push']
      }]
    },
    follow: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['push', 'email', 'sms', 'in_app'],
        default: ['in_app', 'push']
      }]
    },
    mention: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['push', 'email', 'sms', 'in_app'],
        default: ['in_app', 'push']
      }]
    },
    share: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['push', 'email', 'sms', 'in_app'],
        default: ['in_app']
      }]
    },
    achievement: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['push', 'email', 'sms', 'in_app'],
        default: ['in_app', 'push']
      }]
    },
    reminder: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['push', 'email', 'sms', 'in_app'],
        default: ['in_app', 'push']
      }]
    },
    system: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['push', 'email', 'sms', 'in_app'],
        default: ['in_app', 'email']
      }]
    },
    security: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['push', 'email', 'sms', 'in_app'],
        default: ['in_app', 'email', 'push']
      }]
    }
  },
  
  // 设备推送token
  pushTokens: [{
    token: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true
    },
    deviceId: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// 索引
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ sender: 1 });
notificationSchema.index({ isDeleted: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ batchId: 1 });
notificationSchema.index({ nextRetryAt: 1 });

notificationSettingsSchema.index({ user: 1 }, { unique: true });

// 中间件：查询时排除已删除的通知
notificationSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// 实例方法：标记为已读
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// 实例方法：软删除
notificationSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// 实例方法：更新推送状态
notificationSchema.methods.updatePushStatus = function(channel, status) {
  if (this.pushStatus[channel]) {
    Object.assign(this.pushStatus[channel], status);
    return this.save();
  }
  return Promise.reject(new Error('Invalid channel'));
};

// 静态方法：获取未读通知数量
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

// 静态方法：标记所有通知为已读
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      isRead: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

// 静态方法：清理过期通知
notificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// 静态方法：获取需要重试的通知
notificationSchema.statics.getRetryNotifications = function() {
  return this.find({
    nextRetryAt: { $lte: new Date() },
    retryCount: { $lt: 3 }
  });
};

// 实例方法：添加推送token
notificationSettingsSchema.methods.addPushToken = function(token, platform, deviceId) {
  // 移除相同设备的旧token
  this.pushTokens = this.pushTokens.filter(t => t.deviceId !== deviceId);
  
  // 添加新token
  this.pushTokens.push({
    token,
    platform,
    deviceId,
    isActive: true,
    lastUsed: new Date()
  });
  
  return this.save();
};

// 实例方法：移除推送token
notificationSettingsSchema.methods.removePushToken = function(deviceId) {
  this.pushTokens = this.pushTokens.filter(t => t.deviceId !== deviceId);
  return this.save();
};

// 实例方法：获取活跃的推送token
notificationSettingsSchema.methods.getActivePushTokens = function(platform = null) {
  let tokens = this.pushTokens.filter(t => t.isActive);
  
  if (platform) {
    tokens = tokens.filter(t => t.platform === platform);
  }
  
  return tokens.map(t => t.token);
};

// 创建模型
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
const NotificationSettings = mongoose.models.NotificationSettings || mongoose.model('NotificationSettings', notificationSettingsSchema);

module.exports = {
  Notification,
  NotificationSettings
};