# Moka 面试管理系统

> 基于 AI Native 开发的企业级招聘管理系统，支持完整的面试招聘流程管理。

## 📖 项目简介

Moka 面试管理系统是一个功能完整的招聘管理平台，帮助企业高效管理招聘流程，包括职位管理、候选人管理、面试调度、反馈收集等核心功能。

### 🎯 核心功能

- **用户认证**: 基于 JWT 的身份验证，支持多角色权限（HR/面试官）
- **职位管理**: 创建、编辑、删除职位，管理招聘需求
- **候选人管理**: 简历上传、信息管理、查重功能
- **面试管理**: 面试安排、日程管理
- **面试流程**: 多轮面试流程配置（1-5轮），流程状态跟踪
- **反馈系统**: 结构化面试反馈，星级评分，综合评价
- **简历解析**: 支持 PDF 简历自动解析（提取姓名、电话、邮箱）
- **@面试官**: 通知面试官查看特定候选人简历
- **数据分析**: 招聘数据统计、漏斗分析
- **邮件通知**: 面试通知、反馈提醒（当前输出到控制台）
- **通知系统**: 系统消息推送

### 🚀 快速开始

#### 方式一：Docker 一键部署（推荐）

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
- 前端: `http://localhost:3000`
- 后端 API: `http://localhost:3001`

#### 方式二：本地开发

```bash
# 1. 启动数据库
docker-compose up -d postgres

# 2. 初始化数据库
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed

# 3. 启动后端
npm run dev  # 端口: 3001

# 4. 启动前端
cd ../frontend
npm install
npm run dev  # 端口: 3000
```

### 👤 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| **HR** | `hr` | `hr123456` |
| **面试官** | `interviewer` | `interviewer123` |

---

## 🛠️ 技术栈

### 后端
- **框架**: NestJS (TypeScript)
- **运行时**: Bun
- **ORM**: Prisma
- **数据库**: PostgreSQL 15
- **认证**: JWT + Passport.js
- **文件**: Multer (PDF/Word 上传)
- **邮件**: Nodemailer

### 前端
- **框架**: Next.js 16
- **UI**: React 19
- **样式**: TailwindCSS 4
- **HTTP**: Fetch API

### 基础设施
- **容器**: Docker + Docker Compose
- **Web Server**: Nginx

---

## 📁 项目结构

```
moka-opencode/
├── backend/                  # 后端 NestJS 应用
│   ├── src/
│   │   ├── analytics/       # 数据分析模块
│   │   ├── auth/            # 认证模块
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
│   ├── package.json
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
│   │   │   ├── settings/    # 系统设置
│   │   │   └── login/       # 登录页
│   │   └── components/      # 共享组件
│   ├── package.json
│   └── Dockerfile
│
├── docs/
│   ├── API_DOCUMENTATION.md    # 完整 API 文档
│   └── plans/
│       └── 2026-02-12-moka-system-design.md
│
├── docker-compose.yml        # Docker 部署配置
├── .env.example              # 环境变量模板
├── deploy.sh                 # 部署脚本
├── start.sh                  # 启动脚本
├── stop.sh                   # 停止脚本
└── README.md
```

---

## 📚 API 文档

完整的 API 文档请查看 [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

### 核心 API 端点

#### 认证
- `POST /auth/login` - 用户登录
- `GET /auth/profile` - 获取当前用户信息

#### 职位管理
- `GET /positions` - 职位列表
- `POST /positions` - 创建职位
- `PUT /positions/:id` - 更新职位
- `DELETE /positions/:id` - 删除职位

#### 候选人管理
- `GET /candidates` - 候选人列表
- `POST /candidates` - 创建候选人
- `POST /candidates/parse-resume` - PDF 简历解析
- `POST /candidates/:id/resumes` - 上传简历文件
- `GET /candidates/:id/mentions` - @记录列表

#### 面试管理
- `GET /interviews` - 面试列表
- `POST /interviews` - 创建面试
- `PUT /interviews/:id` - 更新面试

#### 面试流程
- `POST /interview-processes` - 创建面试流程
- `POST /interview-processes/:id/rounds/:roundNumber/interview` - 安排面试
- `POST /interview-processes/:id/complete-round` - 确认轮次完成

#### 反馈
- `POST /feedback` - 提交反馈
- `GET /feedback/my-feedbacks` - 获取我的反馈
- `POST /feedback/public/:token` - 免登录提交反馈

#### 数据分析
- `GET /analytics/interview-stats` - 面试统计
- `GET /analytics/candidate-stats` - 候选人统计
- `GET /analytics/position-stats` - 职位统计
- `GET /analytics/funnel` - 招聘漏斗

---

## 🧪 测试

### E2E 测试

```bash
cd tests/e2e

# 安装依赖
npm install

# 运行所有测试
npm test

# 运行特定测试
npm test -- positions.spec.ts
```

### 单元测试

```bash
cd backend
npm test
```

### 测试覆盖的功能
- ✅ 认证流程（登录、退出、权限验证）
- ✅ 职位管理（创建、编辑、删除）
- ✅ 候选人管理（列表、详情、简历上传）
- ✅ 面试管理（安排、查看）
- ✅ 面试流程（流程创建、轮次管理）
- ✅ 反馈提交
- ✅ 数据统计
- ✅ 用户管理

---

## 🚀 部署指南

### Docker Compose 部署

详细部署步骤请查看 [DEPLOYMENT.md](DEPLOYMENT.md)

```bash
# 首次部署
./deploy.sh

# 快速启动
./start.sh

# 停止服务
./stop.sh
```

### 环境变量配置

```env
# 数据库
POSTGRES_USER=moka
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=moka_db

# 后端
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d

# 前端
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📊 数据库设计

### 核心实体

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

## 🔧 开发指南

### 本地开发环境

```bash
# 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 启动服务
cd backend && npm run dev      # http://localhost:3001
cd frontend && npm run dev     # http://localhost:3000
```

### 代码规范

- 使用 TypeScript + ESLint
- 遵循 NestJS 最佳实践
- 使用 Prisma 进行数据库操作
- 所有 API 都需要 Swagger 文档 (`@ApiOperation`)
- 所有请求都需要验证（class-validator）

### 添加新功能

1. 在 `backend/prisma/schema.prisma` 中定义数据模型
2. 运行 `npm run prisma:migrate` 生成迁移
3. 创建 Controller、Service、DTO
4. 更新 API 文档

---

## 📈 项目进度

- ✅ 基础架构搭建
- ✅ 用户认证系统
- ✅ 职位管理
- ✅ 候选人管理
- ✅ 面试管理
- ✅ 面试流程
- ✅ 反馈系统
- ✅ 简历解析
- ✅ 邮件通知
- ✅ 通知系统
- ✅ 数据分析
- ✅ 前端页面
- ✅ E2E 测试
- ✅ API 文档

---

## 🤝 贡献

本项目采用 AI Native 开发方式，使用以下工具：

- **代码生成**: Claude, GPT-4
- **代码补全**: GitHub Copilot
- **代码审查**: AI 代码分析工具
- **自动化测试**: Playwright E2E

---

## 📄 许可证

MIT License

---

## 📞 联系方式

- GitHub: [chinaxiaoshijie/hiringlikemoka-opencode](https://github.com/chinaxiaoshijie/hiringlikemoka-opencode)
- 项目文档: [docs/](docs/)
- API 文档: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

---

## 🎉 感谢

感谢所有贡献者和支持者！

---

**开发时间**: 2026-02-12 ~ 2026-03-20
**项目状态**: 🟢 可用
**版本**: v1.0.0
