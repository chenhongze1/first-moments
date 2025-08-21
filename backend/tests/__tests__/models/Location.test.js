const mongoose = require('mongoose');
const Location = require('../../../src/models/Location');
const User = require('../../../src/models/User');

describe('Location Model', () => {
  let user;

  beforeEach(async () => {
    // 创建测试用户
    user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
  });

  afterEach(async () => {
    await Location.deleteMany({});
    await User.deleteMany({});
  });

  describe('位置创建', () => {
    it('应该成功创建位置记录', async () => {
      const locationData = {
        userId: user._id,
        coordinates: [116.4074, 39.9042], // 北京坐标
        address: '北京市朝阳区',
        name: '北京CBD',
        type: 'checkin'
      };

      const location = new Location(locationData);
      const savedLocation = await location.save();

      expect(savedLocation._id).toBeDefined();
      expect(savedLocation.userId.toString()).toBe(user._id.toString());
      expect(savedLocation.coordinates).toEqual([116.4074, 39.9042]);
      expect(savedLocation.address).toBe('北京市朝阳区');
      expect(savedLocation.name).toBe('北京CBD');
      expect(savedLocation.type).toBe('checkin');
      expect(savedLocation.createdAt).toBeDefined();
      expect(savedLocation.updatedAt).toBeDefined();
    });

    it('应该设置默认值', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042]
      });
      const savedLocation = await location.save();

      expect(savedLocation.type).toBe('checkin');
      expect(savedLocation.isPublic).toBe(true);
      expect(savedLocation.visitCount).toBe(1);
    });

    it('应该支持不同的位置类型', async () => {
      const types = ['checkin', 'home', 'work', 'favorite', 'other'];
      
      for (const type of types) {
        const location = new Location({
          userId: user._id,
          coordinates: [116.4074, 39.9042],
          type: type
        });
        const savedLocation = await location.save();
        expect(savedLocation.type).toBe(type);
      }
    });
  });

  describe('数据验证', () => {
    it('应该要求必填字段', async () => {
      const location = new Location({});
      const error = location.validateSync();

      expect(error.errors.userId).toBeDefined();
      expect(error.errors.coordinates).toBeDefined();
    });

    it('应该验证userId格式', async () => {
      const location = new Location({
        userId: 'invalid-id',
        coordinates: [116.4074, 39.9042]
      });
      const error = location.validateSync();

      expect(error.errors.userId).toBeDefined();
    });

    it('应该验证坐标格式', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074] // 缺少纬度
      });
      const error = location.validateSync();

      expect(error.errors.coordinates).toBeDefined();
    });

    it('应该验证经度范围', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [181, 39.9042] // 经度超出范围
      });
      const error = location.validateSync();

      expect(error.errors['coordinates.0']).toBeDefined();
    });

    it('应该验证纬度范围', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 91] // 纬度超出范围
      });
      const error = location.validateSync();

      expect(error.errors['coordinates.1']).toBeDefined();
    });

    it('应该验证地址长度', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042],
        address: 'a'.repeat(501) // 超过500字符
      });
      const error = location.validateSync();

      expect(error.errors.address).toBeDefined();
    });

    it('应该验证名称长度', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042],
        name: 'a'.repeat(201) // 超过200字符
      });
      const error = location.validateSync();

      expect(error.errors.name).toBeDefined();
    });

    it('应该验证描述长度', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042],
        description: 'a'.repeat(1001) // 超过1000字符
      });
      const error = location.validateSync();

      expect(error.errors.description).toBeDefined();
    });

    it('应该验证类型枚举值', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042],
        type: 'invalid_type'
      });
      const error = location.validateSync();

      expect(error.errors.type).toBeDefined();
    });

    it('应该验证访问次数为非负数', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042],
        visitCount: -1
      });
      const error = location.validateSync();

      expect(error.errors.visitCount).toBeDefined();
    });
  });

  describe('地理位置功能', () => {
    beforeEach(async () => {
      // 创建测试位置数据
      await Location.create([
        {
          userId: user._id,
          coordinates: [116.4074, 39.9042], // 北京
          address: '北京市朝阳区',
          name: '北京CBD',
          type: 'work'
        },
        {
          userId: user._id,
          coordinates: [121.4737, 31.2304], // 上海
          address: '上海市黄浦区',
          name: '上海外滩',
          type: 'checkin'
        },
        {
          userId: user._id,
          coordinates: [116.4075, 39.9043], // 北京附近
          address: '北京市朝阳区建国门',
          name: '建国门',
          type: 'checkin'
        }
      ]);
    });

    it('应该能查找附近的位置', async () => {
      const nearbyLocations = await Location.find({
        coordinates: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [116.4074, 39.9042]
            },
            $maxDistance: 1000 // 1公里内
          }
        }
      });

      expect(nearbyLocations.length).toBeGreaterThan(0);
    });

    it('应该能按距离排序', async () => {
      const locations = await Location.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [116.4074, 39.9042]
            },
            distanceField: 'distance',
            spherical: true
          }
        },
        { $sort: { distance: 1 } }
      ]);

      expect(locations.length).toBeGreaterThan(0);
      expect(locations[0].distance).toBeLessThanOrEqual(locations[1].distance);
    });
  });

  describe('索引', () => {
    it('应该有userId索引', async () => {
      const indexes = await Location.collection.getIndexes();
      expect(indexes).toHaveProperty('userId_1');
    });

    it('应该有coordinates的2dsphere索引', async () => {
      const indexes = await Location.collection.getIndexes();
      const geoIndex = Object.keys(indexes).find(key => 
        key.includes('coordinates') && indexes[key].some(field => field[1] === '2dsphere')
      );
      expect(geoIndex).toBeDefined();
    });

    it('应该有type索引', async () => {
      const indexes = await Location.collection.getIndexes();
      expect(indexes).toHaveProperty('type_1');
    });

    it('应该有isPublic索引', async () => {
      const indexes = await Location.collection.getIndexes();
      expect(indexes).toHaveProperty('isPublic_1');
    });

    it('应该有createdAt索引', async () => {
      const indexes = await Location.collection.getIndexes();
      expect(indexes).toHaveProperty('createdAt_1');
    });
  });

  describe('中间件', () => {
    it('应该在保存时自动更新updatedAt字段', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042]
      });
      const savedLocation = await location.save();
      const originalUpdatedAt = savedLocation.updatedAt;

      // 等待一毫秒确保时间差异
      await new Promise(resolve => setTimeout(resolve, 1));
      
      savedLocation.visitCount += 1;
      const updatedLocation = await savedLocation.save();

      expect(updatedLocation.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('查询方法', () => {
    beforeEach(async () => {
      // 创建测试数据
      await Location.create([
        {
          userId: user._id,
          coordinates: [116.4074, 39.9042],
          address: '北京市朝阳区',
          name: '工作地点',
          type: 'work',
          isPublic: true,
          visitCount: 5
        },
        {
          userId: user._id,
          coordinates: [121.4737, 31.2304],
          address: '上海市黄浦区',
          name: '私人地点',
          type: 'home',
          isPublic: false,
          visitCount: 10
        },
        {
          userId: user._id,
          coordinates: [113.2644, 23.1291],
          address: '广州市天河区',
          name: '收藏地点',
          type: 'favorite',
          isPublic: true,
          visitCount: 3
        }
      ]);
    });

    it('应该能按用户查找位置', async () => {
      const locations = await Location.find({ userId: user._id });
      expect(locations).toHaveLength(3);
    });

    it('应该能按类型查找位置', async () => {
      const workLocations = await Location.find({ type: 'work' });
      const homeLocations = await Location.find({ type: 'home' });
      const favoriteLocations = await Location.find({ type: 'favorite' });
      
      expect(workLocations).toHaveLength(1);
      expect(homeLocations).toHaveLength(1);
      expect(favoriteLocations).toHaveLength(1);
    });

    it('应该能按公开状态查找位置', async () => {
      const publicLocations = await Location.find({ isPublic: true });
      const privateLocations = await Location.find({ isPublic: false });
      
      expect(publicLocations).toHaveLength(2);
      expect(privateLocations).toHaveLength(1);
    });

    it('应该能按访问次数排序', async () => {
      const locations = await Location.find({}).sort({ visitCount: -1 });
      
      expect(locations[0].visitCount).toBe(10);
      expect(locations[1].visitCount).toBe(5);
      expect(locations[2].visitCount).toBe(3);
    });

    it('应该能按地址搜索', async () => {
      const locations = await Location.find({ 
        address: { $regex: '北京', $options: 'i' } 
      });
      expect(locations).toHaveLength(1);
    });

    it('应该能按名称搜索', async () => {
      const locations = await Location.find({ 
        name: { $regex: '工作', $options: 'i' } 
      });
      expect(locations).toHaveLength(1);
    });
  });

  describe('虚拟字段', () => {
    it('应该计算经纬度', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042]
      });
      
      expect(location.longitude).toBe(116.4074);
      expect(location.latitude).toBe(39.9042);
    });

    it('应该格式化坐标显示', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042]
      });
      
      expect(location.coordinatesDisplay).toBe('116.4074, 39.9042');
    });
  });

  describe('JSON序列化', () => {
    it('应该包含虚拟字段', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042],
        address: '北京市朝阳区'
      });
      const savedLocation = await location.save();
      const json = savedLocation.toJSON();

      expect(json.id).toBeDefined();
      expect(json.longitude).toBeDefined();
      expect(json.latitude).toBeDefined();
      expect(json.coordinatesDisplay).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  describe('位置统计', () => {
    beforeEach(async () => {
      await Location.create([
        {
          userId: user._id,
          coordinates: [116.4074, 39.9042],
          type: 'work',
          visitCount: 5
        },
        {
          userId: user._id,
          coordinates: [121.4737, 31.2304],
          type: 'home',
          visitCount: 10
        },
        {
          userId: user._id,
          coordinates: [113.2644, 23.1291],
          type: 'checkin',
          visitCount: 3
        }
      ]);
    });

    it('应该能统计用户位置总数', async () => {
      const totalCount = await Location.countDocuments({ userId: user._id });
      expect(totalCount).toBe(3);
    });

    it('应该能按类型统计位置数量', async () => {
      const workCount = await Location.countDocuments({ userId: user._id, type: 'work' });
      const homeCount = await Location.countDocuments({ userId: user._id, type: 'home' });
      const checkinCount = await Location.countDocuments({ userId: user._id, type: 'checkin' });
      
      expect(workCount).toBe(1);
      expect(homeCount).toBe(1);
      expect(checkinCount).toBe(1);
    });

    it('应该能计算总访问次数', async () => {
      const result = await Location.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, totalVisits: { $sum: '$visitCount' } } }
      ]);
      
      expect(result[0].totalVisits).toBe(18);
    });

    it('应该能找到最常访问的位置', async () => {
      const mostVisited = await Location.findOne({ userId: user._id }).sort({ visitCount: -1 });
      expect(mostVisited.visitCount).toBe(10);
    });
  });

  describe('位置管理', () => {
    it('应该能增加访问次数', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042],
        visitCount: 1
      });
      await location.save();

      location.visitCount += 1;
      const updatedLocation = await location.save();

      expect(updatedLocation.visitCount).toBe(2);
    });

    it('应该能切换公开状态', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042],
        isPublic: true
      });
      await location.save();

      location.isPublic = false;
      const updatedLocation = await location.save();

      expect(updatedLocation.isPublic).toBe(false);
    });

    it('应该能更新位置信息', async () => {
      const location = new Location({
        userId: user._id,
        coordinates: [116.4074, 39.9042],
        name: '原始名称'
      });
      await location.save();

      location.name = '更新后的名称';
      location.description = '新增的描述';
      const updatedLocation = await location.save();

      expect(updatedLocation.name).toBe('更新后的名称');
      expect(updatedLocation.description).toBe('新增的描述');
    });
  });
});