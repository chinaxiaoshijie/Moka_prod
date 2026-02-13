#!/bin/bash
# Moka 面试系统 - 停止脚本

set -e

echo "🛑 Moka 面试系统 - 停止脚本"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 停止后端
echo -e "${BLUE}1. 停止后端...${NC}"
pkill -9 -f "bun.*main.ts" 2>/dev/null || true
pkill -9 -f "bun.*dev" 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✓ 后端已停止${NC}"

# 停止前端
echo -e "${BLUE}2. 停止前端...${NC}"
pkill -9 -f "next.*dev" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✓ 前端已停止${NC}"

# 停止数据库
echo -e "${BLUE}3. 停止数据库...${NC}"
read -p "是否停止数据库容器? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose down
    echo -e "${GREEN}✓ 数据库已停止${NC}"
else
    echo -e "${YELLOW}数据库容器保持运行${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Moka 面试系统已停止${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
