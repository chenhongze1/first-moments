const mongoose = require('mongoose');
const Moment = require('../../../src/models/Moment');
const User = require('../../../src/models/User');
const Profile = require('../../../src/models/Profile');

describe('Moment Model', () => {
  let testUser;
  let testProfile;
  let testMoment;

  beforeEach(async () => {
    testUser = await createTestUser();
    testProfile = await createTestProfile(testUser._id);
    
    testMoment = {
      title: '测试记录',
      content: '这是一个测试记录的内容',
      type: 'text',
      profileId: testProfile._id,
      userId: testUser._id,
      tags: ['测试', '记录'],
      location: {
        name: '北京市朝阳区',
        coordinates: [116.4074, 39.9042],
        address: '北京市朝阳区某街道'
      },
      media: [
        {
          type: 'image',
          url: 'https://example.com/image1.jpg',
          filename: 'image1.jpg',
          size: 1024000,
          mimeType: 'image/jpeg'
        }
      ],
      mood: 'happy',
      weather: {
        condition: 'sunny',
        temperature: 25,
        humidity: 60
      },
      isPublic: false,
      metadata: {
        device: 'iPhone 15',
        app_version: '1.0.0',
        source: 'mobile'
      }
    };
  });

  describe('记录创建', () => {
    it('应该成功创建记录', async () => {
      const moment = new Moment(testMoment);
      const savedMoment = await moment.save();

      expect(savedMoment._id).toBeDefined();
      expect(savedMoment.title).toBe(testMoment.title);
      expect(savedMoment.content).toBe(testMoment.content);
      expect(savedMoment.type).toBe(testMoment.type);
      expect(savedMoment.profileId.toString()).toBe(testProfile._id.toString());
      expect(savedMoment.userId.toString()).toBe(testUser._id.toString());
      expect(savedMoment.isPublic).toBe(false);
      expect(savedMoment.isActive).toBe(true); // 默认激活
      expect(savedMoment.createdAt).toBeDefined();
      expect(savedMoment.updatedAt).toBeDefined();
    });

    it('应该正确设置默认值', async () => {
      const minimalMoment = new Moment({
        content: '最小记录',
        profileId: testProfile._id,
        userId: testUser._id
      });
      const savedMoment = await minimalMoment.save();

      expect(savedMoment.type).toBe('text'); // 默认类型
      expect(savedMoment.isPublic).toBe(false); // 默认私有
      expect(savedMoment.isActive).toBe(true); // 默认激活
      expect(savedMoment.tags).toEqual([]); // 默认空数组
      expect(savedMoment.media).toEqual([]); // 默认空数组
      expect(savedMoment.stats.viewsCount).toBe(0); // 默认统计
      expect(savedMoment.stats.likesCount).toBe(0);
      expect(savedMoment.stats.commentsCount).toBe(0);
    });

    it('应该拒绝无效的记录类型', async () => {
      const moment = new Moment({
        ...testMoment,
        type: 'invalid-type'
      });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该拒绝无效的心情值', async () => {
      const moment = new Moment({
        ...testMoment,
        mood: 'invalid-mood'
      });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该拒绝无效的媒体类型', async () => {
      const moment = new Moment({
        ...testMoment,
        media: [{
          type: 'invalid-media-type',
          url: 'https://example.com/file.txt'
        }]
      });

      await expect(moment.save()).rejects.toThrow();
    });
  });

  describe('数据验证', () => {
    it('应该验证必填字段', async () => {
      const moment = new Moment({});
      
      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证内容长度', async () => {
      const longContent = 'a'.repeat(10001); // 超过10000字符
      const moment = new Moment({ ...testMoment, content: longContent });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证标题长度', async () => {
      const longTitle = 'a'.repeat(201); // 超过200字符
      const moment = new Moment({ ...testMoment, title: longTitle });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证标签数量', async () => {
      const tooManyTags = Array(21).fill('tag'); // 超过20个
      const moment = new Moment({ ...testMoment, tags: tooManyTags });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证标签长度', async () => {
      const longTag = 'a'.repeat(31); // 超过30字符
      const moment = new Moment({ ...testMoment, tags: [longTag] });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证媒体数量', async () => {
      const tooManyMedia = Array(11).fill({
        type: 'image',
        url: 'https://example.com/image.jpg'
      }); // 超过10个
      const moment = new Moment({ ...testMoment, media: tooManyMedia });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证profileId是有效的ObjectId', async () => {
      const moment = new Moment({
        ...testMoment,
        profileId: 'invalid-id'
      });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证userId是有效的ObjectId', async () => {
      const moment = new Moment({
        ...testMoment,
        userId: 'invalid-id'
      });

      await expect(moment.save()).rejects.toThrow();
    });
  });

  describe('地理位置验证', () => {
    it('应该验证坐标格式', async () => {
      const moment = new Moment({
        ...testMoment,
        location: {
          name: '测试地点',
          coordinates: [200, 100] // 无效坐标
        }
      });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证经度范围', async () => {
      const moment = new Moment({
        ...testMoment,
        location: {
          name: '测试地点',
          coordinates: [181, 39] // 经度超出范围
        }
      });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证纬度范围', async () => {
      const moment = new Moment({
        ...testMoment,
        location: {
          name: '测试地点',
          coordinates: [116, 91] // 纬度超出范围
        }
      });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该接受有效的坐标', async () => {
      const moment = new Moment({
        ...testMoment,
        location: {
          name: '测试地点',
          coordinates: [116.4074, 39.9042] // 有效坐标
        }
      });

      const savedMoment = await moment.save();
      expect(savedMoment.location.coordinates).toEqual([116.4074, 39.9042]);
    });
  });

  describe('媒体文件验证', () => {
    it('应该验证媒体URL格式', async () => {
      const moment = new Moment({
        ...testMoment,
        media: [{
          type: 'image',
          url: 'invalid-url' // 无效URL
        }]
      });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证文件大小', async () => {
      const moment = new Moment({
        ...testMoment,
        media: [{
          type: 'image',
          url: 'https://example.com/image.jpg',
          size: -1 // 负数大小
        }]
      });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证MIME类型格式', async () => {
      const moment = new Moment({
        ...testMoment,
        media: [{
          type: 'image',
          url: 'https://example.com/image.jpg',
          mimeType: 'invalid-mime' // 无效MIME类型
        }]
      });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该接受有效的媒体文件', async () => {
      const moment = new Moment({
        ...testMoment,
        media: [
          {
            type: 'image',
            url: 'https://example.com/image.jpg',
            filename: 'image.jpg',
            size: 1024000,
            mimeType: 'image/jpeg'
          },
          {
            type: 'video',
            url: 'https://example.com/video.mp4',
            filename: 'video.mp4',
            size: 5120000,
            mimeType: 'video/mp4',
            duration: 120
          }
        ]
      });

      const savedMoment = await moment.save();
      expect(savedMoment.media).toHaveLength(2);
      expect(savedMoment.media[0].type).toBe('image');
      expect(savedMoment.media[1].type).toBe('video');
      expect(savedMoment.media[1].duration).toBe(120);
    });
  });

  describe('天气信息验证', () => {
    it('应该验证天气条件', async () => {
      const moment = new Moment({
        ...testMoment,
        weather: {
          condition: 'invalid-condition' // 无效天气条件
        }
      });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证温度范围', async () => {
      const moment = new Moment({
        ...testMoment,
        weather: {
          condition: 'sunny',
          temperature: -100 // 无效温度
        }
      });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该验证湿度范围', async () => {
      const moment = new Moment({
        ...testMoment,
        weather: {
          condition: 'sunny',
          humidity: 150 // 湿度超出范围
        }
      });

      await expect(moment.save()).rejects.toThrow();
    });

    it('应该接受有效的天气信息', async () => {
      const moment = new Moment({
        ...testMoment,
        weather: {
          condition: 'rainy',
          temperature: 18,
          humidity: 80,
          windSpeed: 15,
          pressure: 1013
        }
      });

      const savedMoment = await moment.save();
      expect(savedMoment.weather.condition).toBe('rainy');
      expect(savedMoment.weather.temperature).toBe(18);
      expect(savedMoment.weather.humidity).toBe(80);
      expect(savedMoment.weather.windSpeed).toBe(15);
      expect(savedMoment.weather.pressure).toBe(1013);
    });
  });

  describe('统计信息', () => {
    let savedMoment;

    beforeEach(async () => {
      const moment = new Moment(testMoment);
      savedMoment = await moment.save();
    });

    it('应该能更新统计信息', async () => {
      savedMoment.stats.viewsCount = 100;
      savedMoment.stats.likesCount = 25;
      savedMoment.stats.commentsCount = 10;
      savedMoment.stats.sharesCount = 5;
      await savedMoment.save();

      expect(savedMoment.stats.viewsCount).toBe(100);
      expect(savedMoment.stats.likesCount).toBe(25);
      expect(savedMoment.stats.commentsCount).toBe(10);
      expect(savedMoment.stats.sharesCount).toBe(5);
    });

    it('应该拒绝负数统计', async () => {
      savedMoment.stats.viewsCount = -1;

      await expect(savedMoment.save()).rejects.toThrow();
    });
  });

  describe('索引', () => {
    it('应该在profileId上有索引', async () => {
      const indexes = await Moment.collection.getIndexes();
      const profileIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'profileId')
      );
      expect(profileIndex).toBeDefined();
    });

    it('应该在userId上有索引', async () => {
      const indexes = await Moment.collection.getIndexes();
      const userIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'userId')
      );
      expect(userIndex).toBeDefined();
    });

    it('应该在type上有索引', async () => {
      const indexes = await Moment.collection.getIndexes();
      const typeIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'type')
      );
      expect(typeIndex).toBeDefined();
    });

    it('应该在tags上有索引', async () => {
      const indexes = await Moment.collection.getIndexes();
      const tagsIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'tags')
      );
      expect(tagsIndex).toBeDefined();
    });

    it('应该在createdAt上有索引', async () => {
      const indexes = await Moment.collection.getIndexes();
      const createdAtIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'createdAt')
      );
      expect(createdAtIndex).toBeDefined();
    });

    it('应该在地理位置上有2dsphere索引', async () => {
      const indexes = await Moment.collection.getIndexes();
      const geoIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'location.coordinates')
      );
      expect(geoIndex).toBeDefined();
    });
  });

  describe('中间件', () => {
    it('应该自动更新updatedAt字段', async () => {
      const moment = new Moment(testMoment);
      await moment.save();
      
      const originalUpdatedAt = moment.updatedAt;
      
      // 等待一毫秒确保时间不同
      await new Promise(resolve => setTimeout(resolve, 1));
      
      moment.content = '更新的内容';
      await moment.save();
      
      expect(moment.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('查询方法', () => {
    let moments;
    let anotherUser;
    let anotherProfile;

    beforeEach(async () => {
      anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      anotherProfile = await createTestProfile(anotherUser._id);
      anotherProfile.name = '另一个档案';
      await anotherProfile.save();

      moments = [
        new Moment({ ...testMoment, title: 'moment1', type: 'text', isPublic: true }),
        new Moment({ ...testMoment, title: 'moment2', type: 'image', isPublic: false }),
        new Moment({ ...testMoment, title: 'moment3', type: 'video', isPublic: true, profileId: anotherProfile._id, userId: anotherUser._id }),
        new Moment({ ...testMoment, title: 'moment4', type: 'text', isActive: false })
      ];
      
      for (const moment of moments) {
        await moment.save();
      }
    });

    it('应该能按档案查找记录', async () => {
      const profileMoments = await Moment.find({ profileId: testProfile._id });
      expect(profileMoments.length).toBe(3);
    });

    it('应该能按用户查找记录', async () => {
      const userMoments = await Moment.find({ userId: testUser._id });
      expect(userMoments.length).toBe(3);
    });

    it('应该能按类型查找记录', async () => {
      const textMoments = await Moment.find({ type: 'text' });
      expect(textMoments.length).toBe(2);
    });

    it('应该能查找公开记录', async () => {
      const publicMoments = await Moment.find({ isPublic: true });
      expect(publicMoments.length).toBe(2);
    });

    it('应该能查找活跃记录', async () => {
      const activeMoments = await Moment.find({ isActive: true });
      expect(activeMoments.length).toBe(3);
    });

    it('应该能按标签查找记录', async () => {
      const taggedMoments = await Moment.find({ tags: { $in: ['测试'] } });
      expect(taggedMoments.length).toBe(4);
    });

    it('应该能按日期范围查找记录', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      const recentMoments = await Moment.find({
        createdAt: { $gte: yesterday }
      });
      expect(recentMoments.length).toBe(4);
    });
  });

  describe('虚拟字段', () => {
    let savedMoment;

    beforeEach(async () => {
      const moment = new Moment(testMoment);
      savedMoment = await moment.save();
    });

    it('应该正确计算媒体数量', async () => {
      expect(savedMoment.mediaCount).toBe(1);
      
      savedMoment.media.push({
        type: 'video',
        url: 'https://example.com/video.mp4'
      });
      await savedMoment.save();
      
      expect(savedMoment.mediaCount).toBe(2);
    });

    it('应该正确计算总互动数', async () => {
      savedMoment.stats.likesCount = 10;
      savedMoment.stats.commentsCount = 5;
      savedMoment.stats.sharesCount = 2;
      await savedMoment.save();
      
      expect(savedMoment.totalInteractions).toBe(17);
    });
  });

  describe('JSON序列化', () => {
    let savedMoment;

    beforeEach(async () => {
      const moment = new Moment(testMoment);
      savedMoment = await moment.save();
    });

    it('应该在JSON中包含虚拟字段', () => {
      const momentJSON = savedMoment.toJSON();
      expect(momentJSON.mediaCount).toBeDefined();
      expect(momentJSON.totalInteractions).toBeDefined();
    });

    it('应该在JSON中隐藏版本字段', () => {
      const momentJSON = savedMoment.toJSON();
      expect(momentJSON.__v).toBeUndefined();
    });
  });

  describe('记录状态管理', () => {
    let savedMoment;

    beforeEach(async () => {
      const moment = new Moment(testMoment);
      savedMoment = await moment.save();
    });

    it('应该能激活记录', async () => {
      savedMoment.isActive = false;
      await savedMoment.save();
      
      savedMoment.isActive = true;
      await savedMoment.save();
      
      expect(savedMoment.isActive).toBe(true);
    });

    it('应该能停用记录', async () => {
      savedMoment.isActive = false;
      await savedMoment.save();
      
      expect(savedMoment.isActive).toBe(false);
    });

    it('应该能切换公开状态', async () => {
      savedMoment.isPublic = true;
      await savedMoment.save();
      
      expect(savedMoment.isPublic).toBe(true);
      
      savedMoment.isPublic = false;
      await savedMoment.save();
      
      expect(savedMoment.isPublic).toBe(false);
    });
  });

  describe('地理位置查询', () => {
    let savedMoment;

    beforeEach(async () => {
      const moment = new Moment({
        ...testMoment,
        location: {
          name: '天安门广场',
          coordinates: [116.3974, 39.9093],
          address: '北京市东城区天安门广场'
        }
      });
      savedMoment = await moment.save();
    });

    it('应该能按地理位置查找附近记录', async () => {
      const nearbyMoments = await Moment.find({
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [116.4074, 39.9042] // 附近坐标
            },
            $maxDistance: 5000 // 5公里内
          }
        }
      });
      
      expect(nearbyMoments.length).toBeGreaterThan(0);
      expect(nearbyMoments[0]._id.toString()).toBe(savedMoment._id.toString());
    });
  });

  describe('文本搜索', () => {
    let moments;

    beforeEach(async () => {
      moments = [
        new Moment({ ...testMoment, title: '北京旅行', content: '今天去了故宫，很美丽' }),
        new Moment({ ...testMoment, title: '上海美食', content: '品尝了正宗的小笼包' }),
        new Moment({ ...testMoment, title: '工作日记', content: '完成了重要的项目' })
      ];
      
      for (const moment of moments) {
        await moment.save();
      }
    });

    it('应该能按标题搜索记录', async () => {
      const results = await Moment.find({
        title: { $regex: '北京', $options: 'i' }
      });
      
      expect(results.length).toBe(1);
      expect(results[0].title).toContain('北京');
    });

    it('应该能按内容搜索记录', async () => {
      const results = await Moment.find({
        content: { $regex: '故宫', $options: 'i' }
      });
      
      expect(results.length).toBe(1);
      expect(results[0].content).toContain('故宫');
    });

    it('应该能组合搜索标题和内容', async () => {
      const results = await Moment.find({
        $or: [
          { title: { $regex: '美食', $options: 'i' } },
          { content: { $regex: '美食', $options: 'i' } }
        ]
      });
      
      expect(results.length).toBe(1);
      expect(results[0].title).toContain('美食');
    });
  });
});