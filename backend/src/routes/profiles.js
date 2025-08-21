const express = require('express');
const profileController = require('../controllers/profileController');
const { auth, checkOwnership } = require('../middleware/auth');
const {
  createProfileValidation,
  updateProfileValidation,
  getProfileValidation,
  deleteProfileValidation,
  getProfilesValidation
} = require('../validators/profileValidator');

const router = express.Router();

// 获取用户档案列表
router.get('/', auth, getProfilesValidation, profileController.getProfiles);

// 创建新档案
router.post('/', auth, createProfileValidation, profileController.createProfile);

// 获取指定档案
router.get('/:id', auth, getProfileValidation, profileController.getProfile);

// 更新档案
router.put('/:id', auth, updateProfileValidation, profileController.updateProfile);

// 删除档案
router.delete('/:id', auth, deleteProfileValidation, profileController.deleteProfile);

module.exports = router;