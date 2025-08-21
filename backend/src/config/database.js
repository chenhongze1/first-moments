const mongoose = require('mongoose');
const logger = require('../utils/logger');

// MongoDB连接配置
const dbConfig = {
  // 连接选项
  options: {
    // 连接池配置
    maxPoolSize: 10, // 最大连接数
    minPoolSize: 2,  // 最小连接数
    maxIdleTimeMS: 30000, // 连接空闲时间
    serverSelectionTimeoutMS: 5000, // 服务器选择超时
    socketTimeoutMS: 45000, // Socket超时
    
    // 缓冲配置
      bufferCommands: false, // 禁用mongoose缓冲
    
    // 其他配置
    autoIndex: process.env.NODE_ENV !== 'production', // 生产环境禁用自动索引
    autoCreate: true, // 自动创建集合
    family: 4 // 使用IPv4，跳过IPv6
  },
  
  // 重连配置
  reconnect: {
    maxRetries: 5,
    retryDelay: 1000, // 1秒
    backoffFactor: 2, // 指数退避
  }
};

// 连接状态管理
class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.isConnecting = false;
    this.retryCount = 0;
    this.setupEventListeners();
  }
  
  // 设置事件监听器
  setupEventListeners() {
    // 连接成功
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      this.isConnecting = false;
      this.retryCount = 0;
      logger.info('MongoDB连接成功');
      logger.info(`数据库: ${mongoose.connection.name}`);
      logger.info(`主机: ${mongoose.connection.host}:${mongoose.connection.port}`);
    });
    
    // 连接错误
    mongoose.connection.on('error', (error) => {
      this.isConnected = false;
      this.isConnecting = false;
      logger.error('MongoDB连接错误:', error.message);
    });
    
    // 连接断开
    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('MongoDB连接断开');
      
      // 自动重连
      if (process.env.NODE_ENV !== 'test') {
        this.handleReconnect();
      }
    });
    
    // 重连成功
    mongoose.connection.on('reconnected', () => {
      this.isConnected = true;
      this.retryCount = 0;
      logger.info('MongoDB重连成功');
    });
    
    // 进程退出时关闭连接
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }
  
  // 连接数据库
  async connect(uri = process.env.MONGODB_URI) {
    if (this.isConnected) {
      logger.info('数据库已连接');
      return;
    }
    
    if (this.isConnecting) {
      logger.info('数据库正在连接中...');
      return;
    }
    
    if (!uri) {
      uri = 'mongodb://admin:admin123@localhost:27017/first_moments?authSource=admin';
    }
    
    try {
      this.isConnecting = true;
      logger.info('正在连接MongoDB...');
      
      await mongoose.connect(uri, dbConfig.options);
      
    } catch (error) {
      this.isConnecting = false;
      logger.error('MongoDB连接失败:', error.message);
      throw error;
    }
  }
  
  // 断开连接
  async disconnect() {
    if (!this.isConnected && !this.isConnecting) {
      return;
    }
    
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      this.isConnecting = false;
      logger.info('MongoDB连接已关闭');
    } catch (error) {
      logger.error('关闭MongoDB连接失败:', error.message);
      throw error;
    }
  }
  
  // 处理重连
  async handleReconnect() {
    if (this.retryCount >= dbConfig.reconnect.maxRetries) {
      logger.error(`重连失败，已达到最大重试次数: ${dbConfig.reconnect.maxRetries}`);
      return;
    }
    
    const delay = dbConfig.reconnect.retryDelay * 
                 Math.pow(dbConfig.reconnect.backoffFactor, this.retryCount);
    
    this.retryCount++;
    logger.info(`${delay}ms后尝试第${this.retryCount}次重连...`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error(`第${this.retryCount}次重连失败:`, error.message);
      }
    }, delay);
  }
  
  // 获取连接状态
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      retryCount: this.retryCount,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
  
  // 健康检查
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: '数据库未连接' };
      }
      
      // 执行简单查询测试连接
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        message: '数据库连接正常',
        details: this.getStatus()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: '数据库连接异常',
        error: error.message
      };
    }
  }
}

// 创建单例实例
const dbConnection = new DatabaseConnection();

// 兼容原有的connectDB函数
const connectDB = async () => {
  await dbConnection.connect();
};

module.exports = {
  connectDB,
  dbConnection,
  dbConfig,
  // 便捷方法
  connect: (uri) => dbConnection.connect(uri),
  disconnect: () => dbConnection.disconnect(),
  getStatus: () => dbConnection.getStatus(),
  healthCheck: () => dbConnection.healthCheck()
};

// 保持向后兼容
module.exports.default = connectDB;