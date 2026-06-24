#!/bin/bash
# Moka 面试系统 - 快速启动脚本

set -e

echo "🚀 Moka 面试系统 - 启动脚本"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    exit 1
fi

# 检查 Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装${NC}"
    exit 1
fi

# 检查 Bun
if ! command -v bun &> /dev/null; then
    echo -e "${RED}错误: Bun 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 所有依赖已安装${NC}"
echo ""

# 启动数据库
echo -e "${BLUE}1. 启动数据库...${NC}"
docker compose up -d
sleep 2
echo -e "${GREEN}✓ 数据库已启动${NC}"
echo ""

# 清理端口
echo -e "${BLUE}2. 清理端口...${NC}"
pkill -9 -f "bun.*main.ts" 2>/dev/null || true
pkill -9 -f "bun.*dev" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✓ 端口已清理${NC}"
echo ""

# 生成 Prisma Client
echo -e "${BLUE}3. 生成 Prisma Client...${NC}"
cd backend
bun run prisma:generate
echo -e "${GREEN}✓ Prisma Client 已生成${NC}"
echo ""

# 启动后端
echo -e "${BLUE}4. 启动后端...${NC}"
nohup bun run dev > /tmp/backend.log 2>&1 &
sleep 3
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端已启动 (http://localhost:3001)${NC}"
else
    echo -e "${RED}✗ 后端启动失败，查看日志: tail -20 /tmp/backend.log${NC}"
    exit 1
fi
echo ""

# 启动前端
echo -e "${BLUE}5. 启动前端...${NC}"
cd ../frontend
nohup bun run dev > /tmp/frontend.log 2>&1 &
sleep 5
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端已启动 (http://localhost:3000)${NC}"
else
    echo -e "${RED}✗ 前端启动失败，查看日志: tail -20 /tmp/frontend.log${NC}"
    exit 1
fi
echo ""

# 显示状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Moka 面试系统启动成功！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 访问地址:"
echo -e "  前端: ${BLUE}http://localhost:3000${NC}"
echo -e "  后端: ${BLUE}http://localhost:3001${NC}"
echo ""
echo "🔐 测试账号:"
echo "  HR:      hr / hr123456"
echo "  面试官: interviewer / interviewer123"
echo ""
echo -e "${YELLOW}查看日志:${NC}"
echo "  后端: tail -f /tmp/backend.log"
echo "  前端: tail -f /tmp/frontend.log"
echo ""
echo -e "${YELLOW}停止系统:${NC}"
echo "  按 Ctrl+C 或运行: ./stop.sh"
echo ""
