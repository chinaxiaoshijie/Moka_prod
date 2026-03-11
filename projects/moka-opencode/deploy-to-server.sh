#!/bin/bash

# Moka Interview Management System - 自动化部署脚本
# 适用于 Ubuntu/Debian 系统
# 作者: Sisyphus
# 日期: 2026-03-11

set -e

echo "🚀 开始部署 Moka 面试管理系统..."
echo "========================================"

# 配置变量
SERVER_IP="10.10.2.131"
SERVER_USER="malong"
PROJECT_NAME="moka-interview-system"
DEPLOY_DIR="/home/${SERVER_USER}/${PROJECT_NAME}"
BACKEND_PORT="13001"
FRONTEND_PORT="13000"
POSTGRES_PORT="5432"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 检查依赖
check_dependencies() {
    log "检查系统依赖..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        error "Docker 未安装。请先安装 Docker: https://docs.docker.com/engine/install/"
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose 未安装。请先安装 Docker Compose: https://docs.docker.com/compose/install/"
    fi
    
    # 检查 Git
    if ! command -v git &> /dev/null; then
        error "Git 未安装。请先安装 Git: sudo apt install git"
    fi
    
    log "所有依赖检查通过！✅"
}

# 创建部署目录
create_deploy_directory() {
    log "创建部署目录: ${DEPLOY_DIR}"
    mkdir -p "${DEPLOY_DIR}"
}

# 克隆项目
clone_project() {
    log "克隆项目到服务器..."
    if [ -d "${DEPLOY_DIR}/.git" ]; then
        log "项目已存在，更新代码..."
        cd "${DEPLOY_DIR}"
        git pull origin main
    else
        cd "${DEPLOY_DIR}"
        git clone https://github.com/chinaxiaoshijie/Moka_prod.git .
    fi
}

# 创建环境文件
create_env_file() {
    log "创建环境配置文件..."
    cat > "${DEPLOY_DIR}/.env" << EOF
# Moka 面试管理系统 - 生产环境配置
NODE_ENV=production

# 数据库配置
POSTGRES_USER=moka
POSTGRES_PASSWORD=moka123456
POSTGRES_DB=moka_db
POSTGRES_PORT=${POSTGRES_PORT}

# JWT配置
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# 端口配置
BACKEND_PORT=${BACKEND_PORT}
FRONTEND_PORT=${FRONTEND_PORT}

# API地址（前端使用）
NEXT_PUBLIC_API_URL=http://${SERVER_IP}:${BACKEND_PORT}
EOF
    
    log "环境文件创建完成！🔐"
}

# 启动服务
start_services() {
    log "启动 Moka 面试管理系统..."
    cd "${DEPLOY_DIR}"
    
    # 使用 docker compose (v2) 如果可用，否则使用 docker-compose (v1)
    if docker compose version &> /dev/null; then
        docker compose up -d
    else
        docker-compose up -d
    fi
    
    log "服务启动完成！🚀"
}

# 验证部署
verify_deployment() {
    log "验证部署状态..."
    
    sleep 10
    
    # 检查容器状态
    if docker compose ps | grep -q "Up"; then
        log "所有容器运行正常！✅"
    else
        warn "部分容器可能未正常启动，请检查日志"
    fi
    
    # 检查端口
    if ss -tlnp | grep -q ":${BACKEND_PORT}"; then
        log "后端服务端口 ${BACKEND_PORT} 监听正常！✅"
    else
        warn "后端服务端口 ${BACKEND_PORT} 未监听"
    fi
    
    if ss -tlnp | grep -q ":${FRONTEND_PORT}"; then
        log "前端服务端口 ${FRONTEND_PORT} 监听正常！✅"
    else
        warn "前端服务端口 ${FRONTEND_PORT} 未监听"
    fi
    
    log "部署验证完成！"
}

# 显示访问信息
show_access_info() {
    echo ""
    echo "🎉 Moka 面试管理系统部署成功！"
    echo "========================================"
    echo "🌐 访问地址:"
    echo "   前端界面: http://${SERVER_IP}:${FRONTEND_PORT}"
    echo "   后端API: http://${SERVER_IP}:${BACKEND_PORT}"
    echo ""
    echo "📁 项目目录: ${DEPLOY_DIR}"
    echo "📄 环境文件: ${DEPLOY_DIR}/.env"
    echo ""
    echo "🔧 管理命令:"
    echo "   查看日志: cd ${DEPLOY_DIR} && docker compose logs -f"
    echo "   停止服务: cd ${DEPLOY_DIR} && docker compose down"
    echo "   重启服务: cd ${DEPLOY_DIR} && docker compose restart"
    echo "========================================"
}

# 主函数
main() {
    check_dependencies
    create_deploy_directory
    clone_project
    create_env_file
    start_services
    verify_deployment
    show_access_info
}

# 运行主函数
main "$@"
