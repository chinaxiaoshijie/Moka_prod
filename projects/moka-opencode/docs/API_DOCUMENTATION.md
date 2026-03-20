# Moka 面试管理系统 - API 文档

## 📖 目录

1. [认证](#认证)
2. [用户管理](#用户管理)
3. [职位管理](#职位管理)
4. [候选人管理](#候选人管理)
5. [面试管理](#面试管理)
6. [面试流程](#面试流程)
7. [反馈管理](#反馈管理)
8. [通知管理](#通知管理)
9. [数据分析](#数据分析)

---

## 认证

### 登录获取 Token

**POST** `/auth/login`

获取 JWT Token 用于后续认证。

**请求体**:
```json
{
  "username": "hr",
  "password": "hr123456"
}
```

**响应**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "hr",
    "name": "HR管理员",
    "role": "HR"
  }
}
```

**测试账号**:
- `hr` / `hr123456` (HR角色)
- `interviewer` / `interviewer123` (面试官角色)

---

### 获取当前用户信息

**GET** `/auth/profile`
**Headers**: `Authorization: Bearer <token>`

获取当前登录用户信息。

**响应**:
```json
{
  "id": "uuid",
  "username": "hr",
  "name": "HR管理员",
  "email": "hr@moka.com",
  "role": "HR",
  "avatarUrl": null
}
```

---

### 登出

**POST** `/auth/logout`
**Headers**: `Authorization: Bearer <token>`

登出当前用户。

---

## 用户管理

### 创建用户

**POST** `/users`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

创建新用户。

**请求体**:
```json
{
  "username": "interviewer2",
  "password": "password123",
  "name": "面试官2",
  "email": "interviewer2@moka.com",
  "role": "INTERVIEWER"
}
```

---

### 获取用户列表

**GET** `/users`
**Headers**: `Authorization: Bearer <token>`

获取所有用户列表。

**查询参数**:
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认10

---

### 获取用户详情

**GET** `/users/:id`
**Headers**: `Authorization: Bearer <token>`

获取指定用户详情。

---

### 更新用户

**PUT** `/users/:id`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

更新用户信息。

**请求体**:
```json
{
  "name": "面试官2",
  "email": "interviewer2@moka.com",
  "role": "INTERVIEWER"
}
```

---

### 删除用户

**DELETE** `/users/:id`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

删除用户（不能删除自己的账户）。

---

## 职位管理

### 获取职位列表

**GET** `/positions`

获取所有职位列表。

**查询参数**:
- `status` (可选): 筛选状态 (OPEN, PAUSED, CLOSED)
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认10

**响应**:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "高级前端工程师",
      "description": "...",
      "salaryMin": 15000,
      "salaryMax": 25000,
      "headcount": 2,
      "hiredCount": 0,
      "inProgressCount": 1,
      "status": "OPEN",
      "location": "上海",
      "createdAt": "2026-02-12T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10
}
```

---

### 获取单个职位

**GET** `/positions/:id`

获取指定职位详情。

---

### 创建职位

**POST** `/positions`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

创建新职位。

**请求体**:
```json
{
  "title": "高级前端工程师",
  "description": "负责前端架构设计...",
  "requirements": "5年以上经验...",
  "salaryMin": 15000,
  "salaryMax": 25000,
  "headcount": 2,
  "location": "上海"
}
```

---

### 更新职位

**PUT** `/positions/:id`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

更新职位信息。

**请求体**: 同创建职位

---

### 删除职位

**DELETE** `/positions/:id`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

删除职位。

---

## 候选人管理

### 获取候选人列表

**GET** `/candidates`

获取候选人列表。

**查询参数**:
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认10
- `status` (可选): 筛选状态 (PENDING, SCREENING, INTERVIEW_1, INTERVIEW_2, INTERVIEW_3, HIRED, REJECTED)
- `source` (可选): 筛选来源 (BOSS, REFERRAL, HEADHUNTER, WEBSITE)
- `positionId` (可选): 关联职位ID
- `keyword` (可选): 关键词搜索（姓名/电话/邮箱）

---

### 获取单个候选人

**GET** `/candidates/:id`

获取候选人详情（包含面试历史、状态变更历史）。

---

### 创建候选人

**POST** `/candidates`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

手动创建候选人。

**请求体**:
```json
{
  "name": "张三",
  "phone": "13800138000",
  "email": "zhangsan@email.com",
  "positionId": "position-uuid",
  "source": "BOSS",
  "status": "SCREENING"
}
```

---

### 更新候选人

**PUT** `/candidates/:id`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

更新候选人信息。

**请求体**: 同创建候选人

---

### 删除候选人

**DELETE** `/candidates/:id`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

删除候选人（包含简历文件、@记录等）。

---

### 解析简历PDF

**POST** `/candidates/parse-resume`
**Role**: HR
**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

上传PDF简历，自动提取信息（姓名、电话、邮箱）。

**请求体**:
- `file`: PDF文件

**响应**:
```json
{
  "name": "张三",
  "phone": "13800138000",
  "email": "zhangsan@email.com"
}
```

---

### 上传简历文件

**POST** `/candidates/:id/resumes`
**Role**: HR
**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

为候选人上传简历文件（支持多版本）。

**请求体**:
- `file`: 文件（PDF/Word）

**响应**:
```json
{
  "id": "uuid",
  "fileName": "resume.pdf",
  "fileType": "application/pdf",
  "fileSize": 245678,
  "fileUrl": "/uploads/resume_123.pdf",
  "isActive": true
}
```

---

### 获取简历文件列表

**GET** `/candidates/:id/resumes`

获取候选人的所有简历文件。

---

### 下载简历文件

**GET** `/candidates/resumes/:resumeId`

下载或预览指定简历文件。

---

### 删除简历文件

**DELETE** `/candidates/resumes/:resumeId`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

删除简历文件（不能删除当前使用的版本）。

---

### 设置当前简历版本

**PUT** `/candidates/resumes/:resumeId/activate`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

将指定简历设为当前使用版本。

---

### 检查候选人是否重复

**GET** `/candidates/check-duplicate`

检查姓名+电话是否已存在（用于防重复）。

**查询参数**:
- `name`: 候选人姓名
- `phone`: 手机号码

**响应**:
```json
{
  "exists": true,
  "candidateId": "uuid",
  "positionId": "position-uuid",
  "status": "SCREENING"
}
```

---

### @面试官查看简历

**POST** `/candidates/:id/mentions`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

@指定面试官查看候选人简历。

**请求体**:
```json
{
  "interviewerId": "interviewer-uuid",
  "message": "请查看这位候选人的简历"
}
```

**响应**:
```json
{
  "id": "uuid",
  "status": "PENDING",
  "createdAt": "2026-02-12T00:00:00.000Z"
}
```

---

### 获取@记录列表

**GET** `/candidates/:id/mentions`

获取候选人的所有@记录。

---

## 面试管理

### 获取面试列表

**GET** `/interviews`

获取面试列表。

**查询参数**:
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认10
- `status` (可选): 筛选状态 (SCHEDULED, COMPLETED, CANCELLED)
- `positionId` (可选): 职位ID
- `candidateId` (可选): 候选人ID
- `interviewerId` (可选): 面试官ID

---

### 获取单个面试

**GET** `/interviews/:id`

获取面试详情。

---

### 创建面试

**POST** `/interviews`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

创建面试安排。

**请求体**:
```json
{
  "candidateId": "candidate-uuid",
  "positionId": "position-uuid",
  "interviewerId": "interviewer-uuid",
  "type": "INTERVIEW_1",
  "format": "ONLINE",
  "startTime": "2026-02-13T10:00:00.000Z",
  "endTime": "2026-02-13T11:00:00.000Z",
  "location": "线上-腾讯会议",
  "meetingUrl": "https://meeting.tencent.com/...",
  "meetingNumber": "123456789"
}
```

---

### 更新面试

**PUT** `/interviews/:id`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

更新面试信息。

---

### 删除面试

**DELETE** `/interviews/:id`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

删除面试。

---

## 面试流程

### 创建面试流程

**POST** `/interview-processes`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

启动完整的面试流程（HR创建）。

**请求体**:
```json
{
  "candidateId": "candidate-uuid",
  "positionId": "position-uuid",
  "totalRounds": 3,
  "hasHRRound": true,
  "rounds": [
    {
      "roundNumber": 1,
      "interviewerId": "interviewer-uuid-1",
      "isHRRound": true,
      "roundType": "HR_SCREENING"
    },
    {
      "roundNumber": 2,
      "interviewerId": "interviewer-uuid-2",
      "isHRRound": false,
      "roundType": "TECHNICAL"
    },
    {
      "roundNumber": 3,
      "interviewerId": "interviewer-uuid-3",
      "isHRRound": false,
      "roundType": "FINAL"
    }
  ]
}
```

**响应**:
```json
{
  "id": "uuid",
  "candidateId": "candidate-uuid",
  "positionId": "position-uuid",
  "currentRound": 1,
  "totalRounds": 3,
  "status": "IN_PROGRESS",
  "rounds": [...],
  "createdAt": "2026-02-12T00:00:00.000Z"
}
```

---

### 为指定轮次创建面试

**POST** `/interview-processes/:id/rounds/:roundNumber/interview`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

为指定轮次安排具体面试时间。

**请求体**:
```json
{
  "type": "INTERVIEW_1",
  "format": "ONLINE",
  "startTime": "2026-02-13T10:00:00.000Z",
  "endTime": "2026-02-13T11:00:00.000Z",
  "location": "线上-腾讯会议",
  "meetingUrl": "https://meeting.tencent.com/...",
  "meetingNumber": "123456789"
}
```

---

### HR确认轮次完成

**POST** `/interview-processes/:id/complete-round`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

HR确认当前轮次完成，并决定下一步操作。

**请求体**:
```json
{
  "action": "next"  // 可选值: next(继续下一轮), complete(完成流程), reject(拒绝候选人)
}
```

---

### 获取面试流程列表

**GET** `/interview-processes`

获取所有面试流程。

**查询参数**:
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认10
- `status` (可选): 筛选状态 (IN_PROGRESS, WAITING_HR, COMPLETED, CANCELLED)

---

### 获取面试流程详情

**GET** `/interview-processes/:id`

获取流程详情（包含所有轮次、面试记录）。

---

### 取消面试流程

**PUT** `/interview-processes/:id/cancel`
**Role**: HR
**Headers**: `Authorization: Bearer <token>`

取消整个面试流程。

---

## 反馈管理

### 获取所有反馈

**GET** `/feedback`

获取所有面试反馈。

---

### 获取特定面试的反馈

**GET** `/feedback/interview/:interviewId`

获取指定面试的所有反馈（一个面试可能有多个反馈）。

---

### 获取当前面试官的反馈

**GET** `/feedback/my-feedbacks`

获取当前登录面试官提交的所有反馈。

---

### 提交面试反馈

**POST** `/feedback`
**Headers**: `Authorization: Bearer <token>`

提交面试反馈。

**请求体**:
```json
{
  "interviewId": "interview-uuid",
  "result": "PASS",
  "strengths": "技术能力强，沟通顺畅",
  "weaknesses": "缺乏大厂经验",
  "overallRating": 4,
  "notes": "建议进入下一轮"
}
```

**字段说明**:
- `result`: PASS/Fail/PENDING
- `overallRating`: 1-5 星

---

### 更新反馈

**PUT** `/feedback/:id`
**Headers**: `Authorization: Bearer <token>`

更新已提交的反馈（仅限本人更新）。

---

### 删除反馈

**DELETE** `/feedback/:id`
**Headers**: `Authorization: Bearer <token>`

删除反馈（仅限本人删除）。

---

### 免登录提交反馈 (Public)

**POST** `/feedback/public/:token`

使用 Token 免登录提交反馈（用于邮件邀请面试官反馈）。

**请求体**: 同提交面试反馈

**字段说明**:
- `token`: 邮件中的邀请Token

---

## 通知管理

### 获取通知列表

**GET** `/notifications`

获取当前用户的通知列表。

**查询参数**:
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认10
- `read` (可选): 已读状态筛选 (true/false)

---

### 获取未读通知数量

**GET** `/notifications/unread-count`

获取未读通知数量。

**响应**:
```json
{
  "count": 5
}
```

---

### 标记通知为已读

**PUT** `/notifications/:id/read`
**Headers**: `Authorization: Bearer <token>`

标记单个通知为已读。

---

### 标记所有通知为已读

**PUT** `/notifications/mark-all-read`
**Headers**: `Authorization: Bearer <token>`

标记所有通知为已读。

---

### 删除通知

**DELETE** `/notifications/:id`
**Headers**: `Authorization: Bearer <token>`

删除通知。

---

## 数据分析

### 获取面试统计

**GET** `/analytics/interview-stats`

获取面试统计数据。

**响应**:
```json
{
  "totalInterviews": 10,
  "scheduledInterviews": 3,
  "completedInterviews": 6,
  "cancelledInterviews": 1,
  "interviewsByStatus": {
    "SCHEDULED": 3,
    "COMPLETED": 6,
    "CANCELLED": 1
  },
  "interviewsByFormat": {
    "ONLINE": 8,
    "OFFLINE": 2
  },
  "feedbackStats": {
    "passCount": 4,
    "failCount": 2,
    "pendingCount": 0
  }
}
```

---

### 获取候选人统计

**GET** `/analytics/candidate-stats`

获取候选人统计数据。

**响应**:
```json
{
  "totalCandidates": 50,
  "candidatesByStatus": {
    "PENDING": 10,
    "SCREENING": 5,
    "INTERVIEW_1": 15,
    "INTERVIEW_2": 10,
    "INTERVIEW_3": 5,
    "HIRED": 3,
    "REJECTED": 2
  },
  "candidatesBySource": {
    "BOSS": 30,
    "REFERRAL": 10,
    "HEADHUNTER": 5,
    "WEBSITE": 5
  },
  "conversionRate": {
    "screeningToInterview": 0.5,
    "interviewToHire": 0.2
  }
}
```

---

### 获取职位统计

**GET** `/analytics/position-stats`

获取职位统计数据。

**响应**:
```json
{
  "totalPositions": 5,
  "positionsByStatus": {
    "OPEN": 3,
    "PAUSED": 1,
    "CLOSED": 1
  },
  "totalHeadcount": 15,
  "hiredCount": 3,
  "inProgressCount": 5,
  "remainingHeadcount": 7,
  "fillRate": 0.2  // 已招聘比例
}
```

---

### 获取招聘漏斗数据

**GET** `/analytics/funnel`

获取招聘漏斗统计数据。

**响应**:
```json
{
  "funnel": [
    { "stage": "简历投递", "count": 100 },
    { "stage": "简历筛选", "count": 50 },
    { "stage": "初试", "count": 30 },
    { "stage": "复试", "count": 15 },
    { "stage": "终试", "count": 8 },
    { "stage": "录用", "count": 3 }
  ],
  "conversionRates": {
    "screeningToInterview1": 0.6,
    "interview1ToInterview2": 0.5,
    "interview2ToInterview3": 0.533,
    "interview3ToHire": 0.375
  }
}
```

---

## 错误响应格式

所有API错误响应遵循统一格式：

```json
{
  "statusCode": 404,
  "message": "职位不存在",
  "error": "Not Found"
}
```

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或Token过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 认证说明

1. **Token获取**: 通过 `/auth/login` 接口获取
2. **Token使用**: 在请求头中添加 `Authorization: Bearer <token>`
3. **Token有效期**: 24小时
4. **刷新机制**: 当前版本不支持自动刷新，过期后需重新登录

---

## 角色权限说明

### HR
- ✅ 用户管理（创建、更新、删除用户）
- ✅ 职位管理（创建、更新、删除职位）
- ✅ 候选人管理（创建、更新、删除候选人）
- ✅ 面试管理（创建、更新、删除面试）
- ✅ 面试流程管理（创建流程、安排面试、确认轮次）
- ✅ 查看所有数据

### 面试官
- ✅ 查看自己的面试
- ✅ 提交面试反馈
- ✅ 查看自己的反馈
- ✅ 查看候选人简历（被@后）
- ❌ 无权限修改、删除、创建数据

---

## 文件上传说明

1. **支持格式**: PDF、Word
2. **大小限制**: 10MB
3. **存储位置**: `backend/uploads/`
4. **访问方式**: `http://localhost:3001/uploads/<文件名>`

---

## 开发环境

- **API地址**: `http://localhost:3001`
- **前端地址**: `http://localhost:3000`
- **数据库**: PostgreSQL 15 (Docker)
- **Swagger文档**: `http://localhost:3001/api-docs`

---

## 技术栈

- **后端**: NestJS + Bun + Prisma
- **数据库**: PostgreSQL 15
- **认证**: JWT + Passport
- **文件**: Multer (PDF/Word上传)
- **邮件**: Nodemailer (SMTP)

---

## 更新日志

- **2026-02-12**: 项目初始化，基础架构搭建
- **2026-02-20**: 添加面试流程模块
- **2026-02-26**: 添加简历文件管理、@面试官功能
- **2026-03-19**: 文档更新，完善API说明
