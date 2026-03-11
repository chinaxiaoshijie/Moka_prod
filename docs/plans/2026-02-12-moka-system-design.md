# Moka 面试系统 - 系统设计文档

**日期**: 2026-02-12
**版本**: v1.0
**项目**: Moka ATS 替代方案

---

## 1. 整体架构

系统采用前后端分离架构，部署在公司内网服务器。

### 1.1 前端（Next.js 16）

- **框架**: Next.js 16 (App Router)
- **UI 组件库**: shadcn/ui（基于 Radix UI + Tailwind CSS）
- **状态管理**: React Context API（简单状态） + Zustand（复杂状态）
- **表单处理**: React Hook Form + Zod 验证
- **部署端口**: 3000

### 1.2 后端（NestJS）

- **框架**: NestJS 10+
- **架构**: 模块化架构，每个功能模块独立的 NestJS Module
- **API 设计**: RESTful API
- **ORM**: Prisma（类型安全的数据库访问）
- **认证**: JWT（jsonwebtoken） + bcrypt 密码加密
- **部署端口**: 3001

### 1.3 数据层

- **数据库**: PostgreSQL 15（Docker 容器）
- **连接池**: pg
- **迁移管理**: Prisma Migrate

### 1.4 文件存储

- **存储方式**: 本地文件系统
- **存储路径**: `/data/uploads`
- **静态文件服务**: Nginx 直接服务
- **备份**: rsync 定时备份到内网备份服务器

### 1.5 反向代理（Nginx）

- **监听端口**: 80/443
- **路由规则**:
  - `/api/*` → 后端 NestJS (3001)
  - `/uploads/*` → 本地文件目录 `/data/uploads`
  - 其他 → 前端 Next.js (3000)

---

## 2. 数据库设计

### 2.1 Users（系统用户表）

```prisma
model User {
  id          String   @id @default(uuid())
  username    String   @unique
  password    String   // bcrypt 加密
  name        String
  email       String?  // 用于接收通知
  role        Role     @default(INTERVIEWER)
  avatarUrl   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("users")
}

enum Role {
  HR
  INTERVIEWER
}
```

### 2.2 Positions（职位表）

```prisma
model Position {
  id                String   @id @default(uuid())
  title             String
  description       String?
  requirements      String?
  salaryMin         Int?
  salaryMax         Int?
  headcount         Int      @default(1)
  hiredCount        Int      @default(0)
  inProgressCount   Int      @default(0)
  status            PositionStatus @default(OPEN)
  location          String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  candidates        Candidate[]
  interviews        Interview[]

  @@map("positions")
}

enum PositionStatus {
  OPEN
  PAUSED
  CLOSED
}
```

### 2.3 Candidates（候选人表）

```prisma
model Candidate {
  id          String          @id @default(uuid())
  name        String
  phone       String
  email       String?
  positionId  String?
  status      CandidateStatus @default(PENDING)
  source      CandidateSource?
  resumeUrl   String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  position    Position?       @relation(fields: [positionId], references: [id])
  interviews  Interview[]

  @@unique([name, phone]) // 去重约束
  @@map("candidates")
}

enum CandidateStatus {
  PENDING
  SCREENING
  INTERVIEW_1
  INTERVIEW_2
  INTERVIEW_3
  HIRED
  REJECTED
}

enum CandidateSource {
  BOSS
  REFERRAL
  HEADHUNTER
  WEBSITE
}
```

### 2.4 Interviews（面试表）

```prisma
model Interview {
  id            String           @id @default(uuid())
  candidateId   String
  positionId    String
  interviewerId String
  type          InterviewType
  format        InterviewFormat
  startTime     DateTime
  endTime       DateTime
  location      String?
  meetingUrl    String?
  meetingNumber String?
  status        InterviewStatus  @default(SCHEDULED)
  createdAt     DateTime         @default(now())
  createdById   String?

  candidate     Candidate       @relation(fields: [candidateId], references: [id])
  position      Position        @relation(fields: [positionId], references: [id])
  interviewer   User            @relation(fields: [interviewerId], references: [id])
  feedbacks     InterviewFeedback[]
  createdBy     User?            @relation(fields: [createdById], references: [id])

  @@map("interviews")
}

enum InterviewType {
  INTERVIEW_1  // 初试
  INTERVIEW_2  // 复试
  INTERVIEW_3  // 终试
}

enum InterviewFormat {
  ONLINE       // 线上（腾讯会议）
  OFFLINE      // 线下
}

enum InterviewStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
}
```

### 2.5 InterviewFeedbacks（面试反馈表）

```prisma
model InterviewFeedback {
  id            String   @id @default(uuid())
  interviewId   String
  interviewerId String
  result        FeedbackResult
  strengths     String?
  weaknesses    String?
  overallRating Int?     // 1-5 星
  notes         String?
  createdAt     DateTime @default(now())

  interview     Interview @relation(fields: [interviewId], references: [id])
  interviewer   User      @relation(fields: [interviewerId], references: [id])

  @@map("interview_feedbacks")
}

enum FeedbackResult {
  PASS
  FAIL
  PENDING
}
```

