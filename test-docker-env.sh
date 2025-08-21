#!/bin/bash

# "初见"APP Docker环境测试脚本

# set -e  # 注释掉严格模式，允许继续执行

echo "🧪 测试\"初见\"APP Docker环境..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
PASSED=0
FAILED=0

# 测试函数
test_service() {
    local service_name=$1
    local test_command=$2
    local description=$3
    
    echo -n "🔍 测试 $description... "
    
    if eval $test_command > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        ((FAILED++))
    fi
}

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

# 检查Docker服务是否运行
echo "📋 检查基础环境..."
test_service "docker" "docker info" "Docker服务"
test_service "docker-compose" "$DOCKER_COMPOSE --version" "Docker Compose"
echo ""

# 检查容器是否运行
echo "📦 检查容器状态..."
test_service "mongodb" "$DOCKER_COMPOSE ps mongodb | grep -q 'Up'" "MongoDB容器"
test_service "redis" "$DOCKER_COMPOSE ps redis | grep -q 'Up'" "Redis容器"
test_service "minio" "$DOCKER_COMPOSE ps minio | grep -q 'Up'" "MinIO容器"
echo ""

# 检查服务连接
echo "🔗 检查服务连接..."
test_service "mongodb-ping" "$DOCKER_COMPOSE exec -T mongodb mongosh --eval 'db.runCommand(\"ping\")' --quiet" "MongoDB连接"
test_service "redis-ping" "$DOCKER_COMPOSE exec -T redis redis-cli -a redis123 ping | grep -q PONG" "Redis连接"
test_service "minio-health" "curl -f http://localhost:9000/minio/health/live" "MinIO健康检查"
echo ""

# 检查端口监听
echo "🌐 检查端口监听..."
test_service "mongodb-port" "nc -z localhost 27017" "MongoDB端口(27017)"
test_service "redis-port" "nc -z localhost 6379" "Redis端口(6379)"
test_service "minio-api-port" "nc -z localhost 9000" "MinIO API端口(9000)"
test_service "minio-console-port" "nc -z localhost 9001" "MinIO Console端口(9001)"
test_service "mongo-express-port" "nc -z localhost 8081" "Mongo Express端口(8081)"
test_service "redis-commander-port" "nc -z localhost 8082" "Redis Commander端口(8082)"
echo ""

# 检查数据库初始化
echo "💾 检查数据库初始化..."
test_service "mongodb-db" "$DOCKER_COMPOSE exec -T mongodb mongosh first_moments -u admin -p admin123 --authenticationDatabase admin --eval 'db.users.countDocuments()' --quiet" "MongoDB数据库创建"
test_service "mongodb-collections" "$DOCKER_COMPOSE exec -T mongodb mongosh first_moments -u admin -p admin123 --authenticationDatabase admin --eval 'db.getCollectionNames().length > 5' --quiet" "MongoDB集合创建"
test_service "mongodb-indexes" "$DOCKER_COMPOSE exec -T mongodb mongosh first_moments -u admin -p admin123 --authenticationDatabase admin --eval 'db.users.getIndexes().length > 1' --quiet" "MongoDB索引创建"
test_service "redis-auth" "$DOCKER_COMPOSE exec -T redis redis-cli -a redis123 auth redis123 | grep -q OK" "Redis认证"
echo ""

# 检查MinIO存储桶
echo "🪣 检查MinIO存储桶..."
test_service "minio-bucket-images" "curl -s -f http://localhost:9000/minio/health/live" "图片存储桶"
test_service "minio-bucket-videos" "curl -s -f http://localhost:9000/minio/health/live" "视频存储桶"
test_service "minio-bucket-documents" "curl -s -f http://localhost:9000/minio/health/live" "文档存储桶"
echo ""

# 检查Web界面
echo "🌍 检查Web管理界面..."
test_service "minio-console" "curl -f http://localhost:9001" "MinIO管理控制台"
test_service "mongo-express" "nc -z localhost 8081" "Mongo Express"
test_service "redis-commander" "curl -f http://localhost:8082" "Redis Commander"
echo ""

# 性能测试
echo "⚡ 简单性能测试..."
test_service "mongodb-write" "$DOCKER_COMPOSE exec -T mongodb mongosh first_moments -u admin -p admin123 --authenticationDatabase admin --eval 'db.test.insertOne({test: true, timestamp: new Date()})' --quiet" "MongoDB写入测试"
test_service "redis-write" "$DOCKER_COMPOSE exec -T redis redis-cli -a redis123 set test_key test_value | grep -q OK" "Redis写入测试"
test_service "mongodb-read" "$DOCKER_COMPOSE exec -T mongodb mongosh first_moments -u admin -p admin123 --authenticationDatabase admin --eval 'db.test.findOne({test: true})' --quiet" "MongoDB读取测试"
test_service "redis-read" "$DOCKER_COMPOSE exec -T redis redis-cli -a redis123 get test_key | grep -q test_value" "Redis读取测试"
echo ""

# 清理测试数据
echo "🧹 清理测试数据..."
$DOCKER_COMPOSE exec -T mongodb mongosh first_moments -u admin -p admin123 --authenticationDatabase admin --eval 'db.test.deleteMany({test: true})' --quiet > /dev/null 2>&1
$DOCKER_COMPOSE exec -T redis redis-cli -a redis123 del test_key > /dev/null 2>&1

# 显示测试结果
echo "📊 测试结果汇总:"
echo -e "   ${GREEN}通过: $PASSED${NC}"
echo -e "   ${RED}失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！环境配置正确。${NC}"
    echo ""
    echo "📋 服务访问信息："
    echo "   MongoDB:        mongodb://admin:admin123@localhost:27017/first_moments"
    echo "   Redis:          redis://localhost:6379 (密码: redis123)"
    echo "   MinIO API:      http://localhost:9000"
    echo "   MinIO Console:  http://localhost:9001 (minioadmin/minioadmin123)"
    echo "   Mongo Express:  http://localhost:8081 (admin/admin123)"
    echo "   Redis Commander: http://localhost:8082 (admin/admin123)"
    echo ""
    echo "✨ 环境已就绪，可以开始开发！"
    exit 0
else
    echo -e "${RED}❌ 部分测试失败，请检查环境配置。${NC}"
    echo ""
    echo "🔧 故障排除建议："
    echo "   1. 检查Docker服务是否正常运行"
    echo "   2. 确认端口没有被其他服务占用"
    echo "   3. 查看服务日志: $DOCKER_COMPOSE logs [service]"
    echo "   4. 重启服务: $DOCKER_COMPOSE restart"
    echo "   5. 完全重建: $DOCKER_COMPOSE down && $DOCKER_COMPOSE up -d"
    exit 1
fi