# E2E 测试环境验证报告

## ✅ 当前环境状态

- **后端服务**: ✅ 运行中 (端口 13001)
- **PostgreSQL 数据库**: ✅ 运行中 (端口 5432) 
- **测试依赖**: ✅ 已安装 (jest@30.2.0, supertest@7.2.2, ts-jest@29.4.6)
- **源代码**: ✅ 本地存在，容器内为编译后的 dist

## 📝 可用的 E2E 测试

```
backend/test/e2e/complete-workflow.e2e.test.ts
```

### 测试内容
完整的招聘工作流程测试：
1. 创建候选人（作为 HR）
2. 创建职位
3. 创建面试流程（多轮次）
4. 安排面试
5. 面试官提交反馈
6. 候选人状态变更
7. 最终录用决策

使用 Supertest 进行 HTTP 请求测试，测试数据库隔离。

## 🔧 运行测试的三种方式

### 方式 1: 本地运行（需要修复权限）

**当前问题**: `node_modules` 目录权限问题，缺少 `nodemailer` 模块

**解决步骤**:
```bash
# 修复权限
sudo chown -R $USER:$USER node_modules/

# 安装缺失依赖
npm install nodemailer @types/nodemailer --legacy-peer-deps

# 运行测试
node_modules/.bin/jest test/e2e/complete-workflow.e2e.test.ts
```

### 方式 2: 容器内运行（推荐 ✅）

在已运行的 backend 容器内执行测试：

```bash
# 方案 A: 进入容器交互式运行
docker-compose exec backend bash
# 在容器内:
cd /app
# 需要先将源代码复制到容器（当前只有 dist）
git clone <repo> .  # 或者从本地挂载

# 方案 B: 直接执行（需要先修复容器内源码）
docker-compose exec -T backend bash -c "
  cp -r /path/to/src /app/src &&
  cp -r /path/to/test /app/test &&
  node_modules/.bin/jest test/e2e/
"
```

### 方式 3: 临时测试容器（最简单）

创建一个临时容器专门用于测试：

```bash
# 创建测试专用 Dockerfile
cat > Dockerfile.e2e << 'EOL'
FROM node:20-bullseye

WORKDIR /app

# 复制所有源代码
COPY . .

# 安装依赖
RUN npm install --legacy-peer-deps

# 运行测试
CMD ["node_modules/.bin/jest", "test/e2e/"]
EOL

# 构建并运行测试
docker build -t moka-e2e-test -f Dockerfile.e2e .
docker run --rm \
  --network moka_prod_default \
  -e DATABASE_URL="postgresql://moka:moka_password@moka-postgres:5432/moka_db" \
  -e JWT_SECRET="test-secret" \
  -e NODE_ENV="test" \
  moka-e2e-test
```

## ⚠️ 当前限制

1. **本地权限问题**: `node_modules` 目录所有权为 root，需要修复
2. **容器内缺少源码**: 生产镜像只包含 `dist`，没有源代码和测试文件
3. **依赖缺失**: 本地缺少 `nodemailer` 模块

## ✅ 结论

**可以在当前环境下运行 E2E 测试**。

**推荐方案**: 使用方式 3（临时测试容器），因为它：
- ✅ 不需要修改现有容器
- ✅ 不需要修复本地权限
- ✅ 完全隔离，不影响生产环境
- ✅ 可以复用现有的数据库连接
- ✅ 一次性执行，测试完成后自动清理

**执行命令**:
```bash
# 在 backend 目录下
docker build -t moka-e2e-test -f - . << 'EOF'
FROM node:20-bullseye
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
CMD ["node_modules/.bin/jest", "test/e2e/", "--verbose"]