---

## 3. API 接口设计

### 3.1 认证模块（Auth Module）

#### POST `/api/auth/login` - 登录

```typescript
Request: {
  username: string;
  password: string;
}

Response: {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    role: "HR" | "INTERVIEWER";
  }
}
```

#### GET `/api/auth/profile` - 获取当前用户信息

```typescript
Response: {
  id: string;
  username: string;
  name: string;
  email: string;
  role: "HR" | "INTERVIEWER";
  avatarUrl: string;
}
```

#### POST `/api/auth/refresh` - 刷新 Token

```typescript
Request: {
  refresh_token: string;
}

Response: {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
}
```

#### POST `/api/auth/logout` - 登出

```typescript
Response: {
  message: "Successfully logged out";
}
```

---

### 3.2 职位管理模块（Positions Module）

#### GET `/api/positions` - 获取职位列表

```typescript
Query Params: {
  status?: 'OPEN' | 'PAUSED' | 'CLOSED'
  page?: number
  limit?: number
}

Response: {
  data: Position[]
  total: number
  page: number
  limit: number
}

interface Position {
  id: string
  title: string
  description: string
  requirements: string
  salaryMin: number
  salaryMax: number
  headcount: number
  hiredCount: number
  inProgressCount: number
  status: 'OPEN' | 'PAUSED' | 'CLOSED'
  location: string
  createdAt: string
  updatedAt: string
}
```

#### POST `/api/positions` - 创建职位（仅 HR）

```typescript
Request: {
  title: string
  description: string
  requirements: string
  salaryMin: number
  salaryMax: number
  headcount: number
  location: string
}

Response: {
  id: string
  ...Position
}
```

#### GET `/api/positions/:id` - 获取职位详情

```typescript
Response: Position;
```

#### PUT `/api/positions/:id` - 更新职位（仅 HR）

```typescript
Request: Partial<Position>;

Response: Position;
```

#### DELETE `/api/positions/:id` - 删除职位（仅 HR）

```typescript
Response: {
  message: "Position deleted successfully";
}
```

---

### 3.3 候选人管理模块（Candidates Module）

#### GET `/api/candidates` - 获取候选人列表（HR：全部，面试官：仅@自己的）

```typescript
Query Params: {
  status?: 'PENDING' | 'SCREENING' | 'INTERVIEW_1' | 'INTERVIEW_2' | 'INTERVIEW_3' | 'HIRED' | 'REJECTED'
  positionId?: string
  source?: 'BOSS' | 'REFERRAL' | 'HEADHUNTER' | 'WEBSITE'
  search?: string  // 搜索姓名、电话、邮箱
  page?: number
  limit?: number
}

Response: {
  data: Candidate[]
  total: number
  page: number
  limit: number
}

interface Candidate {
  id: string
  name: string
  phone: string
  email: string
  positionId: string
  status: string
  source: string
  resumeUrl: string
  position?: {
    id: string
    title: string
  }
  createdAt: string
  updatedAt: string
}
```

#### POST `/api/candidates` - 创建候选人（仅 HR，含简历上传）

```typescript
Request (multipart/form-data): {
  name: string
  phone: string
  email: string
  positionId: string
  source: string
  resume: File  // PDF/Word
}

Response: Candidate
```

#### GET `/api/candidates/:id` - 获取候选人详情

```typescript
Response: {
  ...Candidate
  interviews: Interview[]
}
```

#### PUT `/api/candidates/:id` - 更新候选人（仅 HR）

```typescript
Request: Partial<Candidate>;

Response: Candidate;
```

#### DELETE `/api/candidates/:id` - 删除候选人（仅 HR）

```typescript
Response: {
  message: "Candidate deleted successfully";
}
```

#### POST `/api/candidates/:id/assign` - @面试官（仅 HR）

```typescript
Request: {
  interviewerIds: string[]
}

Response: {
  message: 'Candidate assigned to interviewers successfully'
}
```

---

### 3.4 面试管理模块（Interviews Module）

#### GET `/api/interviews` - 获取面试列表

```typescript
Query Params: {
  candidateId?: string
  interviewerId?: string
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

Response: {
  data: Interview[]
  total: number
  page: number
  limit: number
}

interface Interview {
  id: string
  candidateId: string
  positionId: string
  interviewerId: string
  type: 'INTERVIEW_1' | 'INTERVIEW_2' | 'INTERVIEW_3'
  format: 'ONLINE' | 'OFFLINE'
  startTime: string
  endTime: string
  location: string
  meetingUrl: string
  meetingNumber: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  candidate?: Candidate
  position?: Position
  interviewer?: User
}
```

#### POST `/api/interviews` - 安排面试（仅 HR）

```typescript
Request: {
  candidateId: string
  positionId: string
  interviewerId: string
  type: 'INTERVIEW_1' | 'INTERVIEW_2' | 'INTERVIEW_3'
  format: 'ONLINE' | 'OFFLINE'
  startTime: string  // ISO 8601
  endTime: string
  location?: string  // OFFLINE 必填
  meetingUrl?: string   // ONLINE 必填
  meetingNumber?: string
}

Response: Interview
```

