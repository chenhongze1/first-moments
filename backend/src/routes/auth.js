const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth, rateLimitLogin, validateRefreshToken } = require('../middleware/auth');

const router = express.Router();

// 用户注册
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个大写字母、一个小写字母和一个数字'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('确认密码不匹配');
      }
      return true;
    })
], authController.register);

// 用户登录
router.post('/login', [
  rateLimitLogin,
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
], authController.login);

// 刷新token
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('刷新token不能为空'),
  validateRefreshToken
], authController.refreshToken);

// 用户登出
router.post('/logout', auth, authController.logout);

// 忘记密码
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
], authController.forgotPassword);

// 重置密码
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('重置token不能为空'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个大写字母、一个小写字母和一个数字')
], authController.resetPassword);

// 验证邮箱
router.get('/verify-email/:token', authController.verifyEmail);

// 重新发送验证邮件
router.post('/resend-verification', [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
], authController.resendVerification);

// 获取当前用户信息
router.get('/me', auth, authController.getMe);

module.exports = router;