#!/bin/bash

# "初见"APP Docker环境启动脚本

set -e

echo "🚀 启动\"初见\"APP开发环境..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 检查docker-compose命令（优先使用本地脚本）
if [ -x "./docker-compose" ]; then
    DOCKER_COMPOSE="./docker-compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ docker-compose未安装，请先安装docker-compose"
    exit 1
fi

echo "📦 使用Docker Compose: $DOCKER_COMPOSE"

# 创建.env文件（如果不存在）
if [ ! -f .env ]; then
    echo "📝 创建.env文件..."
    cp .env.example .env
    echo "✅ .env文件已创建，请根据需要修改配置"
fi

# 拉取最新镜像
echo "📦 拉取Docker镜像..."
$DOCKER_COMPOSE pull

# 启动服务
echo "🔧 启动服务..."
$DOCKER_COMPOSE up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
$DOCKER_COMPOSE ps

# 显示服务信息
echo ""
echo "🎉 服务启动完成！"
echo ""
echo "📋 服务访问信息："
echo "   MongoDB:        localhost:27017"
echo "   Redis:          localhost:6379"
echo "   MinIO API:      http://localhost:9000"
echo "   MinIO Console:  http://localhost:9001"
echo "   Mongo Express:  http://localhost:8081"
echo "   Redis Commander: http://localhost:8082"
echo ""
echo "🔑 默认登录凭据："
echo "   MongoDB:        admin / admin123"
echo "   Redis:          (密码: redis123)"
echo "   MinIO:          minioadmin / minioadmin123"
echo "   Mongo Express:  admin / admin123"
echo "   Redis Commander: admin / admin123"
echo ""
echo "💡 提示："
echo "   - 使用 '$DOCKER_COMPOSE logs -f [service]' 查看服务日志"
echo "   - 使用 '$DOCKER_COMPOSE stop' 停止服务"
echo "   - 使用 '$DOCKER_COMPOSE down' 停止并删除容器"
echo "   - 使用 '$DOCKER_COMPOSE down -v' 停止并删除容器和数据卷"
echo ""
echo "🔍 健康检查："
echo "   MongoDB: $DOCKER_COMPOSE exec mongodb mongosh --eval 'db.runCommand(\"ping\")'"
echo "   Redis:   $DOCKER_COMPOSE exec redis redis-cli -a redis123 ping"
echo "   MinIO:   curl -f http://localhost:9000/minio/health/live"
echo ""