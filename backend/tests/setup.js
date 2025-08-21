const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const redis = require('redis');
const logger = require('../src/utils/logger');

// 禁用日志输出（测试环境）
logger.transports.forEach((t) => (t.silent = true));

// MongoDB内存服务器
let mongoServer;
let redisClient;

// 测试前设置
beforeAll(async () => {
  try {
    // 启动MongoDB内存服务器
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 连接到内存数据库
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // 创建Redis客户端（使用内存存储）
    redisClient = redis.createClient({
      socket: {
        host: 'localhost',
        port: 6379
      },
      password: 'redis123'
    });
    
    // 连接Redis（如果可用）
    try {
      await redisClient.connect();
    } catch (error) {
      console.warn('Redis连接失败，将跳过Redis相关测试');
    }
    
  } catch (error) {
    console.error('测试环境设置失败:', error);
    process.exit(1);
  }
});

// 每个测试前清理数据
beforeEach(async () => {
  try {
    // 清理MongoDB集合
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    // 清理Redis数据（如果连接可用）
    if (redisClient && redisClient.isOpen) {
      await redisClient.flushAll();
    }
  } catch (error) {
    console.error('测试数据清理失败:', error);
  }
});

// 测试后清理
afterAll(async () => {
  try {
    // 关闭数据库连接
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    
    // 停止MongoDB内存服务器
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    // 关闭Redis连接
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
    }
  } catch (error) {
    console.error('测试环境清理失败:', error);
  }
});

// 全局测试工具函数
global.createTestUser = async () => {
  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');
  
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: await bcrypt.hash('password123', 10),
    isEmailVerified: true
  };
  
  const user = new User(userData);
  await user.save();
  return user;
};

global.createTestProfile = async (userId) => {
  const Profile = require('../src/models/Profile');
  
  const profileData = {
    userId: userId,
    name: '测试档案',
    description: '这是一个测试档案',
    type: 'self',
    isPublic: false,
    permissions: [{
      userId: userId,
      role: 'owner',
      canEdit: true,
      canView: true,
      canShare: true,
      canDelete: true,
      grantedBy: userId
    }]
  };
  
  const profile = new Profile(profileData);
  await profile.save();
  return profile;
};

global.generateAuthToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// 模拟外部服务
jest.mock('../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendNotificationEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/services/uploadService', () => ({
  uploadFile: jest.fn().mockResolvedValue({
    url: 'https://example.com/test-file.jpg',
    key: 'test-file-key'
  }),
  deleteFile: jest.fn().mockResolvedValue(true)
}));

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.BCRYPT_ROUNDS = '4'; // 降低加密轮数以提高测试速度