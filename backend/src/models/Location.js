const mongoose = require('mongoose');

// 位置记录模式
const locationSchema = new mongoose.Schema({
  // 用户ID
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  
  // 地理坐标
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, '坐标不能为空'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: '坐标格式不正确'
      }
    }
  },
  
  // 地址信息
  address: {
    // 格式化地址
    formatted: {
      type: String,
      required: [true, '格式化地址不能为空']
    },
    // 国家
    country: String,
    // 省/州
    state: String,
    // 城市
    city: String,
    // 区/县
    district: String,
    // 街道
    street: String,
    // 邮政编码
    postalCode: String
  },
  
  // 地点名称（POI）
  placeName: {
    type: String,
    trim: true,
    maxlength: [100, '地点名称不能超过100个字符']
  },
  
  // 地点类型
  placeType: {
    type: String,
    enum: [
      'home', 'work', 'school', 'restaurant', 'cafe', 'shop', 'hospital',
      'park', 'gym', 'cinema', 'hotel', 'airport', 'station', 'beach',
      'mountain', 'museum', 'library', 'church', 'other'
    ],
    default: 'other'
  },
  
  // 访问类型
  visitType: {
    type: String,
    enum: ['checkin', 'visit', 'live', 'work', 'travel'],
    default: 'checkin'
  },
  
  // 访问时间
  visitedAt: {
    type: Date,
    default: Date.now
  },
  
  // 停留时长（分钟）
  duration: {
    type: Number,
    min: [0, '停留时长不能为负数'],
    default: null
  },
  
  // 准确度（米）
  accuracy: {
    type: Number,
    min: [0, '准确度不能为负数'],
    default: null
  },
  
  // 海拔（米）
  altitude: {
    type: Number,
    default: null
  },
  
  // 速度（米/秒）
  speed: {
    type: Number,
    min: [0, '速度不能为负数'],
    default: null
  },
  
  // 方向（度）
  heading: {
    type: Number,
    min: [0, '方向不能小于0度'],
    max: [360, '方向不能大于360度'],
    default: null
  },
  
  // 天气信息
  weather: {
    condition: {
      type: String,
      enum: ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'foggy', 'stormy']
    },
    temperature: Number,
    humidity: Number,
    description: String
  },
  
  // 相关记录
  relatedMoments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Moment'
  }],
  
  // 标签
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签不能超过20个字符']
  }],
  
  // 备注
  notes: {
    type: String,
    trim: true,
    maxlength: [500, '备注不能超过500个字符']
  },
  
  // 隐私设置
  privacy: {
    type: String,
    enum: ['public', 'private', 'friends'],
    default: 'private'
  },
  
  // 是否为收藏地点
  isFavorite: {
    type: Boolean,
    default: false
  },
  
  // 访问次数
  visitCount: {
    type: Number,
    default: 1,
    min: [1, '访问次数不能少于1']
  },
  
  // 最后访问时间
  lastVisitAt: {
    type: Date,
    default: Date.now
  },
  
  // 设备信息
  deviceInfo: {
    platform: String,
    model: String,
    osVersion: String,
    appVersion: String
  },
  
  // 是否已删除（软删除）
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // 删除时间
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 地点收藏模式
const favoritePlaceSchema = new mongoose.Schema({
  // 用户ID
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  
  // 地点名称
  name: {
    type: String,
    required: [true, '地点名称不能为空'],
    trim: true,
    maxlength: [100, '地点名称不能超过100个字符']
  },
  
  // 地理坐标
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, '坐标不能为空']
    }
  },
  
  // 地址信息
  address: {
    formatted: String,
    country: String,
    state: String,
    city: String,
    district: String,
    street: String
  },
  
  // 地点类型
  type: {
    type: String,
    enum: [
      'home', 'work', 'school', 'restaurant', 'cafe', 'shop', 'hospital',
      'park', 'gym', 'cinema', 'hotel', 'airport', 'station', 'beach',
      'mountain', 'museum', 'library', 'church', 'other'
    ],
    default: 'other'
  },
  
  // 描述
  description: {
    type: String,
    trim: true,
    maxlength: [200, '描述不能超过200个字符']
  },
  
  // 标签
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签不能超过20个字符']
  }],
  
  // 访问次数
  visitCount: {
    type: Number,
    default: 0
  },
  
  // 最后访问时间
  lastVisitAt: {
    type: Date,
    default: null
  },
  
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
locationSchema.index({ coordinates: '2dsphere' });
locationSchema.index({ user: 1, visitedAt: -1 });
locationSchema.index({ user: 1, placeType: 1 });
locationSchema.index({ user: 1, isFavorite: 1 });
locationSchema.index({ visitType: 1 });
locationSchema.index({ privacy: 1 });
locationSchema.index({ isDeleted: 1 });
locationSchema.index({ tags: 1 });

