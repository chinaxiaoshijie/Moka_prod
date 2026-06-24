# Moka 面试管理系统

> 基于 AI Native 开发的企业级招聘管理系统，支持完整的面试招聘流程管理。

## 项目简介

Moka 面试管理系统是一个招聘管理平台，帮助企业管理招聘流程，包括职位管理、候选人管理、面试调度、反馈收集等核心功能。

### 核心功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 用户认证 | 可用 | JWT 身份验证，HR/面试官双角色，密码修改 |
| 职位管理 | 可用 | 创建、编辑、删除职位，状态管理 |
| 候选人管理 | 可用 | 手动录入、简历文件上传、查重 |
| 面试管理 | 可用 | 面试安排、日程管理、日历视图 |
| 面试流程 | 可用 | 多轮面试流程（1-5轮），轮次状态跟踪 |
| 反馈系统 | 可用 | 结构化反馈，星级评分，综合评价 |
| 数据分析 | 可用 | 招聘统计、漏斗分析、职位统计 |
| 通知系统 | 可用 | 系统消息推送（数据库存储） |
| 用户管理 | 可用 | 用户列表查看 |
| 简历文件上传 | 可用 | PDF/Word 文件上传存储 |
| 简历文本解析 | 未启用 | PDF 文本提取功能已禁用 |
| 邮件通知 | 需配置 | 需要 SMTP 配置，未配置时输出到控制台 |
| Excel 批量导入 | 未实现 | 前端有 UI，后端接口未实现 |
| 设置-系统信息 | 静态 | 版本号、数据库状态为硬编码值 |

### 快速开始

#### Docker 一键部署（推荐）

```bash
# 克隆项目
git clone https://github.com/chinaxiaoshijie/hiringlikemoka-opencode.git
cd hiringlikemoka-opencode

# 配置环境变量
cp .env.production.example .env
nano .env  # 修改密码

# 启动服务
./deploy.sh
```

访问地址：
- 前端: `http://localhost:13000`
- 后端 API: `http://localhost:13001`

#### 本地开发

```bash
# 1. 启动数据库
docker-compose up -d postgres

# 2. 初始化后端
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed

# 3. 启动后端
npm run dev  # 端口: 13001

# 4. 启动前端
cd ../frontend
npm install
npm run dev  # 端口: 13000
```

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| HR | `hr` | `hr123456` |
| 面试官 | `interviewer` | `interviewer123` |

---

## 技术栈

### 后端
- **框架**: NestJS (TypeScript)
- **ORM**: Prisma
- **数据库**: PostgreSQL 15
- **认证**: JWT + Passport.js
- **文件**: Multer (PDF/Word 上传)
- **邮件**: Nodemailer（需 SMTP 配置）

### 前端
- **框架**: Next.js 16
- **UI**: React 19
- **样式**: TailwindCSS 4
- **HTTP**: Fetch API

### 基础设施
- **容器**: Docker + Docker Compose
- **Web Server**: Nginx（前端反向代理）

---

## 项目结构

```
moka-opencode/
├── backend/                  # 后端 NestJS 应用
│   ├── src/
│   │   ├── analytics/       # 数据分析模块
│   │   ├── auth/            # 认证模块（登录/注册/密码修改）
│   │   ├── candidates/      # 候选人模块
│   │   ├── feedback/        # 反馈模块
│   │   ├── interview-processes/  # 面试流程模块
│   │   ├── interviews/      # 面试模块
│   │   ├── notifications/   # 通知模块
│   │   ├── positions/       # 职位模块
│   │   ├── users/           # 用户模块
│   │   ├── email/           # 邮件服务
│   │   └── config/          # 配置
│   ├── prisma/
│   │   ├── schema.prisma    # 数据模型
│   │   └── migrations/      # 数据库迁移
│   └── Dockerfile
│
├── frontend/                 # 前端 Next.js 应用
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/   # 仪表板
│   │   │   ├── positions/   # 职位管理
│   │   │   ├── candidates/  # 候选人管理
│   │   │   ├── interviews/  # 面试管理
│   │   │   ├── interview-processes/  # 面试流程
│   │   │   ├── feedback/    # 反馈管理
│   │   │   ├── analytics/   # 数据分析
│   │   │   ├── calendar/    # 日历视图
│   │   │   ├── settings/    # 系统设置
│   │   │   └── login/       # 登录页
│   │   └── components/      # 共享组件
│   └── Dockerfile
│
├── docker-compose.yml        # Docker 部署配置
├── .env.example              # 环境变量模板
├── deploy.sh                 # 部署脚本
├── start.sh                  # 启动脚本
├── stop.sh                   # 停止脚本
└── README.md
```

---

## API 端点

### 认证
- `POST /auth/login` - 用户登录
- `GET /auth/profile` - 获取当前用户信息
- `PUT /auth/profile` - 更新个人信息
- `POST /auth/change-password` - 修改密码
- `POST /auth/logout` - 登出
- `GET /auth/users` - 获取用户列表

### 职位管理
- `GET /positions` - 职位列表
- `POST /positions` - 创建职位
- `PUT /positions/:id` - 更新职位
- `DELETE /positions/:id` - 删除职位

### 候选人管理
- `GET /candidates` - 候选人列表
- `POST /candidates` - 创建候选人
- `POST /candidates/:id/resumes` - 上传简历文件
- `GET /candidates/:id/mentions` - @记录列表

### 面试管理
- `GET /interviews` - 面试列表
- `POST /interviews` - 创建面试
- `PUT /interviews/:id` - 更新面试
- `DELETE /interviews/:id` - 删除面试

### 面试流程
- `POST /interview-processes` - 创建面试流程
- `POST /interview-processes/:id/rounds/:roundNumber/interview` - 安排面试
- `POST /interview-processes/:id/complete-round` - 确认轮次完成

### 反馈
- `POST /feedback` - 提交反馈
- `GET /feedback/my-feedbacks` - 获取我的反馈
- `POST /feedback/public/:token` - 免登录提交反馈

### 数据分析
- `GET /analytics/interview-stats` - 面试统计
- `GET /analytics/candidate-stats` - 候选人统计
- `GET /analytics/position-stats` - 职位统计
- `GET /analytics/funnel` - 招聘漏斗

---

## 环境变量

```env
# 数据库
POSTGRES_USER=moka
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=moka_db

# 后端
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d

# 邮件（可选，未配置则输出到控制台）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

---

## 数据库实体

- `User` - 系统用户（HR、面试官）
- `Position` - 职位信息
- `Candidate` - 候选人信息
- `Interview` - 面试记录
- `InterviewProcess` - 面试流程
- `InterviewRound` - 面试轮次
- `InterviewFeedback` - 面试反馈
- `Notification` - 系统通知
- `ResumeFile` - 简历文件
- `CandidateMention` - @面试官记录
- `FeedbackToken` - 反馈 Token
- `CandidateStatusHistory` - 状态变更历史

完整数据库设计请查看 `backend/prisma/schema.prisma`

---

## 部署

### Docker Compose 部署

```bash
# 首次部署
./deploy.sh

# 快速启动
./start.sh

# 停止服务
./stop.sh
```

### 部署流程

1. PostgreSQL 启动并健康检查通过
2. 后端启动，执行 Prisma migrate 和 seed
3. 前端构建并通过 Nginx 提供服务
4. 访问 `http://localhost:13000` 使用系统

---

**开发时间**: 2026-02-12 ~ 2026-03-26
**版本**: v1.0.0
**许可证**: MIT