#### GET `/api/interviews/:id` - 获取面试详情

```typescript
Response: {
  ...Interview
  feedbacks: InterviewFeedback[]
}
```

#### PUT `/api/interviews/:id` - 更新面试（仅 HR）

```typescript
Request: Partial<Interview>;

Response: Interview;
```

#### DELETE `/api/interviews/:id` - 取消面试（仅 HR）

```typescript
Response: {
  message: "Interview cancelled successfully";
}
```

#### GET `/api/interviews/calendar` - 获取日历视图数据

```typescript
Query Params: {
  startDate: string
  endDate: string
  interviewerId?: string
}

Response: {
  date: string
  interviews: Interview[]
}[]
```

---

### 3.5 面试反馈模块（Feedback Module）

#### GET `/api/feedback/interviews/:id` - 获取面试反馈列表

```typescript
Response: {
  interviewId: string
  feedbacks: InterviewFeedback[]
}

interface InterviewFeedback {
  id: string
  interviewId: string
  interviewerId: string
  result: 'PASS' | 'FAIL' | 'PENDING'
  strengths: string
  weaknesses: string
  overallRating: number  // 1-5
  notes: string
  createdAt: string
  interviewer?: {
    id: string
    name: string
  }
}
```

#### POST `/api/feedback/interviews/:id` - 填写面试反馈

```typescript
Request: {
  result: "PASS" | "FAIL" | "PENDING";
  strengths: string;
  weaknesses: string;
  overallRating: number;
  notes: string;
}

Response: InterviewFeedback;
```

---

### 3.6 邮件通知模块（Email Module）

邮件由后端自动触发，无需外部 API 调用。

邮件类型：

1. **面试通知给候选人** - 面试安排后自动发送
2. **面试通知给面试官** - 面试安排后自动发送
3. **反馈填写提醒** - 面试后 2 小时自动发送

邮件模板配置（环境变量）：

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASSWORD=***
EMAIL_FROM=HR Team <noreply@company.com>
```

---

### 3.7 文件上传模块（Files Module）

#### POST `/api/files/upload` - 上传文件

```typescript
Request (multipart/form-data): {
  file: File
  type: 'resume' | 'avatar'
  candidateId?: string  // type=resume 时必填
  userId?: string      // type=avatar 时必填
}

Response: {
  url: string  // /uploads/...
  filename: string
  size: number
}
```

#### GET `/uploads/*` - 访问文件（Nginx 直接服务）

- 简历：`/uploads/resumes/{candidate_id}/resume_{timestamp}.pdf`
- 头像：`/uploads/avatars/{user_id}/avatar_{timestamp}.jpg`

---

## 4. 文件上传处理

### 4.1 支持的文件类型

- **简历**: PDF、Word (.doc, .docx)
- **头像**: JPG、PNG

### 4.2 文件限制

- **大小限制**: 5MB
- **存储路径**: `/data/uploads`

### 4.3 存储路径结构

```
/data/uploads/
├── resumes/
│   ├── {candidate_id}/
│   │   └── resume_{timestamp}.{ext}
├── avatars/
│   └── {user_id}/
│       └── avatar_{timestamp}.{ext}
└── exports/
    └── {date}/
        └── export_{timestamp}.csv
```

### 4.4 Nginx 配置

```nginx
location /uploads/ {
    alias /data/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## 5. 技术决策总结

| 决策点     | 选择              | 理由                                   |
| ---------- | ----------------- | -------------------------------------- |
| 开发优先级 | 按功能模块        | 建立稳定代码基础，每个模块独立测试     |
| 数据库     | Docker PostgreSQL | 容器化，易于迁移和备份，适合生产环境   |
| 邮件服务   | 配置文件管理      | 环境变量管理是最佳实践，易于更换服务商 |
| 文件存储   | 本地存储 + Nginx  | 内网部署，简单可靠，性能更好           |

---

## 6. 后续实施计划

### 阶段 1: 用户认证系统

- 配置 PostgreSQL 数据库
- 实现 Users 表的 Prisma Schema
- 实现登录、注册、JWT 认证
- 实现角色权限控制

### 阶段 2: 职位管理模块

- 实现 Positions 表
- 实现 CRUD API
- 实现前端职位管理页面

### 阶段 3: 候选人管理模块

- 实现 Candidates 表
- 实现文件上传功能
- 实现 CRUD API
- 实现前端候选人管理页面

### 阶段 4: 面试管理模块

- 实现 Interviews 表
- 实现时间冲突检测
- 实现日历视图
- 实现 CRUD API
- 实现前端面试管理页面

### 阶段 5: 面试反馈和邮件

- 实现 InterviewFeedbacks 表
- 实现反馈 API
- 实现邮件发送功能
- 实现前端反馈填写页面

---

**文档状态**: ✅ 设计完成
**下一步**: 准备开始实施
