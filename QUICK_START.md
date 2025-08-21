# "初见"APP 快速启动指南

## 🚀 一键启动开发环境

本指南将帮助您在5分钟内搭建完整的"初见"APP开发环境。

### 📋 环境要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **系统内存**: 至少 4GB
- **磁盘空间**: 至少 2GB

### ⚡ 快速启动

```bash
# 1. 克隆项目（如果还没有）
git clone <your-repo-url>
cd first-moments

# 2. 一键启动环境
./docker-start.sh

# 3. 验证环境
./test-docker-env.sh
```

### 🎯 启动成功标志

当您看到以下信息时，说明环境启动成功：

```
🎉 所有服务启动成功！

📋 服务访问信息：
   MongoDB:        mongodb://admin:admin123@localhost:27017/first_moments
   Redis:          redis://localhost:6379 (密码: redis123)
   MinIO API:      http://localhost:9000
   MinIO Console:  http://localhost:9001 (minioadmin/minioadmin123)
   Mongo Express:  http://localhost:8081 (admin/admin123)
   Redis Commander: http://localhost:8082 (admin/admin123)
```

### 🌐 管理界面访问

| 服务 | 地址 | 用户名 | 密码 | 说明 |
|------|------|--------|------|------|
| MinIO Console | http://localhost:9001 | minioadmin | minioadmin123 | 对象存储管理 |
| Mongo Express | http://localhost:8081 | admin | admin123 | MongoDB可视化 |
| Redis Commander | http://localhost:8082 | admin | admin123 | Redis可视化 |

### 🔧 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f [service_name]

# 重启特定服务
docker-compose restart [service_name]

# 停止所有服务
./docker-stop.sh

# 完全清理环境
./docker-stop.sh --clean
```

### 📊 服务详情

#### MongoDB
- **端口**: 27017
- **数据库**: first_moments
- **用户**: admin / admin123
- **连接字符串**: `mongodb://admin:admin123@localhost:27017/first_moments`

#### Redis
- **端口**: 6379
- **密码**: redis123
- **连接字符串**: `redis://localhost:6379`

#### MinIO
- **API端口**: 9000
- **控制台端口**: 9001
- **Access Key**: minioadmin
- **Secret Key**: minioadmin123
- **预设存储桶**:
  - `first-moments-images` (图片)
  - `first-moments-videos` (视频)
  - `first-moments-documents` (文档)

### 🛠️ 开发配置

#### 1. 环境变量配置

复制并修改环境变量文件：

```bash
cp .env.example .env
```

主要配置项：

```env
# 数据库配置
MONGO_URI=mongodb://admin:admin123@localhost:27017/first_moments
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis123

# MinIO配置
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

#### 2. 应用连接示例

**Node.js 连接示例**:

```javascript
// MongoDB连接
const mongoose = require('mongoose');
mongoose.connect('mongodb://admin:admin123@localhost:27017/first_moments');

// Redis连接
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379,
  password: 'redis123'
});

// MinIO连接
const Minio = require('minio');
const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin123'
});
```

### 🚨 故障排除

#### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   lsof -i :27017
   lsof -i :6379
   lsof -i :9000
   
   # 修改docker-compose.yml中的端口映射
   ```

2. **内存不足**
   ```bash
   # 检查Docker内存限制
   docker system df
   docker system prune
   ```

3. **服务启动失败**
   ```bash
   # 查看详细日志
   docker-compose logs [service_name]
   
   # 重新构建
   docker-compose down
   docker-compose up -d --build
   ```

4. **数据持久化问题**
   ```bash
   # 检查数据卷
   docker volume ls
   
   # 备份数据
   docker-compose exec mongodb mongodump --out /backup
   ```

#### 完全重置环境

```bash
# 停止并删除所有容器和数据
./docker-stop.sh --clean

# 重新启动
./docker-start.sh
```

### 📈 性能优化

#### 开发环境优化

1. **增加内存分配**
   ```yaml
   # 在docker-compose.yml中添加
   services:
     mongodb:
       deploy:
         resources:
           limits:
             memory: 1G
   ```

2. **启用缓存**
   ```bash
   # Redis配置优化
   echo "maxmemory 256mb" >> docker/redis/redis.conf
   echo "maxmemory-policy allkeys-lru" >> docker/redis/redis.conf
   ```

3. **数据库连接池**
   ```javascript
   // MongoDB连接池配置
   mongoose.connect(uri, {
     maxPoolSize: 10,
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000,
   });
   ```

### 🔄 数据管理

#### 备份数据

```bash
# MongoDB备份
docker-compose exec mongodb mongodump --db first_moments --out /backup

# Redis备份
docker-compose exec redis redis-cli -a redis123 --rdb /backup/dump.rdb

# MinIO备份
docker-compose exec minio-client mc mirror myminio/first-moments-images ./backup/images
```

#### 恢复数据

```bash
# MongoDB恢复
docker-compose exec mongodb mongorestore --db first_moments /backup/first_moments

# Redis恢复
docker-compose exec redis redis-cli -a redis123 --rdb /backup/dump.rdb
```

### 📚 相关文档

- [Docker环境详细说明](./DOCKER_README.md)
- [项目架构文档](./02_总体规划与技术架构.md)
- [后端开发指南](./04_后端开发阶段.md)
- [前端开发指南](./05_前端开发阶段.md)

### 🤝 获取帮助

如果遇到问题，请：

1. 查看 [故障排除](#故障排除) 部分
2. 运行 `./test-docker-env.sh` 进行环境诊断
3. 查看服务日志 `docker-compose logs [service]`
4. 提交 Issue 或联系开发团队

---

**🎉 恭喜！您的"初见"APP开发环境已经准备就绪！**

现在您可以开始：
- 🔧 后端API开发
- 🎨 前端界面开发  
- 📱 移动端应用开发
- 🧪 功能测试验证

祝您开发愉快！ 🚀