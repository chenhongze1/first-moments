const mongoose = require('mongoose');
const AchievementTemplate = require('../../../src/models/AchievementTemplate');

describe('AchievementTemplate Model', () => {
  afterEach(async () => {
    await AchievementTemplate.deleteMany({});
  });

  describe('模板创建', () => {
    it('应该成功创建成就模板', async () => {
      const templateData = {
        name: '首次记录',
        description: '创建你的第一条时光记录',
        category: 'milestone',
        icon: 'star',
        points: 50,
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      };

      const template = new AchievementTemplate(templateData);
      const savedTemplate = await template.save();

      expect(savedTemplate._id).toBeDefined();
      expect(savedTemplate.name).toBe('首次记录');
      expect(savedTemplate.description).toBe('创建你的第一条时光记录');
      expect(savedTemplate.category).toBe('milestone');
      expect(savedTemplate.icon).toBe('star');
      expect(savedTemplate.points).toBe(50);
      expect(savedTemplate.conditions.type).toBe('count');
      expect(savedTemplate.conditions.target).toBe(1);
      expect(savedTemplate.conditions.metric).toBe('moments_created');
      expect(savedTemplate.createdAt).toBeDefined();
      expect(savedTemplate.updatedAt).toBeDefined();
    });

    it('应该设置默认值', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: '测试描述',
        category: 'milestone',
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      });
      const savedTemplate = await template.save();

      expect(savedTemplate.icon).toBe('trophy');
      expect(savedTemplate.points).toBe(10);
      expect(savedTemplate.isActive).toBe(true);
      expect(savedTemplate.order).toBe(0);
    });

    it('应该拒绝重复的名称', async () => {
      const templateData = {
        name: '重复名称',
        description: '描述1',
        category: 'milestone',
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      };

      await new AchievementTemplate(templateData).save();

      const duplicateTemplate = new AchievementTemplate({
        ...templateData,
        description: '描述2'
      });
      await expect(duplicateTemplate.save()).rejects.toThrow();
    });
  });

  describe('数据验证', () => {
    it('应该要求必填字段', async () => {
      const template = new AchievementTemplate({});
      const error = template.validateSync();

      expect(error.errors.name).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.category).toBeDefined();
      expect(error.errors.conditions).toBeDefined();
    });

    it('应该验证名称长度', async () => {
      const template = new AchievementTemplate({
        name: 'a'.repeat(101), // 超过100字符
        description: '测试描述',
        category: 'milestone',
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      });
      const error = template.validateSync();

      expect(error.errors.name).toBeDefined();
    });

    it('应该验证描述长度', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: 'a'.repeat(501), // 超过500字符
        category: 'milestone',
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      });
      const error = template.validateSync();

      expect(error.errors.description).toBeDefined();
    });

    it('应该验证类别枚举值', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: '测试描述',
        category: 'invalid_category',
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      });
      const error = template.validateSync();

      expect(error.errors.category).toBeDefined();
    });

    it('应该验证积分为正数', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: '测试描述',
        category: 'milestone',
        points: -10,
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      });
      const error = template.validateSync();

      expect(error.errors.points).toBeDefined();
    });

    it('应该验证排序为非负数', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: '测试描述',
        category: 'milestone',
        order: -1,
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      });
      const error = template.validateSync();

      expect(error.errors.order).toBeDefined();
    });
  });

  describe('条件验证', () => {
    it('应该验证条件类型', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: '测试描述',
        category: 'milestone',
        conditions: {
          type: 'invalid_type',
          target: 1,
          metric: 'moments_created'
        }
      });
      const error = template.validateSync();

      expect(error.errors['conditions.type']).toBeDefined();
    });

    it('应该验证目标值为正数', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: '测试描述',
        category: 'milestone',
        conditions: {
          type: 'count',
          target: 0,
          metric: 'moments_created'
        }
      });
      const error = template.validateSync();

      expect(error.errors['conditions.target']).toBeDefined();
    });

    it('应该验证指标名称', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: '测试描述',
        category: 'milestone',
        conditions: {
          type: 'count',
          target: 1,
          metric: ''
        }
      });
      const error = template.validateSync();

      expect(error.errors['conditions.metric']).toBeDefined();
    });

    it('应该支持连续类型条件', async () => {
      const template = new AchievementTemplate({
        name: '连续记录',
        description: '连续7天记录',
        category: 'habit',
        conditions: {
          type: 'streak',
          target: 7,
          metric: 'daily_moments',
          timeframe: 'days'
        }
      });
      const savedTemplate = await template.save();

      expect(savedTemplate.conditions.type).toBe('streak');
      expect(savedTemplate.conditions.timeframe).toBe('days');
    });

    it('应该支持里程碑类型条件', async () => {
      const template = new AchievementTemplate({
        name: '里程碑成就',
        description: '达到特定里程碑',
        category: 'milestone',
        conditions: {
          type: 'milestone',
          target: 100,
          metric: 'total_moments'
        }
      });
      const savedTemplate = await template.save();

      expect(savedTemplate.conditions.type).toBe('milestone');
    });
  });

  describe('索引', () => {
    it('应该有name的唯一索引', async () => {
      const indexes = await AchievementTemplate.collection.getIndexes();
      expect(indexes).toHaveProperty('name_1');
    });

    it('应该有category索引', async () => {
      const indexes = await AchievementTemplate.collection.getIndexes();
      expect(indexes).toHaveProperty('category_1');
    });

    it('应该有isActive索引', async () => {
      const indexes = await AchievementTemplate.collection.getIndexes();
      expect(indexes).toHaveProperty('isActive_1');
    });

    it('应该有order索引', async () => {
      const indexes = await AchievementTemplate.collection.getIndexes();
      expect(indexes).toHaveProperty('order_1');
    });
  });

  describe('中间件', () => {
    it('应该在保存时自动更新updatedAt字段', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: '测试描述',
        category: 'milestone',
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      });
      const savedTemplate = await template.save();
      const originalUpdatedAt = savedTemplate.updatedAt;

      // 等待一毫秒确保时间差异
      await new Promise(resolve => setTimeout(resolve, 1));
      
      savedTemplate.description = '更新的描述';
      const updatedTemplate = await savedTemplate.save();

      expect(updatedTemplate.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('查询方法', () => {
    beforeEach(async () => {
      // 创建测试数据
      await AchievementTemplate.create([
        {
          name: '活跃模板',
          description: '活跃的成就模板',
          category: 'milestone',
          isActive: true,
          order: 1,
          conditions: {
            type: 'count',
            target: 1,
            metric: 'moments_created'
          }
        },
        {
          name: '非活跃模板',
          description: '非活跃的成就模板',
          category: 'habit',
          isActive: false,
          order: 2,
          conditions: {
            type: 'streak',
            target: 7,
            metric: 'daily_moments'
          }
        },
        {
          name: '社交模板',
          description: '社交类成就模板',
          category: 'social',
          isActive: true,
          order: 3,
          conditions: {
            type: 'count',
            target: 10,
            metric: 'friends_added'
          }
        }
      ]);
    });

    it('应该能按活跃状态查找模板', async () => {
      const activeTemplates = await AchievementTemplate.find({ isActive: true });
      const inactiveTemplates = await AchievementTemplate.find({ isActive: false });
      
      expect(activeTemplates).toHaveLength(2);
      expect(inactiveTemplates).toHaveLength(1);
    });

    it('应该能按类别查找模板', async () => {
      const milestoneTemplates = await AchievementTemplate.find({ category: 'milestone' });
      const habitTemplates = await AchievementTemplate.find({ category: 'habit' });
      const socialTemplates = await AchievementTemplate.find({ category: 'social' });
      
      expect(milestoneTemplates).toHaveLength(1);
      expect(habitTemplates).toHaveLength(1);
      expect(socialTemplates).toHaveLength(1);
    });

    it('应该能按排序查找模板', async () => {
      const templates = await AchievementTemplate.find({}).sort({ order: 1 });
      
      expect(templates[0].order).toBe(1);
      expect(templates[1].order).toBe(2);
      expect(templates[2].order).toBe(3);
    });

    it('应该能按条件类型查找模板', async () => {
      const countTemplates = await AchievementTemplate.find({ 'conditions.type': 'count' });
      const streakTemplates = await AchievementTemplate.find({ 'conditions.type': 'streak' });
      
      expect(countTemplates).toHaveLength(2);
      expect(streakTemplates).toHaveLength(1);
    });
  });

  describe('虚拟字段', () => {
    it('应该计算难度等级', async () => {
      const easyTemplate = new AchievementTemplate({
        name: '简单成就',
        description: '简单的成就',
        category: 'milestone',
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      });
      
      const hardTemplate = new AchievementTemplate({
        name: '困难成就',
        description: '困难的成就',
        category: 'milestone',
        conditions: {
          type: 'count',
          target: 1000,
          metric: 'moments_created'
        }
      });
      
      expect(easyTemplate.difficulty).toBe('easy');
      expect(hardTemplate.difficulty).toBe('hard');
    });
  });

  describe('JSON序列化', () => {
    it('应该包含虚拟字段', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: '测试描述',
        category: 'milestone',
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      });
      const savedTemplate = await template.save();
      const json = savedTemplate.toJSON();

      expect(json.id).toBeDefined();
      expect(json.difficulty).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  describe('模板管理', () => {
    it('应该能激活模板', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: '测试描述',
        category: 'milestone',
        isActive: false,
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      });
      await template.save();

      template.isActive = true;
      const updatedTemplate = await template.save();

      expect(updatedTemplate.isActive).toBe(true);
    });

    it('应该能停用模板', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: '测试描述',
        category: 'milestone',
        isActive: true,
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      });
      await template.save();

      template.isActive = false;
      const updatedTemplate = await template.save();

      expect(updatedTemplate.isActive).toBe(false);
    });

    it('应该能更新排序', async () => {
      const template = new AchievementTemplate({
        name: '测试成就',
        description: '测试描述',
        category: 'milestone',
        order: 1,
        conditions: {
          type: 'count',
          target: 1,
          metric: 'moments_created'
        }
      });
      await template.save();

      template.order = 5;
      const updatedTemplate = await template.save();

      expect(updatedTemplate.order).toBe(5);
    });
  });
});