const logger = require('../utils/logger');

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 处理MongoDB重复键错误
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `${field}已存在，请使用其他值`;
  return new AppError(message, 400);
};

// 处理MongoDB验证错误
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `数据验证失败: ${errors.join(', ')}`;
  return new AppError(message, 400);
};

// 处理JWT错误
const handleJWTError = () => {
  return new AppError('无效的token，请重新登录', 401);
};

// 处理JWT过期错误
const handleJWTExpiredError = () => {
  return new AppError('token已过期，请重新登录', 401);
};

// 发送错误响应
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // 操作性错误，发送给客户端
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    // 编程错误，不泄露错误详情
    logger.error('ERROR:', err);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // MongoDB重复键错误
    if (err.code === 11000) error = handleDuplicateKeyError(error);
    
    // MongoDB验证错误
    if (err.name === 'ValidationError') error = handleValidationError(error);
    
    // JWT错误
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    
    // JWT过期错误
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = {
  AppError,
  errorHandler
};