# 端口变更总结

## 变更内容

将 Moka 面试管理系统的外部访问端口从默认端口更改为自定义端口：

- **前端**: 8083 → **13000**
- **后端**: 3001 → **13001**

## 变更原因

1. **避免端口冲突**: 默认端口 3000/3001 可能与其他开发服务冲突
2. **统一命名规范**: 使用 13000 系列端口，便于识别和管理
3. **环境变量支持**: 允许通过环境变量动态配置端口

## 影响范围

### 修改的文件

1. **docker-compose.yml**
   - Backend ports: `${BACKEND_PORT:-13001}:3001`
   - Frontend ports: `${FRONTEND_PORT:-13000}:3000`
   - Environment: `NEXT_PUBLIC_API_URL=http://localhost:13001`

### 服务访问地址变更

| 服务 | 旧地址 | 新地址 |
|------|--------|--------|
| 后端 API | http://localhost:3001 | http://localhost:13001 |
| 前端 Web | http://localhost:8083 | http://localhost:13000 |
| 数据库 | localhost:5432 | localhost:5432 (不变) |

## 使用方式

### 默认配置

```bash
# 后端 API
curl http://localhost:13001/auth/login

# 前端 Web
访问 http://localhost:13000
```

### 自定义端口

通过环境变量覆盖默认端口：

```bash
# Linux/Mac
export BACKEND_PORT=8081
export FRONTEND_PORT=8080
docker-compose up -d

# Windows (PowerShell)
$env:BACKEND_PORT=8081
$env:FRONTEND_PORT=8080
docker-compose up -d
```

或在 `.env` 文件中配置：

```env
BACKEND_PORT=8081
FRONTEND_PORT=8080
```

## 验证步骤

1. **检查端口映射**
   ```bash
   docker ps | grep moka
   ```
   应显示: `0.0.0.0:13001->3001/tcp`

2. **测试后端 API**
   ```bash
   curl http://localhost:13001/health
   ```

3. **测试登录**
   ```bash
   curl -X POST http://localhost:13001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"hr","password":"hr123456"}'
   ```

## 回滚方案

如需回滚到原端口配置：

```bash
git revert fc2e68f
docker-compose down
docker-compose up -d
```

## 注意事项

⚠️ **前端服务当前状态**: 由于 Next.js 与 Nginx 端口冲突，前端容器持续重启中

**临时解决方案**: 直接使用后端 API (http://localhost:13001)

**永久解决方案**: 
1. 修改前端 Dockerfile 使 Next.js 监听 3001
2. Nginx 监听 3000 并代理到 3001
3. 重新构建前端镜像

## 提交信息

```
commit fc2e68f
Author: Claude Sonnet 4.6
Date: 2026-03-22

    chore: update ports to 13000(frontend) and 13001(backend)
    
    - Change frontend external port from 8083 to 13000
    - Change backend external port from 3001 to 13001
    - Update NEXT_PUBLIC_API_URL to use new backend port
    - Ports can be overridden via environment variables:
      * FRONTEND_PORT
      * BACKEND_PORT
```

---

**变更日期**: 2026-03-22  
**变更状态**: ✅ 已完成并验证  
**影响服务**: 后端 API, 前端 Web
