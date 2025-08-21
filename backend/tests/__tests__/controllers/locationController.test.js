const request = require('supertest');
const app = require('../../testApp');
const Location = require('../../../src/models/Location');
const Moment = require('../../../src/models/Moment');

describe('Location Controller', () => {
  let testUser;
  let authToken;
  let testProfile;
  let testLocation;

  beforeEach(async () => {
    testUser = await createTestUser();
    authToken = generateAuthToken(testUser._id);
    testProfile = await createTestProfile(testUser._id);
    
    // 创建测试地点
    testLocation = new Location({
      userId: testUser._id,
      profileId: testProfile._id,
      name: '测试地点',
      description: '这是一个测试地点',
      coordinates: {
        type: 'Point',
        coordinates: [116.4074, 39.9042]
      },
      address: '北京市朝阳区',
      category: 'restaurant',
      tags: ['美食', '聚餐'],
      isPublic: false,
      visitCount: 1,
      lastVisitAt: new Date()
    });
    await testLocation.save();
  });

  describe('GET /api/locations', () => {
    it('应该获取用户的地点列表', async () => {
      const response = await request(app)
        .get('/api/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toHaveLength(1);
      expect(response.body.data.locations[0].name).toBe('测试地点');
      expect(response.body.data.total).toBe(1);
    });

    it('应该支持按档案筛选地点', async () => {
      const response = await request(app)
        .get(`/api/locations?profileId=${testProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toHaveLength(1);
      expect(response.body.data.locations[0].profileId).toBe(testProfile._id.toString());
    });

    it('应该支持按类别筛选地点', async () => {
      // 创建不同类别的地点
      const parkLocation = new Location({
        userId: testUser._id,
        profileId: testProfile._id,
        name: '公园',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        address: '北京市朝阳区公园',
        category: 'park'
      });
      await parkLocation.save();

      const response = await request(app)
        .get('/api/locations?category=park')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toHaveLength(1);
      expect(response.body.data.locations[0].category).toBe('park');
    });

    it('应该支持按标签筛选地点', async () => {
      const response = await request(app)
        .get('/api/locations?tags=美食')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toHaveLength(1);
      expect(response.body.data.locations[0].tags).toContain('美食');
    });

    it('应该支持地理位置范围查询', async () => {
      const response = await request(app)
        .get('/api/locations?lat=39.9042&lng=116.4074&radius=1000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toHaveLength(1);
    });

    it('应该支持分页查询', async () => {
      // 创建更多地点
      for (let i = 0; i < 5; i++) {
        const location = new Location({
          userId: testUser._id,
          profileId: testProfile._id,
          name: `地点${i}`,
          coordinates: {
            type: 'Point',
            coordinates: [116.4074 + i * 0.001, 39.9042 + i * 0.001]
          },
          address: `地址${i}`,
          category: 'other'
        });
        await location.save();
      }

      const response = await request(app)
        .get('/api/locations?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toHaveLength(3);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(3);
    });

    it('应该拒绝未认证的请求', async () => {
      const response = await request(app)
        .get('/api/locations')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供认证令牌');
    });
  });

  describe('GET /api/locations/:id', () => {
    it('应该获取指定地点详情', async () => {
      const response = await request(app)
        .get(`/api/locations/${testLocation._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('测试地点');
      expect(response.body.data.description).toBe('这是一个测试地点');
      expect(response.body.data.address).toBe('北京市朝阳区');
      expect(response.body.data.visitCount).toBe(1);
    });

    it('应该拒绝访问不存在的地点', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/locations/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('地点不存在');
    });

    it('应该拒绝访问无权限的地点', async () => {
      // 创建另一个用户的地点
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);
      const anotherLocation = new Location({
        userId: anotherUser._id,
        profileId: anotherProfile._id,
        name: '他人地点',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        address: '他人地址',
        category: 'other',
        isPublic: false
      });
      await anotherLocation.save();

      const response = await request(app)
        .get(`/api/locations/${anotherLocation._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限访问此地点');
    });

    it('应该允许访问公开地点', async () => {
      // 创建公开地点
      const publicLocation = new Location({
        userId: testUser._id,
        profileId: testProfile._id,
        name: '公开地点',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        address: '公开地址',
        category: 'restaurant',
        isPublic: true
      });
      await publicLocation.save();

      // 创建另一个用户
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      const anotherToken = generateAuthToken(anotherUser._id);

      const response = await request(app)
        .get(`/api/locations/${publicLocation._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('公开地点');
    });
  });

  describe('POST /api/locations', () => {
    it('应该成功创建新地点', async () => {
      const locationData = {
        profileId: testProfile._id.toString(),
        name: '新地点',
        description: '新地点描述',
        coordinates: {
          coordinates: [116.4074, 39.9042]
        },
        address: '北京市朝阳区新地址',
        category: 'cafe',
        tags: ['咖啡', '休闲'],
        isPublic: false
      };

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(locationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(locationData.name);
      expect(response.body.data.description).toBe(locationData.description);
      expect(response.body.data.userId).toBe(testUser._id.toString());
      expect(response.body.data.profileId).toBe(testProfile._id.toString());
      expect(response.body.data.category).toBe(locationData.category);
      expect(response.body.data.tags).toEqual(['咖啡', '休闲']);

      // 验证地点已保存到数据库
      const savedLocation = await Location.findById(response.body.data._id);
      expect(savedLocation).toBeTruthy();
      expect(savedLocation.name).toBe(locationData.name);
    });

    it('应该拒绝无效的地点数据', async () => {
      const invalidData = {
        profileId: testProfile._id.toString(),
        name: '', // 空名称
        coordinates: {}, // 缺少坐标
        category: 'invalid-category' // 无效类别
      };

      const response = await request(app)
        .post('/api/locations')
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

      const locationData = {
        profileId: anotherProfile._id.toString(),
        name: '尝试创建',
        coordinates: {
          coordinates: [116.4074, 39.9042]
        },
        address: '尝试地址',
        category: 'other'
      };

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(locationData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限在此档案中创建地点');
    });
  });

  describe('PUT /api/locations/:id', () => {
    it('应该成功更新地点信息', async () => {
      const updateData = {
        name: '更新后的地点',
        description: '更新后的描述',
        category: 'cafe',
        tags: ['更新', '测试'],
        isPublic: true
      };

      const response = await request(app)
        .put(`/api/locations/${testLocation._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.category).toBe(updateData.category);
      expect(response.body.data.tags).toEqual(['更新', '测试']);
      expect(response.body.data.isPublic).toBe(true);

      // 验证数据库中的数据已更新
      const updatedLocation = await Location.findById(testLocation._id);
      expect(updatedLocation.name).toBe(updateData.name);
      expect(updatedLocation.isPublic).toBe(true);
    });

    it('应该拒绝更新不存在的地点', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { name: '新名称' };

      const response = await request(app)
        .put(`/api/locations/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('地点不存在');
    });

    it('应该拒绝无权限的更新操作', async () => {
      // 创建另一个用户的地点
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);
      const anotherLocation = new Location({
        userId: anotherUser._id,
        profileId: anotherProfile._id,
        name: '他人地点',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        address: '他人地址',
        category: 'other'
      });
      await anotherLocation.save();

      const updateData = { name: '尝试更新' };

      const response = await request(app)
        .put(`/api/locations/${anotherLocation._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限编辑此地点');
    });
  });

  describe('DELETE /api/locations/:id', () => {
    it('应该成功删除地点', async () => {
      const response = await request(app)
        .delete(`/api/locations/${testLocation._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('地点删除成功');

      // 验证地点已从数据库中删除
      const deletedLocation = await Location.findById(testLocation._id);
      expect(deletedLocation).toBeNull();
    });

    it('应该拒绝删除不存在的地点', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/locations/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('地点不存在');
    });

    it('应该拒绝无权限的删除操作', async () => {
      // 创建另一个用户的地点
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);
      const anotherLocation = new Location({
        userId: anotherUser._id,
        profileId: anotherProfile._id,
        name: '他人地点',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        address: '他人地址',
        category: 'other'
      });
      await anotherLocation.save();

      const response = await request(app)
        .delete(`/api/locations/${anotherLocation._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限删除此地点');
    });
  });

  describe('POST /api/locations/:id/checkin', () => {
    it('应该成功打卡地点', async () => {
      const checkinData = {
        note: '今天来这里吃饭了',
        mood: 'happy'
      };

      const response = await request(app)
        .post(`/api/locations/${testLocation._id}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(checkinData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.visitCount).toBe(2); // 原来是1，现在应该是2
      expect(response.body.data.lastVisitAt).toBeDefined();
      expect(response.body.message).toContain('打卡成功');

      // 验证数据库中的访问次数已更新
      const updatedLocation = await Location.findById(testLocation._id);
      expect(updatedLocation.visitCount).toBe(2);
    });

    it('应该拒绝打卡不存在的地点', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const checkinData = { note: '尝试打卡' };

      const response = await request(app)
        .post(`/api/locations/${fakeId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(checkinData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('地点不存在');
    });

    it('应该拒绝打卡无权限的地点', async () => {
      // 创建另一个用户的地点
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);
      const anotherLocation = new Location({
        userId: anotherUser._id,
        profileId: anotherProfile._id,
        name: '他人地点',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        address: '他人地址',
        category: 'other',
        isPublic: false
      });
      await anotherLocation.save();

      const checkinData = { note: '尝试打卡' };

      const response = await request(app)
        .post(`/api/locations/${anotherLocation._id}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(checkinData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限打卡此地点');
    });
  });

  describe('GET /api/locations/:id/moments', () => {
    it('应该获取地点相关的记录', async () => {
      // 创建与地点相关的记录
      const moment = new Moment({
        userId: testUser._id,
        profileId: testProfile._id,
        title: '地点记录',
        content: '在这个地点的记录',
        type: 'text',
        location: {
          type: 'Point',
          coordinates: [116.4074, 39.9042],
          address: '北京市朝阳区',
          locationId: testLocation._id
        }
      });
      await moment.save();

      const response = await request(app)
        .get(`/api/locations/${testLocation._id}/moments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moments).toHaveLength(1);
      expect(response.body.data.moments[0].title).toBe('地点记录');
      expect(response.body.data.moments[0].location.locationId).toBe(testLocation._id.toString());
    });

    it('应该拒绝访问无权限地点的记录', async () => {
      // 创建另一个用户的地点
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);
      const anotherLocation = new Location({
        userId: anotherUser._id,
        profileId: anotherProfile._id,
        name: '他人地点',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        address: '他人地址',
        category: 'other',
        isPublic: false
      });
      await anotherLocation.save();

      const response = await request(app)
        .get(`/api/locations/${anotherLocation._id}/moments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限访问此地点的记录');
    });
  });

  describe('GET /api/locations/stats/:profileId', () => {
    it('应该获取档案地点统计', async () => {
      // 创建更多地点
      for (let i = 0; i < 3; i++) {
        const location = new Location({
          userId: testUser._id,
          profileId: testProfile._id,
          name: `地点${i}`,
          coordinates: {
            type: 'Point',
            coordinates: [116.4074 + i * 0.001, 39.9042 + i * 0.001]
          },
          address: `地址${i}`,
          category: i % 2 === 0 ? 'restaurant' : 'cafe',
          visitCount: i + 1
        });
        await location.save();
      }

      const response = await request(app)
        .get(`/api/locations/stats/${testProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalLocations).toBe(4); // 包括初始的testLocation
      expect(response.body.data.categoryStats).toBeDefined();
      expect(response.body.data.totalVisits).toBeGreaterThan(0);
      expect(response.body.data.mostVisitedLocation).toBeDefined();
    });

    it('应该拒绝访问无权限的档案统计', async () => {
      // 创建另一个用户的档案
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);

      const response = await request(app)
        .get(`/api/locations/stats/${anotherProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限访问此档案的地点统计');
    });
  });

  describe('GET /api/locations/search', () => {
    it('应该支持关键词搜索地点', async () => {
      const response = await request(app)
        .get('/api/locations/search?q=测试')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toHaveLength(1);
      expect(response.body.data.locations[0].name).toContain('测试');
    });

    it('应该支持组合搜索条件', async () => {
      const response = await request(app)
        .get('/api/locations/search?q=测试&category=restaurant&tags=美食')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toHaveLength(1);
    });

    it('应该返回空结果当没有匹配时', async () => {
      const response = await request(app)
        .get('/api/locations/search?q=不存在的地点')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toHaveLength(0);
    });
  });

  describe('GET /api/locations/nearby', () => {
    it('应该获取附近的地点', async () => {
      // 创建附近的地点
      const nearbyLocation = new Location({
        userId: testUser._id,
        profileId: testProfile._id,
        name: '附近地点',
        coordinates: {
          type: 'Point',
          coordinates: [116.4075, 39.9043] // 很近的坐标
        },
        address: '附近地址',
        category: 'cafe',
        isPublic: true
      });
      await nearbyLocation.save();

      const response = await request(app)
        .get('/api/locations/nearby?lat=39.9042&lng=116.4074&radius=1000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations.length).toBeGreaterThanOrEqual(1);
    });

    it('应该拒绝无效的坐标参数', async () => {
      const response = await request(app)
        .get('/api/locations/nearby?lat=invalid&lng=116.4074')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的坐标参数');
    });
  });
});