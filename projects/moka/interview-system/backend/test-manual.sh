#!/bin/bash

# 面试管理系统 - 全面功能测试脚本
# 直接使用curl进行API测试

BASE_URL="http://localhost:3000"
TOKEN=""
TOTAL=0
PASSED=0
FAILED=0

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 面试管理系统 - 全面功能测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 测试函数
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local auth="$5"

    TOTAL=$((TOTAL + 1))
    echo -e "\n${BLUE}[测试 $TOTAL] $name${NC}"
    echo "请求: $method $endpoint"

    local cmd="curl -s -X $method \"$BASE_URL$endpoint\""

    if [ -n "$auth" ] && [ -n "$TOKEN" ]; then
        cmd="$cmd -H \"Authorization: Bearer $TOKEN\""
    fi

    if [ -n "$data" ]; then
        cmd="$cmd -H \"Content-Type: application/json\" -d '$data'"
    fi

    cmd="$cmd --max-time 10"

    # 执行请求
    response=$(eval $cmd 2>&1)
    exit_code=$?

    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}✗ FAIL: 请求失败${NC}"
        echo "错误: $response"
        FAILED=$((FAILED + 1))
        return 1
    fi

    # 检查响应
    if echo "$response" | grep -q '"success":true\|"status":"ok"'; then
        echo -e "${GREEN}✓ PASS${NC}"
        echo "响应: $(echo "$response" | head -c 200)..."
        PASSED=$((PASSED + 1))

        # 提取token（如果是登录请求）
        if echo "$response" | grep -q '"token"'; then
            TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
            echo "获取到Token: ${TOKEN:0:30}..."
        fi
        return 0
    else
        echo -e "${RED}✗ FAIL: API返回错误${NC}"
        echo "响应: $response"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 等待服务器启动
echo -e "${YELLOW}等待服务器启动...${NC}"
sleep 3

for i in {1..10}; do
    if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 服务器已就绪${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}✗ 服务器未响应，测试中止${NC}"
        exit 1
    fi
    sleep 2
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}开始功能测试${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. 健康检查
test_api "服务器健康检查" "GET" "/health" "" "noauth"

# 2. 用户登录
test_api "管理员登录" "POST" "/api/auth/login" \
    '{"username":"admin","email":"admin@company.com","password":"test123"}' "noauth"

# 3. 数据导出功能
if [ -n "$TOKEN" ]; then
    test_api "导出候选人列表" "GET" "/api/exports/candidates" "" "auth"
    test_api "导出职位列表" "GET" "/api/exports/positions" "" "auth"
    test_api "导出面试列表" "GET" "/api/exports/interviews" "" "auth"
    test_api "导出反馈列表" "GET" "/api/exports/feedbacks" "" "auth"
    test_api "获取导出历史" "GET" "/api/exports/history" "" "auth"
fi

# 4. 候选人管理
if [ -n "$TOKEN" ]; then
    test_api "获取候选人列表" "GET" "/api/candidates?page=1&limit=10" "" "auth"
fi

# 5. 职位管理
if [ -n "$TOKEN" ]; then
    test_api "获取职位列表" "GET" "/api/positions?page=1&limit=10" "" "auth"
fi

# 6. 面试管理
if [ -n "$TOKEN" ]; then
    test_api "获取面试列表" "GET" "/api/interviews?page=1&limit=10" "" "auth"
fi

# 7. 简历管理API（不需要认证）
test_api "简历路由注册" "GET" "/api/resumes" "" "noauth"

# 8. 邮件通知API
if [ -n "$TOKEN" ]; then
    test_api "获取邮件配置" "GET" "/api/notifications/config" "" "auth"
fi

# 9. 批量导入
if [ -n "$TOKEN" ]; then
    test_api "获取导入模板" "GET" "/api/imports/candidates-template" "" "auth"
fi

# 10. 操作日志
if [ -n "$TOKEN" ]; then
    test_api "获取操作日志" "GET" "/api/audit-logs?limit=10" "" "auth"
    test_api "获取日志统计" "GET" "/api/audit-logs/stats?days=30" "" "auth"
    test_api "获取操作类型" "GET" "/api/audit-logs/action-types" "" "auth"
    test_api "获取资源类型" "GET" "/api/audit-logs/resource-types" "" "auth"
fi

# 测试总结
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}测试总结${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "总测试数: $TOTAL"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"

if [ $TOTAL -gt 0 ]; then
    PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")
    echo "通过率: $PASS_RATE%"
fi

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  $FAILED 个测试失败${NC}"
    exit 1
fi
