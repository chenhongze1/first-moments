const { errorHandler, notFoundHandler, validationErrorHandler } = require('../../../src/middleware/errorHandler');
const mongoose = require('mongoose');

describe('Error Handler Middleware', () => {
  let req, res, next;
  let consoleErrorSpy;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false
    };
    next = jest.fn();

    // Mock console.error to avoid noise in test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('errorHandler', () => {
    it('应该处理一般错误', () => {
      const error = new Error('测试错误');
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '测试错误',
        error: {
          name: 'Error',
          message: '测试错误'
        }
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('应该处理没有状态码的错误', () => {
      const error = new Error('未知错误');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '服务器内部错误',
        error: {
          name: 'Error',
          message: '未知错误'
        }
      });
    });

    it('应该处理MongoDB验证错误', () => {
      const error = new mongoose.Error.ValidationError();
      error.errors = {
        username: {
          message: '用户名是必填项',
          path: 'username',
          value: ''
        },
        email: {
          message: '邮箱格式无效',
          path: 'email',
          value: 'invalid-email'
        }
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '数据验证失败',
        error: {
          name: 'ValidationError',
          message: expect.any(String),
          details: {
            username: '用户名是必填项',
            email: '邮箱格式无效'
          }
        }
      });
    });

    it('应该处理MongoDB重复键错误', () => {
      const error = new Error('E11000 duplicate key error');
      error.code = 11000;
      error.keyPattern = { username: 1 };
      error.keyValue = { username: 'testuser' };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '数据已存在',
        error: {
          name: 'MongoError',
          message: 'username 字段的值已存在',
          field: 'username',
          value: 'testuser'
        }
      });
    });

    it('应该处理MongoDB转换错误', () => {
      const error = new mongoose.Error.CastError('ObjectId', 'invalid-id', '_id');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '数据格式错误',
        error: {
          name: 'CastError',
          message: '_id 字段格式无效',
          path: '_id',
          value: 'invalid-id'
        }
      });
    });

    it('应该处理JWT错误', () => {
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '令牌格式错误',
        error: {
          name: 'JsonWebTokenError',
          message: 'jwt malformed'
        }
      });
    });

    it('应该处理JWT过期错误', () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      error.expiredAt = new Date();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '令牌已过期',
        error: {
          name: 'TokenExpiredError',
          message: 'jwt expired',
          expiredAt: error.expiredAt
        }
      });
    });

    it('应该处理文件上传错误', () => {
      const error = new Error('File too large');
      error.code = 'LIMIT_FILE_SIZE';
      error.limit = 5 * 1024 * 1024; // 5MB

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '文件大小超出限制',
        error: {
          name: 'MulterError',
          message: 'File too large',
          limit: '5MB'
        }
      });
    });

    it('应该处理文件类型错误', () => {
      const error = new Error('Invalid file type');
      error.code = 'INVALID_FILE_TYPE';
      error.allowedTypes = ['image/jpeg', 'image/png'];

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '文件类型不支持',
        error: {
          name: 'FileTypeError',
          message: 'Invalid file type',
          allowedTypes: ['image/jpeg', 'image/png']
        }
      });
    });

    it('应该处理权限错误', () => {
      const error = new Error('权限不足');
      error.statusCode = 403;
      error.name = 'ForbiddenError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '权限不足',
        error: {
          name: 'ForbiddenError',
          message: '权限不足'
        }
      });
    });

    it('应该处理资源不存在错误', () => {
      const error = new Error('资源不存在');
      error.statusCode = 404;
      error.name = 'NotFoundError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '资源不存在',
        error: {
          name: 'NotFoundError',
          message: '资源不存在'
        }
      });
    });

    it('应该处理速率限制错误', () => {
      const error = new Error('Too many requests');
      error.statusCode = 429;
      error.name = 'RateLimitError';
      error.retryAfter = 60;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '请求过于频繁，请稍后再试',
        error: {
          name: 'RateLimitError',
          message: 'Too many requests',
          retryAfter: 60
        }
      });
    });

    it('应该在生产环境中隐藏错误详情', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('内部错误详情');
      error.stack = 'Error stack trace...';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '服务器内部错误'
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('应该在开发环境中显示错误详情', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('开发环境错误');
      error.stack = 'Error stack trace...';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '服务器内部错误',
        error: {
          name: 'Error',
          message: '开发环境错误',
          stack: 'Error stack trace...'
        }
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('应该处理已发送响应的情况', () => {
      res.headersSent = true;
      const error = new Error('测试错误');

      errorHandler(error, req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('应该记录错误日志', () => {
      const error = new Error('需要记录的错误');
      error.statusCode = 500;

      errorHandler(error, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred:'),
        expect.objectContaining({
          error: error.message,
          stack: error.stack,
          url: req.url,
          method: req.method,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        })
      );
    });

    it('应该处理循环引用的错误对象', () => {
      const error = new Error('循环引用错误');
      error.circular = error; // 创建循环引用

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
      // 应该能够正常处理而不抛出异常
    });
  });

  describe('notFoundHandler', () => {
    it('应该处理404错误', () => {
      notFoundHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '请求的资源不存在',
        error: {
          name: 'NotFoundError',
          message: `无法找到 ${req.method} ${req.url}`,
          path: req.url,
          method: req.method
        }
      });
    });

    it('应该处理不同的HTTP方法', () => {
      req.method = 'POST';
      req.url = '/api/nonexistent';

      notFoundHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '请求的资源不存在',
        error: {
          name: 'NotFoundError',
          message: '无法找到 POST /api/nonexistent',
          path: '/api/nonexistent',
          method: 'POST'
        }
      });
    });

    it('应该提供API路径建议', () => {
      req.url = '/api/user'; // 可能想访问 /api/users

      notFoundHandler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            suggestions: expect.arrayContaining([
              expect.stringContaining('/api/users')
            ])
          })
        })
      );
    });
  });

  describe('validationErrorHandler', () => {
    it('应该处理express-validator错误', () => {
      const validationErrors = [
        {
          msg: '用户名是必填项',
          param: 'username',
          location: 'body',
          value: ''
        },
        {
          msg: '邮箱格式无效',
          param: 'email',
          location: 'body',
          value: 'invalid-email'
        }
      ];

      req.validationErrors = validationErrors;

      validationErrorHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '输入数据验证失败',
        error: {
          name: 'ValidationError',
          message: '输入数据验证失败',
          details: {
            username: '用户名是必填项',
            email: '邮箱格式无效'
          }
        }
      });
    });

    it('应该在没有验证错误时调用next', () => {
      req.validationErrors = [];

      validationErrorHandler(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该处理嵌套字段验证错误', () => {
      const validationErrors = [
        {
          msg: '设置格式无效',
          param: 'settings.privacy.profileVisibility',
          location: 'body',
          value: 'invalid'
        }
      ];

      req.validationErrors = validationErrors;

      validationErrorHandler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: {
              'settings.privacy.profileVisibility': '设置格式无效'
            }
          })
        })
      );
    });
  });

  describe('异步错误处理', () => {
    it('应该处理Promise拒绝', async () => {
      const asyncError = new Error('异步错误');
      
      // 模拟异步中间件
      const asyncMiddleware = async (req, res, next) => {
        try {
          throw asyncError;
        } catch (error) {
          next(error);
        }
      };

      await asyncMiddleware(req, res, next);
      errorHandler(asyncError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '服务器内部错误'
        })
      );
    });

    it('应该处理未捕获的Promise拒绝', () => {
      const unhandledError = new Error('未处理的Promise拒绝');
      
      // 模拟未处理的Promise拒绝处理器
      const unhandledRejectionHandler = (error) => {
        errorHandler(error, req, res, next);
      };

      unhandledRejectionHandler(unhandledError);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('错误恢复', () => {
    it('应该提供错误恢复建议', () => {
      const error = new Error('数据库连接失败');
      error.code = 'ECONNREFUSED';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            recovery: expect.arrayContaining([
              '检查数据库连接',
              '稍后重试'
            ])
          })
        })
      );
    });

    it('应该提供重试机制信息', () => {
      const error = new Error('服务暂时不可用');
      error.statusCode = 503;
      error.retryAfter = 30;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            retryAfter: 30
          })
        })
      );
    });
  });

  describe('安全性', () => {
    it('应该防止敏感信息泄露', () => {
      const error = new Error('Database password: secret123');
      error.connectionString = 'mongodb://user:password@localhost:27017/db';

      errorHandler(error, req, res, next);

      const responseCall = res.json.mock.calls[0][0];
      expect(JSON.stringify(responseCall)).not.toContain('secret123');
      expect(JSON.stringify(responseCall)).not.toContain('password');
    });

    it('应该清理堆栈跟踪中的敏感路径', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('测试错误');
      error.stack = `Error: 测试错误
    at /home/user/.env:1:1
    at /app/config/secrets.js:10:5`;

      errorHandler(error, req, res, next);

      const responseCall = res.json.mock.calls[0][0];
      expect(responseCall.error.stack).not.toContain('/home/user/.env');
      expect(responseCall.error.stack).not.toContain('secrets.js');

      process.env.NODE_ENV = originalEnv;
    });
  });
});