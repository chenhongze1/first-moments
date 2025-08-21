const request = require('supertest');
const express = require('express');
const locationRoutes = require('../../../src/routes/locations');
const Location = require('../../../src/models/Location');
const Profile = require('../../../src/models/Profile');
const User = require('../../../src/models/User');
const { authenticateToken } = require('../../../src/middleware/auth');

// Mock dependencies
jest.mock('../../../src/models/Location');
jest.mock('../../../src/models/Profile');
jest.mock('../../../src/models/User');
jest.mock('../../../src/middleware/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/locations', locationRoutes);

describe('Location Routes', () => {
  let mockUser;
  let mockProfile;
  let mockLocation;

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
        allowLocationSharing: true
      }
    };

    mockLocation = {
      _id: '507f1f77bcf86cd799439015',
      name: 'Test Location',
      description: 'A test location',
      coordinates: {
        type: 'Point',
        coordinates: [116.4074, 39.9042]
      },
      address: 'Beijing, China',
      category: 'restaurant',
      user: mockUser._id,
      profile: mockProfile._id,
      visits: [
        {
          user: mockUser._id,
          visitedAt: new Date(),
          notes: 'Great place!'
        }
      ],
      photos: [
        {
          url: '/uploads/images/location1.jpg',
          caption: 'Beautiful view'
        }
      ],
      rating: 4.5,
      tags: ['food', 'chinese'],
      isPublic: true,
      stats: {
        visitsCount: 1,
        likesCount: 0,
        photosCount: 1
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

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/locations', () => {
    it('应该成功获取位置列表', async () => {
      const mockLocations = [mockLocation];

      Location.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue(mockLocations)
            })
          })
        })
      });

      Location.countDocuments = jest.fn().mockResolvedValue(1);

      const response = await request(app)
        .get('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('应该支持按档案筛选', async () => {
      const profileId = mockProfile._id;

      Location.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockLocation])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/locations?profile=${profileId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Location.find).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: profileId
        })
      );
    });

    it('应该支持按类别筛选', async () => {
      const category = 'restaurant';

      Location.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockLocation])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/locations?category=${category}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Location.find).toHaveBeenCalledWith(
        expect.objectContaining({
          category: category
        })
      );
    });

    it('应该支持按标签筛选', async () => {
      const tags = 'food,chinese';

      Location.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockLocation])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/locations?tags=${tags}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Location.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: { $in: ['food', 'chinese'] }
        })
      );
    });

    it('应该支持地理位置范围查询', async () => {
      const lat = 39.9042;
      const lng = 116.4074;
      const radius = 1000; // 1km

      Location.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockLocation])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/locations?lat=${lat}&lng=${lng}&radius=${radius}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Location.find).toHaveBeenCalledWith(
        expect.objectContaining({
          coordinates: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              $maxDistance: radius
            }
          }
        })
      );
    });

    it('应该支持搜索功能', async () => {
      const search = 'restaurant';

      Location.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockLocation])
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/locations?search=${search}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Location.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $and: expect.arrayContaining([
            {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
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

      Location.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      Location.countDocuments = jest.fn().mockResolvedValue(15);

      const response = await request(app)
        .get(`/api/locations?page=${page}&limit=${limit}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(page);
      expect(response.body.data.pagination.limit).toBe(limit);
      expect(response.body.data.pagination.totalPages).toBe(3);
    });

    it('应该只返回用户有权限访问的位置', async () => {
      Location.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([mockLocation])
            })
          })
        })
      });

      await request(app)
        .get('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(Location.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { user: mockUser._id },
            { isPublic: true }
          ]
        })
      );
    });
  });

  describe('GET /api/locations/:id', () => {
    it('应该成功获取位置详情', async () => {
      Location.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockLocation)
      });

      const response = await request(app)
        .get(`/api/locations/${mockLocation._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.location).toBeDefined();
      expect(Location.findById).toHaveBeenCalledWith(mockLocation._id);
    });

    it('应该在位置不存在时返回404', async () => {
      Location.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get('/api/locations/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('位置不存在');
    });

    it('应该检查用户访问权限', async () => {
      const privateLocation = {
        ...mockLocation,
        isPublic: false,
        user: 'other-user-id'
      };

      Location.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(privateLocation)
      });

      const response = await request(app)
        .get(`/api/locations/${mockLocation._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限访问此位置');
    });
  });

  describe('POST /api/locations', () => {
    it('应该成功创建位置', async () => {
      const locationData = {
        name: 'New Location',
        description: 'A new location',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        address: 'Beijing, China',
        category: 'restaurant',
        profileId: mockProfile._id,
        tags: ['food'],
        isPublic: true
      };

      const newLocation = {
        ...mockLocation,
        ...locationData,
        user: mockUser._id,
        profile: mockProfile._id
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);
      Location.prototype.save = jest.fn().mockResolvedValue(newLocation);
      Location.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(newLocation)
      });

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .send(locationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('位置创建成功');
      expect(response.body.data.location.name).toBe(locationData.name);
    });

    it('应该验证必填字段', async () => {
      const incompleteData = {
        description: 'Missing name and coordinates',
        profileId: mockProfile._id
      };

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('名称是必填项');
    });

    it('应该验证档案存在和权限', async () => {
      const locationData = {
        name: 'New Location',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        profileId: 'nonexistent-profile-id'
      };

      Profile.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .send(locationData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('档案不存在');
    });

    it('应该检查档案访问权限', async () => {
      const locationData = {
        name: 'New Location',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        profileId: mockProfile._id
      };

      const otherUserProfile = {
        ...mockProfile,
        owner: 'other-user-id',
        collaborators: []
      };

      Profile.findById = jest.fn().mockResolvedValue(otherUserProfile);

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .send(locationData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限在此档案中创建位置');
    });

    it('应该验证坐标格式', async () => {
      const invalidData = {
        name: 'Valid Name',
        coordinates: {
          type: 'Point',
          coordinates: [200, 100] // 无效坐标
        },
        profileId: mockProfile._id
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的地理坐标');
    });

    it('应该验证名称长度', async () => {
      const invalidData = {
        name: 'a'.repeat(201), // 太长
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        profileId: mockProfile._id
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('名称长度不能超过');
    });

    it('应该验证类别值', async () => {
      const invalidData = {
        name: 'Valid Name',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        category: 'invalid-category',
        profileId: mockProfile._id
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的类别');
    });

    it('应该验证评分范围', async () => {
      const invalidData = {
        name: 'Valid Name',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        rating: 6, // 超出范围
        profileId: mockProfile._id
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('评分必须在0-5之间');
    });
  });

  describe('PUT /api/locations/:id', () => {
    it('应该成功更新位置', async () => {
      const updateData = {
        name: 'Updated Location',
        description: 'Updated description',
        category: 'cafe',
        rating: 4.8
      };

      const updatedLocation = {
        ...mockLocation,
        ...updateData,
        save: jest.fn().mockResolvedValue(this)
      };

      Location.findById = jest.fn().mockResolvedValue(updatedLocation);

      const response = await request(app)
        .put(`/api/locations/${mockLocation._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('位置更新成功');
      expect(updatedLocation.save).toHaveBeenCalled();
    });

    it('应该检查更新权限', async () => {
      const updateData = {
        name: 'Updated Location'
      };

      const otherUserLocation = {
        ...mockLocation,
        user: 'other-user-id'
      };

      Location.findById = jest.fn().mockResolvedValue(otherUserLocation);

      const response = await request(app)
        .put(`/api/locations/${mockLocation._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限修改此位置');
    });

    it('应该在位置不存在时返回404', async () => {
      const updateData = {
        name: 'Updated Location'
      };

      Location.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/locations/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('位置不存在');
    });

    it('应该验证更新数据', async () => {
      const invalidData = {
        name: '', // 空名称
        rating: 10 // 超出范围
      };

      Location.findById = jest.fn().mockResolvedValue(mockLocation);

      const response = await request(app)
        .put(`/api/locations/${mockLocation._id}`)
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
        stats: { visitsCount: 100 } // 只读字段
      };

      Location.findById = jest.fn().mockResolvedValue(mockLocation);

      const response = await request(app)
        .put(`/api/locations/${mockLocation._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不允许修改只读字段');
    });
  });

  describe('DELETE /api/locations/:id', () => {
    it('应该成功删除位置', async () => {
      Location.findById = jest.fn().mockResolvedValue(mockLocation);
      Location.findByIdAndDelete = jest.fn().mockResolvedValue(mockLocation);

      const response = await request(app)
        .delete(`/api/locations/${mockLocation._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('位置删除成功');
      expect(Location.findByIdAndDelete).toHaveBeenCalledWith(mockLocation._id);
    });

    it('应该检查删除权限', async () => {
      const otherUserLocation = {
        ...mockLocation,
        user: 'other-user-id'
      };

      Location.findById = jest.fn().mockResolvedValue(otherUserLocation);

      const response = await request(app)
        .delete(`/api/locations/${mockLocation._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限删除此位置');
    });

    it('应该在位置不存在时返回404', async () => {
      Location.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/locations/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('位置不存在');
    });

    it('应该处理删除失败', async () => {
      Location.findById = jest.fn().mockResolvedValue(mockLocation);
      Location.findByIdAndDelete = jest.fn().mockRejectedValue(
        new Error('删除失败')
      );

      const response = await request(app)
        .delete(`/api/locations/${mockLocation._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('删除位置失败');
    });
  });

  describe('POST /api/locations/:id/visit', () => {
    it('应该成功记录访问', async () => {
      const visitData = {
        notes: 'Great experience!',
        rating: 5
      };

      const locationToVisit = {
        ...mockLocation,
        visits: [],
        stats: {
          ...mockLocation.stats,
          visitsCount: 0
        },
        save: jest.fn().mockResolvedValue(this)
      };

      Location.findById = jest.fn().mockResolvedValue(locationToVisit);

      const response = await request(app)
        .post(`/api/locations/${mockLocation._id}/visit`)
        .set('Authorization', 'Bearer valid-token')
        .send(visitData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('访问记录成功');
      expect(locationToVisit.visits).toHaveLength(1);
      expect(locationToVisit.stats.visitsCount).toBe(1);
      expect(locationToVisit.save).toHaveBeenCalled();
    });

    it('应该检查位置访问权限', async () => {
      const visitData = {
        notes: 'Great experience!'
      };

      const privateLocation = {
        ...mockLocation,
        isPublic: false,
        user: 'other-user-id'
      };

      Location.findById = jest.fn().mockResolvedValue(privateLocation);

      const response = await request(app)
        .post(`/api/locations/${mockLocation._id}/visit`)
        .set('Authorization', 'Bearer valid-token')
        .send(visitData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('没有权限访问此位置');
    });

    it('应该验证访问数据', async () => {
      const invalidData = {
        notes: 'a'.repeat(1001), // 太长
        rating: 6 // 超出范围
      };

      Location.findById = jest.fn().mockResolvedValue(mockLocation);

      const response = await request(app)
        .post(`/api/locations/${mockLocation._id}/visit`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });

    it('应该防止重复访问记录', async () => {
      const visitData = {
        notes: 'Another visit'
      };

      const locationWithVisit = {
        ...mockLocation,
        visits: [
          {
            user: mockUser._id,
            visitedAt: new Date(),
            notes: 'Previous visit'
          }
        ]
      };

      Location.findById = jest.fn().mockResolvedValue(locationWithVisit);

      const response = await request(app)
        .post(`/api/locations/${mockLocation._id}/visit`)
        .set('Authorization', 'Bearer valid-token')
        .send(visitData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('今天已经记录过访问');
    });
  });

  describe('POST /api/locations/:id/photos', () => {
    it('应该成功添加照片', async () => {
      const photoData = {
        url: '/uploads/images/new-photo.jpg',
        caption: 'Beautiful sunset'
      };

      const locationWithPhotos = {
        ...mockLocation,
        photos: [],
        stats: {
          ...mockLocation.stats,
          photosCount: 0
        },
        save: jest.fn().mockResolvedValue(this)
      };

      Location.findById = jest.fn().mockResolvedValue(locationWithPhotos);

      const response = await request(app)
        .post(`/api/locations/${mockLocation._id}/photos`)
        .set('Authorization', 'Bearer valid-token')
        .send(photoData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('照片添加成功');
      expect(locationWithPhotos.photos).toHaveLength(1);
      expect(locationWithPhotos.stats.photosCount).toBe(1);
      expect(locationWithPhotos.save).toHaveBeenCalled();
    });

    it('应该验证照片数据', async () => {
      const invalidData = {
        url: '', // 空URL
        caption: 'a'.repeat(501) // 太长
      };

      Location.findById = jest.fn().mockResolvedValue(mockLocation);

      const response = await request(app)
        .post(`/api/locations/${mockLocation._id}/photos`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });

    it('应该限制照片数量', async () => {
      const photoData = {
        url: '/uploads/images/new-photo.jpg',
        caption: 'Another photo'
      };

      const locationWithManyPhotos = {
        ...mockLocation,
        photos: Array(20).fill({
          url: '/uploads/images/photo.jpg',
          caption: 'Photo'
        })
      };

      Location.findById = jest.fn().mockResolvedValue(locationWithManyPhotos);

      const response = await request(app)
        .post(`/api/locations/${mockLocation._id}/photos`)
        .set('Authorization', 'Bearer valid-token')
        .send(photoData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('照片数量已达上限');
    });
  });

  describe('GET /api/locations/nearby', () => {
    it('应该成功获取附近位置', async () => {
      const lat = 39.9042;
      const lng = 116.4074;
      const radius = 1000;

      const nearbyLocations = [mockLocation];

      Location.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(nearbyLocations)
        })
      });

      const response = await request(app)
        .get(`/api/locations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toHaveLength(1);
      expect(Location.find).toHaveBeenCalledWith(
        expect.objectContaining({
          coordinates: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              $maxDistance: radius
            }
          }
        })
      );
    });

    it('应该验证必需的查询参数', async () => {
      const response = await request(app)
        .get('/api/locations/nearby')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('缺少必需的查询参数');
    });

    it('应该验证坐标范围', async () => {
      const lat = 200; // 无效纬度
      const lng = 116.4074;
      const radius = 1000;

      const response = await request(app)
        .get(`/api/locations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的坐标');
    });

    it('应该验证半径范围', async () => {
      const lat = 39.9042;
      const lng = 116.4074;
      const radius = 100000; // 太大

      const response = await request(app)
        .get(`/api/locations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('半径超出允许范围');
    });
  });

  describe('GET /api/locations/stats', () => {
    it('应该成功获取位置统计信息', async () => {
      const mockStats = {
        totalLocations: 25,
        publicLocations: 20,
        privateLocations: 5,
        totalVisits: 150,
        totalPhotos: 75,
        averageRating: 4.2
      };

      Location.countDocuments = jest.fn()
        .mockResolvedValueOnce(mockStats.totalLocations)
        .mockResolvedValueOnce(mockStats.publicLocations)
        .mockResolvedValueOnce(mockStats.privateLocations);

      Location.aggregate = jest.fn()
        .mockResolvedValueOnce([{ _id: null, total: mockStats.totalVisits }])
        .mockResolvedValueOnce([{ _id: null, total: mockStats.totalPhotos }])
        .mockResolvedValueOnce([{ _id: null, average: mockStats.averageRating }]);

      const response = await request(app)
        .get('/api/locations/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalLocations).toBe(mockStats.totalLocations);
      expect(response.body.data.stats.averageRating).toBe(mockStats.averageRating);
    });

    it('应该支持按档案筛选统计', async () => {
      const profileId = mockProfile._id;

      Location.countDocuments = jest.fn().mockResolvedValue(10);
      Location.aggregate = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/locations/stats?profile=${profileId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Location.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser._id,
          profile: profileId
        })
      );
    });
  });

  describe('错误处理', () => {
    it('应该处理数据库连接错误', async () => {
      Location.find = jest.fn().mockRejectedValue(
        new Error('数据库连接失败')
      );

      const response = await request(app)
        .get('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('服务器错误');
    });

    it('应该处理无效的ObjectId', async () => {
      const response = await request(app)
        .get('/api/locations/invalid-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的位置ID');
    });

    it('应该处理未认证的请求', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        return res.status(401).json({
          success: false,
          message: '未认证'
        });
      });

      const response = await request(app)
        .get('/api/locations')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未认证');
    });
  });

  describe('输入验证', () => {
    it('应该验证位置名称格式', async () => {
      const invalidData = {
        name: '   ', // 只有空格
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        profileId: mockProfile._id
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('名称不能为空');
    });

    it('应该验证标签格式', async () => {
      const invalidData = {
        name: 'Valid Name',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        profileId: mockProfile._id,
        tags: ['', 'valid-tag', '   '] // 包含空标签
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('标签不能为空');
    });

    it('应该验证地址长度', async () => {
      const invalidData = {
        name: 'Valid Name',
        coordinates: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        address: 'a'.repeat(501), // 太长
        profileId: mockProfile._id
      };

      Profile.findById = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('地址长度不能超过');
    });
  });
});