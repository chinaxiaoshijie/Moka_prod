# Moka 面试管理系统 - Docker 部署指南

## 系统要求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 10GB 可用磁盘空间

## 快速部署

### 1. 克隆项目

```bash
git clone https://github.com/chinaxiaoshijie/hiringlikemoka-opencode.git
cd hiringlikemoka-opencode
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.production.example .env

# 编辑 .env 文件，设置生产环境密码
nano .env
```

### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 访问应用

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001

## 部署架构

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │   Frontend   │    │    Backend   │                   │
│  │  (Next.js +  │───▶│   (NestJS)   │                   │
│  │    Nginx)    │    │              │                   │
│  │   :3000      │    │    :3001     │                   │
│  └──────────────┘    └──────┬───────┘                   │
│                             │                             │
│                      ┌──────▼───────┐                   │
│                      │  PostgreSQL  │                   │
│                      │    :5432     │                   │
│                      └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

## 服务说明

### PostgreSQL (数据库)

- 端口: 5432
- 数据持久化: `postgres_data` volume
- 自动初始化: 运行 `docker/postgres/init` 目录中的 SQL

### Backend (后端 API)

- 端口: 3001
- 框架: NestJS + Bun
- 健康检查: `/health`
- 环境变量:
  - `DATABASE_URL`: PostgreSQL 连接字符串
  - `JWT_SECRET`: JWT 密钥 (生产环境必须修改)

### Frontend (前端)

- 端口: 3000
- 框架: Next.js 16 + React 19
- Nginx: 静态文件缓存 + API 代理
- 环境变量:
  - `NEXT_PUBLIC_API_URL`: 后端 API 地址

## 常用命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启单个服务
docker-compose restart backend

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 进入容器
docker exec -it moka-backend sh
docker exec -it moka-frontend sh

# 数据库迁移
docker exec -it moka-backend bunx prisma migrate deploy

# 数据库重置 (⚠️ 会删除所有数据)
docker-compose down -v
docker-compose up -d
```

## 生产环境配置

### 1. 修改密码

编辑 `.env` 文件:

```env
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_secure_jwt_secret
```

### 2. SSL/HTTPS 配置

如需启用 HTTPS, 可以使用 nginx 容器:

```bash
# 1. 获取 SSL 证书
# 2. 配置 nginx SSL
# 3. 取消 docker-compose.yml 中 nginx 服务的注释
```

### 3. 性能优化

```yaml
# docker-compose.yml 中可调整的资源限制
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## 备份与恢复

### 备份数据库

```bash
docker exec moka-postgres pg_dump -U moka moka_db > backup.sql
```

### 恢复数据库

```bash
docker exec -i moka-postgres psql -U moka moka_db < backup.sql
```

## 故障排查

### 服务启动失败

```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend

# 检查端口占用
netstat -tulpn | grep 3000
```

### 数据库连接失败

```bash
# 检查数据库是否运行
docker-compose ps postgres

# 测试数据库连接
docker exec -it moka-backend sh
bunx prisma db push
```

### 前端加载缓慢

```bash
# 检查 Nginx 配置
docker exec moka-frontend nginx -t

# 查看 Nginx 日志
docker exec moka-frontend tail -f /var/log/nginx/access.log
```

## 更新部署

```bash
# 拉取最新代码
git pull origin feature/auth

# 重新构建并启动
docker-compose up -d --build

# 运行数据库迁移 (如有)
docker exec -it moka-backend bunx prisma migrate deploy
```

## 技术栈

| 组件       | 技术                                |
| ---------- | ----------------------------------- |
| 前端       | Next.js 16, React 19, TailwindCSS 4 |
| 后端       | NestJS, Bun, Prisma                 |
| 数据库     | PostgreSQL 15                       |
| Web Server | Nginx                               |
| 容器       | Docker, Docker Compose              |
