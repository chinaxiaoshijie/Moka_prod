#!/bin/bash

set -e

echo "========================================"
echo "  Moka 面试管理系统 - 本地部署脚本"
echo "========================================"
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker 和 Docker Compose 已安装"
echo ""

# 进入项目目录
cd "$(dirname "$0")"

# 停止并清理旧容器
echo "🧹 清理旧容器..."
docker-compose down --volumes --remove-orphans 2>/dev/null || true

# 构建并启动服务
echo ""
echo "🔨 构建并启动服务..."
docker-compose up --build -d

# 等待数据库就绪
echo ""
echo "⏳ 等待数据库初始化..."
sleep 5

# 执行数据库迁移
echo ""
echo "📊 执行数据库迁移..."
docker-compose exec -T backend bunx prisma migrate deploy || true

# 导入测试数据
echo ""
echo "🌱 导入测试数据..."
docker-compose exec -T backend bunx prisma db seed || true

echo ""
echo "========================================"
echo "  ✅ 部署完成！"
echo "========================================"
echo ""
echo "📱 访问地址:"
echo "   前端界面: http://localhost:3000"
echo "   后端API:  http://localhost:3001"
echo ""
echo "👤 测试账号:"
echo "   HR账号:     hr / hr123456"
echo "   面试官账号: interviewer / interviewer123"
echo ""
echo "📋 常用命令:"
echo "   查看日志:   docker-compose logs -f"
echo "   停止服务:   docker-compose down"
echo "   重启服务:   docker-compose restart"
echo ""
echo "========================================"
