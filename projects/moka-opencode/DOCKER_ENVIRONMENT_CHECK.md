# Docker 环境检查和配置说明

## 1. Docker 容器状态

### 当前状态
```bash
$ docker ps
```

| 容器名称 | 镜像 | 状态 | 健康检查 | 端口 |
|-----------|--------|------|----------|------|
| moka-postgres | postgres:15-alpine | ✅ Up | ✅ healthy | 5432 |

### Docker Compose 配置
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: moka-postgres
    restart: always
    environment:
      POSTGRES_USER: moka
      POSTGRES_PASSWORD: moka_password
      POSTGRES_DB: moka_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U moka"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

## 2. 数据库连接

### 连接信息
- **Host**: localhost
- **Port**: 5432
- **Database**: moka_db
- **User**: moka
- **Password**: moka_password

### 测试连接
```bash
# 方法 1: 使用 docker exec
docker exec -it moka-postgres psql -U moka -d moka_db

# 方法 2: 使用 psql 客户端
psql -h localhost -p 5432 -U moka -d moka_db
```

### 数据验证
```sql
-- 检查用户表
SELECT username, name, role, created_at FROM users;

-- 检查表结构
\d users
\d positions
\d candidates
\d interviews
```

## 3. 环境变量配置

### Backend (.env)
```bash
DATABASE_URL="postgresql://moka:moka_password@localhost:5432/moka_db?schema=public"
JWT_SECRET="dev-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

### Prisma 配置
```toml
[provider]
provider = "postgresql"

[datasource]
url      = env("DATABASE_URL")
```

## 4. 快速启动/停止

### 一键启动
```bash
./start.sh
```

这个脚本会：
1. ✅ 检查依赖（Docker, Docker Compose, Bun）
2. ✅ 启动数据库容器
3. ✅ 清理端口占用
4. ✅ 生成 Prisma Client
5. ✅ 启动后端服务（端口 3001）
6. ✅ 启动前端服务（端口 3000）
7. ✅ 显示访问地址和测试账号

### 一键停止
```bash
./stop.sh
```

这个脚本会：
1. ✅ 停止后端服务
2. ✅ 停止前端服务
3. ✅ 询问是否停止数据库容器

## 5. 服务端口

| 服务 | 端口 | 用途 |
|------|--------|------|
| PostgreSQL | 5432 | 数据库 |
| Backend API | 3001 | REST API |
| Frontend | 3000 | Web 界面 |

## 6. 常见问题排查

### 问题 1: 数据库连接失败
```bash
# 检查容器是否运行
docker ps | grep postgres

# 检查容器日志
docker logs moka-postgres

# 重新启动数据库
docker-compose down && docker-compose up -d
```

### 问题 2: 端口占用
```bash
# 查看端口占用
lsof -ti:3000  # 前端
lsof -ti:3001  # 后端
lsof -ti:5432  # 数据库

# 杀死占用端口的进程
lsof -ti:3000 | xargs kill -9
```

### 问题 3: Prisma Client 未生成
```bash
cd backend
bun run prisma:generate
```

### 问题 4: 数据库迁移失败
```bash
# 重置数据库（慎用，会删除所有数据）
cd backend
docker-compose down
docker volume rm moka-opencode_postgres_data
docker-compose up -d
bun run prisma:migrate
bunx prisma db seed
```

## 7. 服务状态检查

### 健康检查脚本
```bash
#!/bin/bash
echo "=== 服务健康检查 ==="

# 检查数据库
docker ps | grep moka-postgres && echo "✅ 数据库运行正常" || echo "❌ 数据库未运行"

# 检查后端
curl -s http://localhost:3001 > /dev/null && echo "✅ 后端运行正常" || echo "❌ 后端未运行"

# 检查前端
curl -s http://localhost:3000 > /dev/null && echo "✅ 前端运行正常" || echo "❌ 前端未运行"
```

## 8. 日志查看

### 查看实时日志
```bash
# 后端日志
tail -f /tmp/backend.log

# 前端日志
tail -f /tmp/frontend.log

# 数据库日志
docker logs -f moka-postgres
```

## 总结

✅ **Docker 环境配置正确**
✅ **数据库容器运行正常**
✅ **后端服务运行正常**
✅ **前端服务运行正常**
✅ **所有 API 接口测试通过**

系统已就绪，可以开始使用！
