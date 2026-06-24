#!/bin/bash

# Moka Interview System - Test Runner
# Based on: https://github.com/goldbergyoni/javascript-testing-best-practices (24.6k ⭐)

echo "========================================"
echo "  Moka 面试系统 - 测试套件"
echo "========================================"
echo ""
echo "📋 测试结构:"
echo "   - 认证 API 测试"
echo "   - 候选人 API 测试"  
echo "   - 面试流程 API 测试"
echo "   - E2E 完整工作流测试"
echo ""
echo "✨ 应用的最佳实践:"
echo "   ✅ AAA 模式 (Arrange-Act-Assert)"
echo "   ✅ What-When-Expect 命名规范"
echo "   ✅ 黑盒测试"
echo "   ✅ 真实测试数据"
echo "   ✅ 测试隔离"
echo ""
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}测试文件列表:${NC}"
echo ""

for file in /home/malong/projects/moka-opencode/backend/test/**/*.test.ts; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        printf "  ✅ %-50s\n" "$filename"
    fi
done

echo ""
echo "========================================"
echo ""
echo "📖 测试文件详情:"
echo ""

# Count test cases
AUTH_TESTS=$(grep -c "it(" /home/malong/projects/moka-opencode/backend/test/integration/auth.api.test.ts 2>/dev/null || echo "0")
CANDIDATE_TESTS=$(grep -c "it(" /home/malong/projects/moka-opencode/backend/test/integration/candidates.api.test.ts 2>/dev/null || echo "0")
PROCESS_TESTS=$(grep -c "it(" /home/malong/projects/moka-opencode/backend/test/integration/interview-process.api.test.ts 2>/dev/null || echo "0")
E2E_TESTS=$(grep -c "it(" /home/malong/projects/moka-opencode/backend/test/e2e/complete-workflow.e2e.test.ts 2>/dev/null || echo "0")

echo "  认证 API 测试:        $AUTH_TESTS 个测试用例"
echo "  候选人 API 测试:      $CANDIDATE_TESTS 个测试用例"
echo "  面试流程 API 测试:    $PROCESS_TESTS 个测试用例"
echo "  E2E 完整工作流测试:   $E2E_TESTS 个测试用例"
echo ""
echo "  总计: $((AUTH_TESTS + CANDIDATE_TESTS + PROCESS_TESTS + E2E_TESTS)) 个测试用例"
echo ""
echo "========================================"
echo ""
echo -e "${GREEN}✨ 测试套件已准备就绪!${NC}"
echo ""
echo "📚 查看测试文档:"
echo "   backend/test/README.md"
echo ""
echo "🚀 运行测试 (需要安装依赖):"
echo "   cd backend"
echo "   npm install"
echo "   npm test"
echo ""
echo "========================================"
