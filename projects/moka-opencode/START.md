# Moka 面试系统 - 启动指南

## 前提条件

- Docker 和 Docker Compose 已安装
- Bun 已安装
- 项目已克隆到本地

## 快速启动（首次）

```bash
# 1. 启动数据库
docker-compose up -d

# 2. 后端初始化（首次运行）
cd backend
bun install
bun run prisma:generate
bun run prisma:migrate
bunx prisma db seed  # 填充测试数据
bun run dev &

# 3. 前端启动（新终端）
cd frontend
bun install
bun run dev
```

## 启动步骤

### 1. 启动数据库

```bash
# 启动 PostgreSQL 容器
docker-compose up -d

# 确认容器运行状态
docker ps
```

### 2. 后端启动

```bash
# 进入后端目录
cd backend

# 安装依赖（首次运行）
bun install

# 生成 Prisma Client
bun run prisma:generate

# 运行数据库迁移（首次运行或 schema 变更）
bun run prisma:migrate

# 填充测试数据（首次运行）
bunx prisma db seed

# 启动开发服务器
bun run dev
```

后端将运行在 `http://localhost:3001`

### 3. 前端启动

```bash
# 打开新终端，进入前端目录
cd frontend

# 安装依赖（首次运行）
bun install

# 启动开发服务器
bun run dev
```

前端将运行在 `http://localhost:3000`

## 访问系统

打开浏览器访问：`http://localhost:3000`

系统会自动重定向到登录页面。

## 测试账号

| 角色   | 用户名      | 密码           |
| ------ | ----------- | -------------- |
| HR     | hr          | hr123456       |
| 面试官 | interviewer | interviewer123 |

## 后续启动（非首次）

如果数据库和依赖已经配置好，只需：

```bash
# 终端 1 - 数据库
docker-compose up -d

# 终端 2 - 后端
cd backend && bun run dev

# 终端 3 - 前端
cd frontend && bun run dev
```

## 停止项目

```bash
# 停止后端（Ctrl+C）

# 停止前端（Ctrl+C）

# 停止数据库容器
docker-compose down
```

## 开发提示

- 后端代码修改后会自动重启
- 前端代码修改后会热更新
- 数据库迁移修改 schema 后需重新运行 `bun run prisma:migrate`
- 查看数据库：`cd backend && bun run prisma:studio`
