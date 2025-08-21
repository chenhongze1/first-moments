const express = require('express');
const momentController = require('../controllers/momentController');
const { auth } = require('../middleware/auth');
const {
  getMomentsValidation,
  createMomentValidation,
  updateMomentValidation,
  addCommentValidation
} = require('../validators/momentValidator');

const router = express.Router();

// 获取时光记录列表
router.get('/', auth, getMomentsValidation, momentController.getMoments);

// 创建新记录
router.post('/', 
  auth, 
  momentController.upload.array('media', 10), 
  createMomentValidation, 
  momentController.createMoment
);

// 获取指定记录
router.get('/:id', auth, momentController.getMoment);

// 更新记录
router.put('/:id', auth, updateMomentValidation, momentController.updateMoment);

// 删除记录
router.delete('/:id', auth, momentController.deleteMoment);

// 点赞/取消点赞
router.post('/:id/like', auth, momentController.toggleLike);

// 添加评论
router.post('/:id/comments', auth, addCommentValidation, momentController.addComment);

// 删除评论
router.delete('/:id/comments/:commentId', auth, momentController.deleteComment);

// 上传媒体文件
router.post('/upload', 
  auth, 
  momentController.upload.array('media', 10), 
  momentController.uploadMedia
);

module.exports = router;