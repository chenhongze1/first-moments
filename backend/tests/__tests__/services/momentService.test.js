const momentService = require('../../../src/services/momentService');
const Moment = require('../../../src/models/Moment');
const Profile = require('../../../src/models/Profile');
const User = require('../../../src/models/User');
const Location = require('../../../src/models/Location');
const path = require('path');
const fs = require('fs');

// Mock文件上传服务
jest.mock('../../../src/services/uploadService', () => ({
  uploadFile: jest.fn().mockResolvedValue({
    success: true,
    url: 'https://example.com/uploads/test-image.jpg',
    filename: 'test-image.jpg',
    size: 1024000,
    mimeType: 'image/jpeg'
  }),
  deleteFile: jest.fn().mockResolvedValue({ success: true })
}));

const uploadService = require('../../../src/services/uploadService');

describe('Moment Service', () => {
  let testUser;
  let testUser2;
  let testProfile;
  let testProfile2;
  let testMoment;
  let testLocation;

  beforeEach(async () => {
    // 创建测试用户
    testUser = await createTestUser();
    testUser2 = await createTestUser({
      username: 'testuser2',
      email: 'test2@example.com'
    });

    // 创建测试档案
    testProfile = await createTestProfile(testUser._id, {
      name: '我的档案',
      isPublic: true
    });
    
    testProfile2 = await createTestProfile(testUser2._id, {
      name: '私有档案',
      isPublic: false
    });

    // 创建测试地点
    testLocation = await createTestLocation(testUser._id, testProfile._id, {
      name: '测试地点',
      coordinates: [116.4074, 39.9042] // 北京坐标
    });

    // 创建测试记录
    testMoment = await createTestMoment(testUser._id, testProfile._id, {
      title: '测试记录',
      content: '这是一条测试记录',
      type: 'text',
      mood: 'happy',
      tags: ['测试', '记录'],
      location: {
        type: 'Point',
        coordinates: [116.4074, 39.9042]
      },
      locationId: testLocation._id
    });

    // 清除mock调用记录
    jest.clearAllMocks();
  });

  describe('创建记录', () => {
    it('应该成功创建文本记录', async () => {
      const momentData = {
        title: '新的记录',
        content: '这是一条新的文本记录',
        type: 'text',
        mood: 'excited',
        tags: ['新记录', '文本'],
        isPublic: true
      };

      const result = await momentService.createMoment(
        testUser._id,
        testProfile._id,
        momentData
      );

      expect(result.success).toBe(true);
      expect(result.moment).toBeDefined();
      expect(result.moment.title).toBe(momentData.title);
      expect(result.moment.content).toBe(momentData.content);
      expect(result.moment.type).toBe(momentData.type);
      expect(result.moment.mood).toBe(momentData.mood);
      expect(result.moment.tags).toEqual(momentData.tags);
      expect(result.moment.isPublic).toBe(momentData.isPublic);
      expect(result.moment.userId.toString()).toBe(testUser._id.toString());
      expect(result.moment.profileId.toString()).toBe(testProfile._id.toString());
    });

    it('应该成功创建带媒体的记录', async () => {
      const momentData = {
        title: '图片记录',
        content: '这是一条带图片的记录',
        type: 'image',
        mood: 'happy',
        tags: ['图片', '记录']
      };

      const mockFile = {
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
        buffer: Buffer.from('fake image data')
      };

      const result = await momentService.createMoment(
        testUser._id,
        testProfile._id,
        momentData,
        [mockFile]
      );

      expect(result.success).toBe(true);
      expect(result.moment.type).toBe('image');
      expect(result.moment.media).toBeDefined();
      expect(result.moment.media.length).toBe(1);
      expect(result.moment.media[0].url).toBe('https://example.com/uploads/test-image.jpg');
      expect(uploadService.uploadFile).toHaveBeenCalledWith(mockFile, 'moments');
    });

    it('应该成功创建带地理位置的记录', async () => {
      const momentData = {
        title: '位置记录',
        content: '这是一条带位置的记录',
        type: 'text',
        location: {
          type: 'Point',
          coordinates: [121.4737, 31.2304] // 上海坐标
        },
        locationName: '上海市中心',
        locationId: testLocation._id
      };

      const result = await momentService.createMoment(
        testUser._id,
        testProfile._id,
        momentData
      );

      expect(result.success).toBe(true);
      expect(result.moment.location).toBeDefined();
      expect(result.moment.location.type).toBe('Point');
      expect(result.moment.location.coordinates).toEqual([121.4737, 31.2304]);
      expect(result.moment.locationName).toBe('上海市中心');
      expect(result.moment.locationId.toString()).toBe(testLocation._id.toString());
    });

    it('应该成功创建带天气信息的记录', async () => {
      const momentData = {
        title: '天气记录',
        content: '今天天气很好',
        type: 'text',
        weather: {
          condition: 'sunny',
          temperature: 25,
          humidity: 60,
          description: '晴朗'
        }
      };

      const result = await momentService.createMoment(
        testUser._id,
        testProfile._id,
        momentData
      );

      expect(result.success).toBe(true);
      expect(result.moment.weather).toBeDefined();
      expect(result.moment.weather.condition).toBe('sunny');
      expect(result.moment.weather.temperature).toBe(25);
      expect(result.moment.weather.humidity).toBe(60);
    });

    it('应该拒绝无权限档案的记录创建', async () => {
      const result = await momentService.createMoment(
        testUser2._id,
        testProfile._id,
        {
          title: '无权限记录',
          content: '尝试在无权限档案中创建记录',
          type: 'text'
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限在此档案中创建记录');
    });

    it('应该拒绝无效的记录类型', async () => {
      const result = await momentService.createMoment(
        testUser._id,
        testProfile._id,
        {
          title: '无效类型记录',
          content: '无效类型的记录',
          type: 'invalid_type'
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('无效的记录类型');
    });

    it('应该拒绝过大的文件', async () => {
      const momentData = {
        title: '大文件记录',
        content: '尝试上传过大文件',
        type: 'image'
      };

      const largeMockFile = {
        originalname: 'large-image.jpg',
        mimetype: 'image/jpeg',
        size: 11 * 1024 * 1024, // 11MB，超过限制
        buffer: Buffer.alloc(11 * 1024 * 1024)
      };

      const result = await momentService.createMoment(
        testUser._id,
        testProfile._id,
        momentData,
        [largeMockFile]
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('文件大小超过限制');
    });

    it('应该拒绝不支持的文件类型', async () => {
      const momentData = {
        title: '不支持文件记录',
        content: '尝试上传不支持的文件类型',
        type: 'image'
      };

      const unsupportedFile = {
        originalname: 'test.exe',
        mimetype: 'application/x-msdownload',
        size: 1024,
        buffer: Buffer.from('fake exe data')
      };

      const result = await momentService.createMoment(
        testUser._id,
        testProfile._id,
        momentData,
        [unsupportedFile]
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('不支持的文件类型');
    });

    it('应该拒绝过长的内容', async () => {
      const result = await momentService.createMoment(
        testUser._id,
        testProfile._id,
        {
          title: '过长内容记录',
          content: 'a'.repeat(5001), // 超过5000字符限制
          type: 'text'
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('内容长度超过限制');
    });

    it('应该拒绝过多的标签', async () => {
      const result = await momentService.createMoment(
        testUser._id,
        testProfile._id,
        {
          title: '过多标签记录',
          content: '测试过多标签',
          type: 'text',
          tags: Array(21).fill('标签') // 超过20个标签
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('标签数量不能超过20个');
    });
  });

  describe('获取记录列表', () => {
    beforeEach(async () => {
      // 创建更多测试记录
      await createTestMoment(testUser._id, testProfile._id, {
        title: '旅行记录',
        content: '美好的旅行回忆',
        type: 'image',
        tags: ['旅行', '摄影'],
        mood: 'excited'
      });

      await createTestMoment(testUser._id, testProfile._id, {
        title: '美食记录',
        content: '今天吃了很棒的美食',
        type: 'text',
        tags: ['美食', '生活'],
        mood: 'happy'
      });

      await createTestMoment(testUser2._id, testProfile2._id, {
        title: '私有记录',
        content: '这是私有档案的记录',
        type: 'text',
        isPublic: false
      });
    });

    it('应该获取档案的所有记录', async () => {
      const result = await momentService.getMoments(testUser._id, {
        profileId: testProfile._id
      });

      expect(result.success).toBe(true);
      expect(result.moments).toBeDefined();
      expect(result.moments.length).toBeGreaterThanOrEqual(3);
      result.moments.forEach(moment => {
        expect(moment.profileId.toString()).toBe(testProfile._id.toString());
      });
    });

    it('应该按类型筛选记录', async () => {
      const result = await momentService.getMoments(testUser._id, {
        profileId: testProfile._id,
        type: 'text'
      });

      expect(result.success).toBe(true);
      result.moments.forEach(moment => {
        expect(moment.type).toBe('text');
      });
    });

    it('应该按标签筛选记录', async () => {
      const result = await momentService.getMoments(testUser._id, {
        profileId: testProfile._id,
        tags: ['旅行']
      });

      expect(result.success).toBe(true);
      result.moments.forEach(moment => {
        expect(moment.tags).toContain('旅行');
      });
    });

    it('应该按心情筛选记录', async () => {
      const result = await momentService.getMoments(testUser._id, {
        profileId: testProfile._id,
        mood: 'happy'
      });

      expect(result.success).toBe(true);
      result.moments.forEach(moment => {
        expect(moment.mood).toBe('happy');
      });
    });

    it('应该按日期范围筛选记录', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // 7天前
      const endDate = new Date(); // 今天

      const result = await momentService.getMoments(testUser._id, {
        profileId: testProfile._id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      expect(result.success).toBe(true);
      result.moments.forEach(moment => {
        const momentDate = new Date(moment.createdAt);
        expect(momentDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(momentDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('应该支持分页', async () => {
      const result = await momentService.getMoments(testUser._id, {
        profileId: testProfile._id,
        page: 1,
        limit: 2
      });

      expect(result.success).toBe(true);
      expect(result.moments.length).toBeLessThanOrEqual(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBeGreaterThan(0);
    });

    it('应该按创建时间排序', async () => {
      const result = await momentService.getMoments(testUser._id, {
        profileId: testProfile._id,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      expect(result.success).toBe(true);
      if (result.moments.length > 1) {
        for (let i = 1; i < result.moments.length; i++) {
          expect(new Date(result.moments[i-1].createdAt).getTime())
            .toBeGreaterThanOrEqual(new Date(result.moments[i].createdAt).getTime());
        }
      }
    });

    it('应该只返回公开记录给非所有者', async () => {
      // 创建一条私有记录
      await createTestMoment(testUser._id, testProfile._id, {
        title: '私有记录',
        content: '这是私有记录',
        type: 'text',
        isPublic: false
      });

      const result = await momentService.getMoments(testUser2._id, {
        profileId: testProfile._id
      });

      expect(result.success).toBe(true);
      result.moments.forEach(moment => {
        expect(moment.isPublic).toBe(true);
      });
    });

    it('应该拒绝访问私有档案的记录', async () => {
      const result = await momentService.getMoments(testUser._id, {
        profileId: testProfile2._id
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限访问此档案的记录');
    });
  });

  describe('获取记录详情', () => {
    it('应该获取自己的记录详情', async () => {
      const result = await momentService.getMomentById(testUser._id, testMoment._id);

      expect(result.success).toBe(true);
      expect(result.moment).toBeDefined();
      expect(result.moment._id.toString()).toBe(testMoment._id.toString());
      expect(result.moment.title).toBe(testMoment.title);
      expect(result.moment.content).toBe(testMoment.content);
    });

    it('应该获取公开记录详情', async () => {
      testMoment.isPublic = true;
      await testMoment.save();

      const result = await momentService.getMomentById(testUser2._id, testMoment._id);

      expect(result.success).toBe(true);
      expect(result.moment._id.toString()).toBe(testMoment._id.toString());
    });

    it('应该拒绝访问私有记录', async () => {
      testMoment.isPublic = false;
      await testMoment.save();

      const result = await momentService.getMomentById(testUser2._id, testMoment._id);

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限访问此记录');
    });

    it('应该拒绝访问不存在的记录', async () => {
      const fakeMomentId = '507f1f77bcf86cd799439011';
      const result = await momentService.getMomentById(testUser._id, fakeMomentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('记录不存在');
    });

    it('应该增加记录浏览次数', async () => {
      const originalViews = testMoment.stats.views;
      
      await momentService.getMomentById(testUser2._id, testMoment._id);
      
      const updatedMoment = await Moment.findById(testMoment._id);
      expect(updatedMoment.stats.views).toBe(originalViews + 1);
    });
  });

  describe('更新记录', () => {
    it('应该成功更新记录信息', async () => {
      const updateData = {
        title: '更新后的标题',
        content: '更新后的内容',
        mood: 'calm',
        tags: ['更新', '测试'],
        isPublic: false
      };

      const result = await momentService.updateMoment(
        testUser._id,
        testMoment._id,
        updateData
      );

      expect(result.success).toBe(true);
      expect(result.moment.title).toBe(updateData.title);
      expect(result.moment.content).toBe(updateData.content);
      expect(result.moment.mood).toBe(updateData.mood);
      expect(result.moment.tags).toEqual(updateData.tags);
      expect(result.moment.isPublic).toBe(updateData.isPublic);
    });

    it('应该拒绝无权限的更新', async () => {
      const result = await momentService.updateMoment(
        testUser2._id,
        testMoment._id,
        { title: '无权限更新' }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限修改此记录');
    });

    it('应该拒绝更新不存在的记录', async () => {
      const fakeMomentId = '507f1f77bcf86cd799439011';
      const result = await momentService.updateMoment(
        testUser._id,
        fakeMomentId,
        { title: '不存在的记录' }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('记录不存在');
    });

    it('应该验证更新数据的有效性', async () => {
      const invalidData = {
        type: 'invalid_type',
        mood: 'invalid_mood',
        content: 'a'.repeat(5001) // 过长内容
      };

      const result = await momentService.updateMoment(
        testUser._id,
        testMoment._id,
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/无效|超过限制/);
    });

    it('应该更新媒体文件', async () => {
      const mockFile = {
        originalname: 'new-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
        buffer: Buffer.from('new image data')
      };

      const result = await momentService.updateMoment(
        testUser._id,
        testMoment._id,
        { title: '更新媒体' },
        [mockFile]
      );

      expect(result.success).toBe(true);
      expect(uploadService.uploadFile).toHaveBeenCalledWith(mockFile, 'moments');
    });
  });

  describe('删除记录', () => {
    it('应该成功删除记录', async () => {
      const result = await momentService.deleteMoment(testUser._id, testMoment._id);

      expect(result.success).toBe(true);
      expect(result.message).toContain('记录删除成功');

      // 验证记录已被删除
      const deletedMoment = await Moment.findById(testMoment._id);
      expect(deletedMoment).toBeNull();
    });

    it('应该拒绝删除他人的记录', async () => {
      const result = await momentService.deleteMoment(testUser2._id, testMoment._id);

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限删除此记录');
    });

    it('应该拒绝删除不存在的记录', async () => {
      const fakeMomentId = '507f1f77bcf86cd799439011';
      const result = await momentService.deleteMoment(testUser._id, fakeMomentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('记录不存在');
    });

    it('应该删除相关的媒体文件', async () => {
      // 创建带媒体的记录
      const momentWithMedia = await createTestMoment(testUser._id, testProfile._id, {
        title: '带媒体的记录',
        type: 'image',
        media: [{
          url: 'https://example.com/uploads/test.jpg',
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024000
        }]
      });

      const result = await momentService.deleteMoment(testUser._id, momentWithMedia._id);

      expect(result.success).toBe(true);
      expect(uploadService.deleteFile).toHaveBeenCalledWith('test.jpg');
    });
  });

  describe('记录统计', () => {
    beforeEach(async () => {
      // 创建更多测试记录
      await createTestMoment(testUser._id, testProfile._id, {
        title: '统计记录1',
        type: 'text'
      });
      await createTestMoment(testUser._id, testProfile._id, {
        title: '统计记录2',
        type: 'image'
      });
    });

    it('应该获取档案记录统计', async () => {
      const result = await momentService.getProfileMomentStats(
        testUser._id,
        testProfile._id
      );

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalMoments).toBeGreaterThanOrEqual(3);
      expect(result.stats.byType).toBeDefined();
      expect(result.stats.byMood).toBeDefined();
      expect(result.stats.totalViews).toBeDefined();
      expect(result.stats.totalLikes).toBeDefined();
      expect(result.stats.totalComments).toBeDefined();
    });

    it('应该拒绝无权限访问统计', async () => {
      const result = await momentService.getProfileMomentStats(
        testUser2._id,
        testProfile._id
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限访问此档案的记录统计');
    });

    it('应该获取用户记录统计', async () => {
      const result = await momentService.getUserMomentStats(testUser._id);

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalMoments).toBeGreaterThan(0);
      expect(result.stats.totalProfiles).toBeGreaterThan(0);
      expect(result.stats.recentActivity).toBeDefined();
    });
  });

  describe('记录搜索', () => {
    beforeEach(async () => {
      // 创建更多测试记录用于搜索
      await createTestMoment(testUser._id, testProfile._id, {
        title: '北京旅行',
        content: '在北京的美好时光',
        type: 'text',
        tags: ['北京', '旅行', '城市'],
        isPublic: true
      });

      await createTestMoment(testUser._id, testProfile._id, {
        title: '美食探索',
        content: '发现了一家很棒的餐厅',
        type: 'image',
        tags: ['美食', '餐厅', '探索'],
        isPublic: true
      });
    });

    it('应该按关键词搜索记录', async () => {
      const result = await momentService.searchMoments(testUser._id, {
        keyword: '北京'
      });

      expect(result.success).toBe(true);
      expect(result.moments.length).toBeGreaterThan(0);
      result.moments.forEach(moment => {
        expect(
          moment.title.includes('北京') ||
          moment.content.includes('北京') ||
          moment.tags.includes('北京')
        ).toBe(true);
      });
    });

    it('应该按标签搜索记录', async () => {
      const result = await momentService.searchMoments(testUser._id, {
        tags: ['旅行']
      });

      expect(result.success).toBe(true);
      result.moments.forEach(moment => {
        expect(moment.tags).toContain('旅行');
      });
    });

    it('应该组合搜索条件', async () => {
      const result = await momentService.searchMoments(testUser._id, {
        keyword: '美食',
        type: 'image',
        tags: ['餐厅']
      });

      expect(result.success).toBe(true);
      result.moments.forEach(moment => {
        expect(moment.type).toBe('image');
        expect(moment.tags).toContain('餐厅');
        expect(
          moment.title.includes('美食') ||
          moment.content.includes('美食') ||
          moment.tags.includes('美食')
        ).toBe(true);
      });
    });

    it('应该返回空结果当无匹配时', async () => {
      const result = await momentService.searchMoments(testUser._id, {
        keyword: '不存在的关键词'
      });

      expect(result.success).toBe(true);
      expect(result.moments).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('应该支持地理位置搜索', async () => {
      const result = await momentService.searchMoments(testUser._id, {
        location: {
          coordinates: [116.4074, 39.9042], // 北京坐标
          radius: 1000 // 1公里范围
        }
      });

      expect(result.success).toBe(true);
      result.moments.forEach(moment => {
        if (moment.location) {
          // 验证记录在指定范围内
          expect(moment.location.coordinates).toBeDefined();
        }
      });
    });
  });

  describe('记录互动', () => {
    it('应该成功点赞记录', async () => {
      const result = await momentService.likeMoment(testUser2._id, testMoment._id);

      expect(result.success).toBe(true);
      expect(result.message).toContain('点赞成功');

      // 验证点赞数增加
      const updatedMoment = await Moment.findById(testMoment._id);
      expect(updatedMoment.stats.likes).toBe(testMoment.stats.likes + 1);
    });

    it('应该成功取消点赞', async () => {
      // 先点赞
      await momentService.likeMoment(testUser2._id, testMoment._id);
      
      // 再取消点赞
      const result = await momentService.unlikeMoment(testUser2._id, testMoment._id);

      expect(result.success).toBe(true);
      expect(result.message).toContain('取消点赞成功');

      // 验证点赞数恢复
      const updatedMoment = await Moment.findById(testMoment._id);
      expect(updatedMoment.stats.likes).toBe(testMoment.stats.likes);
    });

    it('应该拒绝重复点赞', async () => {
      // 先点赞
      await momentService.likeMoment(testUser2._id, testMoment._id);
      
      // 再次点赞
      const result = await momentService.likeMoment(testUser2._id, testMoment._id);

      expect(result.success).toBe(false);
      expect(result.message).toContain('已经点赞过此记录');
    });

    it('应该拒绝对不存在记录的点赞', async () => {
      const fakeMomentId = '507f1f77bcf86cd799439011';
      const result = await momentService.likeMoment(testUser2._id, fakeMomentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('记录不存在');
    });
  });

  describe('工具方法', () => {
    describe('validateMomentData', () => {
      it('应该验证有效的记录数据', () => {
        const validData = {
          title: '有效记录',
          content: '有效的记录内容',
          type: 'text',
          mood: 'happy',
          tags: ['标签1', '标签2'],
          isPublic: true
        };

        const result = momentService.validateMomentData(validData);
        expect(result.isValid).toBe(true);
      });

      it('应该拒绝无效的记录数据', () => {
        const invalidData = {
          title: '', // 空标题
          content: 'a'.repeat(5001), // 过长内容
          type: 'invalid_type',
          mood: 'invalid_mood',
          tags: Array(25).fill('标签') // 过多标签
        };

        const result = momentService.validateMomentData(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateFileUpload', () => {
      it('应该验证有效的文件', () => {
        const validFile = {
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024000 // 1MB
        };

        const result = momentService.validateFileUpload(validFile);
        expect(result.isValid).toBe(true);
      });

      it('应该拒绝无效的文件', () => {
        const invalidFile = {
          originalname: 'test.exe',
          mimetype: 'application/x-msdownload',
          size: 11 * 1024 * 1024 // 11MB，超过限制
        };

        const result = momentService.validateFileUpload(invalidFile);
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    describe('formatMomentResponse', () => {
      it('应该正确格式化记录响应', () => {
        const formatted = momentService.formatMomentResponse(testMoment, testUser._id);

        expect(formatted).toBeDefined();
        expect(formatted.id).toBe(testMoment._id.toString());
        expect(formatted.title).toBe(testMoment.title);
        expect(formatted.isOwner).toBe(true);
        expect(formatted.permissions).toBeDefined();
      });
    });

    describe('calculateMomentScore', () => {
      it('应该计算记录评分', () => {
        const score = momentService.calculateMomentScore(testMoment);

        expect(score).toBeDefined();
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThanOrEqual(0);
      });
    });
  });
});