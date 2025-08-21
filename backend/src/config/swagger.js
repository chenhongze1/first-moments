const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '初见APP API文档',
      version: '1.0.0',
      description: '记录人生第一次的时光记录APP API接口文档',
      contact: {
        name: 'First Moments Team',
        email: 'support@firstmoments.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: '开发环境'
      },
      {
        url: 'https://api.firstmoments.com',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT认证令牌'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: '错误信息'
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            username: {
              type: 'string',
              example: 'johndoe'
            },
            email: {
              type: 'string',
              example: 'john@example.com'
            },
            avatar: {
              type: 'string',
              example: 'https://example.com/avatar.jpg'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Profile: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: '我的档案'
            },
            description: {
              type: 'string',
              example: '这是我的第一个档案'
            },
            avatar: {
              type: 'string',
              example: 'https://example.com/profile-avatar.jpg'
            },
            type: {
              type: 'string',
              enum: ['self', 'child', 'pet', 'other'],
              example: 'self'
            },
            isPublic: {
              type: 'boolean',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Moment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            title: {
              type: 'string',
              example: '第一次学会骑自行车'
            },
            content: {
              type: 'string',
              example: '今天终于学会了骑自行车，太开心了！'
            },
            category: {
              type: 'string',
              example: 'sports'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['运动', '成长']
            },
            media: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['image', 'video', 'audio']
                  },
                  url: {
                    type: 'string'
                  },
                  thumbnail: {
                    type: 'string'
                  }
                }
              }
            },
            location: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: '中央公园'
                },
                coordinates: {
                  type: 'array',
                  items: {
                    type: 'number'
                  },
                  example: [116.4074, 39.9042]
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Achievement: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: '运动达人'
            },
            description: {
              type: 'string',
              example: '完成10次运动记录'
            },
            icon: {
              type: 'string',
              example: 'https://example.com/achievement-icon.png'
            },
            category: {
              type: 'string',
              example: 'sports'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              example: 'medium'
            },
            points: {
              type: 'number',
              example: 100
            }
          }
        },
        Location: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            coordinates: {
              type: 'array',
              items: {
                type: 'number'
              },
              example: [116.4074, 39.9042]
            },
            address: {
              type: 'string',
              example: '北京市朝阳区'
            },
            placeName: {
              type: 'string',
              example: '中央公园'
            },
            type: {
              type: 'string',
              enum: ['manual', 'gps', 'search'],
              example: 'gps'
            },
            accuracy: {
              type: 'number',
              example: 10
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            title: {
              type: 'string',
              example: '新的成就解锁'
            },
            content: {
              type: 'string',
              example: '恭喜您解锁了"运动达人"成就！'
            },
            type: {
              type: 'string',
              enum: ['like', 'comment', 'follow', 'mention', 'share', 'achievement', 'reminder', 'system', 'security'],
              example: 'achievement'
            },
            isRead: {
              type: 'boolean',
              example: false
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              example: 'medium'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: '未授权访问',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '未授权访问，请先登录',
                code: 'UNAUTHORIZED'
              }
            }
          }
        },
        ValidationError: {
          description: '参数验证失败',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '参数验证失败',
                code: 'VALIDATION_ERROR'
              }
            }
          }
        },
        NotFoundError: {
          description: '资源不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '资源不存在',
                code: 'NOT_FOUND'
              }
            }
          }
        },
        ServerError: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '服务器内部错误',
                code: 'INTERNAL_ERROR'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const specs = swaggerJSDoc(options);

// Swagger UI配置
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    syntaxHighlight: {
      activate: true,
      theme: 'agate'
    }
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: '初见APP API文档',
  customfavIcon: '/favicon.ico'
};

module.exports = {
  swaggerUi,
  specs,
  swaggerUiOptions
};