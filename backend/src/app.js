const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { swaggerUi, specs, swaggerUiOptions } = require('./config/swagger');

// 创建Express应用
const app = express();

// 连接数据库
connectDB();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 压缩响应
app.use(compression());

// 请求日志
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API文档路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// API路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/moments', require('./routes/moments'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/notifications', require('./routes/notifications'));

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`服务器运行在端口 ${PORT}`);
});

module.exports = app;