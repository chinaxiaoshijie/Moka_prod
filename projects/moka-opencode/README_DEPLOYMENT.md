# Moka 面试管理系统 - 部署指南

## 🚀 快速开始

### 1. 启动所有服务

```bash
docker-compose up -d
```

### 2. 验证服务状态

```bash
docker ps --filter "name=moka"
```

**预期输出**:
```
moka-backend    Up    0.0.0.0:13001->3001/tcp
moka-postgres   Up    0.0.0.0:5432->5432/tcp
moka-frontend   Up    0.0.0.0:13000->3000/tcp
```

### 3. 测试 API

```bash
# 获取访问令牌
curl -X POST http://localhost:13001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hr","password":"hr123456"}'

# 访问受保护的端点
curl http://localhost:13001/candidates \
  -H "Authorization: Bearer <token>"
```

---

## 📋 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 13001 | NestJS REST API |
| 前端 Web | 13000 | Next.js 应用 (待修复) |
| 数据库 | 5432 | PostgreSQL |

**注意**: 前端服务当前因端口冲突无法正常访问，建议直接使用后端 API。

---

## 🔑 测试账户

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| HR | hr | hr123456 | 全系统管理 |
| 面试官 | interviewer | interviewer123 | 面试相关操作 |

---

## 🛠️ 常见问题

### 前端 502 Bad Gateway

**问题**: 访问 http://localhost:13000 返回 502 错误

**原因**: Next.js 与 Nginx 端口冲突

**解决方案**:
1. **临时**: 使用后端 API (http://localhost:13001)
2. **永久**: 修复前端 Dockerfile 端口配置

### 容器无法启动

```bash
# 查看日志
docker logs moka-backend
docker logs moka-postgres

# 重启服务
docker-compose restart
```

### 数据库连接失败

```bash
# 等待数据库启动
sleep 10

# 重新运行迁移
docker-compose exec backend npx prisma migrate dev
```

---

## 📚 详细文档

- [部署总结](DEPLOYMENT_SUMMARY.md) - 完整部署过程和修复记录
- [测试报告](DEPLOYMENT_TEST_RESULTS.md) - 全量测试结果
- [端口变更](PORTS_CHANGE_SUMMARY.md) - 端口配置说明

---

## 🎯 下一步

1. **立即使用**: 通过 API (http://localhost:13001) 进行开发和测试
2. **修复前端**: 解决端口冲突问题，恢复 Web UI
3. **配置监控**: 添加健康检查、日志聚合
4. **生产部署**: 配置 SSL、负载均衡、备份策略

---

**最后更新**: 2026-03-22  
**状态**: ✅ 后端服务生产就绪
