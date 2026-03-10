# Moka 面试管理系统 - 本地部署使用说明

## 🚀 快速启动

系统已成功部署到本地！你可以通过以下地址访问：

### 📱 访问地址

- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:3001

### 👤 测试账号

| 角色       | 用户名        | 密码             |
| ---------- | ------------- | ---------------- |
| **HR**     | `hr`          | `hr123456`       |
| **面试官** | `interviewer` | `interviewer123` |

---

## 📋 系统功能

### 已实现功能

✅ **用户认证**

- JWT token认证
- 角色区分（HR/面试官）

✅ **职位管理** (HR)

- 创建、编辑、删除职位
- 查看职位列表
- 职位状态管理（开放/暂停/关闭）

✅ **候选人管理** (HR)

- 添加、编辑、删除候选人
- PDF简历导入（支持从Boss直聘下载的PDF）
- 自动提取姓名、电话、邮箱
- 候选人状态跟踪

✅ **面试管理**

- 查看面试列表
- 面试官查看"我的面试"

✅ **面试反馈**

- 面试官提交反馈
- 星级评分（1-5星）
- 综合评价

✅ **面试流程** (HR)

- 创建多轮面试流程（1-5轮）
- 配置每轮面试官
- 流程状态跟踪
- 邮件通知（当前输出到控制台）

---

## 🛠️ 技术栈

- **前端**: Next.js 16 + React 19 + Tailwind CSS
- **后端**: NestJS + Prisma + PostgreSQL
- **部署**: Docker + Docker Compose

---

## 📁 项目结构

```
moka-opencode/
├── frontend/          # 前端代码
├── backend/           # 后端代码
├── docker-compose.yml # Docker部署配置
├── deploy.sh          # 首次部署脚本
├── start.sh           # 快速启动脚本
├── stop.sh            # 停止服务脚本
└── .env.example       # 环境变量示例
```

---

## 🔧 常用命令

```bash
# 首次部署（构建并启动所有服务）
./deploy.sh

# 快速启动（已部署过）
./start.sh

# 停止服务
./stop.sh

# 查看日志
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# 重启服务
docker-compose restart

# 完全删除（包括数据库数据）
docker-compose down --volumes
```

---

## 🧪 测试验证

系统已通过以下测试：

✅ 12个API端点测试通过
✅ 14步端到端流程测试通过
✅ 登录认证测试通过
✅ 数据查询测试通过

---

## 📝 注意事项

1. **数据库**: PostgreSQL数据存储在Docker volume中，删除容器不会丢失数据
2. **邮件通知**: 当前仅输出到控制台，如需真实邮件发送请配置SMTP
3. **文件上传**: PDF文件保存在 `backend/uploads/` 目录
4. **JWT密钥**: 生产环境请修改 `.env` 中的 `JWT_SECRET`

---

## 🐛 故障排查

### 服务无法启动

```bash
# 检查端口占用
lsof -i :3000
lsof -i :3001
lsof -i :5432

# 完全重置
./stop.sh
docker-compose down --volumes
./deploy.sh
```

### 数据库连接失败

```bash
# 检查数据库状态
docker-compose ps postgres

# 重新迁移数据库
cd backend && bunx prisma migrate deploy
```

### 前端无法访问

```bash
# 检查前端日志
tail -f /tmp/frontend.log
```

---

## 🎉 开始使用

1. 打开浏览器访问 http://localhost:3000
2. 使用测试账号登录
3. 体验完整的招聘管理流程！

祝你使用愉快！🎊
