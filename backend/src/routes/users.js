const express = require('express');
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 获取当前用户信息
router.get('/me', auth, userController.getMe);

// 更新用户信息
router.put('/me', auth, userController.updateMe);

// 删除用户账户
router.delete('/me', auth, userController.deleteMe);

// 获取用户列表（管理员）
router.get('/', auth, userController.getUsers);

// 获取指定用户信息
router.get('/:id', auth, userController.getUser);

module.exports = router;