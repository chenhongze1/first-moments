const request = require('supertest');
const app = require('../../testApp');
const Moment = require('../../../src/models/Moment');
const path = require('path');
const fs = require('fs');

describe('Moment Controller', () => {
  let testUser;
  let authToken;
  let testProfile;
  let testMoment;

  beforeEach(async () => {
    testUser = await createTestUser();
    authToken = generateAuthToken(testUser._id);
    testProfile = await createTestProfile(testUser._id);
    
    // 创建测试记录
    testMoment = new Moment({
      userId: testUser._id,
      profileId: testProfile._id,
      title: '测试记录',
      content: '这是一个测试记录',
      type: 'text',
      isPublic: false,
      tags: ['测试', '记录'],
      location: {
        type: 'Point',
        coordinates: [116.4074, 39.9042],
        address: '北京市朝阳区'
      }
    });
    await testMoment.save();
  });

  describe('GET /api/moments', () => {
    it('应该获取用户的记录列表', async () => {
      const response = await request(app)
        .get('/api/moments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moments).toHaveLength(1);
      expect(response.body.data.moments[0].title).toBe('测试记录');
      expect(response.body.data.total).toBe(1);
    });

    it('应该支持按档案筛选记录', async () => {
      const response = await request(app)
        .get(`/api/moments?profileId=${testProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moments).toHaveLength(1);
      expect(response.body.data.moments[0].profileId).toBe(testProfile._id.toString());
    });

    it('应该支持按类型筛选记录', async () => {
      // 创建不同类型的记录
      const photoMoment = new Moment({
        userId: testUser._id,
        profileId: testProfile._id,
        title: '照片记录',
        content: '照片描述',
        type: 'photo',
        media: [{
          type: 'image',
          url: '/uploads/test.jpg',
          filename: 'test.jpg'
        }]
      });
      await photoMoment.save();

      const response = await request(app)
        .get('/api/moments?type=photo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moments).toHaveLength(1);
      expect(response.body.data.moments[0].type).toBe('photo');
    });

    it('应该支持按标签筛选记录', async () => {
      const response = await request(app)
        .get('/api/moments?tags=测试')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moments).toHaveLength(1);
      expect(response.body.data.moments[0].tags).toContain('测试');
    });

    it('应该支持按日期范围筛选记录', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const response = await request(app)
        .get(`/api/moments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moments).toHaveLength(1);
    });

    it('应该支持分页查询', async () => {
      // 创建更多记录
      for (let i = 0; i < 5; i++) {
        const moment = new Moment({
          userId: testUser._id,
          profileId: testProfile._id,
          title: `记录${i}`,
          content: `内容${i}`,
          type: 'text'
        });
        await moment.save();
      }

      const response = await request(app)
        .get('/api/moments?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moments).toHaveLength(3);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(3);
    });

    it('应该拒绝未认证的请求', async () => {
      const response = await request(app)
        .get('/api/moments')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供认证令牌');
    });
  });

  describe('GET /api/moments/:id', () => {
    it('应该获取指定记录详情', async () => {
      const response = await request(app)
        .get(`/api/moments/${testMoment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('测试记录');
      expect(response.body.data.content).toBe('这是一个测试记录');
      expect(response.body.data.location.address).toBe('北京市朝阳区');
    });

    it('应该拒绝访问不存在的记录', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/moments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('记录不存在');
    });

    it('应该拒绝访问无权限的记录', async () => {
      // 创建另一个用户的记录
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);
      const anotherMoment = new Moment({
        userId: anotherUser._id,
        profileId: anotherProfile._id,
        title: '他人记录',
        content: '他人内容',
        type: 'text',
        isPublic: false
      });
      await anotherMoment.save();

      const response = await request(app)
        .get(`/api/moments/${anotherMoment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限访问此记录');
    });

    it('应该允许访问公开记录', async () => {
      // 创建公开记录
      const publicMoment = new Moment({
        userId: testUser._id,
        profileId: testProfile._id,
        title: '公开记录',
        content: '公开内容',
        type: 'text',
        isPublic: true
      });
      await publicMoment.save();

      // 创建另一个用户
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      const anotherToken = generateAuthToken(anotherUser._id);

      const response = await request(app)
        .get(`/api/moments/${publicMoment._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('公开记录');
    });
  });

  describe('POST /api/moments', () => {
    it('应该成功创建文本记录', async () => {
      const momentData = {
        profileId: testProfile._id.toString(),
        title: '新记录',
        content: '新记录内容',
        type: 'text',
        isPublic: false,
        tags: ['新', '记录'],
        location: {
          coordinates: [116.4074, 39.9042],
          address: '北京市朝阳区'
        }
      };

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(momentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(momentData.title);
      expect(response.body.data.content).toBe(momentData.content);
      expect(response.body.data.userId).toBe(testUser._id.toString());
      expect(response.body.data.profileId).toBe(testProfile._id.toString());
      expect(response.body.data.tags).toEqual(['新', '记录']);

      // 验证记录已保存到数据库
      const savedMoment = await Moment.findById(response.body.data._id);
      expect(savedMoment).toBeTruthy();
      expect(savedMoment.title).toBe(momentData.title);
    });

    it('应该拒绝无效的记录数据', async () => {
      const invalidData = {
        profileId: testProfile._id.toString(),
        title: '', // 空标题
        content: 'a'.repeat(5001), // 内容太长
        type: 'invalid-type' // 无效类型
      };

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });

    it('应该拒绝访问无权限的档案', async () => {
      // 创建另一个用户的档案
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);

      const momentData = {
        profileId: anotherProfile._id.toString(),
        title: '尝试创建',
        content: '尝试内容',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(momentData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限在此档案中创建记录');
    });
  });

  describe('POST /api/moments/upload', () => {
    it('应该成功上传图片并创建记录', async () => {
      // 创建测试图片文件
      const testImagePath = path.join(__dirname, '../../fixtures/test-image.jpg');
      
      // 确保测试图片存在（这里模拟一个简单的图片文件）
      if (!fs.existsSync(path.dirname(testImagePath))) {
        fs.mkdirSync(path.dirname(testImagePath), { recursive: true });
      }
      if (!fs.existsSync(testImagePath)) {
        fs.writeFileSync(testImagePath, Buffer.from('fake-image-data'));
      }

      const response = await request(app)
        .post('/api/moments/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('profileId', testProfile._id.toString())
        .field('title', '图片记录')
        .field('content', '图片描述')
        .field('type', 'photo')
        .attach('media', testImagePath)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('图片记录');
      expect(response.body.data.type).toBe('photo');
      expect(response.body.data.media).toHaveLength(1);
      expect(response.body.data.media[0].type).toBe('image');
    });

    it('应该拒绝不支持的文件类型', async () => {
      // 创建测试文本文件
      const testFilePath = path.join(__dirname, '../../fixtures/test-file.txt');
      
      if (!fs.existsSync(path.dirname(testFilePath))) {
        fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      }
      fs.writeFileSync(testFilePath, 'test content');

      const response = await request(app)
        .post('/api/moments/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('profileId', testProfile._id.toString())
        .field('title', '文件记录')
        .field('type', 'photo')
        .attach('media', testFilePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不支持的文件类型');
    });

    it('应该拒绝超大文件', async () => {
      // 创建大文件（模拟）
      const testFilePath = path.join(__dirname, '../../fixtures/large-file.jpg');
      
      if (!fs.existsSync(path.dirname(testFilePath))) {
        fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      }
      // 创建一个大文件（这里只是模拟，实际测试中可能需要真实的大文件）
      fs.writeFileSync(testFilePath, Buffer.alloc(11 * 1024 * 1024)); // 11MB

      const response = await request(app)
        .post('/api/moments/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('profileId', testProfile._id.toString())
        .field('title', '大文件记录')
        .field('type', 'photo')
        .attach('media', testFilePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('文件大小超出限制');
    });
  });

  describe('PUT /api/moments/:id', () => {
    it('应该成功更新记录信息', async () => {
      const updateData = {
        title: '更新后的记录',
        content: '更新后的内容',
        tags: ['更新', '测试'],
        isPublic: true
      };

      const response = await request(app)
        .put(`/api/moments/${testMoment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.tags).toEqual(['更新', '测试']);
      expect(response.body.data.isPublic).toBe(true);

      // 验证数据库中的数据已更新
      const updatedMoment = await Moment.findById(testMoment._id);
      expect(updatedMoment.title).toBe(updateData.title);
      expect(updatedMoment.isPublic).toBe(true);
    });

    it('应该拒绝更新不存在的记录', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { title: '新标题' };

      const response = await request(app)
        .put(`/api/moments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('记录不存在');
    });

    it('应该拒绝无权限的更新操作', async () => {
      // 创建另一个用户的记录
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);
      const anotherMoment = new Moment({
        userId: anotherUser._id,
        profileId: anotherProfile._id,
        title: '他人记录',
        content: '他人内容',
        type: 'text'
      });
      await anotherMoment.save();

      const updateData = { title: '尝试更新' };

      const response = await request(app)
        .put(`/api/moments/${anotherMoment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限编辑此记录');
    });
  });

  describe('DELETE /api/moments/:id', () => {
    it('应该成功删除记录', async () => {
      const response = await request(app)
        .delete(`/api/moments/${testMoment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('记录删除成功');

      // 验证记录已从数据库中删除
      const deletedMoment = await Moment.findById(testMoment._id);
      expect(deletedMoment).toBeNull();
    });

    it('应该拒绝删除不存在的记录', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/moments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('记录不存在');
    });

    it('应该拒绝无权限的删除操作', async () => {
      // 创建另一个用户的记录
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);
      const anotherMoment = new Moment({
        userId: anotherUser._id,
        profileId: anotherProfile._id,
        title: '他人记录',
        content: '他人内容',
        type: 'text'
      });
      await anotherMoment.save();

      const response = await request(app)
        .delete(`/api/moments/${anotherMoment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限删除此记录');
    });
  });

  describe('GET /api/moments/stats/:profileId', () => {
    it('应该获取档案记录统计', async () => {
      // 创建更多记录
      for (let i = 0; i < 3; i++) {
        const moment = new Moment({
          userId: testUser._id,
          profileId: testProfile._id,
          title: `记录${i}`,
          content: `内容${i}`,
          type: i % 2 === 0 ? 'text' : 'photo'
        });
        await moment.save();
      }

      const response = await request(app)
        .get(`/api/moments/stats/${testProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalMoments).toBe(4); // 包括初始的testMoment
      expect(response.body.data.typeStats).toBeDefined();
      expect(response.body.data.monthlyStats).toBeDefined();
      expect(response.body.data.tagStats).toBeDefined();
    });

    it('应该拒绝访问无权限的档案统计', async () => {
      // 创建另一个用户的档案
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);

      const response = await request(app)
        .get(`/api/moments/stats/${anotherProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限访问此档案的记录统计');
    });
  });

  describe('GET /api/moments/search', () => {
    it('应该支持关键词搜索', async () => {
      const response = await request(app)
        .get('/api/moments/search?q=测试')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moments).toHaveLength(1);
      expect(response.body.data.moments[0].title).toContain('测试');
    });

    it('应该支持组合搜索条件', async () => {
      const response = await request(app)
        .get('/api/moments/search?q=测试&type=text&tags=记录')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moments).toHaveLength(1);
    });

    it('应该返回空结果当没有匹配时', async () => {
      const response = await request(app)
        .get('/api/moments/search?q=不存在的内容')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moments).toHaveLength(0);
    });
  });
});