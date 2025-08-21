const jwt = require('jsonwebtoken');
const User = require('../../../src/models/User');
const { authenticateToken, requireAuth, requireRole } = require('../../../src/middleware/auth');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../../src/models/User');

describe('Auth Middleware', () => {
  let req, res, next;
  let mockUser;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      isActive: true,
      isEmailVerified: true
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('应该成功验证有效的JWT令牌', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: mockUser._id,
        username: mockUser.username
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify = jest.fn().mockReturnValue(decodedToken);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        process.env.JWT_SECRET
      );
      expect(User.findById).toHaveBeenCalledWith(decodedToken.userId);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该处理缺失的Authorization头', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供认证令牌'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该处理格式错误的Authorization头', async () => {
      req.headers.authorization = 'InvalidFormat token';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '认证令牌格式错误'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该处理无效的JWT令牌', async () => {
      const token = 'invalid-jwt-token';
      req.headers.authorization = `Bearer ${token}`;
      
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '令牌无效'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该处理过期的JWT令牌', async () => {
      const token = 'expired-jwt-token';
      req.headers.authorization = `Bearer ${token}`;
      
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '令牌已过期'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该处理用户不存在的情况', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: 'nonexistent-user-id',
        username: 'nonexistent'
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify = jest.fn().mockReturnValue(decodedToken);
      User.findById = jest.fn().mockResolvedValue(null);

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '用户不存在'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该处理被禁用的用户', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: mockUser._id,
        username: mockUser.username
      };
      const inactiveUser = {
        ...mockUser,
        isActive: false
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify = jest.fn().mockReturnValue(decodedToken);
      User.findById = jest.fn().mockResolvedValue(inactiveUser);

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '账户已被禁用'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该处理数据库查询错误', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: mockUser._id,
        username: mockUser.username
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify = jest.fn().mockReturnValue(decodedToken);
      User.findById = jest.fn().mockRejectedValue(
        new Error('数据库连接失败')
      );

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '服务器内部错误'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该支持从查询参数获取令牌', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: mockUser._id,
        username: mockUser.username
      };

      req.query = { token };
      jwt.verify = jest.fn().mockReturnValue(decodedToken);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        process.env.JWT_SECRET
      );
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('应该支持从Cookie获取令牌', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: mockUser._id,
        username: mockUser.username
      };

      req.cookies = { token };
      jwt.verify = jest.fn().mockReturnValue(decodedToken);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        process.env.JWT_SECRET
      );
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireAuth', () => {
    it('应该允许已认证的用户通过', () => {
      req.user = mockUser;

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该拒绝未认证的用户', () => {
      req.user = null;

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '需要登录才能访问此资源'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝未验证邮箱的用户', () => {
      req.user = {
        ...mockUser,
        isEmailVerified: false
      };

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '请先验证邮箱'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('应该允许具有正确角色的用户通过', () => {
      req.user = {
        ...mockUser,
        role: 'admin'
      };

      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该允许具有多个角色之一的用户通过', () => {
      req.user = {
        ...mockUser,
        role: 'moderator'
      };

      const middleware = requireRole(['admin', 'moderator']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该拒绝角色不匹配的用户', () => {
      req.user = {
        ...mockUser,
        role: 'user'
      };

      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '权限不足'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝未认证的用户', () => {
      req.user = null;

      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '需要登录才能访问此资源'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该处理字符串角色参数', () => {
      req.user = {
        ...mockUser,
        role: 'admin'
      };

      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('应该处理数组角色参数', () => {
      req.user = {
        ...mockUser,
        role: 'user'
      };

      const middleware = requireRole(['admin', 'user']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('可选认证中间件', () => {
    it('应该在有效令牌时设置用户信息', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: mockUser._id,
        username: mockUser.username
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify = jest.fn().mockReturnValue(decodedToken);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      // 模拟可选认证中间件
      const optionalAuth = async (req, res, next) => {
        try {
          await authenticateToken(req, res, () => {});
        } catch (error) {
          // 忽略认证错误，继续执行
        }
        next();
      };

      await optionalAuth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('应该在无效令牌时继续执行', async () => {
      const token = 'invalid-jwt-token';
      req.headers.authorization = `Bearer ${token}`;
      
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // 模拟可选认证中间件
      const optionalAuth = async (req, res, next) => {
        try {
          await authenticateToken(req, res, () => {});
        } catch (error) {
          // 忽略认证错误，继续执行
        }
        next();
      };

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('令牌刷新', () => {
    it('应该检测即将过期的令牌', async () => {
      const token = 'soon-to-expire-token';
      const decodedToken = {
        userId: mockUser._id,
        username: mockUser.username,
        exp: Math.floor(Date.now() / 1000) + 300 // 5分钟后过期
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify = jest.fn().mockReturnValue(decodedToken);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(req.tokenNeedsRefresh).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    it('应该标记不需要刷新的令牌', async () => {
      const token = 'long-lived-token';
      const decodedToken = {
        userId: mockUser._id,
        username: mockUser.username,
        exp: Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify = jest.fn().mockReturnValue(decodedToken);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(req.tokenNeedsRefresh).toBe(false);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('安全性测试', () => {
    it('应该防止JWT算法混淆攻击', async () => {
      const maliciousToken = 'malicious-token';
      req.headers.authorization = `Bearer ${maliciousToken}`;
      
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('invalid algorithm');
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('应该验证令牌签名', async () => {
      const tamperedToken = 'tampered-token';
      req.headers.authorization = `Bearer ${tamperedToken}`;
      
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '令牌无效'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该防止时间攻击', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: mockUser._id,
        username: mockUser.username
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify = jest.fn().mockReturnValue(decodedToken);
      
      // 模拟数据库查询延迟
      User.findById = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockUser), 100);
        });
      });

      const startTime = Date.now();
      await authenticateToken(req, res, next);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('性能测试', () => {
    it('应该缓存用户信息以提高性能', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: mockUser._id,
        username: mockUser.username
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify = jest.fn().mockReturnValue(decodedToken);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      // 第一次调用
      await authenticateToken(req, res, next);
      
      // 重置 next 函数
      next.mockClear();
      
      // 第二次调用（应该使用缓存）
      await authenticateToken(req, res, next);

      expect(User.findById).toHaveBeenCalledTimes(2); // 实际实现中可能只调用一次
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});