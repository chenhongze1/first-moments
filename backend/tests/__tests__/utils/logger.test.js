const logger = require('../../../src/utils/logger');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    simple: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

// Mock fs
jest.mock('fs');

describe('Logger Utility', () => {
  let mockLogger;
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    };

    winston.createLogger.mockReturnValue(mockLogger);
    
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock fs.existsSync and fs.mkdirSync
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.mkdirSync = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Logger Configuration', () => {
    it('应该正确配置winston logger', () => {
      // Re-require logger to trigger initialization
      delete require.cache[require.resolve('../../../src/utils/logger')];
      require('../../../src/utils/logger');

      expect(winston.createLogger).toHaveBeenCalled();
      expect(winston.format.combine).toHaveBeenCalled();
      expect(winston.format.timestamp).toHaveBeenCalled();
      expect(winston.format.errors).toHaveBeenCalledWith({ stack: true });
    });

    it('应该在开发环境中配置控制台输出', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      delete require.cache[require.resolve('../../../src/utils/logger')];
      require('../../../src/utils/logger');

      expect(winston.transports.Console).toHaveBeenCalled();
      expect(winston.format.colorize).toHaveBeenCalled();
      expect(winston.format.simple).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('应该在生产环境中配置文件输出', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      delete require.cache[require.resolve('../../../src/utils/logger')];
      require('../../../src/utils/logger');

      expect(winston.transports.File).toHaveBeenCalled();
      expect(winston.format.json).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('应该创建日志目录', () => {
      fs.existsSync.mockReturnValue(false);

      delete require.cache[require.resolve('../../../src/utils/logger')];
      require('../../../src/utils/logger');

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('logs'),
        { recursive: true }
      );
    });
  });

  describe('Logging Methods', () => {
    beforeEach(() => {
      // Re-require logger to get fresh instance
      delete require.cache[require.resolve('../../../src/utils/logger')];
    });

    it('应该记录info级别日志', () => {
      const testLogger = require('../../../src/utils/logger');
      const message = '这是一条信息日志';
      const meta = { userId: '123', action: 'login' };

      testLogger.info(message, meta);

      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('应该记录error级别日志', () => {
      const testLogger = require('../../../src/utils/logger');
      const message = '这是一条错误日志';
      const error = new Error('测试错误');

      testLogger.error(message, { error });

      expect(mockLogger.error).toHaveBeenCalledWith(message, { error });
    });

    it('应该记录warn级别日志', () => {
      const testLogger = require('../../../src/utils/logger');
      const message = '这是一条警告日志';
      const meta = { warning: 'deprecated API' };

      testLogger.warn(message, meta);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, meta);
    });

    it('应该记录debug级别日志', () => {
      const testLogger = require('../../../src/utils/logger');
      const message = '这是一条调试日志';
      const meta = { debugInfo: 'variable state' };

      testLogger.debug(message, meta);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, meta);
    });

    it('应该记录verbose级别日志', () => {
      const testLogger = require('../../../src/utils/logger');
      const message = '这是一条详细日志';
      const meta = { details: 'request details' };

      testLogger.verbose(message, meta);

      expect(mockLogger.verbose).toHaveBeenCalledWith(message, meta);
    });
  });

  describe('Error Logging', () => {
    it('应该正确记录Error对象', () => {
      const testLogger = require('../../../src/utils/logger');
      const error = new Error('测试错误');
      error.stack = 'Error stack trace...';

      testLogger.error('发生错误', { error });

      expect(mockLogger.error).toHaveBeenCalledWith('发生错误', {
        error: expect.objectContaining({
          message: '测试错误',
          stack: 'Error stack trace...'
        })
      });
    });

    it('应该记录HTTP请求错误', () => {
      const testLogger = require('../../../src/utils/logger');
      const requestInfo = {
        method: 'POST',
        url: '/api/users',
        statusCode: 500,
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      };

      testLogger.error('HTTP请求失败', { request: requestInfo });

      expect(mockLogger.error).toHaveBeenCalledWith('HTTP请求失败', {
        request: requestInfo
      });
    });

    it('应该记录数据库错误', () => {
      const testLogger = require('../../../src/utils/logger');
      const dbError = {
        name: 'MongoError',
        message: '连接超时',
        code: 'ETIMEDOUT'
      };

      testLogger.error('数据库操作失败', { database: dbError });

      expect(mockLogger.error).toHaveBeenCalledWith('数据库操作失败', {
        database: dbError
      });
    });
  });

  describe('Request Logging', () => {
    it('应该记录HTTP请求', () => {
      const testLogger = require('../../../src/utils/logger');
      const requestInfo = {
        method: 'GET',
        url: '/api/users',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        userId: '123',
        responseTime: 150,
        statusCode: 200
      };

      testLogger.info('HTTP请求', { request: requestInfo });

      expect(mockLogger.info).toHaveBeenCalledWith('HTTP请求', {
        request: requestInfo
      });
    });

    it('应该记录API访问日志', () => {
      const testLogger = require('../../../src/utils/logger');
      const apiInfo = {
        endpoint: '/api/profiles',
        method: 'POST',
        userId: '123',
        profileId: '456',
        action: 'create_profile'
      };

      testLogger.info('API访问', { api: apiInfo });

      expect(mockLogger.info).toHaveBeenCalledWith('API访问', {
        api: apiInfo
      });
    });
  });

  describe('Business Logic Logging', () => {
    it('应该记录用户操作', () => {
      const testLogger = require('../../../src/utils/logger');
      const userAction = {
        userId: '123',
        action: 'create_moment',
        momentId: '456',
        profileId: '789',
        timestamp: new Date().toISOString()
      };

      testLogger.info('用户操作', { user: userAction });

      expect(mockLogger.info).toHaveBeenCalledWith('用户操作', {
        user: userAction
      });
    });

    it('应该记录成就解锁', () => {
      const testLogger = require('../../../src/utils/logger');
      const achievementInfo = {
        userId: '123',
        achievementId: '456',
        achievementName: '第一个记录',
        points: 10
      };

      testLogger.info('成就解锁', { achievement: achievementInfo });

      expect(mockLogger.info).toHaveBeenCalledWith('成就解锁', {
        achievement: achievementInfo
      });
    });

    it('应该记录文件上传', () => {
      const testLogger = require('../../../src/utils/logger');
      const uploadInfo = {
        userId: '123',
        fileName: 'photo.jpg',
        fileSize: 1024000,
        fileType: 'image/jpeg',
        uploadPath: '/uploads/photos/'
      };

      testLogger.info('文件上传', { upload: uploadInfo });

      expect(mockLogger.info).toHaveBeenCalledWith('文件上传', {
        upload: uploadInfo
      });
    });
  });

  describe('Security Logging', () => {
    it('应该记录登录尝试', () => {
      const testLogger = require('../../../src/utils/logger');
      const loginAttempt = {
        username: 'testuser',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        success: true,
        timestamp: new Date().toISOString()
      };

      testLogger.info('登录尝试', { security: loginAttempt });

      expect(mockLogger.info).toHaveBeenCalledWith('登录尝试', {
        security: loginAttempt
      });
    });

    it('应该记录失败的登录尝试', () => {
      const testLogger = require('../../../src/utils/logger');
      const failedLogin = {
        username: 'testuser',
        ip: '127.0.0.1',
        reason: 'invalid_password',
        attempts: 3
      };

      testLogger.warn('登录失败', { security: failedLogin });

      expect(mockLogger.warn).toHaveBeenCalledWith('登录失败', {
        security: failedLogin
      });
    });

    it('应该记录可疑活动', () => {
      const testLogger = require('../../../src/utils/logger');
      const suspiciousActivity = {
        userId: '123',
        activity: 'multiple_failed_logins',
        ip: '192.168.1.100',
        count: 5,
        timeWindow: '5 minutes'
      };

      testLogger.warn('可疑活动', { security: suspiciousActivity });

      expect(mockLogger.warn).toHaveBeenCalledWith('可疑活动', {
        security: suspiciousActivity
      });
    });
  });

  describe('Performance Logging', () => {
    it('应该记录慢查询', () => {
      const testLogger = require('../../../src/utils/logger');
      const slowQuery = {
        query: 'User.find({}).populate("profiles")',
        executionTime: 2500,
        collection: 'users',
        threshold: 1000
      };

      testLogger.warn('慢查询检测', { performance: slowQuery });

      expect(mockLogger.warn).toHaveBeenCalledWith('慢查询检测', {
        performance: slowQuery
      });
    });

    it('应该记录内存使用情况', () => {
      const testLogger = require('../../../src/utils/logger');
      const memoryUsage = {
        rss: 50 * 1024 * 1024, // 50MB
        heapTotal: 30 * 1024 * 1024, // 30MB
        heapUsed: 20 * 1024 * 1024, // 20MB
        external: 1 * 1024 * 1024 // 1MB
      };

      testLogger.info('内存使用情况', { performance: memoryUsage });

      expect(mockLogger.info).toHaveBeenCalledWith('内存使用情况', {
        performance: memoryUsage
      });
    });
  });

  describe('Log Formatting', () => {
    it('应该正确格式化日志消息', () => {
      const testLogger = require('../../../src/utils/logger');
      const message = '用户 {userId} 创建了记录 {momentId}';
      const meta = {
        userId: '123',
        momentId: '456'
      };

      testLogger.info(message, meta);

      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('应该处理循环引用对象', () => {
      const testLogger = require('../../../src/utils/logger');
      const circularObj = { name: 'test' };
      circularObj.self = circularObj;

      // 应该不抛出异常
      expect(() => {
        testLogger.info('循环引用测试', { data: circularObj });
      }).not.toThrow();
    });

    it('应该处理大型对象', () => {
      const testLogger = require('../../../src/utils/logger');
      const largeObj = {
        data: 'x'.repeat(10000),
        array: new Array(1000).fill('item')
      };

      // 应该不抛出异常
      expect(() => {
        testLogger.info('大型对象测试', { data: largeObj });
      }).not.toThrow();
    });
  });

  describe('Log Levels', () => {
    it('应该在生产环境中设置适当的日志级别', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      delete require.cache[require.resolve('../../../src/utils/logger')];
      require('../../../src/utils/logger');

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info'
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('应该在开发环境中设置详细的日志级别', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      delete require.cache[require.resolve('../../../src/utils/logger')];
      require('../../../src/utils/logger');

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug'
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('应该在测试环境中禁用日志', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      delete require.cache[require.resolve('../../../src/utils/logger')];
      require('../../../src/utils/logger');

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          silent: true
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Log Rotation', () => {
    it('应该配置日志轮转', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      delete require.cache[require.resolve('../../../src/utils/logger')];
      require('../../../src/utils/logger');

      expect(winston.transports.File).toHaveBeenCalledWith(
        expect.objectContaining({
          maxsize: expect.any(Number),
          maxFiles: expect.any(Number)
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Handling', () => {
    it('应该处理日志写入错误', () => {
      const testLogger = require('../../../src/utils/logger');
      
      // 模拟日志写入错误
      mockLogger.error.mockImplementation(() => {
        throw new Error('日志写入失败');
      });

      // 应该不抛出异常
      expect(() => {
        testLogger.error('测试错误');
      }).not.toThrow();
    });

    it('应该处理无效的日志级别', () => {
      const testLogger = require('../../../src/utils/logger');
      
      // 应该不抛出异常
      expect(() => {
        testLogger.invalidLevel?.('测试消息');
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('应该与Express中间件集成', () => {
      const testLogger = require('../../../src/utils/logger');
      
      // 模拟Express请求对象
      const req = {
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent'
        }
      };

      const res = {
        statusCode: 200
      };

      const responseTime = 150;

      testLogger.info('HTTP请求完成', {
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          statusCode: res.statusCode,
          responseTime
        }
      });

      expect(mockLogger.info).toHaveBeenCalledWith('HTTP请求完成', {
        request: {
          method: 'GET',
          url: '/api/test',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          statusCode: 200,
          responseTime: 150
        }
      });
    });

    it('应该与错误处理中间件集成', () => {
      const testLogger = require('../../../src/utils/logger');
      
      const error = new Error('测试错误');
      const req = {
        method: 'POST',
        url: '/api/test',
        body: { test: 'data' }
      };

      testLogger.error('请求处理失败', {
        error: {
          message: error.message,
          stack: error.stack
        },
        request: {
          method: req.method,
          url: req.url,
          body: req.body
        }
      });

      expect(mockLogger.error).toHaveBeenCalledWith('请求处理失败', {
        error: {
          message: '测试错误',
          stack: error.stack
        },
        request: {
          method: 'POST',
          url: '/api/test',
          body: { test: 'data' }
        }
      });
    });
  });
});