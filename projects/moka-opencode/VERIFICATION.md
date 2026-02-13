# Moka 面试系统 - 环境验证报告

**验证时间**: 2026-02-13 16:42
**验证结果**: ✅ 全部通过

---

## 1. Docker 环境

### 容器状态

```bash
$ docker ps | grep moka
```

| 容器          | 状态            | 端口 |
| ------------- | --------------- | ---- |
| moka-postgres | ✅ Up (healthy) | 5432 |

**结论**: 数据库容器运行正常

---

## 2. 数据库连接

### 连接测试

```bash
$ docker exec moka-postgres psql -U moka -d moka_db -c "SELECT 1 as status;"
 status
--------
      1
```

**结论**: 数据库连接正常

---

## 3. 后端服务

### 启动状态

```bash
$ cd backend && bun run dev
🚀 Backend server running on http://localhost:3001
```

### API 测试

#### 登录测试

```bash
$ curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hr","password":"hr123456"}'
```

**响应**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 604800,
  "user": {
    "id": "018691c8-0b4e-4de5-8d4d-b5220b00107f",
    "username": "hr",
    "name": "张HR",
    "email": "hr@company.com",
    "role": "HR"
  }
}
```

**结果**: ✅ 登录成功

#### 获取用户信息

```bash
$ curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer <token>"
```

**响应**:

```json
{
  "id": "018691c8-0b4e-4de5-8d4d-b5220b00107f",
  "username": "hr",
  "name": "张HR",
  "email": "hr@company.com",
  "role": "HR",
  "avatarUrl": null
}
```

**结果**: ✅ 用户信息获取成功

#### 未授权访问测试

```bash
$ curl http://localhost:3001/auth/profile
```

**响应**:

```json
{
  "message": "Token not found",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**结果**: ✅ 权限控制正常

**结论**: 后端服务运行正常，API 响应正确

---

## 4. 前端服务

### 启动状态

```bash
$ cd frontend && bun run dev
▲ Next.js 16.1.6 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.31.142:3000
✓ Ready in 916ms
```

### 页面测试

#### 登录页面

```bash
$ curl http://localhost:3000/login | grep "Moka 面试系统"
Moka 面试系统
```

**结果**: ✅ 登录页面正常加载

#### 首页重定向

```bash
$ curl -s -o /dev/null -w "%{redirect_url}" http://localhost:3000
http://localhost:3000/login
```

**结果**: ✅ 首页正确重定向到登录页

**结论**: 前端服务运行正常

---

## 5. 环境配置

### 端口占用

```bash
$ lsof -ti:3000,3001
# 端口 3000: 前端
# 端口 3001: 后端
```

### 进程状态

```bash
$ ps aux | grep -E "bun.*dev|next.*dev"
# 后端进程: running
# 前端进程: running
```

---

## 6. 测试账号

| 角色   | 用户名      | 密码           | 状态      |
| ------ | ----------- | -------------- | --------- |
| HR     | hr          | hr123456       | ✅ 已验证 |
| 面试官 | interviewer | interviewer123 | ✅ 已验证 |

---

## 7. 系统访问

### 访问地址

| 服务   | 地址                  | 状态      |
| ------ | --------------------- | --------- |
| 前端   | http://localhost:3000 | ✅ 可访问 |
| 后端   | http://localhost:3001 | ✅ 可访问 |
| 数据库 | localhost:5432        | ✅ 可访问 |

### 浏览器测试

1. 打开浏览器访问 http://localhost:3000
2. 自动重定向到 /login 登录页
3. 使用测试账号登录
4. 登录成功后跳转到 /dashboard

**结果**: ✅ 登录流程完整

---

## 总结

| 组件          | 状态    | 说明                           |
| ------------- | ------- | ------------------------------ |
| Docker 数据库 | ✅ 正常 | PostgreSQL 容器健康运行        |
| 后端 API      | ✅ 正常 | NestJS 服务运行，API 响应正确  |
| 前端页面      | ✅ 正常 | Next.js 服务运行，页面加载正确 |
| 数据库连接    | ✅ 正常 | Prisma 客户端连接成功          |
| 认证系统      | ✅ 正常 | 登录、token、权限验证全部通过  |
| 页面路由      | ✅ 正常 | 重定向和导航功能正常           |

### 验证结论

**所有组件运行正常，系统已就绪。** 🎉

### 启动命令（后续使用）

```bash
# 启动数据库
docker-compose up -d

# 启动后端
cd backend && bun run dev

# 启动前端（新终端）
cd frontend && bun run dev
```

### 停止命令

```bash
# 停止后端和前端（Ctrl+C）
# 停止数据库
docker-compose down
```

---

**报告生成时间**: 2026-02-13 16:42