favoritePlaceSchema.index({ coordinates: '2dsphere' });
favoritePlaceSchema.index({ user: 1 });
favoritePlaceSchema.index({ user: 1, type: 1 });
favoritePlaceSchema.index({ user: 1, visitCount: -1 });

// 虚拟字段：经度
locationSchema.virtual('longitude').get(function() {
  return this.coordinates.coordinates[0];
});

// 虚拟字段：纬度
locationSchema.virtual('latitude').get(function() {
  return this.coordinates.coordinates[1];
});

// 中间件：查询时排除已删除的记录
locationSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// 实例方法：计算与另一个位置的距离
locationSchema.methods.distanceTo = function(otherLocation) {
  const R = 6371; // 地球半径（公里）
  const lat1 = this.coordinates.coordinates[1] * Math.PI / 180;
  const lat2 = otherLocation.coordinates.coordinates[1] * Math.PI / 180;
  const deltaLat = (otherLocation.coordinates.coordinates[1] - this.coordinates.coordinates[1]) * Math.PI / 180;
  const deltaLng = (otherLocation.coordinates.coordinates[0] - this.coordinates.coordinates[0]) * Math.PI / 180;
  
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // 距离（公里）
};

// 实例方法：软删除
locationSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// 静态方法：查找附近的位置
locationSchema.statics.findNearby = function(longitude, latitude, maxDistance = 1000, userId = null) {
  const query = {
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  };
  
  if (userId) {
    query.user = userId;
  }
  
  return this.find(query);
};

// 静态方法：获取用户的热门地点
locationSchema.statics.getPopularPlaces = function(userId, limit = 10) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: {
          placeName: '$placeName',
          coordinates: '$coordinates'
        },
        visitCount: { $sum: 1 },
        lastVisit: { $max: '$visitedAt' },
        placeType: { $first: '$placeType' },
        address: { $first: '$address' }
      }
    },
    { $sort: { visitCount: -1, lastVisit: -1 } },
    { $limit: limit }
  ]);
};

// 静态方法：获取用户的位置统计
locationSchema.statics.getUserLocationStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalLocations: { $sum: 1 },
        uniquePlaces: { $addToSet: '$placeName' },
        placeTypes: { $addToSet: '$placeType' },
        cities: { $addToSet: '$address.city' },
        countries: { $addToSet: '$address.country' }
      }
    },
    {
      $project: {
        totalLocations: 1,
        uniquePlacesCount: { $size: '$uniquePlaces' },
        placeTypesCount: { $size: '$placeTypes' },
        citiesCount: { $size: '$cities' },
        countriesCount: { $size: '$countries' }
      }
    }
  ]);
};

// 创建模型
const Location = mongoose.models.Location || mongoose.model('Location', locationSchema);
const FavoritePlace = mongoose.models.FavoritePlace || mongoose.model('FavoritePlace', favoritePlaceSchema);

module.exports = {
  Location,
  FavoritePlace
};