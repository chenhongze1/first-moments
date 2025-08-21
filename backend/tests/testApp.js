const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// 不要在测试环境中连接真实数据库
// const { connectDB } = require('../src/config/database');
const logger = require('../src/utils/logger');
const { errorHandler } = require('../src/middleware/errorHandler');

// 创建Express应用
const app = express();

// 在测试环境中不连接数据库
// connectDB();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 压缩响应
app.use(compression());

// 请求日志（仅在非测试环境）
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// 解析JSON和URL编码的请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制（在测试环境中放宽限制）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: process.env.NODE_ENV === 'test' ? 1000 : 100, // 测试环境允许更多请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由
app.use('/api/auth', require('../src/routes/auth'));
app.use('/api/users', require('../src/routes/users'));
app.use('/api/profiles', require('../src/routes/profiles'));
app.use('/api/moments', require('../src/routes/moments'));
app.use('/api/achievements', require('../src/routes/achievements'));
app.use('/api/locations', require('../src/routes/locations'));
app.use('/api/notifications', require('../src/routes/notifications'));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use(errorHandler);

// 不要在测试环境中启动服务器
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   logger.info(`服务器运行在端口 ${PORT}`);
// });

module.exports = app;