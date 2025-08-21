const request = require('supertest');
const express = require('express');
const momentRoutes = require('../../../src/routes/moments');
const Moment = require('../../../src/models/Moment');
const Profile = require('../../../src/models/Profile');
const User = require('../../../src/models/User');
const { authenticateToken } = require('../../../src/middleware/auth');
const multer = require('multer');
const path = require('path');

// Mock dependencies
jest.mock('../../../src/models/Moment');
jest.mock('../../../src/models/Profile');
jest.mock('../../../src/models/User');
jest.mock('../../../src/middleware/auth');
jest.mock('multer');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/moments', momentRoutes);

describe('Moment Routes', () => {
  let mockUser;
  let mockProfile;
  let mockMoment;
  let mockComment;

  beforeEach(() => {
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    mockProfile = {
      _id: '507f1f77bcf86cd799439013',
      name: 'Test Profile',
      owner: mockUser._id,
      collaborators: [],
      isPublic: true,
      settings: {
        allowComments: true,
        allowLikes: true
      }
    };

    mockComment = {
      _id: '507f1f77bcf86cd799439016',
      user: mockUser._id,
      content: 'Test comment',
      createdAt: new Date()
    };

    mockMoment = {
      _id: '507f1f77bcf86cd799439015',
      title: 'Test Moment',
      content: 'Test moment content',
      user: mockUser._id,
      profile: mockProfile._id,
      media: [
        {
          type: 'image',
          url: '/uploads/images/test.jpg',
          filename: 'test.jpg',
          size: 1024000
        }
      ],
      location: {
        type: 'Point',
        coordinates: [116.4074, 39.9042],
        address: 'Beijing, China'
      },
      tags: ['travel', 'photography'],
      mood: 'happy',
      weather: 'sunny',
      isPublic: true,
      likes: [],
      comments: [mockComment],
      stats: {
        likesCount: 0,
        commentsCount: 1,
        viewsCount: 5
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(this),
      populate: jest.fn().mockResolvedValue(this)
    };

    // Mock authentication middleware
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });

    // Mock multer
    const mockMulter = {
      array: jest.fn().mockReturnValue((req, res, next) => {
        req.files = [
          {
            fieldname: 'media',
            originalname: 'test.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            destination: 'uploads/images',
            filename: 'test.jpg',
            path: 'uploads/images/test.jpg',
            size: 1024000
          }
        ];
        next();
      })
    };
    multer.mockReturnValue(mockMulter);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/moments', () => {
    it('应该成功获取记录列表', async () => {
      const mockMoments = [mockMoment];

      Moment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue(mockMoments)
            })
          })
        })
      });

      Moment.countDocuments = jest.fn().mockResolvedValue(1);

      const response = await request(app)
        .get('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moments).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('应该支持按档案筛选', async () => {
      const profileId = mockProfile._id;

      Moment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockMoment])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/moments?profile=${profileId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Moment.find).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: profileId
        })
      );
    });

    it('应该支持按标签筛选', async () => {
      const tags = 'travel,photography';

      Moment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockMoment])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/moments?tags=${tags}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Moment.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: { $in: ['travel', 'photography'] }
        })
      );
    });

    it('应该支持按日期范围筛选', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      Moment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockMoment])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/moments?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Moment.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        })
      );
    });

    it('应该支持搜索功能', async () => {
      const search = 'test';

      Moment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockMoment])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/moments?search=${search}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Moment.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $and: expect.arrayContaining([
            {
              $or: [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
              ]
            }
          ])
        })
      );
    });

    it('应该支持分页查询', async () => {
      const page = 2;
      const limit = 5;

      Moment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      Moment.countDocuments = jest.fn().mockResolvedValue(15);

      const response = await request(app)
        .get(`/api/moments?page=${page}&limit=${limit}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(page);
      expect(response.body.data.pagination.limit).toBe(limit);
      expect(response.body.data.pagination.totalPages).toBe(3);
    });

    it('应该只返回用户有权限访问的记录', async () => {
      Moment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockMoment])
            })
          })
        })
      });

      await request(app)
        .get('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(Moment.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { user: mockUser._id },
            { isPublic: true }
          ]
        })
      );
    });
  });

  describe('GET /api/moments/:id', () => {
    it('应该成功获取记录详情', async () => {
      Moment.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMoment)
      });

      const response = await request(app)
        .get(`/api/moments/${mockMoment._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moment).toBeDefined();
      expect(Moment.findById).toHaveBeenCalledWith(mockMoment._id);
    });

    it('应该在记录不存在时返回404', async () => {
      Moment.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get('/api/moments/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('记录不存在');
    });

    it('应该检查用户访问权限', async () => {
      const privateMoment = {
        ...mockMoment,
        isPublic: false,
        user: 'other-user-id'
      };

      Moment.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(privateMoment)
      });

      const response = await request(app)
        .get(`/api/moments/${mockMoment._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限访问此记录');
    });

    it('应该增加浏览次数', async () => {
      const momentWithViews = {
        ...mockMoment,
        stats: {
          ...mockMoment.stats,
          viewsCount: 5
        },
        save: jest.fn().mockResolvedValue(this)
      };

      Moment.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(momentWithViews)
      });

      const response = await request(app)
        .get(`/api/moments/${mockMoment._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(momentWithViews.stats.viewsCount).toBe(6);
      expect(momentWithViews.save).toHaveBeenCalled();
    });
  });

  describe('POST /api/moments', () => {
    it('应该成功创建记录', async () => {
      const momentData = {
        title: 'New Moment',
        content: 'New moment content',
        profileId: mockProfile._id,
        tags: ['test'],
        mood: 'happy',
        isPublic: true
      };

      const newMoment = {
        ...mockMoment,
        ...momentData,
        user: mockUser._id,
        profile: mockProfile._id
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);
      Moment.prototype.save = jest.fn().mockResolvedValue(newMoment);
      Moment.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(newMoment)
      });

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .send(momentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('记录创建成功');
      expect(response.body.data.moment.title).toBe(momentData.title);
    });

    it('应该验证必填字段', async () => {
      const incompleteData = {
        content: 'Missing title',
        profileId: mockProfile._id
      };

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('标题是必填项');
    });

    it('应该验证档案存在和权限', async () => {
      const momentData = {
        title: 'New Moment',
        content: 'New moment content',
        profileId: 'nonexistent-profile-id'
      };

      Profile.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .send(momentData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('档案不存在');
    });

    it('应该检查档案访问权限', async () => {
      const momentData = {
        title: 'New Moment',
        content: 'New moment content',
        profileId: mockProfile._id
      };

      const otherUserProfile = {
        ...mockProfile,
        owner: 'other-user-id',
        collaborators: []
      };

      Profile.findById = jest.fn().mockResolvedValue(otherUserProfile);

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .send(momentData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限在此档案中创建记录');
    });

    it('应该验证标题长度', async () => {
      const invalidData = {
        title: 'a'.repeat(201), // 太长
        content: 'Valid content',
        profileId: mockProfile._id
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('标题长度不能超过');
    });

    it('应该验证内容长度', async () => {
      const invalidData = {
        title: 'Valid Title',
        content: 'a'.repeat(5001), // 太长
        profileId: mockProfile._id
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('内容长度不能超过');
    });

    it('应该验证标签数量', async () => {
      const invalidData = {
        title: 'Valid Title',
        content: 'Valid content',
        profileId: mockProfile._id,
        tags: Array(21).fill('tag') // 太多标签
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('标签数量不能超过');
    });
  });

  describe('PUT /api/moments/:id', () => {
    it('应该成功更新记录', async () => {
      const updateData = {
        title: 'Updated Moment',
        content: 'Updated content',
        tags: ['updated'],
        mood: 'excited'
      };

      const updatedMoment = {
        ...mockMoment,
        ...updateData,
        save: jest.fn().mockResolvedValue(this)
      };

      Moment.findById = jest.fn().mockResolvedValue(updatedMoment);

      const response = await request(app)
        .put(`/api/moments/${mockMoment._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('记录更新成功');
      expect(updatedMoment.save).toHaveBeenCalled();
    });

    it('应该检查更新权限', async () => {
      const updateData = {
        title: 'Updated Moment'
      };

      const otherUserMoment = {
        ...mockMoment,
        user: 'other-user-id'
      };

      Moment.findById = jest.fn().mockResolvedValue(otherUserMoment);

      const response = await request(app)
        .put(`/api/moments/${mockMoment._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限修改此记录');
    });

    it('应该在记录不存在时返回404', async () => {
      const updateData = {
        title: 'Updated Moment'
      };

      Moment.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/moments/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('记录不存在');
    });

    it('应该验证更新数据', async () => {
      const invalidData = {
        title: '', // 空标题
        content: 'a'.repeat(5001) // 太长
      };

      Moment.findById = jest.fn().mockResolvedValue(mockMoment);

      const response = await request(app)
        .put(`/api/moments/${mockMoment._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });

    it('应该防止修改只读字段', async () => {
      const invalidData = {
        user: 'other-user-id', // 只读字段
        createdAt: new Date(), // 只读字段
        stats: { likesCount: 100 } // 只读字段
      };

      Moment.findById = jest.fn().mockResolvedValue(mockMoment);

      const response = await request(app)
        .put(`/api/moments/${mockMoment._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不允许修改只读字段');
    });
  });

  describe('DELETE /api/moments/:id', () => {
    it('应该成功删除记录', async () => {
      Moment.findById = jest.fn().mockResolvedValue(mockMoment);
      Moment.findByIdAndDelete = jest.fn().mockResolvedValue(mockMoment);

      const response = await request(app)
        .delete(`/api/moments/${mockMoment._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('记录删除成功');
      expect(Moment.findByIdAndDelete).toHaveBeenCalledWith(mockMoment._id);
    });

    it('应该检查删除权限', async () => {
      const otherUserMoment = {
        ...mockMoment,
        user: 'other-user-id'
      };

      Moment.findById = jest.fn().mockResolvedValue(otherUserMoment);

      const response = await request(app)
        .delete(`/api/moments/${mockMoment._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限删除此记录');
    });

    it('应该在记录不存在时返回404', async () => {
      Moment.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/moments/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('记录不存在');
    });

    it('应该处理删除失败', async () => {
      Moment.findById = jest.fn().mockResolvedValue(mockMoment);
      Moment.findByIdAndDelete = jest.fn().mockRejectedValue(
        new Error('删除失败')
      );

      const response = await request(app)
        .delete(`/api/moments/${mockMoment._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('删除记录失败');
    });
  });

  describe('POST /api/moments/:id/like', () => {
    it('应该成功点赞记录', async () => {
      const momentToLike = {
        ...mockMoment,
        likes: [],
        stats: {
          ...mockMoment.stats,
          likesCount: 0
        },
        save: jest.fn().mockResolvedValue(this)
      };

      Moment.findById = jest.fn().mockResolvedValue(momentToLike);

      const response = await request(app)
        .post(`/api/moments/${mockMoment._id}/like`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('点赞成功');
      expect(momentToLike.likes).toContain(mockUser._id);
      expect(momentToLike.stats.likesCount).toBe(1);
      expect(momentToLike.save).toHaveBeenCalled();
    });

    it('应该成功取消点赞', async () => {
      const likedMoment = {
        ...mockMoment,
        likes: [mockUser._id],
        stats: {
          ...mockMoment.stats,
          likesCount: 1
        },
        save: jest.fn().mockResolvedValue(this)
      };

      Moment.findById = jest.fn().mockResolvedValue(likedMoment);

      const response = await request(app)
        .post(`/api/moments/${mockMoment._id}/like`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('取消点赞成功');
      expect(likedMoment.likes).not.toContain(mockUser._id);
      expect(likedMoment.stats.likesCount).toBe(0);
      expect(likedMoment.save).toHaveBeenCalled();
    });

    it('应该检查记录访问权限', async () => {
      const privateMoment = {
        ...mockMoment,
        isPublic: false,
        user: 'other-user-id'
      };

      Moment.findById = jest.fn().mockResolvedValue(privateMoment);

      const response = await request(app)
        .post(`/api/moments/${mockMoment._id}/like`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限访问此记录');
    });

    it('应该检查档案点赞设置', async () => {
      const momentWithDisabledLikes = {
        ...mockMoment,
        profile: {
          ...mockProfile,
          settings: {
            ...mockProfile.settings,
            allowLikes: false
          }
        }
      };

      Moment.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(momentWithDisabledLikes)
      });

      const response = await request(app)
        .post(`/api/moments/${mockMoment._id}/like`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('此档案不允许点赞');
    });
  });

  describe('POST /api/moments/:id/comments', () => {
    it('应该成功添加评论', async () => {
      const commentData = {
        content: 'Great moment!'
      };

      const momentWithComment = {
        ...mockMoment,
        comments: [],
        stats: {
          ...mockMoment.stats,
          commentsCount: 0
        },
        save: jest.fn().mockResolvedValue(this)
      };

      Moment.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(momentWithComment)
      });

      const response = await request(app)
        .post(`/api/moments/${mockMoment._id}/comments`)
        .set('Authorization', 'Bearer valid-token')
        .send(commentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('评论添加成功');
      expect(momentWithComment.comments).toHaveLength(1);
      expect(momentWithComment.stats.commentsCount).toBe(1);
      expect(momentWithComment.save).toHaveBeenCalled();
    });

    it('应该验证评论内容', async () => {
      const invalidData = {
        content: '' // 空内容
      };

      const response = await request(app)
        .post(`/api/moments/${mockMoment._id}/comments`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('评论内容不能为空');
    });

    it('应该验证评论长度', async () => {
      const invalidData = {
        content: 'a'.repeat(1001) // 太长
      };

      const response = await request(app)
        .post(`/api/moments/${mockMoment._id}/comments`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('评论长度不能超过');
    });

    it('应该检查档案评论设置', async () => {
      const momentWithDisabledComments = {
        ...mockMoment,
        profile: {
          ...mockProfile,
          settings: {
            ...mockProfile.settings,
            allowComments: false
          }
        }
      };

      Moment.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(momentWithDisabledComments)
      });

      const commentData = {
        content: 'Great moment!'
      };

      const response = await request(app)
        .post(`/api/moments/${mockMoment._id}/comments`)
        .set('Authorization', 'Bearer valid-token')
        .send(commentData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('此档案不允许评论');
    });
  });

  describe('DELETE /api/moments/:id/comments/:commentId', () => {
    it('应该成功删除评论', async () => {
      const momentWithComments = {
        ...mockMoment,
        comments: [mockComment],
        stats: {
          ...mockMoment.stats,
          commentsCount: 1
        },
        save: jest.fn().mockResolvedValue(this)
      };

      Moment.findById = jest.fn().mockResolvedValue(momentWithComments);

      const response = await request(app)
        .delete(`/api/moments/${mockMoment._id}/comments/${mockComment._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('评论删除成功');
      expect(momentWithComments.comments).toHaveLength(0);
      expect(momentWithComments.stats.commentsCount).toBe(0);
      expect(momentWithComments.save).toHaveBeenCalled();
    });

    it('应该检查删除权限', async () => {
      const otherUserComment = {
        ...mockComment,
        user: 'other-user-id'
      };

      const momentWithComments = {
        ...mockMoment,
        user: 'other-user-id', // 记录也不是当前用户的
        comments: [otherUserComment]
      };

      Moment.findById = jest.fn().mockResolvedValue(momentWithComments);

      const response = await request(app)
        .delete(`/api/moments/${mockMoment._id}/comments/${otherUserComment._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限删除此评论');
    });

    it('应该在评论不存在时返回404', async () => {
      const momentWithoutComment = {
        ...mockMoment,
        comments: []
      };

      Moment.findById = jest.fn().mockResolvedValue(momentWithoutComment);

      const response = await request(app)
        .delete(`/api/moments/${mockMoment._id}/comments/nonexistent-comment-id`)
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('评论不存在');
    });
  });

  describe('POST /api/moments/upload', () => {
    it('应该成功上传媒体文件', async () => {
      const response = await request(app)
        .post('/api/moments/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('media', Buffer.from('fake image data'), 'test.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('文件上传成功');
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.files[0]).toHaveProperty('url');
      expect(response.body.data.files[0]).toHaveProperty('filename');
    });

    it('应该在没有文件时返回错误', async () => {
      // Mock multer to not add files
      const mockMulter = {
        array: jest.fn().mockReturnValue((req, res, next) => {
          req.files = [];
          next();
        })
      };
      multer.mockReturnValue(mockMulter);

      const response = await request(app)
        .post('/api/moments/upload')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有上传文件');
    });

    it('应该验证文件类型', async () => {
      const mockMulter = {
        array: jest.fn().mockReturnValue((req, res, next) => {
          req.files = [
            {
              fieldname: 'media',
              originalname: 'test.txt',
              mimetype: 'text/plain', // 不支持的类型
              size: 1024
            }
          ];
          next();
        })
      };
      multer.mockReturnValue(mockMulter);

      const response = await request(app)
        .post('/api/moments/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('media', Buffer.from('text content'), 'test.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不支持的文件类型');
    });

    it('应该验证文件大小', async () => {
      const mockMulter = {
        array: jest.fn().mockReturnValue((req, res, next) => {
          req.files = [
            {
              fieldname: 'media',
              originalname: 'large.jpg',
              mimetype: 'image/jpeg',
              size: 11 * 1024 * 1024 // 11MB，超过限制
            }
          ];
          next();
        })
      };
      multer.mockReturnValue(mockMulter);

      const response = await request(app)
        .post('/api/moments/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('media', Buffer.alloc(11 * 1024 * 1024), 'large.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('文件大小超过限制');
    });
  });

  describe('GET /api/moments/stats', () => {
    it('应该成功获取记录统计信息', async () => {
      const mockStats = {
        totalMoments: 25,
        publicMoments: 20,
        privateMoments: 5,
        totalLikes: 150,
        totalComments: 75,
        totalViews: 500
      };

      Moment.countDocuments = jest.fn()
        .mockResolvedValueOnce(mockStats.totalMoments)
        .mockResolvedValueOnce(mockStats.publicMoments)
        .mockResolvedValueOnce(mockStats.privateMoments);

      Moment.aggregate = jest.fn()
        .mockResolvedValueOnce([{ _id: null, total: mockStats.totalLikes }])
        .mockResolvedValueOnce([{ _id: null, total: mockStats.totalComments }])
        .mockResolvedValueOnce([{ _id: null, total: mockStats.totalViews }]);

      const response = await request(app)
        .get('/api/moments/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalMoments).toBe(mockStats.totalMoments);
      expect(response.body.data.stats.publicMoments).toBe(mockStats.publicMoments);
    });

    it('应该支持按档案筛选统计', async () => {
      const profileId = mockProfile._id;

      Moment.countDocuments = jest.fn().mockResolvedValue(10);
      Moment.aggregate = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/moments/stats?profile=${profileId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Moment.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser._id,
          profile: profileId
        })
      );
    });
  });

  describe('错误处理', () => {
    it('应该处理数据库连接错误', async () => {
      Moment.find = jest.fn().mockRejectedValue(
        new Error('数据库连接失败')
      );

      const response = await request(app)
        .get('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('服务器错误');
    });

    it('应该处理无效的ObjectId', async () => {
      const response = await request(app)
        .get('/api/moments/invalid-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的记录ID');
    });

    it('应该处理未认证的请求', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        return res.status(401).json({
          success: false,
          message: '未认证'
        });
      });

      const response = await request(app)
        .get('/api/moments')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未认证');
    });
  });

  describe('输入验证', () => {
    it('应该验证标题格式', async () => {
      const invalidData = {
        title: '   ', // 只有空格
        content: 'Valid content',
        profileId: mockProfile._id
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('标题不能为空');
    });

    it('应该验证标签格式', async () => {
      const invalidData = {
        title: 'Valid Title',
        content: 'Valid content',
        profileId: mockProfile._id,
        tags: ['', 'valid-tag', '   '] // 包含空标签
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('标签不能为空');
    });

    it('应该验证心情值', async () => {
      const invalidData = {
        title: 'Valid Title',
        content: 'Valid content',
        profileId: mockProfile._id,
        mood: 'invalid-mood' // 无效心情
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的心情值');
    });

    it('应该验证地理位置格式', async () => {
      const invalidData = {
        title: 'Valid Title',
        content: 'Valid content',
        profileId: mockProfile._id,
        location: {
          coordinates: [200, 100] // 无效坐标
        }
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/moments')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的地理位置');
    });
  });
});