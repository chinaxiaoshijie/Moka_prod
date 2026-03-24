#!/bin/bash

set -e

echo "========================================"
echo "Running E2E Tests in Docker Container"
echo "========================================"
echo ""

cd /home/malong/projects/Moka_prod/Moka_prod/projects/moka-opencode/backend

# 1. 构建测试镜像
echo "Building test Docker image..."
docker build -t moka-backend-test -f - . << 'EOF'
FROM node:20-bullseye

WORKDIR /app

# 复制所有文件
COPY . .

# 安装依赖（包括开发依赖）
RUN npm install --legacy-peer-deps

# 运行测试
CMD ["npm", "test", "--", "test/e2e/"]

EOF

echo "✅ Test image built"
echo ""

# 2. 运行测试容器并连接到数据库网络
echo "Running tests..."
docker run --rm \
  --network moka_prod_default \
  -e DATABASE_URL="postgresql://moka:moka_password@moka-postgres:5432/moka_db" \
  -e JWT_SECRET="your-secret-key-change-in-production" \
  -e NODE_ENV="test" \
  moka-backend-test

echo ""
echo "========================================"
echo "E2E Tests Complete"
echo "========================================"
