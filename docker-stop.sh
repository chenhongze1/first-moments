#!/bin/bash

# "初见"APP Docker环境停止脚本

set -e

echo "🛑 停止\"初见\"APP开发环境..."

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

# 显示当前运行的容器
echo "📊 当前运行的容器："
$DOCKER_COMPOSE ps

# 询问用户操作类型
echo ""
echo "请选择操作类型："
echo "1) 停止服务（保留数据）"
echo "2) 停止并删除容器（保留数据卷）"
echo "3) 完全清理（删除容器和数据卷）"
echo "4) 仅查看状态"
read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        echo "⏸️  停止服务..."
        $DOCKER_COMPOSE stop
        echo "✅ 服务已停止，数据已保留"
        echo "💡 使用 '$DOCKER_COMPOSE start' 重新启动服务"
        ;;
    2)
        echo "🗑️  停止并删除容器..."
        $DOCKER_COMPOSE down
        echo "✅ 容器已删除，数据卷已保留"
        echo "💡 使用 '$DOCKER_COMPOSE up -d' 重新创建并启动服务"
        ;;
    3)
        echo "⚠️  警告：此操作将删除所有数据！"
        read -p "确认删除所有数据？(y/N): " confirm
        if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
            echo "🗑️  完全清理环境..."
            $DOCKER_COMPOSE down -v
            echo "✅ 环境已完全清理"
            echo "💡 使用 './docker-start.sh' 重新初始化环境"
        else
            echo "❌ 操作已取消"
        fi
        ;;
    4)
        echo "📊 服务状态："
        $DOCKER_COMPOSE ps
        echo ""
        echo "📈 资源使用情况："
        docker stats --no-stream $($DOCKER_COMPOSE ps -q) 2>/dev/null || echo "没有运行的容器"
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "🔍 可用命令："
echo "   查看日志: $DOCKER_COMPOSE logs -f [service]"
echo "   重启服务: $DOCKER_COMPOSE restart [service]"
echo "   进入容器: $DOCKER_COMPOSE exec [service] bash"
echo "   查看状态: $DOCKER_COMPOSE ps"
echo ""