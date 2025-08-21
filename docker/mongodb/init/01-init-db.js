// MongoDB初始化脚本 - "初见"APP数据库

// 切换到应用数据库
db = db.getSiblingDB('first_moments');

// 创建应用用户
db.createUser({
  user: 'app_user',
  pwd: 'app_password_123',
  roles: [
    {
      role: 'readWrite',
      db: 'first_moments'
    }
  ]
});

print('✅ 应用用户创建成功');

// 创建集合并设置索引

// 用户集合
db.createCollection('users');
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'phone': 1 }, { unique: true, sparse: true });
db.users.createIndex({ 'username': 1 }, { unique: true });
db.users.createIndex({ 'createdAt': 1 });
db.users.createIndex({ 'lastLoginAt': 1 });
print('✅ 用户集合和索引创建成功');

// 用户档案集合
db.createCollection('profiles');
db.profiles.createIndex({ 'userId': 1 });
db.profiles.createIndex({ 'name': 1 });
db.profiles.createIndex({ 'birthday': 1 });
db.profiles.createIndex({ 'createdAt': 1 });
print('✅ 用户档案集合和索引创建成功');

// 时光记录集合
db.createCollection('moments');
db.moments.createIndex({ 'userId': 1 });
db.moments.createIndex({ 'profileId': 1 });
db.moments.createIndex({ 'createdAt': -1 });
db.moments.createIndex({ 'tags': 1 });
db.moments.createIndex({ 'location.coordinates': '2dsphere' });
db.moments.createIndex({ 'isPublic': 1 });
db.moments.createIndex({ 'category': 1 });
print('✅ 时光记录集合和索引创建成功');

// 成就集合
db.createCollection('achievements');
db.achievements.createIndex({ 'userId': 1 });
db.achievements.createIndex({ 'profileId': 1 });
db.achievements.createIndex({ 'type': 1 });
db.achievements.createIndex({ 'isCompleted': 1 });
db.achievements.createIndex({ 'completedAt': 1 });
db.achievements.createIndex({ 'createdAt': 1 });
print('✅ 成就集合和索引创建成功');

// 地点打卡集合
db.createCollection('checkins');
db.checkins.createIndex({ 'userId': 1 });
db.checkins.createIndex({ 'profileId': 1 });
db.checkins.createIndex({ 'location.coordinates': '2dsphere' });
db.checkins.createIndex({ 'createdAt': -1 });
db.checkins.createIndex({ 'placeName': 1 });
print('✅ 地点打卡集合和索引创建成功');

// 评论集合
db.createCollection('comments');
db.comments.createIndex({ 'momentId': 1 });
db.comments.createIndex({ 'userId': 1 });
db.comments.createIndex({ 'createdAt': -1 });
db.comments.createIndex({ 'parentId': 1 });
print('✅ 评论集合和索引创建成功');

// 点赞集合
db.createCollection('likes');
db.likes.createIndex({ 'momentId': 1, 'userId': 1 }, { unique: true });
db.likes.createIndex({ 'userId': 1 });
db.likes.createIndex({ 'createdAt': -1 });
print('✅ 点赞集合和索引创建成功');

// 关注关系集合
db.createCollection('follows');
db.follows.createIndex({ 'followerId': 1, 'followingId': 1 }, { unique: true });
db.follows.createIndex({ 'followerId': 1 });
db.follows.createIndex({ 'followingId': 1 });
db.follows.createIndex({ 'createdAt': -1 });
print('✅ 关注关系集合和索引创建成功');

// 通知集合
db.createCollection('notifications');
db.notifications.createIndex({ 'userId': 1 });
db.notifications.createIndex({ 'isRead': 1 });
db.notifications.createIndex({ 'type': 1 });
db.notifications.createIndex({ 'createdAt': -1 });
print('✅ 通知集合和索引创建成功');

// 文件上传记录集合
db.createCollection('uploads');
db.uploads.createIndex({ 'userId': 1 });
db.uploads.createIndex({ 'fileType': 1 });
db.uploads.createIndex({ 'createdAt': -1 });
db.uploads.createIndex({ 'fileName': 1 });
print('✅ 文件上传记录集合和索引创建成功');

// 系统配置集合
db.createCollection('configs');
db.configs.createIndex({ 'key': 1 }, { unique: true });
print('✅ 系统配置集合和索引创建成功');

// 插入初始配置数据
db.configs.insertMany([
  {
    key: 'app_version',
    value: '1.0.0',
    description: '应用版本号',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'maintenance_mode',
    value: false,
    description: '维护模式开关',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'max_file_size',
    value: 10485760,
    description: '最大文件上传大小（字节）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'allowed_image_types',
    value: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    description: '允许的图片类型',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'allowed_video_types',
    value: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    description: '允许的视频类型',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('✅ 初始配置数据插入成功');

// 创建预设成就模板
db.createCollection('achievement_templates');
db.achievement_templates.createIndex({ 'category': 1 });
db.achievement_templates.createIndex({ 'isActive': 1 });
db.achievement_templates.createIndex({ 'sortOrder': 1 });

// 插入预设成就模板
db.achievement_templates.insertMany([
  {
    name: '第一次微笑',
    description: '记录宝宝第一次微笑的珍贵时刻',
    category: 'baby',
    icon: 'smile',
    isActive: true,
    sortOrder: 1,
    createdAt: new Date()
  },
  {
    name: '第一次说话',
    description: '记录宝宝第一次说话的时刻',
    category: 'baby',
    icon: 'voice',
    isActive: true,
    sortOrder: 2,
    createdAt: new Date()
  },
  {
    name: '第一次走路',
    description: '记录宝宝第一次独立行走',
    category: 'baby',
    icon: 'walk',
    isActive: true,
    sortOrder: 3,
    createdAt: new Date()
  },
  {
    name: '第一天上学',
    description: '记录第一天上学的重要时刻',
    category: 'education',
    icon: 'school',
    isActive: true,
    sortOrder: 4,
    createdAt: new Date()
  },
  {
    name: '毕业典礼',
    description: '记录毕业典礼的重要时刻',
    category: 'education',
    icon: 'graduation',
    isActive: true,
    sortOrder: 5,
    createdAt: new Date()
  },
  {
    name: '第一次旅行',
    description: '记录第一次旅行的美好回忆',
    category: 'travel',
    icon: 'travel',
    isActive: true,
    sortOrder: 6,
    createdAt: new Date()
  }
]);

print('✅ 预设成就模板插入成功');
print('🎉 MongoDB数据库初始化完成！');
print('📊 数据库统计信息：');
print('   - 集合数量：' + db.getCollectionNames().length);
print('   - 配置项数量：' + db.configs.countDocuments());
print('   - 成就模板数量：' + db.achievement_templates.countDocuments());
print('💡 提示：请记住应用用户凭据 - 用户名: app_user, 密码: app_password_123');