module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/logs/'
  ],
  
  // 覆盖率收集
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/**',
    '!src/middleware/errorHandler.js',
    '!**/node_modules/**'
  ],
  
  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // 覆盖率输出目录
  coverageDirectory: 'coverage',
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 测试设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // 测试超时时间（毫秒）
  testTimeout: 10000,
  
  // 详细输出
  verbose: true,
  
  // 清除模拟
  clearMocks: true,
  
  // 强制退出
  forceExit: true,
  
  // 检测打开的句柄
  detectOpenHandles: true,
  
  // 全局变量
  globals: {
    'process.env.NODE_ENV': 'test'
  }
};