const { Location, FavoritePlace } = require('../models/Location');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const axios = require('axios');

// 获取用户位置记录
const getLocations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      placeType,
      visitType,
      startDate,
      endDate,
      isFavorite,
      privacy,
      tags,
      search,
      sortBy = 'visitedAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query = {
      user: userId,
      isDeleted: false
    };

    // 添加筛选条件
    if (placeType) query.placeType = placeType;
    if (visitType) query.visitType = visitType;
    if (isFavorite !== undefined) query.isFavorite = isFavorite === 'true';
    if (privacy) query.privacy = privacy;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // 日期范围筛选
    if (startDate || endDate) {
      query.visitedAt = {};
      if (startDate) query.visitedAt.$gte = new Date(startDate);
      if (endDate) query.visitedAt.$lte = new Date(endDate);
    }

    // 搜索条件
    if (search) {
      query.$or = [
        { placeName: { $regex: search, $options: 'i' } },
        { 'address.formatted': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // 分页和排序
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [locations, total] = await Promise.all([
      Location.find(query)
        .populate('relatedMoments', 'title mediaFiles createdAt')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Location.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        locations,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('获取位置记录错误:', error);
    next(error);
  }
};

// 创建位置记录（打卡）
const createLocation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      coordinates,
      address,
      placeName,
      placeType = 'other',
      visitType = 'checkin',
      duration,
      accuracy,
      altitude,
      speed,
      heading,
      weather,
      tags = [],
      notes,
      privacy = 'private',
      deviceInfo
    } = req.body;

    // 验证必需字段
    if (!coordinates || !coordinates.coordinates || coordinates.coordinates.length !== 2) {
      return next(new AppError('坐标信息不完整', 400));
    }

    if (!address || !address.formatted) {
      return next(new AppError('地址信息不完整', 400));
    }

    // 检查是否在相同位置重复打卡（1小时内，100米范围内）
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const nearbyRecent = await Location.findOne({
      user: userId,
      visitedAt: { $gte: oneHourAgo },
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates.coordinates
          },
          $maxDistance: 100 // 100米
        }
      },
      isDeleted: false
    });

    if (nearbyRecent) {
      // 更新访问次数和最后访问时间
      nearbyRecent.visitCount += 1;
      nearbyRecent.lastVisitAt = new Date();
      if (duration) nearbyRecent.duration = duration;
      if (weather) nearbyRecent.weather = weather;
      if (notes) nearbyRecent.notes = notes;
      
      await nearbyRecent.save();
      
      return res.status(200).json({
        success: true,
        message: '更新了现有位置记录',
        data: nearbyRecent
      });
    }

    // 创建新的位置记录
    const locationData = {
      user: userId,
      coordinates,
      address,
      placeName,
      placeType,
      visitType,
      duration,
      accuracy,
      altitude,
      speed,
      heading,
      weather,
      tags,
      notes,
      privacy,
      deviceInfo
    };

    const location = new Location(locationData);
    await location.save();

    // 检查是否需要添加到收藏地点
    if (placeName && placeType !== 'other') {
      const existingFavorite = await FavoritePlace.findOne({
        user: userId,
        coordinates: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates.coordinates
            },
            $maxDistance: 50 // 50米范围内认为是同一地点
          }
        }
      });

      if (existingFavorite) {
        existingFavorite.visitCount += 1;
        existingFavorite.lastVisitAt = new Date();
        await existingFavorite.save();
      } else {
        const favoritePlace = new FavoritePlace({
          user: userId,
          name: placeName,
          coordinates,
          address: {
            formatted: address.formatted,
            country: address.country,
            state: address.state,
            city: address.city,
            district: address.district,
            street: address.street
          },
          type: placeType,
          visitCount: 1,
          lastVisitAt: new Date()
        });
        await favoritePlace.save();
      }
    }

    logger.info(`用户 ${userId} 创建位置记录: ${placeName || '未命名地点'}`);

    res.status(201).json({
      success: true,
      message: '位置记录创建成功',
      data: location
    });
  } catch (error) {
    logger.error('创建位置记录错误:', error);
    next(error);
  }
};

// 获取附近的位置
const getNearbyLocations = async (req, res, next) => {
  try {
    const {
      longitude,
      latitude,
      maxDistance = 1000,
      limit = 20,
      includeOthers = false
    } = req.query;

    if (!longitude || !latitude) {
      return next(new AppError('经纬度参数不能为空', 400));
    }

    const userId = req.user.id;
    const query = {
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      isDeleted: false
    };

    // 是否包含其他用户的公开位置
    if (includeOthers === 'true') {
      query.$or = [
        { user: userId },
        { privacy: 'public' }
      ];
    } else {
      query.user = userId;
    }

    const locations = await Location.find(query)
      .populate('user', 'username avatar')
      .populate('relatedMoments', 'title mediaFiles')
      .limit(parseInt(limit))
      .lean();

    // 计算距离
    const locationsWithDistance = locations.map(location => {
      const distance = calculateDistance(
        latitude,
        longitude,
        location.coordinates.coordinates[1],
        location.coordinates.coordinates[0]
      );
      return {
        ...location,
        distance: Math.round(distance)
      };
    });

    res.status(200).json({
      success: true,
      data: {
        locations: locationsWithDistance,
        center: {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude)
        },
        searchRadius: parseInt(maxDistance)
      }
    });
  } catch (error) {
    logger.error('获取附近位置错误:', error);
    next(error);
  }
};

