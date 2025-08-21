const express = require('express');
const locationController = require('../controllers/locationController');
const { auth } = require('../middleware/auth');
const {
  getLocationsValidation,
  createLocationValidation,
  getNearbyLocationsValidation,
  searchLocationsValidation,
  updateLocationValidation,
  geocodeValidation
} = require('../validators/locationValidator');

const router = express.Router();

// 获取用户位置记录
router.get('/', auth, getLocationsValidation, locationController.getLocations);

// 创建位置记录（打卡）
router.post('/', auth, createLocationValidation, locationController.createLocation);

// 获取附近的位置
router.get('/nearby', auth, getNearbyLocationsValidation, locationController.getNearbyLocations);

// 搜索位置
router.get('/search', auth, searchLocationsValidation, locationController.searchLocations);

// 获取位置详情
router.get('/:id', auth, locationController.getLocation);

// 更新位置记录
router.put('/:id', auth, updateLocationValidation, locationController.updateLocation);

// 删除位置记录
router.delete('/:id', auth, locationController.deleteLocation);

// 获取收藏地点
router.get('/favorites/places', auth, locationController.getFavoritePlaces);

// 获取位置统计
router.get('/stats/summary', auth, locationController.getLocationStats);

// 地理编码（地址转坐标）
router.get('/geocode/address', auth, geocodeValidation, locationController.geocodeAddress);

// 逆地理编码（坐标转地址）
router.get('/geocode/reverse', auth, geocodeValidation, locationController.reverseGeocode);

module.exports = router;