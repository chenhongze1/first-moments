const mongoose = require('mongoose');
const Profile = require('../../../src/models/Profile');
const User = require('../../../src/models/User');

describe('Profile Model', () => {
  let testUser;
  let testProfile;

  beforeEach(async () => {
    testUser = await createTestUser();
    
    testProfile = {
      name: '我的档案',
      description: '这是一个测试档案',
      type: 'personal',
      ownerId: testUser._id,
      isPublic: false,
      tags: ['测试', '档案'],
      settings: {
        allowComments: true,
        allowSharing: false,
        theme: 'default',
        layout: 'grid'
      },
      metadata: {
        category: '生活',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        location: '北京市'
      }
    };
  });

  describe('档案创建', () => {
    it('应该成功创建档案', async () => {
      const profile = new Profile(testProfile);
      const savedProfile = await profile.save();

      expect(savedProfile._id).toBeDefined();
      expect(savedProfile.name).toBe(testProfile.name);
      expect(savedProfile.description).toBe(testProfile.description);
      expect(savedProfile.type).toBe(testProfile.type);
      expect(savedProfile.ownerId.toString()).toBe(testUser._id.toString());
      expect(savedProfile.isPublic).toBe(false);
      expect(savedProfile.isActive).toBe(true); // 默认激活
      expect(savedProfile.createdAt).toBeDefined();
      expect(savedProfile.updatedAt).toBeDefined();
    });

    it('应该正确设置默认值', async () => {
      const minimalProfile = new Profile({
        name: '最小档案',
        ownerId: testUser._id
      });
      const savedProfile = await minimalProfile.save();

      expect(savedProfile.type).toBe('personal'); // 默认类型
      expect(savedProfile.isPublic).toBe(false); // 默认私有
      expect(savedProfile.isActive).toBe(true); // 默认激活
      expect(savedProfile.tags).toEqual([]); // 默认空数组
      expect(savedProfile.settings.allowComments).toBe(true); // 默认设置
      expect(savedProfile.settings.allowSharing).toBe(true);
      expect(savedProfile.settings.theme).toBe('default');
      expect(savedProfile.settings.layout).toBe('timeline');
    });

    it('应该拒绝重复的档案名称（同一用户）', async () => {
      const profile1 = new Profile(testProfile);
      await profile1.save();

      const profile2 = new Profile({
        ...testProfile,
        description: '另一个描述'
      });

      await expect(profile2.save()).rejects.toThrow();
    });

    it('应该允许不同用户使用相同的档案名称', async () => {
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();

      const profile1 = new Profile(testProfile);
      await profile1.save();

      const profile2 = new Profile({
        ...testProfile,
        ownerId: anotherUser._id
      });

      const savedProfile2 = await profile2.save();
      expect(savedProfile2).toBeTruthy();
    });

    it('应该拒绝无效的档案类型', async () => {
      const profile = new Profile({
        ...testProfile,
        type: 'invalid-type'
      });

      await expect(profile.save()).rejects.toThrow();
    });

    it('应该拒绝无效的主题', async () => {
      const profile = new Profile({
        ...testProfile,
        settings: {
          ...testProfile.settings,
          theme: 'invalid-theme'
        }
      });

      await expect(profile.save()).rejects.toThrow();
    });

    it('应该拒绝无效的布局', async () => {
      const profile = new Profile({
        ...testProfile,
        settings: {
          ...testProfile.settings,
          layout: 'invalid-layout'
        }
      });

      await expect(profile.save()).rejects.toThrow();
    });
  });

  describe('数据验证', () => {
    it('应该验证必填字段', async () => {
      const profile = new Profile({});
      
      await expect(profile.save()).rejects.toThrow();
    });

    it('应该验证档案名称长度', async () => {
      const shortName = 'a'; // 太短
      const longName = 'a'.repeat(101); // 太长

      const profile1 = new Profile({ ...testProfile, name: shortName });
      const profile2 = new Profile({ ...testProfile, name: longName });

      await expect(profile1.save()).rejects.toThrow();
      await expect(profile2.save()).rejects.toThrow();
    });

    it('应该验证描述长度', async () => {
      const longDescription = 'a'.repeat(1001); // 太长
      const profile = new Profile({ ...testProfile, description: longDescription });

      await expect(profile.save()).rejects.toThrow();
    });

    it('应该验证标签数量', async () => {
      const tooManyTags = Array(21).fill('tag'); // 超过20个
      const profile = new Profile({ ...testProfile, tags: tooManyTags });

      await expect(profile.save()).rejects.toThrow();
    });

    it('应该验证标签长度', async () => {
      const longTag = 'a'.repeat(31); // 超过30字符
      const profile = new Profile({ ...testProfile, tags: [longTag] });

      await expect(profile.save()).rejects.toThrow();
    });

    it('应该验证ownerId是有效的ObjectId', async () => {
      const profile = new Profile({
        ...testProfile,
        ownerId: 'invalid-id'
      });

      await expect(profile.save()).rejects.toThrow();
    });
  });

  describe('权限管理', () => {
    let savedProfile;
    let anotherUser;

    beforeEach(async () => {
      const profile = new Profile(testProfile);
      savedProfile = await profile.save();
      
      anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();
    });

    it('应该能添加协作者', async () => {
      savedProfile.collaborators.push({
        userId: anotherUser._id,
        role: 'editor',
        permissions: ['read', 'write']
      });
      await savedProfile.save();

      expect(savedProfile.collaborators).toHaveLength(1);
      expect(savedProfile.collaborators[0].userId.toString()).toBe(anotherUser._id.toString());
      expect(savedProfile.collaborators[0].role).toBe('editor');
      expect(savedProfile.collaborators[0].permissions).toContain('read');
      expect(savedProfile.collaborators[0].permissions).toContain('write');
    });

    it('应该拒绝重复的协作者', async () => {
      savedProfile.collaborators.push({
        userId: anotherUser._id,
        role: 'editor',
        permissions: ['read']
      });
      await savedProfile.save();

      savedProfile.collaborators.push({
        userId: anotherUser._id,
        role: 'viewer',
        permissions: ['read']
      });

      await expect(savedProfile.save()).rejects.toThrow();
    });

    it('应该验证协作者角色', async () => {
      savedProfile.collaborators.push({
        userId: anotherUser._id,
        role: 'invalid-role',
        permissions: ['read']
      });

      await expect(savedProfile.save()).rejects.toThrow();
    });

    it('应该验证协作者权限', async () => {
      savedProfile.collaborators.push({
        userId: anotherUser._id,
        role: 'editor',
        permissions: ['invalid-permission']
      });

      await expect(savedProfile.save()).rejects.toThrow();
    });

    it('应该能移除协作者', async () => {
      savedProfile.collaborators.push({
        userId: anotherUser._id,
        role: 'editor',
        permissions: ['read', 'write']
      });
      await savedProfile.save();

      savedProfile.collaborators = savedProfile.collaborators.filter(
        collab => collab.userId.toString() !== anotherUser._id.toString()
      );
      await savedProfile.save();

      expect(savedProfile.collaborators).toHaveLength(0);
    });
  });

  describe('统计信息', () => {
    let savedProfile;

    beforeEach(async () => {
      const profile = new Profile(testProfile);
      savedProfile = await profile.save();
    });

    it('应该能更新统计信息', async () => {
      savedProfile.stats.momentsCount = 10;
      savedProfile.stats.locationsCount = 5;
      savedProfile.stats.achievementsCount = 3;
      savedProfile.stats.viewsCount = 100;
      savedProfile.stats.likesCount = 25;
      await savedProfile.save();

      expect(savedProfile.stats.momentsCount).toBe(10);
      expect(savedProfile.stats.locationsCount).toBe(5);
      expect(savedProfile.stats.achievementsCount).toBe(3);
      expect(savedProfile.stats.viewsCount).toBe(100);
      expect(savedProfile.stats.likesCount).toBe(25);
    });

    it('应该拒绝负数统计', async () => {
      savedProfile.stats.momentsCount = -1;

      await expect(savedProfile.save()).rejects.toThrow();
    });
  });

  describe('档案设置', () => {
    let savedProfile;

    beforeEach(async () => {
      const profile = new Profile(testProfile);
      savedProfile = await profile.save();
    });

    it('应该能更新档案设置', async () => {
      savedProfile.settings.allowComments = false;
      savedProfile.settings.allowSharing = true;
      savedProfile.settings.theme = 'dark';
      savedProfile.settings.layout = 'grid';
      await savedProfile.save();

      expect(savedProfile.settings.allowComments).toBe(false);
      expect(savedProfile.settings.allowSharing).toBe(true);
      expect(savedProfile.settings.theme).toBe('dark');
      expect(savedProfile.settings.layout).toBe('grid');
    });

    it('应该能添加自定义设置', async () => {
      savedProfile.settings.customSettings = {
        autoSave: true,
        notifications: false,
        language: 'zh-CN'
      };
      await savedProfile.save();

      expect(savedProfile.settings.customSettings.autoSave).toBe(true);
      expect(savedProfile.settings.customSettings.notifications).toBe(false);
      expect(savedProfile.settings.customSettings.language).toBe('zh-CN');
    });
  });

  describe('元数据管理', () => {
    let savedProfile;

    beforeEach(async () => {
      const profile = new Profile(testProfile);
      savedProfile = await profile.save();
    });

    it('应该能更新元数据', async () => {
      savedProfile.metadata.category = '工作';
      savedProfile.metadata.startDate = new Date('2024-06-01');
      savedProfile.metadata.endDate = new Date('2024-12-31');
      savedProfile.metadata.location = '上海市';
      await savedProfile.save();

      expect(savedProfile.metadata.category).toBe('工作');
      expect(savedProfile.metadata.startDate).toEqual(new Date('2024-06-01'));
      expect(savedProfile.metadata.endDate).toEqual(new Date('2024-12-31'));
      expect(savedProfile.metadata.location).toBe('上海市');
    });

    it('应该验证日期范围', async () => {
      savedProfile.metadata.startDate = new Date('2024-12-31');
      savedProfile.metadata.endDate = new Date('2024-01-01'); // 结束日期早于开始日期

      await expect(savedProfile.save()).rejects.toThrow();
    });

    it('应该能添加自定义元数据', async () => {
      savedProfile.metadata.customData = {
        budget: 10000,
        priority: 'high',
        tags: ['重要', '紧急']
      };
      await savedProfile.save();

      expect(savedProfile.metadata.customData.budget).toBe(10000);
      expect(savedProfile.metadata.customData.priority).toBe('high');
      expect(savedProfile.metadata.customData.tags).toContain('重要');
    });
  });

  describe('索引', () => {
    it('应该在ownerId和name上有复合唯一索引', async () => {
      const indexes = await Profile.collection.getIndexes();
      const compoundIndex = Object.keys(indexes).find(key => {
        const index = indexes[key];
        return index.some(field => field[0] === 'ownerId') && 
               index.some(field => field[0] === 'name');
      });
      expect(compoundIndex).toBeDefined();
    });

    it('应该在type上有索引', async () => {
      const indexes = await Profile.collection.getIndexes();
      const typeIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'type')
      );
      expect(typeIndex).toBeDefined();
    });

    it('应该在isPublic上有索引', async () => {
      const indexes = await Profile.collection.getIndexes();
      const publicIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'isPublic')
      );
      expect(publicIndex).toBeDefined();
    });

    it('应该在tags上有索引', async () => {
      const indexes = await Profile.collection.getIndexes();
      const tagsIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'tags')
      );
      expect(tagsIndex).toBeDefined();
    });
  });

  describe('中间件', () => {
    it('应该自动更新updatedAt字段', async () => {
      const profile = new Profile(testProfile);
      await profile.save();
      
      const originalUpdatedAt = profile.updatedAt;
      
      // 等待一毫秒确保时间不同
      await new Promise(resolve => setTimeout(resolve, 1));
      
      profile.description = '更新的描述';
      await profile.save();
      
      expect(profile.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('查询方法', () => {
    let profiles;

    beforeEach(async () => {
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();

      profiles = [
        new Profile({ ...testProfile, name: 'profile1', type: 'personal', isPublic: true }),
        new Profile({ ...testProfile, name: 'profile2', type: 'work', isPublic: false }),
        new Profile({ ...testProfile, name: 'profile3', type: 'travel', isPublic: true, ownerId: anotherUser._id }),
        new Profile({ ...testProfile, name: 'profile4', type: 'personal', isActive: false })
      ];
      
      for (const profile of profiles) {
        await profile.save();
      }
    });

    it('应该能按所有者查找档案', async () => {
      const userProfiles = await Profile.find({ ownerId: testUser._id });
      expect(userProfiles.length).toBe(3);
    });

    it('应该能按类型查找档案', async () => {
      const personalProfiles = await Profile.find({ type: 'personal' });
      expect(personalProfiles.length).toBe(2);
    });

    it('应该能查找公开档案', async () => {
      const publicProfiles = await Profile.find({ isPublic: true });
      expect(publicProfiles.length).toBe(2);
    });

    it('应该能查找活跃档案', async () => {
      const activeProfiles = await Profile.find({ isActive: true });
      expect(activeProfiles.length).toBe(3);
    });

    it('应该能按标签查找档案', async () => {
      const taggedProfiles = await Profile.find({ tags: { $in: ['测试'] } });
      expect(taggedProfiles.length).toBe(4);
    });
  });

  describe('虚拟字段', () => {
    let savedProfile;

    beforeEach(async () => {
      const profile = new Profile(testProfile);
      savedProfile = await profile.save();
    });

    it('应该正确计算协作者数量', async () => {
      const anotherUser = await createTestUser();
      anotherUser.email = 'another@example.com';
      anotherUser.username = 'anotheruser';
      await anotherUser.save();

      savedProfile.collaborators.push({
        userId: anotherUser._id,
        role: 'editor',
        permissions: ['read', 'write']
      });
      await savedProfile.save();

      expect(savedProfile.collaboratorsCount).toBe(1);
    });

    it('应该正确计算总统计数', async () => {
      savedProfile.stats.momentsCount = 10;
      savedProfile.stats.locationsCount = 5;
      savedProfile.stats.achievementsCount = 3;
      await savedProfile.save();

      expect(savedProfile.totalStats).toBe(18);
    });
  });

  describe('JSON序列化', () => {
    let savedProfile;

    beforeEach(async () => {
      const profile = new Profile(testProfile);
      savedProfile = await profile.save();
    });

    it('应该在JSON中包含虚拟字段', () => {
      const profileJSON = savedProfile.toJSON();
      expect(profileJSON.collaboratorsCount).toBeDefined();
      expect(profileJSON.totalStats).toBeDefined();
    });

    it('应该在JSON中隐藏版本字段', () => {
      const profileJSON = savedProfile.toJSON();
      expect(profileJSON.__v).toBeUndefined();
    });
  });

  describe('档案状态管理', () => {
    let savedProfile;

    beforeEach(async () => {
      const profile = new Profile(testProfile);
      savedProfile = await profile.save();
    });

    it('应该能激活档案', async () => {
      savedProfile.isActive = false;
      await savedProfile.save();
      
      savedProfile.isActive = true;
      await savedProfile.save();
      
      expect(savedProfile.isActive).toBe(true);
    });

    it('应该能停用档案', async () => {
      savedProfile.isActive = false;
      await savedProfile.save();
      
      expect(savedProfile.isActive).toBe(false);
    });

    it('应该能切换公开状态', async () => {
      savedProfile.isPublic = true;
      await savedProfile.save();
      
      expect(savedProfile.isPublic).toBe(true);
      
      savedProfile.isPublic = false;
      await savedProfile.save();
      
      expect(savedProfile.isPublic).toBe(false);
    });
  });
});