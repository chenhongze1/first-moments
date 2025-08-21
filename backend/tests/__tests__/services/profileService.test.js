const profileService = require('../../../src/services/profileService');
const Profile = require('../../../src/models/Profile');
const User = require('../../../src/models/User');
const Moment = require('../../../src/models/Moment');
const Location = require('../../../src/models/Location');

describe('Profile Service', () => {
  let testUser;
  let testUser2;
  let testProfile;
  let testProfileData;

  beforeEach(async () => {
    // 创建测试用户
    testUser = await createTestUser();
    testUser2 = await createTestUser({
      username: 'testuser2',
      email: 'test2@example.com'
    });

    testProfileData = {
      name: '我的档案',
      description: '这是一个测试档案',
      type: 'personal',
      theme: 'default',
      layout: 'timeline',
      tags: ['生活', '记录'],
      isPublic: true
    };

    testProfile = await createTestProfile(testUser._id, testProfileData);
  });

  describe('创建档案', () => {
    it('应该成功创建档案', async () => {
      const profileData = {
        name: '新档案',
        description: '新的测试档案',
        type: 'travel',
        theme: 'nature',
        layout: 'grid',
        tags: ['旅行', '摄影'],
        isPublic: false
      };

      const result = await profileService.createProfile(testUser._id, profileData);

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile.name).toBe(profileData.name);
      expect(result.profile.description).toBe(profileData.description);
      expect(result.profile.type).toBe(profileData.type);
      expect(result.profile.theme).toBe(profileData.theme);
      expect(result.profile.layout).toBe(profileData.layout);
      expect(result.profile.tags).toEqual(profileData.tags);
      expect(result.profile.isPublic).toBe(profileData.isPublic);
      expect(result.profile.ownerId.toString()).toBe(testUser._id.toString());
      expect(result.profile.isActive).toBe(true);
    });

    it('应该使用默认值创建档案', async () => {
      const minimalData = {
        name: '最小档案'
      };

      const result = await profileService.createProfile(testUser._id, minimalData);

      expect(result.success).toBe(true);
      expect(result.profile.name).toBe(minimalData.name);
      expect(result.profile.type).toBe('personal'); // 默认值
      expect(result.profile.theme).toBe('default'); // 默认值
      expect(result.profile.layout).toBe('timeline'); // 默认值
      expect(result.profile.isPublic).toBe(false); // 默认值
      expect(result.profile.tags).toEqual([]);
    });

    it('应该拒绝重复的档案名称（同一用户）', async () => {
      const result = await profileService.createProfile(testUser._id, {
        name: testProfile.name
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('档案名称已存在');
    });

    it('应该允许不同用户使用相同的档案名称', async () => {
      const result = await profileService.createProfile(testUser2._id, {
        name: testProfile.name
      });

      expect(result.success).toBe(true);
      expect(result.profile.name).toBe(testProfile.name);
    });

    it('应该拒绝无效的档案类型', async () => {
      const result = await profileService.createProfile(testUser._id, {
        name: '无效类型档案',
        type: 'invalid_type'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('无效的档案类型');
    });

    it('应该拒绝无效的主题', async () => {
      const result = await profileService.createProfile(testUser._id, {
        name: '无效主题档案',
        theme: 'invalid_theme'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('无效的主题');
    });

    it('应该拒绝无效的布局', async () => {
      const result = await profileService.createProfile(testUser._id, {
        name: '无效布局档案',
        layout: 'invalid_layout'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('无效的布局');
    });

    it('应该拒绝过长的档案名称', async () => {
      const result = await profileService.createProfile(testUser._id, {
        name: 'a'.repeat(101) // 超过100字符
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('档案名称过长');
    });

    it('应该拒绝过多的标签', async () => {
      const result = await profileService.createProfile(testUser._id, {
        name: '标签过多档案',
        tags: Array(21).fill('标签') // 超过20个标签
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('标签数量不能超过20个');
    });

    it('应该拒绝不存在的用户', async () => {
      const fakeUserId = '507f1f77bcf86cd799439011';
      const result = await profileService.createProfile(fakeUserId, {
        name: '测试档案'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('用户不存在');
    });
  });

  describe('获取档案列表', () => {
    let publicProfile;
    let privateProfile;

    beforeEach(async () => {
      // 创建公开档案
      publicProfile = await createTestProfile(testUser2._id, {
        name: '公开档案',
        type: 'travel',
        isPublic: true
      });

      // 创建私有档案
      privateProfile = await createTestProfile(testUser2._id, {
        name: '私有档案',
        type: 'personal',
        isPublic: false
      });
    });

    it('应该获取用户自己的所有档案', async () => {
      const result = await profileService.getProfiles(testUser._id, {
        ownerId: testUser._id
      });

      expect(result.success).toBe(true);
      expect(result.profiles).toBeDefined();
      expect(result.profiles.length).toBeGreaterThan(0);
      expect(result.profiles.some(p => p._id.toString() === testProfile._id.toString())).toBe(true);
    });

    it('应该只获取其他用户的公开档案', async () => {
      const result = await profileService.getProfiles(testUser._id, {
        ownerId: testUser2._id
      });

      expect(result.success).toBe(true);
      expect(result.profiles).toBeDefined();
      expect(result.profiles.some(p => p._id.toString() === publicProfile._id.toString())).toBe(true);
      expect(result.profiles.some(p => p._id.toString() === privateProfile._id.toString())).toBe(false);
    });

    it('应该按类型筛选档案', async () => {
      const result = await profileService.getProfiles(testUser._id, {
        type: 'travel'
      });

      expect(result.success).toBe(true);
      result.profiles.forEach(profile => {
        expect(profile.type).toBe('travel');
      });
    });

    it('应该按标签筛选档案', async () => {
      const result = await profileService.getProfiles(testUser._id, {
        tags: ['生活']
      });

      expect(result.success).toBe(true);
      result.profiles.forEach(profile => {
        expect(profile.tags).toContain('生活');
      });
    });

    it('应该支持分页', async () => {
      const result = await profileService.getProfiles(testUser._id, {
        page: 1,
        limit: 1
      });

      expect(result.success).toBe(true);
      expect(result.profiles.length).toBeLessThanOrEqual(1);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.total).toBeGreaterThan(0);
    });

    it('应该按创建时间排序', async () => {
      const result = await profileService.getProfiles(testUser._id, {
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      expect(result.success).toBe(true);
      if (result.profiles.length > 1) {
        for (let i = 1; i < result.profiles.length; i++) {
          expect(new Date(result.profiles[i-1].createdAt).getTime())
            .toBeGreaterThanOrEqual(new Date(result.profiles[i].createdAt).getTime());
        }
      }
    });

    it('应该搜索档案名称和描述', async () => {
      const result = await profileService.getProfiles(testUser._id, {
        search: '测试'
      });

      expect(result.success).toBe(true);
      result.profiles.forEach(profile => {
        expect(
          profile.name.includes('测试') || 
          (profile.description && profile.description.includes('测试'))
        ).toBe(true);
      });
    });
  });

  describe('获取档案详情', () => {
    it('应该获取自己的档案详情', async () => {
      const result = await profileService.getProfileById(testUser._id, testProfile._id);

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile._id.toString()).toBe(testProfile._id.toString());
      expect(result.profile.name).toBe(testProfile.name);
      expect(result.profile.description).toBe(testProfile.description);
    });

    it('应该获取公开档案详情', async () => {
      const publicProfile = await createTestProfile(testUser2._id, {
        name: '公开档案',
        isPublic: true
      });

      const result = await profileService.getProfileById(testUser._id, publicProfile._id);

      expect(result.success).toBe(true);
      expect(result.profile._id.toString()).toBe(publicProfile._id.toString());
    });

    it('应该拒绝访问他人的私有档案', async () => {
      const privateProfile = await createTestProfile(testUser2._id, {
        name: '私有档案',
        isPublic: false
      });

      const result = await profileService.getProfileById(testUser._id, privateProfile._id);

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限访问此档案');
    });

    it('应该拒绝访问不存在的档案', async () => {
      const fakeProfileId = '507f1f77bcf86cd799439011';
      const result = await profileService.getProfileById(testUser._id, fakeProfileId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('档案不存在');
    });

    it('应该包含档案统计信息', async () => {
      const result = await profileService.getProfileById(testUser._id, testProfile._id);

      expect(result.success).toBe(true);
      expect(result.profile.stats).toBeDefined();
      expect(result.profile.stats.momentsCount).toBeDefined();
      expect(result.profile.stats.locationsCount).toBeDefined();
      expect(result.profile.stats.collaboratorsCount).toBeDefined();
    });
  });

  describe('更新档案', () => {
    it('应该成功更新档案信息', async () => {
      const updateData = {
        name: '更新后的档案',
        description: '更新后的描述',
        theme: 'nature',
        layout: 'grid',
        tags: ['更新', '标签'],
        isPublic: false
      };

      const result = await profileService.updateProfile(testUser._id, testProfile._id, updateData);

      expect(result.success).toBe(true);
      expect(result.profile.name).toBe(updateData.name);
      expect(result.profile.description).toBe(updateData.description);
      expect(result.profile.theme).toBe(updateData.theme);
      expect(result.profile.layout).toBe(updateData.layout);
      expect(result.profile.tags).toEqual(updateData.tags);
      expect(result.profile.isPublic).toBe(updateData.isPublic);
    });

    it('应该拒绝更新为重复的档案名称', async () => {
      const anotherProfile = await createTestProfile(testUser._id, {
        name: '另一个档案'
      });

      const result = await profileService.updateProfile(testUser._id, testProfile._id, {
        name: anotherProfile.name
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('档案名称已存在');
    });

    it('应该拒绝无权限的更新', async () => {
      const result = await profileService.updateProfile(testUser2._id, testProfile._id, {
        name: '无权限更新'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限修改此档案');
    });

    it('应该拒绝更新不存在的档案', async () => {
      const fakeProfileId = '507f1f77bcf86cd799439011';
      const result = await profileService.updateProfile(testUser._id, fakeProfileId, {
        name: '不存在的档案'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('档案不存在');
    });

    it('应该验证更新数据的有效性', async () => {
      const invalidData = {
        type: 'invalid_type',
        theme: 'invalid_theme',
        layout: 'invalid_layout'
      };

      const result = await profileService.updateProfile(testUser._id, testProfile._id, invalidData);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/无效的|不支持的/);
    });
  });

  describe('删除档案', () => {
    it('应该成功删除档案', async () => {
      const result = await profileService.deleteProfile(testUser._id, testProfile._id);

      expect(result.success).toBe(true);
      expect(result.message).toContain('档案删除成功');

      // 验证档案已被删除
      const deletedProfile = await Profile.findById(testProfile._id);
      expect(deletedProfile).toBeNull();
    });

    it('应该拒绝删除他人的档案', async () => {
      const result = await profileService.deleteProfile(testUser2._id, testProfile._id);

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限删除此档案');
    });

    it('应该拒绝删除不存在的档案', async () => {
      const fakeProfileId = '507f1f77bcf86cd799439011';
      const result = await profileService.deleteProfile(testUser._id, fakeProfileId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('档案不存在');
    });

    it('应该级联删除相关数据', async () => {
      // 创建相关的记录和地点
      const moment = await createTestMoment(testUser._id, testProfile._id);
      const location = await createTestLocation(testUser._id, testProfile._id);

      const result = await profileService.deleteProfile(testUser._id, testProfile._id);

      expect(result.success).toBe(true);

      // 验证相关数据已被删除
      const deletedMoment = await Moment.findById(moment._id);
      const deletedLocation = await Location.findById(location._id);
      expect(deletedMoment).toBeNull();
      expect(deletedLocation).toBeNull();
    });
  });

  describe('档案权限管理', () => {
    it('应该成功添加协作者', async () => {
      const result = await profileService.addCollaborator(
        testUser._id,
        testProfile._id,
        testUser2._id,
        'editor'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('协作者添加成功');

      // 验证协作者已添加
      const updatedProfile = await Profile.findById(testProfile._id);
      const collaborator = updatedProfile.collaborators.find(
        c => c.userId.toString() === testUser2._id.toString()
      );
      expect(collaborator).toBeDefined();
      expect(collaborator.role).toBe('editor');
    });

    it('应该拒绝重复添加协作者', async () => {
      // 先添加一次
      await profileService.addCollaborator(
        testUser._id,
        testProfile._id,
        testUser2._id,
        'editor'
      );

      // 再次添加
      const result = await profileService.addCollaborator(
        testUser._id,
        testProfile._id,
        testUser2._id,
        'viewer'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('用户已是协作者');
    });

    it('应该成功移除协作者', async () => {
      // 先添加协作者
      await profileService.addCollaborator(
        testUser._id,
        testProfile._id,
        testUser2._id,
        'editor'
      );

      // 移除协作者
      const result = await profileService.removeCollaborator(
        testUser._id,
        testProfile._id,
        testUser2._id
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('协作者移除成功');

      // 验证协作者已移除
      const updatedProfile = await Profile.findById(testProfile._id);
      const collaborator = updatedProfile.collaborators.find(
        c => c.userId.toString() === testUser2._id.toString()
      );
      expect(collaborator).toBeUndefined();
    });

    it('应该拒绝非所有者管理协作者', async () => {
      const result = await profileService.addCollaborator(
        testUser2._id,
        testProfile._id,
        testUser._id,
        'editor'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('只有档案所有者可以管理协作者');
    });

    it('应该验证协作者角色', async () => {
      const result = await profileService.addCollaborator(
        testUser._id,
        testProfile._id,
        testUser2._id,
        'invalid_role'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('无效的协作者角色');
    });

    it('应该检查用户权限', async () => {
      // 测试所有者权限
      let hasPermission = await profileService.checkPermission(
        testUser._id,
        testProfile._id,
        'write'
      );
      expect(hasPermission).toBe(true);

      // 测试非协作者权限
      hasPermission = await profileService.checkPermission(
        testUser2._id,
        testProfile._id,
        'write'
      );
      expect(hasPermission).toBe(false);

      // 添加协作者后测试权限
      await profileService.addCollaborator(
        testUser._id,
        testProfile._id,
        testUser2._id,
        'editor'
      );

      hasPermission = await profileService.checkPermission(
        testUser2._id,
        testProfile._id,
        'write'
      );
      expect(hasPermission).toBe(true);

      // 测试查看者权限
      await profileService.updateCollaboratorRole(
        testUser._id,
        testProfile._id,
        testUser2._id,
        'viewer'
      );

      hasPermission = await profileService.checkPermission(
        testUser2._id,
        testProfile._id,
        'read'
      );
      expect(hasPermission).toBe(true);

      hasPermission = await profileService.checkPermission(
        testUser2._id,
        testProfile._id,
        'write'
      );
      expect(hasPermission).toBe(false);
    });
  });

  describe('档案统计', () => {
    beforeEach(async () => {
      // 创建一些测试数据
      await createTestMoment(testUser._id, testProfile._id);
      await createTestMoment(testUser._id, testProfile._id);
      await createTestLocation(testUser._id, testProfile._id);
    });

    it('应该获取档案统计信息', async () => {
      const result = await profileService.getProfileStats(testUser._id, testProfile._id);

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.momentsCount).toBeGreaterThanOrEqual(2);
      expect(result.stats.locationsCount).toBeGreaterThanOrEqual(1);
      expect(result.stats.collaboratorsCount).toBeDefined();
      expect(result.stats.totalViews).toBeDefined();
      expect(result.stats.totalLikes).toBeDefined();
    });

    it('应该拒绝无权限访问统计', async () => {
      const result = await profileService.getProfileStats(testUser2._id, testProfile._id);

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限访问此档案');
    });

    it('应该更新档案统计', async () => {
      const result = await profileService.updateProfileStats(testProfile._id, {
        momentsCount: 10,
        locationsCount: 5,
        totalViews: 100,
        totalLikes: 50
      });

      expect(result.success).toBe(true);

      // 验证统计已更新
      const updatedProfile = await Profile.findById(testProfile._id);
      expect(updatedProfile.stats.momentsCount).toBe(10);
      expect(updatedProfile.stats.locationsCount).toBe(5);
      expect(updatedProfile.stats.totalViews).toBe(100);
      expect(updatedProfile.stats.totalLikes).toBe(50);
    });
  });

  describe('档案设置', () => {
    it('应该更新档案设置', async () => {
      const settings = {
        privacy: {
          allowComments: false,
          allowSharing: true,
          showStats: false
        },
        notifications: {
          newMoments: true,
          newCollaborators: false,
          comments: true
        },
        display: {
          showMap: true,
          showTimeline: false,
          itemsPerPage: 20
        }
      };

      const result = await profileService.updateProfileSettings(
        testUser._id,
        testProfile._id,
        settings
      );

      expect(result.success).toBe(true);
      expect(result.profile.settings.privacy.allowComments).toBe(false);
      expect(result.profile.settings.notifications.newMoments).toBe(true);
      expect(result.profile.settings.display.itemsPerPage).toBe(20);
    });

    it('应该拒绝无权限更新设置', async () => {
      const result = await profileService.updateProfileSettings(
        testUser2._id,
        testProfile._id,
        { privacy: { allowComments: false } }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('无权限修改此档案');
    });
  });

  describe('档案搜索', () => {
    beforeEach(async () => {
      // 创建更多测试档案
      await createTestProfile(testUser._id, {
        name: '旅行档案',
        description: '记录我的旅行足迹',
        type: 'travel',
        tags: ['旅行', '摄影'],
        isPublic: true
      });

      await createTestProfile(testUser2._id, {
        name: '美食档案',
        description: '分享美食体验',
        type: 'food',
        tags: ['美食', '餐厅'],
        isPublic: true
      });
    });

    it('应该按关键词搜索档案', async () => {
      const result = await profileService.searchProfiles(testUser._id, {
        keyword: '旅行'
      });

      expect(result.success).toBe(true);
      expect(result.profiles.length).toBeGreaterThan(0);
      result.profiles.forEach(profile => {
        expect(
          profile.name.includes('旅行') ||
          (profile.description && profile.description.includes('旅行')) ||
          profile.tags.includes('旅行')
        ).toBe(true);
      });
    });

    it('应该按标签搜索档案', async () => {
      const result = await profileService.searchProfiles(testUser._id, {
        tags: ['摄影']
      });

      expect(result.success).toBe(true);
      result.profiles.forEach(profile => {
        expect(profile.tags).toContain('摄影');
      });
    });

    it('应该组合搜索条件', async () => {
      const result = await profileService.searchProfiles(testUser._id, {
        keyword: '档案',
        type: 'travel',
        tags: ['旅行']
      });

      expect(result.success).toBe(true);
      result.profiles.forEach(profile => {
        expect(profile.type).toBe('travel');
        expect(profile.tags).toContain('旅行');
      });
    });

    it('应该返回空结果当无匹配时', async () => {
      const result = await profileService.searchProfiles(testUser._id, {
        keyword: '不存在的关键词'
      });

      expect(result.success).toBe(true);
      expect(result.profiles).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('工具方法', () => {
    describe('validateProfileData', () => {
      it('应该验证有效的档案数据', () => {
        const validData = {
          name: '有效档案',
          description: '有效描述',
          type: 'personal',
          theme: 'default',
          layout: 'timeline',
          tags: ['标签1', '标签2'],
          isPublic: true
        };

        const result = profileService.validateProfileData(validData);
        expect(result.isValid).toBe(true);
      });

      it('应该拒绝无效的档案数据', () => {
        const invalidData = {
          name: '', // 空名称
          type: 'invalid_type',
          theme: 'invalid_theme',
          layout: 'invalid_layout',
          tags: Array(25).fill('标签') // 过多标签
        };

        const result = profileService.validateProfileData(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('formatProfileResponse', () => {
      it('应该正确格式化档案响应', () => {
        const formattedProfile = profileService.formatProfileResponse(testProfile, testUser._id);

        expect(formattedProfile).toBeDefined();
        expect(formattedProfile.id).toBe(testProfile._id.toString());
        expect(formattedProfile.name).toBe(testProfile.name);
        expect(formattedProfile.isOwner).toBe(true);
        expect(formattedProfile.permissions).toBeDefined();
      });
    });

    describe('calculateProfileScore', () => {
      it('应该计算档案评分', () => {
        const score = profileService.calculateProfileScore(testProfile);

        expect(score).toBeDefined();
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });
});