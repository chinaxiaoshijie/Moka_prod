#!/bin/bash

# Moka 系统环境配置检查脚本
# 用途：验证生产环境必需的环境变量

set -e

echo "🔍 Moka 系统环境配置检查"
echo "========================"
echo ""

ERRORS=0
WARNINGS=0

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查必需的环境变量
check_required() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ ${var_name} 未设置${NC}"
        ((ERRORS++))
        return 1
    else
        echo -e "${GREEN}✅ ${var_name} 已设置${NC}"
        return 0
    fi
}

# 检查环境变量是否为默认值
check_not_default() {
    local var_name=$1
    local default_value=$2
    local var_value="${!var_name}"
    
    if [ "$var_value" == "$default_value" ]; then
        echo -e "${RED}❌ ${var_name} 使用默认值（不安全）${NC}"
        ((ERRORS++))
        return 1
    else
        echo -e "${GREEN}✅ ${var_name} 已自定义${NC}"
        return 0
    fi
}

# 检查 JWT_SECRET
echo "🔐 安全性检查"
echo "------------"

if [ -n "$JWT_SECRET" ]; then
    if [ "$JWT_SECRET" == "dev-secret-key" ]; then
        echo -e "${RED}❌ JWT_SECRET 使用默认值（严重安全风险）${NC}"
        echo "   请生成随机密钥：openssl rand -hex 32"
        ((ERRORS++))
    elif [ ${#JWT_SECRET} -lt 32 ]; then
        echo -e "${YELLOW}⚠️  JWT_SECRET 长度不足 32 字符（当前：${#JWT_SECRET}）${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✅ JWT_SECRET 配置安全${NC}"
    fi
else
    echo -e "${RED}❌ JWT_SECRET 未设置${NC}"
    ((ERRORS++))
fi

echo ""
echo "📦 数据库配置"
echo "------------"

check_required "DATABASE_URL"

echo ""
echo "🌐 服务配置"
echo "------------"

check_required "PORT"
check_required "API_URL"
check_required "FRONTEND_URL"

echo ""
echo "📧 邮件服务"
echo "------------"

if [ -n "$EMAIL_HOST" ]; then
    echo -e "${GREEN}✅ EMAIL_HOST 已设置${NC}"
else
    echo -e "${YELLOW}⚠️  EMAIL_HOST 未设置（邮件功能不可用）${NC}"
    ((WARNINGS++))
fi

if [ -n "$EMAIL_FROM" ]; then
    echo -e "${GREEN}✅ EMAIL_FROM 已设置${NC}"
else
    echo -e "${YELLOW}⚠️  EMAIL_FROM 未设置（邮件功能不可用）${NC}"
    ((WARNINGS++))
fi

echo ""
echo "🔑 第三方服务"
echo "------------"

if [ -n "$OPENAI_API_KEY" ]; then
    echo -e "${GREEN}✅ OPENAI_API_KEY 已设置${NC}"
else
    echo -e "${YELLOW}⚠️  OPENAI_API_KEY 未设置（AI 功能不可用）${NC}"
    ((WARNINGS++))
fi

echo ""
echo "========================"
echo "检查完成"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ 发现 ${ERRORS} 个错误，必须修复才能部署${NC}"
    echo ""
    echo "修复建议:"
    echo "1. 生成 JWT_SECRET: openssl rand -hex 32"
    echo "2. 设置 .env 文件中的所有必需变量"
    echo "3. 重新运行此脚本验证"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  发现 ${WARNINGS} 个警告，建议优化${NC}"
    exit 0
else
    echo -e "${GREEN}✅ 所有检查通过，可以部署${NC}"
    exit 0
fi
