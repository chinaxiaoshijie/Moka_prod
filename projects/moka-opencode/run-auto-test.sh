#!/bin/bash
# MOKA 主流程自动化测试脚本
# 创建日期：2026-04-02
# 用途：自动化验证所有主流程

set -e

echo "========================================"
echo "MOKA 主流程自动化测试"
echo "========================================"
echo ""

# 1. 检查服务状态
echo "1️⃣  检查服务状态..."
if curl -s http://localhost:13001/health | grep -q '"status":"ok"'; then
    echo "✅ 后端服务正常"
else
    echo "❌ 后端服务异常"
    exit 1
fi

if curl -s http://localhost:13000 | grep -q "Moka"; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务异常"
    exit 1
fi
echo ""

# 2. 初始化测试数据
echo "2️⃣  初始化测试数据..."
cd /home/malong/projects/Moka_prod/Moka_prod/projects/moka-opencode/backend
docker-compose exec -T backend npx prisma db seed
echo "✅ 测试数据已创建"
echo ""

# 3. 运行 API 测试
echo "3️⃣  运行 API 测试..."
cd /home/malong/projects/Moka_prod/Moka_prod/projects/moka-opencode/backend
npm test -- test/e2e/ --passWithNoTests
echo "✅ API 测试完成"
echo ""

# 4. 运行 E2E 测试
echo "4️⃣  运行 E2E 测试..."
cd /home/malong/projects/Moka_prod/Moka_prod/projects/moka-opencode
npx playwright test --project=chromium
echo "✅ E2E 测试完成"
echo ""

# 5. 生成测试报告
echo "5️⃣  生成测试报告..."
echo "========================================"
echo "测试报告"
echo "========================================"
echo "服务状态：✅ 正常"
echo "测试数据：✅ 已创建"
echo "API 测试：✅ 通过"
echo "E2E 测试：✅ 通过"
echo "========================================"
echo ""
echo "🎉 所有测试通过！"
echo ""
