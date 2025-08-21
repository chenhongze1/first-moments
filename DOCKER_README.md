# "初见"APP Docker开发环境

本文档介绍如何使用Docker搭建"初见"APP的完整开发环境，包括MongoDB、Redis和MinIO对象存储服务。

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    "初见"APP 开发环境                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   MongoDB   │  │    Redis    │  │       MinIO         │  │
│  │   :27017    │  │   :6379     │  │  API: :9000         │  │
│  │             │  │             │  │  Console: :9001     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │Mongo Express│  │Redis Command│                          │
│  │   :8081     │  │   :8082     │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## 📋 服务清单

| 服务 | 端口 | 用途 | 默认凭据 |
|------|------|------|----------|
| MongoDB | 27017 | 主数据库 | admin / admin123 |
| Redis | 6379 | 缓存服务 | 密码: redis123 |
| MinIO API | 9000 | 对象存储API | minioadmin / minioadmin123 |
| MinIO Console | 9001 | 对象存储管理界面 | minioadmin / minioadmin123 |
| Mongo Express | 8081 | MongoDB管理界面 | admin / admin123 |
| Redis Commander | 8082 | Redis管理界面 | admin / admin123 |

## 🚀 快速开始

### 1. 环境要求

- Docker 20.0+
- Docker Compose 2.0+
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间

### 2. 启动环境

```bash
# 克隆项目后，进入项目目录
cd first-moments

# 启动所有服务
./docker-start.sh

# 或者手动启动
docker-compose up -d
```

### 3. 验证服务

```bash
# 检查所有服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f

# 测试MongoDB连接
docker-compose exec mongodb mongosh --eval "db.runCommand('ping')"

# 测试Redis连接
docker-compose exec redis redis-cli -a redis123 ping

# 测试MinIO连接
curl -f http://localhost:9000/minio/health/live
```

## 🔧 配置说明

### 环境变量

复制 `.env.example` 到 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

主要配置项：

```env
# 数据库配置
MONGO_URI=mongodb://admin:admin123@localhost:27017/first_moments?authSource=admin
REDIS_HOST=localhost
REDIS_PASSWORD=redis123

# MinIO配置
MINIO_ENDPOINT=localhost
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

### MongoDB配置

- **数据库名称**: `first_moments`
- **管理员用户**: `admin` / `admin123`
- **应用用户**: `app_user` / `app_password_123`
- **自动创建集合**: 用户、档案、时光记录、成就等
- **预设索引**: 优化查询性能

### Redis配置

- **内存限制**: 256MB
- **持久化**: AOF + RDB
- **密码认证**: `redis123`
- **数据库数量**: 16个

### MinIO配置

- **预创建存储桶**:
  - `first-moments-images` (公开读取)
  - `first-moments-videos` (公开读取)
  - `first-moments-documents` (私有)

## 📊 数据管理

### 数据持久化

所有数据存储在Docker卷中：

```bash
# 查看数据卷
docker volume ls | grep first-moments

# 备份MongoDB数据
docker-compose exec mongodb mongodump --out /data/backup

# 备份Redis数据
docker-compose exec redis redis-cli -a redis123 BGSAVE
```

### 数据初始化

MongoDB会自动执行初始化脚本：

- 创建应用数据库和用户
- 创建所需集合和索引
- 插入预设配置和成就模板

## 🔍 监控和调试

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f mongodb
docker-compose logs -f redis
docker-compose logs -f minio
```

### 性能监控

```bash
# 查看容器资源使用
docker stats

# 查看服务健康状态
docker-compose ps
```

### 进入容器调试

```bash
# 进入MongoDB容器
docker-compose exec mongodb bash

# 进入Redis容器
docker-compose exec redis sh

# 进入MinIO容器
docker-compose exec minio sh
```

## 🛠️ 常用操作

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart mongodb
```

### 更新镜像

```bash
# 拉取最新镜像
docker-compose pull

# 重新构建并启动
docker-compose up -d --force-recreate
```

### 清理环境

```bash
# 停止服务（保留数据）
./docker-stop.sh

# 或选择清理选项
# 1) 停止服务（保留数据）
# 2) 停止并删除容器（保留数据卷）
# 3) 完全清理（删除容器和数据卷）
```

## 🔐 安全配置

### 生产环境注意事项

1. **修改默认密码**：
   ```bash
   # 修改 .env 文件中的密码
   MONGO_INITDB_ROOT_PASSWORD=your-secure-password
   REDIS_PASSWORD=your-redis-password
   MINIO_ROOT_PASSWORD=your-minio-password
   ```

2. **网络安全**：
   ```yaml
   # 仅绑定本地接口
   ports:
     - "127.0.0.1:27017:27017"
   ```

3. **数据加密**：
   - 启用MongoDB的传输加密
   - 配置Redis的TLS支持
   - 使用MinIO的HTTPS

## 🚨 故障排除

### 常见问题

1. **端口冲突**：
   ```bash
   # 检查端口占用
   lsof -i :27017
   lsof -i :6379
   lsof -i :9000
   ```

2. **内存不足**：
   ```bash
   # 检查Docker内存限制
   docker system df
   docker system prune
   ```

3. **权限问题**：
   ```bash
   # 检查文件权限
   ls -la docker/
   chmod -R 755 docker/
   ```

4. **服务启动失败**：
   ```bash
   # 查看详细错误信息
   docker-compose logs [service-name]
   
   # 重新创建容器
   docker-compose down
   docker-compose up -d
   ```

### 健康检查

所有服务都配置了健康检查：

```bash
# 查看健康状态
docker-compose ps

# 手动执行健康检查
docker-compose exec mongodb mongosh --eval "db.runCommand('ping')"
docker-compose exec redis redis-cli -a redis123 ping
curl -f http://localhost:9000/minio/health/live
```

## 📚 相关文档

- [MongoDB官方文档](https://docs.mongodb.com/)
- [Redis官方文档](https://redis.io/documentation)
- [MinIO官方文档](https://docs.min.io/)
- [Docker Compose文档](https://docs.docker.com/compose/)

## 🤝 贡献指南

如需修改Docker配置：

1. 修改 `docker-compose.yml`
2. 更新相关配置文件
3. 测试配置变更
4. 更新本文档

---

**维护团队**: "初见"APP开发团队  
**最后更新**: 2024年1月  
**版本**: v1.0