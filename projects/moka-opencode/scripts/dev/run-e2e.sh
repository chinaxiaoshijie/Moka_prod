#!/bin/bash

set -e

echo "========================================"
echo "Running E2E Tests in Backend Container"
echo "========================================"
echo ""

cd /home/malong/projects/Moka_prod/Moka_prod/projects/moka-opencode

# 1. 在现有后端容器中执行测试
echo ""
echo "Creating Jest configuration..."

docker-compose exec -T backend bash -c "
cat > jest.config.js << 'EOL'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  setupFilesAfterEnv: ['./test/setup.ts']
};
EOL
"

echo "✅ Jest configuration created"
echo ""

# 2. 修改 package.json 添加测试脚本
echo "Adding test script to package.json..."
docker-compose exec -T backend bash -c "
node -e '
const fs = require(\"fs\");
const pkg = JSON.parse(fs.readFileSync(\"package.json\", \"utf8\"));
pkg.scripts.test = \"jest\";
fs.writeFileSync(\"package.json\", JSON.stringify(pkg, null, 2));
'
"

echo "✅ Test script added"
echo ""

# 3. 运行测试
echo "Running E2E tests..."
echo ""

docker-compose exec -T backend bash -c "
npm test -- test/e2e/
"

echo ""
echo "========================================"
echo "Test Execution Complete"
echo "========================================"
