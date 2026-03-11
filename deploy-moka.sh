#!/bin/bash

# Moka 面试管理系统 - 一键部署脚本
# 专为 10.10.2.131 服务器设计
# 用户: malong
# 日期: 2026-03-11

set -e

echo "🚀 开始部署 Moka 面试管理系统到 10.10.2.131..."
echo "==============================================="

# 配置
SERVER_IP="10.10.2.131"
DEPLOY_DIR="/home/malong/moka-interview-system"

# 检查是否在目标服务器上运行
if [[ $(hostname -I) != *"10.10.2.131"* ]] && [[ $(ip addr show | grep '10.10.2.131') == "" ]]; then
    echo "⚠️  此脚本应在 10.10.2.131 服务器上运行！"
    echo "请将此脚本复制到 10.10.2.131 服务器并执行："
    echo ""
    echo "scp deploy-moka.sh malong@10.10.2.131:/tmp/"
    echo "ssh malong@10.10.2.131 'bash /tmp/deploy-moka.sh'"
    echo ""
    exit 1
fi

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker malong
    # 重新加载用户组
    newgrp docker
fi

# 检查Docker Compose
if ! docker compose version &> /dev/null; then
    echo "📦 安装 Docker Compose..."
    sudo apt update
    sudo apt install -y docker-compose-plugin
fi

# 创建部署目录
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# 克隆项目
echo "📥 克隆项目代码..."
if [ ! -d ".git" ]; then
    git clone https://github.com/chinaxiaoshijie/Moka_prod.git .
else
    git pull origin main
fi

# 创建环境文件
echo "🔐 创建环境配置..."
cat > .env << EOF
NODE_ENV=production
POSTGRES_USER=moka
POSTGRES_PASSWORD=moka123456
POSTGRES_DB=moka_db
POSTGRES_PORT=5432
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
BACKEND_PORT=13001
FRONTEND_PORT=13000
NEXT_PUBLIC_API_URL=http://10.10.2.131:13001
EOF

# 启动服务
echo "🚀 启动服务..."
docker compose up -d

# 等待服务启动
echo "⏳ 等待服务启动 (约30秒)..."
sleep 30

# 检查状态
echo "✅ 部署完成！"
echo ""
echo "🌐 访问地址:"
echo "   前端: http://10.10.2.131:13000"
echo "   后端: http://10.10.2.131:13001"
echo ""
echo "📁 项目目录: $DEPLOY_DIR"
echo "📄 环境文件: $DEPLOY_DIR/.env"
echo ""
echo "🔧 管理命令:"
echo "   查看日志: cd $DEPLOY_DIR && docker compose logs -f"
echo "   停止服务: cd $DEPLOY_DIR && docker compose down"
echo "   重启服务: cd $DEPLOY_DIR && docker compose restart"
