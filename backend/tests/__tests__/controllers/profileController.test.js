const request = require('supertest');
const app = require('../../testApp');
const Profile = require('../../../src/models/Profile');

describe('Profile Controller', () => {
  let testUser;
  let authToken;
  let testProfile;

  beforeEach(async () => {
    testUser = await createTestUser();
    authToken = generateAuthToken(testUser._id);
    testProfile = await createTestProfile(testUser._id);
  });

  describe('GET /api/profiles', () => {
    it('应该获取用户的档案列表', async () => {
      const response = await request(app)
        .get('/api/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profiles).toHaveLength(1);
      expect(response.body.data.profiles[0].name).toBe('测试档案');
      expect(response.body.data.total).toBe(1);
    });

    it('应该支持分页查询', async () => {
      // 创建更多档案
      for (let i = 0; i < 5; i++) {
        await createTestProfile(testUser._id);
      }

      const response = await request(app)
        .get('/api/profiles?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profiles).toHaveLength(3);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(3);
      expect(response.body.data.pagination.total).toBe(6);
    });

    it('应该支持按类型筛选', async () => {
      // 创建不同类型的档案
      const childProfile = new Profile({
        userId: testUser._id,
        name: '孩子档案',
        type: 'child',
        permissions: [{
          userId: testUser._id,
          role: 'owner',
          canEdit: true,
          canView: true,
          canShare: true,
          canDelete: true,
          grantedBy: testUser._id
        }]
      });
      await childProfile.save();

      const response = await request(app)
        .get('/api/profiles?type=child')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profiles).toHaveLength(1);
      expect(response.body.data.profiles[0].type).toBe('child');
    });

    it('应该拒绝未认证的请求', async () => {
      const response = await request(app)
        .get('/api/profiles')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供认证令牌');
    });
  });

  describe('GET /api/profiles/:id', () => {
    it('应该获取指定档案详情', async () => {
      const response = await request(app)
        .get(`/api/profiles/${testProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('测试档案');
      expect(response.body.data.type).toBe('self');
      expect(response.body.data.permissions).toBeDefined();
    });

    it('应该拒绝访问不存在的档案', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/profiles/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('档案不存在');
    });

    it('应该拒绝访问无权限的档案', async () => {
      // 创建另一个用户的档案
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);

      const response = await request(app)
        .get(`/api/profiles/${anotherProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限访问此档案');
    });
  });

  describe('POST /api/profiles', () => {
    it('应该成功创建新档案', async () => {
      const profileData = {
        name: '新档案',
        description: '这是一个新档案',
        type: 'child',
        isPublic: false
      };

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(profileData.name);
      expect(response.body.data.type).toBe(profileData.type);
      expect(response.body.data.userId).toBe(testUser._id.toString());
      expect(response.body.data.permissions).toHaveLength(1);
      expect(response.body.data.permissions[0].role).toBe('owner');

      // 验证档案已保存到数据库
      const savedProfile = await Profile.findById(response.body.data._id);
      expect(savedProfile).toBeTruthy();
      expect(savedProfile.name).toBe(profileData.name);
    });

    it('应该拒绝无效的档案数据', async () => {
      const invalidData = {
        name: '', // 空名称
        type: 'invalid-type', // 无效类型
        description: 'a'.repeat(1001) // 描述太长
      };

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });

    it('应该拒绝重复的档案名称', async () => {
      const profileData = {
        name: '测试档案', // 与已存在的档案同名
        type: 'self'
      };

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('档案名称已存在');
    });
  });

  describe('PUT /api/profiles/:id', () => {
    it('应该成功更新档案信息', async () => {
      const updateData = {
        name: '更新后的档案',
        description: '更新后的描述',
        isPublic: true
      };

      const response = await request(app)
        .put(`/api/profiles/${testProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.isPublic).toBe(updateData.isPublic);

      // 验证数据库中的数据已更新
      const updatedProfile = await Profile.findById(testProfile._id);
      expect(updatedProfile.name).toBe(updateData.name);
      expect(updatedProfile.description).toBe(updateData.description);
    });

    it('应该拒绝更新不存在的档案', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { name: '新名称' };

      const response = await request(app)
        .put(`/api/profiles/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('档案不存在');
    });

    it('应该拒绝无权限的更新操作', async () => {
      // 创建另一个用户的档案
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);
      const updateData = { name: '尝试更新' };

      const response = await request(app)
        .put(`/api/profiles/${anotherProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限编辑此档案');
    });
  });

  describe('DELETE /api/profiles/:id', () => {
    it('应该成功删除档案', async () => {
      const response = await request(app)
        .delete(`/api/profiles/${testProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('档案删除成功');

      // 验证档案已从数据库中删除
      const deletedProfile = await Profile.findById(testProfile._id);
      expect(deletedProfile).toBeNull();
    });

    it('应该拒绝删除不存在的档案', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/profiles/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('档案不存在');
    });

    it('应该拒绝无权限的删除操作', async () => {
      // 创建另一个用户的档案
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);

      const response = await request(app)
        .delete(`/api/profiles/${anotherProfile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限删除此档案');
    });
  });

  describe('POST /api/profiles/:id/permissions', () => {
    it('应该成功设置档案权限', async () => {
      // 创建另一个用户
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();

      const permissionData = {
        userId: anotherUser._id.toString(),
        role: 'viewer',
        canView: true,
        canEdit: false,
        canShare: false,
        canDelete: false
      };

      const response = await request(app)
        .post(`/api/profiles/${testProfile._id}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(permissionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('权限设置成功');

      // 验证权限已添加到档案
      const updatedProfile = await Profile.findById(testProfile._id);
      const newPermission = updatedProfile.permissions.find(
        p => p.userId.toString() === anotherUser._id.toString()
      );
      expect(newPermission).toBeTruthy();
      expect(newPermission.role).toBe('viewer');
      expect(newPermission.canView).toBe(true);
      expect(newPermission.canEdit).toBe(false);
    });

    it('应该拒绝为不存在的用户设置权限', async () => {
      const fakeUserId = '507f1f77bcf86cd799439011';
      const permissionData = {
        userId: fakeUserId,
        role: 'viewer',
        canView: true
      };

      const response = await request(app)
        .post(`/api/profiles/${testProfile._id}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(permissionData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户不存在');
    });

    it('应该拒绝无权限的权限设置操作', async () => {
      // 创建另一个用户和档案
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
      
      const anotherProfile = await createTestProfile(anotherUser._id);
      
      const permissionData = {
        userId: anotherUser._id.toString(),
        role: 'viewer',
        canView: true
      };

      const response = await request(app)
        .post(`/api/profiles/${anotherProfile._id}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(permissionData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限管理此档案的权限');
    });
  });
});