// 搜索位置
const searchLocations = async (req, res, next) => {
  try {
    const {
      query: searchQuery,
      longitude,
      latitude,
      radius = 5000,
      limit = 20
    } = req.query;

    if (!searchQuery) {
      return next(new AppError('搜索关键词不能为空', 400));
    }

    const userId = req.user.id;
    const searchConditions = {
      user: userId,
      isDeleted: false,
      $or: [
        { placeName: { $regex: searchQuery, $options: 'i' } },
        { 'address.formatted': { $regex: searchQuery, $options: 'i' } },
        { 'address.city': { $regex: searchQuery, $options: 'i' } },
        { 'address.district': { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } },
        { notes: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    // 如果提供了坐标，添加地理位置筛选
    if (longitude && latitude) {
      searchConditions.coordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }

    const locations = await Location.find(searchConditions)
      .populate('relatedMoments', 'title mediaFiles')
      .limit(parseInt(limit))
      .sort({ visitedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        locations,
        query: searchQuery,
        total: locations.length
      }
    });
  } catch (error) {
    logger.error('搜索位置错误:', error);
    next(error);
  }
};

// 获取位置详情
const getLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const location = await Location.findOne({
      _id: id,
      $or: [
        { user: userId },
        { privacy: 'public' },
        { privacy: 'friends' } // 这里可以后续添加好友关系检查
      ],
      isDeleted: false
    })
      .populate('user', 'username avatar')
      .populate('relatedMoments')
      .lean();

    if (!location) {
      return next(new AppError('位置记录不存在或无权访问', 404));
    }

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    logger.error('获取位置详情错误:', error);
    next(error);
  }
};

// 更新位置记录
const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // 查找位置记录
    const location = await Location.findOne({
      _id: id,
      user: userId,
      isDeleted: false
    });

    if (!location) {
      return next(new AppError('位置记录不存在或无权修改', 404));
    }

    // 更新允许的字段
    const allowedFields = [
      'placeName', 'placeType', 'visitType', 'duration',
      'weather', 'tags', 'notes', 'privacy', 'isFavorite'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        location[field] = updateData[field];
      }
    });

    await location.save();

    logger.info(`用户 ${userId} 更新位置记录: ${id}`);

    res.status(200).json({
      success: true,
      message: '位置记录更新成功',
      data: location
    });
  } catch (error) {
    logger.error('更新位置记录错误:', error);
    next(error);
  }
};

// 删除位置记录
const deleteLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { permanent = false } = req.query;

    const location = await Location.findOne({
      _id: id,
      user: userId
    });

    if (!location) {
      return next(new AppError('位置记录不存在或无权删除', 404));
    }

    if (permanent === 'true') {
      // 永久删除
      await Location.findByIdAndDelete(id);
      logger.info(`用户 ${userId} 永久删除位置记录: ${id}`);
    } else {
      // 软删除
      location.isDeleted = true;
      location.deletedAt = new Date();
      await location.save();
      logger.info(`用户 ${userId} 软删除位置记录: ${id}`);
    }

    res.status(200).json({
      success: true,
      message: '位置记录删除成功'
    });
  } catch (error) {
    logger.error('删除位置记录错误:', error);
    next(error);
  }
};

// 获取收藏地点
const getFavoritePlaces = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      type,
      sortBy = 'visitCount',
      sortOrder = 'desc'
    } = req.query;

    const query = { user: userId };
    if (type) query.type = type;

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [places, total] = await Promise.all([
      FavoritePlace.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      FavoritePlace.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        places,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('获取收藏地点错误:', error);
    next(error);
  }
};

// 获取位置统计
const getLocationStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30d' } = req.query;

    let startDate;
    switch (timeRange) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const stats = await Location.getUserLocationStats(userId, startDate);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取位置统计错误:', error);
    next(error);
  }
};

// 地理编码（地址转坐标）
const geocodeAddress = async (req, res, next) => {
  try {
    const { address } = req.query;

    if (!address) {
      return next(new AppError('地址参数不能为空', 400));
    }

    // 这里可以集成第三方地图服务API，如高德地图、百度地图等
    // 示例使用模拟数据
    const mockResult = {
      formatted: address,
      coordinates: [116.397428, 39.90923], // 北京天安门坐标
      country: '中国',
      state: '北京市',
      city: '北京市',
      district: '东城区'
    };

    res.status(200).json({
      success: true,
      data: mockResult
    });
  } catch (error) {
    logger.error('地理编码错误:', error);
    next(error);
  }
};

// 逆地理编码（坐标转地址）
const reverseGeocode = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.query;

    if (!longitude || !latitude) {
      return next(new AppError('经纬度参数不能为空', 400));
    }

    // 这里可以集成第三方地图服务API
    // 示例使用模拟数据
    const mockResult = {
      formatted: '北京市东城区东长安街1号',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
      country: '中国',
      state: '北京市',
      city: '北京市',
      district: '东城区',
      street: '东长安街'
    };

    res.status(200).json({
      success: true,
      data: mockResult
    });
  } catch (error) {
    logger.error('逆地理编码错误:', error);
    next(error);
  }
};

// 计算两点间距离的辅助函数
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 地球半径（米）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

module.exports = {
  getLocations,
  createLocation,
  getNearbyLocations,
  searchLocations,
  getLocation,
  updateLocation,
  deleteLocation,
  getFavoritePlaces,
  getLocationStats,
  geocodeAddress,
  reverseGeocode
};