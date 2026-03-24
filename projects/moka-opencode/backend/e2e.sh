#!/bin/bash

set -e

echo "========================================"
echo "E2E Test Execution"
echo "========================================"
echo ""

cd /app/backend

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --legacy-peer-deps
fi

# 运行 E2E 测试
echo "Running E2E tests..."
npm test -- test/e2e/

echo ""
echo "========================================"
echo "E2E Test Complete"
echo "========================================"
