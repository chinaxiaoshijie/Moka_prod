# 需求澄清结论

**日期**: 2026-02-12
**项目**: Moka 面试系统替代方案
**澄清方式**: 基于需求文档、Moka 官方功能分析和用户确认

---

## 📋 执行摘要

本项目旨在构建一个轻量级但功能完整的招聘面试管理系统，替代 Moka ATS 的核心功能。经过需求分析和用户确认，明确了以下关键决策点：

### ✅ 已确认事项

1. **核心范围**: 候选人管理、职位管理、面试安排、面试反馈
2. **技术栈**: Next.js + shadcn/ui + NestJS + PostgreSQL + Prisma
3. **部署方式**: 本地服务部署（公司内网服务器）
4. **用户认证**: 内置账号和密码登录（账号包含用户名）
5. **权限设计**: 简单角色系统（HR/Admin + 面试官），暂不需要细化
6. **文件存储**: 本地存储
7. **集成策略**: 第一阶段采用人工对接，未来扩展 API 集成
8. **飞书集成**: 第二阶段可以考虑飞书单点登录（SSO）

### 🎯 第一阶段（MVP）范围

- 8 大核心模块
- 4-6 周开发周期
- 人工对接外部系统

---

## 🔍 需求澄清详情

### 1. 部署环境 ✅ 已确认

**部署方式**: 本地服务部署

- 部署位置：公司内网服务器
- 网络环境：内网环境，不对外暴露
- 访问方式：内网 IP 或域名

**架构示意**:

```
公司内网
├── 内网服务器 (192.168.x.x)
│   ├── Nginx (反向代理)
│   │   └── 反向代理到应用服务
│   ├── Next.js 前端 (端口 3000)
│   ├── NestJS 后端 (端口 3001)
│   ├── PostgreSQL 数据库 (端口 5432)
│   └── 文件存储目录 /data/uploads
```

**技术选型考虑**:

- 数据库：内网 PostgreSQL 实例
- 文件存储：本地文件系统（/data/uploads）
- 静态资源：Nginx 直接提供
- 备份：定时备份到内网备份服务器

**未来扩展**（第二阶段）:

- 飞书单点登录（SSO）
- 飞书 API 集成（自动日历同步）

---

### 2. 用户认证 ✅ 已确认

**认证方式**: 内置账号和密码登录

**用户范围**：

- ✅ HR/Admin（内部员工）
- ✅ 面试官（内部员工）
- ❌ 候选人（**不登录系统**）

**用户数据结构**:

```typescript
{
  id: string
  username: string        // 登录用户名
  password: string        // 加密密码 (bcrypt)
  name: string            // 显示名称
  email: string           // 邮箱（用于通知）
  role: 'hr' | 'interviewer'
  avatar_url?: string     // 头像 URL
  created_at: datetime
  updated_at: datetime
}
```

**用户 vs 候选人区别**:

| 对比项       | 系统用户（User）   | 候选人（Candidate） |
| ------------ | ------------------ | ------------------- |
| 是否需要登录 | ✅ 需要            | ❌ 不需要           |
| 账号类型     | HR/Admin / 面试官  | 外部候选人          |
| 信息来源     | HR手动创建         | 简历导入            |
| 邮箱用途     | 系统登录、接收通知 | 与HR联系            |
| 密码         | ✅ 有              | ❌ 无               |
| 系统权限     | 有（根据角色）     | 无                  |

**认证流程**:

1. 用户输入：用户名 + 密码
2. 后端验证：查询数据库，bcrypt 验证密码
3. 生成 JWT Token：包含用户 ID、角色、过期时间
4. 返回 Token：存储在浏览器 Cookie（httpOnly）或 LocalStorage

**JWT Payload 示例**:

```json
{
  "sub": "user_id",
  "username": "zhangsan",
  "name": "张三",
  "role": "hr",
  "iat": 1739366400,
  "exp": 1739452800
}
```

**安全措施**:

- 密码使用 bcrypt 加密（cost factor: 10）
- JWT Token 过期时间：7 天
- 支持刷新 Token（refresh token）
- 登录失败次数限制（5 次后锁定 15 分钟）

**初始用户数据**（系统部署后创建）:

```json
[
  {
    "username": "admin",
    "password": "Admin@123",
    "name": "系统管理员",
    "email": "admin@company.com",
    "role": "hr"
  }
]
```

**未来扩展**（第二阶段）:

- 飞书单点登录（SSO）

---

### 3. 权限设计 ✅ 已确认

**权限级别**: 简单角色系统，暂不需要细化

**角色定义**:

| 角色           | 权限范围 | 说明                                                                                                                  |
| -------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| **HR / Admin** | 所有权限 | - 职位发布和管理<br>- 候选人管理（所有）<br>- 面试安排和管理<br>- 查看所有数据和报表<br>- 用户管理（创建/编辑面试官） |
| **面试官**     | 有限权限 | - 查看 @ 自己的候选人<br>- 查看自己的面试安排<br>- 填写面试反馈<br>- 查看自己的日历<br>- 查看候选人简历（@ 自己的）   |

**权限控制策略**:

1. **页面级权限**：根据角色显示/隐藏菜单项
2. **数据级权限**：后端 API 根据 token 中的角色过滤数据
3. **操作级权限**：特定操作需要特定角色

**API 权限示例**:

```typescript
// 获取所有候选人（仅 HR）
GET /api/candidates - 需要 role: 'hr'

// 获取面试官自己的候选人
GET /api/candidates/my - 需要 role: 'interviewer'

// 安排面试（仅 HR）
POST /api/interviews - 需要 role: 'hr'

// 填写面试反馈（面试官）
POST /api/interviews/:id/feedback - 需要 role: 'interviewer' 或 'hr'
```

**前端路由保护**:

```typescript
// 仅 HR 可访问
const hrRoutes = ["/positions", "/candidates", "/reports"];

// 所有角色可访问
const commonRoutes = ["/dashboard", "/interviews", "/feedback"];
```

**未来扩展**（第三阶段，如需要）:

- 部门级别权限
- 数据访问权限（只看自己部门的候选人）
- 细粒度权限控制（RBAC）

---

### 4. 文件存储 ✅ 已确认

**存储方式**: 本地文件系统

**存储路径**:

- 生产环境：`/data/uploads`
- 开发环境：`./uploads`

**文件组织结构**:

```
/data/uploads/
├── resumes/
│   ├── {candidate_id}/
│   │   └── resume_{timestamp}.pdf
├── avatars/
│   └── {user_id}/
│       └── avatar_{timestamp}.{ext}
└── exports/
    └── {date}/
        └── export_{timestamp}.csv
```

**文件上传规则**:

- 简历上传：支持 PDF、Word (.doc, .docx)
- 文件大小限制：5MB
- 头像上传：支持 JPG、PNG
- 文件名格式：`{类型}_{时间戳}.{扩展名}`

**文件访问**:

- 开发环境：通过 Nginx 直接提供静态文件
- 生产环境：通过 Nginx 直接提供静态文件
- API 访问：后端提供文件流下载接口

**Nginx 配置示例**:

```nginx
location /uploads/ {
    alias /data/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

location /api/files/ {
    proxy_pass http://localhost:3001/api/files/;
}
```

**备份策略**:

- 每日凌晨 2 点备份到内网备份服务器
- 保留最近 30 天的备份
- 使用 rsync 增量备份

**未来扩展**（第三阶段，如需要）:

- 云存储（OSS/S3）
- CDN 加速
- 文件压缩和优化

---

### 6. 核心功能模块澄清

#### 6.1 候选人管理 ✅ 已确认

**候选人身份说明**:

- **候选人没有系统账号** - 候选人不需要登录系统
- **信息来源** - 从导入的简历中提取（姓名、电话、邮箱）
- **沟通方式** - 通过简历中的邮箱与候选人联系
- **HR确认流程** - 导入时HR需要确认简历信息的正确性

**必须实现**:

- [x] 候选人 CRUD 操作
- [x] 简历上传和预览（PDF/Word）
- [x] 简历去重（姓名+电话唯一约束）
- [x] 候选人筛选（状态、职位、时间）
- [x] 候选人搜索（姓名、电话、邮箱）
- [x] @面试官功能（发送邮件通知）

**候选人导入流程**:

```
1. HR上传简历文件（PDF/Word）
2. 系统自动解析简历（或HR手动输入）
   - 姓名（必填）
   - 电话（必填）
   - 邮箱（必填）
3. HR确认信息正确性
4. 系统检查去重（姓名+电话）
5. 关联到职位
6. 保存候选人信息
7. 保存简历文件到本地
```

**数据字段**:

```typescript
{
  id: string;
  name: string; // 从简历提取
  phone: string; // 从简历提取
  email: string; // 从简历提取，用于与候选人联系
  position_id: string; // HR手动选择或自动关联
  status: "pending" |
    "screening" |
    "interview_1" |
    "interview_2" |
    "interview_3" |
    "hired" |
    "rejected";
  source: "boss" | "referral" | "headhunter" | "website";
  resume_url: string; // 简历文件存储路径
  created_at: datetime;
  updated_at: datetime;
}
```

**去重逻辑**:

- 数据库层面：`(name, phone)` 唯一约束
- 应用层面：上传时检查是否存在，提示用户合并或更新

**候选人信息确认**:

HR在导入时需要确认：

- [ ] 姓名是否正确
- [ ] 电话是否正确
- [ ] 邮箱是否正确
- [ ] 职位是否正确
- [ ] 来源是否正确

系统支持：

- 修改候选人基本信息（HR权限）
- 重新上传简历
- 合并重复候选人

---

#### 6.2 职位管理 ✅ 已确认

**必须实现**:

- [x] 职位 CRUD 操作
- [x] 职位状态管理（招聘中/已暂停/已关闭）
- [x] 导出职位信息（供人工发布到 BOSS 直聘）
- [x] 招聘进度跟踪（已入职/进行中）

**数据字段**:

```typescript
{
  id: string;
  title: string;
  description: string; // 富文本
  requirements: string; // 富文本
  salary_min: number;
  salary_max: number;
  headcount: number;
  hired_count: number;
  in_progress_count: number;
  status: "open" | "paused" | "closed";
  location: string;
  created_at: datetime;
  updated_at: datetime;
}
```

**BOSS 直聘对接**:

- **第一阶段**: 导出标准格式（JSON/CSV），人工复制到 BOSS 直聘
- **格式示例**:

```json
{
  "jobName": "前端工程师",
  "salary": "20K-30K",
  "jobDescription": "...",
  "jobRequirement": "..."
}
```

---

#### 6.3 面试安排 ✅ 已确认

**必须实现**:

- [x] 面试类型（初试/复试/终试）
- [x] 面试形式（线上/线下）
- [x] 线上面试：记录腾讯会议链接和会议号
- [x] 线下面试：记录面试地点
- [x] 面试日历视图（周视图/月视图）
- [x] 时间冲突检测（面试官日程冲突）

**数据字段**:

```typescript
{
  id: string;
  candidate_id: string;
  position_id: string;
  interviewer_id: string; // 面试官 ID
  type: "interview_1" | "interview_2" | "interview_3";
  format: "online" | "offline";
  start_time: datetime;
  end_time: datetime;
  location: string; // 线下地点
  meeting_url: string; // 腾讯会议链接
  meeting_number: string; // 腾讯会议号
  status: "scheduled" | "completed" | "cancelled";
  created_at: datetime;
}
```

**时间冲突检测逻辑**:

```typescript
function checkConflict(
  interviewerId: string,
  startTime: datetime,
  endTime: datetime,
) {
  // 查询面试官在该时间段内是否有其他面试
  return db.interview.findFirst({
    where: {
      interviewer_id: interviewerId,
      status: "scheduled",
      NOT: {
        OR: [
          { end_time: { lte: startTime } }, // 在之前结束
          { start_time: { gte: endTime } }, // 在之后开始
        ],
      },
    },
  });
}
```

---

#### 6.4 面试反馈 ✅ 已确认

**必须实现**:

- [x] 发送反馈链接给面试官（邮件通知）
- [x] 面试官在线填写反馈
- [x] 评价结果（满意/不满意/待定）
- [x] 优势/劣势评价（文本）
- [x] 反馈汇总（候选人详情页显示历史反馈）

**反馈表单字段**:

```typescript
{
  id: string;
  interview_id: string;
  interviewer_id: string;
  result: "pass" | "fail" | "pending";
  strengths: string;
  weaknesses: string;
  overall_rating: number; // 1-5 星
  notes: string;
  created_at: datetime;
}
```

**反馈链接设计**:

- 链接格式：`/feedback/{interviewId}/{token}`
- Token 有效期：7 天
- 填写后链接失效

---

#### 6.5 邮件通知 ✅ 已确认

**必须实现**:

- [x] 面试通知给候选人（时间、地点/会议链接）
- [x] 面试通知给面试官（候选人简历、时间、反馈链接）
- [x] 反馈填写提醒（面试后 2 小时）
- [x] 邮件模板管理

**邮件类型**:
| 类型 | 收件人 | 触发时机 | 内容 |
|------|--------|----------|------|
| 面试通知（候选人） | candidate | 面试安排后 | 时间、地点/链接、职位 |
| 面试通知（面试官） | interviewer | 面试安排后 | 候选人简历、时间、反馈链接 |
| 反馈提醒 | interviewer | 面试后 2 小时 | 催促填写反馈 |

**邮件模板示例（候选人）**:

```
主题：面试邀请 - {职位名称}

尊敬的 {候选人姓名}：

您好！感谢您对我们公司的关注。

您申请的 {职位名称} 职位已安排面试，具体信息如下：

面试时间：{开始时间} - {结束时间}
面试形式：{线上/线下}
{如果是线上}
腾讯会议链接：{会议链接}
会议号：{会议号}
{如果是线下}
面试地点：{地址}

请准时参加面试。如有问题，请联系 HR。

此致
HR 团队
```

**SMTP 配置**:

- 支持配置 SMTP 服务器
- 发件人、服务器地址、端口、用户名、密码

---

#### 6.6 飞书日历集成 ✅ 已确认

**第一阶段方案（MVP）**:

- [x] 生成 ICS 日历事件文件
- [x] 提供下载按钮，用户手动导入到飞书日历
- [x] ICS 文件包含：事件标题、时间、描述、地点/会议链接

**ICS 文件格式**:

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Moka Interview System//CN
BEGIN:VEVENT
UID:{interview_id}
DTSTART:{start_time}
DTEND:{end_time}
SUMMARY:面试 - {候选人姓名} - {职位名称}
DESCRIPTION:面试类型：{初试/复试/终试}\n候选人：{候选人姓名}\n职位：{职位名称}
LOCATION:{线下地点 或 腾讯会议}
END:VEVENT
END:VCALENDAR
```

**未来扩展**（第二阶段）:

- [ ] 飞书 API 自动同步日程
- [ ] 单点登录（SSO）

---

#### 6.7 腾讯会议集成 ✅ 已确认

**第一阶段方案（MVP）**:

- [x] 手动创建腾讯会议
- [x] 在面试安排表单中输入会议链接和会议号
- [x] 会议链接存储到数据库

**未来扩展**（第二阶段）:

- [ ] 腾讯会议 API 自动创建会议
- [ ] 邀请候选人自动加入会议

---

#### 6.8 BOSS 直聘对接 ✅ 已确认

**第一阶段方案（MVP）**:

- [x] 人工导入简历（从 BOSS 直聘下载，手动上传）
- [x] 人工导出职位（导出标准格式，复制到 BOSS 直聘）

**简历导入格式**:

- 支持上传 PDF 简历
- 手动填写姓名、电话、邮箱
- 自动关联到职位

**未来扩展**（第三阶段）:

- [ ] BOSS 直聘 API 对接
- [ ] 自动同步简历和职位

---

### 7. UI/UX 澄清

#### 3.1 整体布局

- **左侧导航栏**: 固定，包含主要模块
- **顶部栏**: 用户信息、通知、设置
- **主内容区**: 根据导航切换不同页面

#### 3.2 颜色主题

- **主色调**: 蓝色（#3B82F6）- 符合专业、可信赖的形象
- **状态颜色**:
  - 待处理: 灰色
  - 进行中: 绿色
  - 已完成: 蓝色
  - 已取消: 红色

#### 3.3 关键页面澄清

**工作台 (Dashboard)**:

- 显示今日待处理任务
- 显示本周面试安排
- 显示招聘漏斗概览

**候选人列表页**:

- 表格视图，支持排序
- 顶部筛选器（状态、职位、时间）
- 搜索框（姓名、电话、邮箱）
- 批量操作（导出、@面试官）

**面试日历**:

- 月视图和周视图切换
- 点击日期查看当日面试
- 拖拽调整时间（未来版本）

**候选人详情页**:

- 左侧：基本信息
- 中间：简历预览
- 右侧：面试反馈历史
- 顶部：@面试官、安排面试按钮

---

### 8. 数据库设计澄清

#### 核心表结构

**Users**（用户表）

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('hr', 'interviewer')),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 初始化管理员账号
INSERT INTO users (username, password, name, email, role)
VALUES ('admin', '$2b$10$...', '系统管理员', 'admin@company.com', 'hr');
```

**Positions**（职位表）

```sql
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  requirements TEXT,
  salary_min INT,
  salary_max INT,
  headcount INT DEFAULT 1,
  hired_count INT DEFAULT 0,
  in_progress_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'paused', 'closed')),
  location VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Candidates**（候选人表）

```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  position_id UUID REFERENCES positions(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'screening', 'interview_1', 'interview_2', 'interview_3', 'hired', 'rejected')),
  source VARCHAR(50) CHECK (source IN ('boss', 'referral', 'headhunter', 'website')),
  resume_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, phone) -- 去重约束
);

-- 注意：候选人表不包含 username 和 password 字段
-- 候选人不需要登录系统，信息从简历导入
-- 邮箱用于 HR 与候选人联系
```

**关键区别**：

| 特性     | Users 表    | Candidates 表 |
| -------- | ----------- | ------------- |
| username | ✅ 有       | ❌ 无         |
| password | ✅ 有       | ❌ 无         |
| 登录能力 | ✅ 可以登录 | ❌ 不可以登录 |
| 系统角色 | HR/面试官   | 外部候选人    |
| 信息来源 | HR创建      | 简历导入      |
| 邮箱用途 | 登录/通知   | 联系候选人    |

**Interviews**（面试表）

```sql
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  position_id UUID REFERENCES positions(id),
  interviewer_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('interview_1', 'interview_2', 'interview_3')),
  format VARCHAR(20) NOT NULL CHECK (format IN ('online', 'offline')),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location VARCHAR(200),
  meeting_url TEXT,
  meeting_number VARCHAR(50),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

**InterviewFeedbacks**（面试反馈表）

```sql
CREATE TABLE interview_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id),
  interviewer_id UUID NOT NULL REFERENCES users(id),
  result VARCHAR(20) NOT NULL CHECK (result IN ('pass', 'fail', 'pending')),
  strengths TEXT,
  weaknesses TEXT,
  overall_rating INT CHECK (overall_rating >= 1 AND overall_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 9. 技术栈澄清

#### 前端

- **框架**: Next.js 15+ (App Router)
- **UI 组件**: shadcn/ui (Radix UI + Tailwind CSS)
- **状态管理**: React Context API / Zustand
- **表单处理**: React Hook Form + Zod
- **日期处理**: date-fns
- **富文本编辑**: Tiptap 或 Quill

#### 后端

- **框架**: NestJS
- **ORM**: Prisma
- **验证**: class-validator
- **认证**: JWT (jsonwebtoken)
- **邮件**: Nodemailer
- **文件上传**: Multer + 本地存储

#### 数据库

- **主数据库**: PostgreSQL 15+
- **连接池**: pg
- **迁移**: Prisma Migrate

#### 部署

- **容器化**: Docker
- **反向代理**: Nginx
- **进程管理**: PM2 (或 Docker Compose)

---

### 10. 实施计划澄清

#### 第一阶段（MVP）- 4-6 周

**Week 1-2: 基础设施和核心模块**

- [ ] 项目初始化（前端 + 后端）
- [ ] 数据库设计和迁移
- [ ] 用户认证系统
- [ ] 职位管理模块

**Week 3-4: 候选人和面试管理**

- [ ] 候选人管理模块
- [ ] 面试安排模块
- [ ] 面试日历视图

**Week 5-6: 集成和优化**

- [ ] 面试反馈模块
- [ ] 邮件通知系统
- [ ] 飞书日历 ICS 导出
- [ ] 测试和部署

---

#### 第二阶段（增强）- 4-6 周

**Week 1-2: 自动化**

- [ ] 飞书日历 API 集成
- [ ] 腾讯会议 API 集成
- [ ] 简历自动解析

**Week 3-4: 用户体验优化**

- [ ] 移动端适配
- [ ] 响应式设计优化
- [ ] 性能优化

**Week 5-6: 高级功能**

- [ ] 数据分析和报表
- [ ] 更多筛选和搜索功能
- [ ] 用户操作日志

---

#### 第三阶段（高级）- 6-8 周

**Week 1-3: 深度集成**

- [ ] BOSS 直聘 API 对接
- [ ] 飞书企业版深度集成
- [ ] 单点登录（SSO）

**Week 4-6: AI 功能**

- [ ] AI 辅助面试评分
- [ ] 智能推荐面试官
- [ ] 候选人智能匹配

**Week 7-8: 高级分析**

- [ ] 高级数据分析
- [ ] 招聘漏斗分析
- [ ] 渠道效果分析

---

### 11. 风险和约束澄清

#### 技术风险

1. **邮件发送可靠性**
   - 缓解：使用企业邮箱，配置 SPF/DKIM
   - 降级：如果邮件发送失败，在系统中显示通知

2. **文件上传和存储**
   - 缓解：限制文件大小（5MB），支持 PDF/Word 格式
   - 未来：考虑云存储（OSS/S3）

3. **时间冲突检测**
   - 缓解：安排面试时提前检测并提示
   - 降级：允许覆盖，但警告用户

#### 业务风险

1. **用户培训成本**
   - 缓解：界面友好，提供操作文档
   - 设计：参考 Moka 的界面，减少学习成本

2. **数据迁移**
   - 缓解：设计数据导入工具（CSV/JSON）
   - 未来：如果需要，开发 Moka 数据迁移工具

---

### 12. 验收标准澄清

#### 功能验收

- [ ] 完成第一阶段所有功能模块
- [ ] 支持至少 50 个候选人的并发管理
- [ ] 支持至少 20 个职位的管理
- [ ] 邮件发送成功率 > 95%

#### 性能验收

- [ ] 页面加载时间 < 2 秒
- [ ] 用户操作响应时间 < 500ms
- [ ] 系统可用性 > 99%（工作时间内）

#### 用户体验验收

- [ ] 界面美观、符合 Moka 风格
- [ ] 操作流程清晰、易于理解
- [ ] 错误提示明确、帮助用户解决问题

---

## 📌 未决事项

以下事项需要在开发过程中进一步确认：

### 高优先级

（已全部确认）

### 中优先级

1. **面试官日历**
   - [ ] 是否需要面试官可以查看自己的日历？
   - [ ] 是否需要面试官可以调整自己的可用时间？

2. **候选人评分**
   - [ ] 是否需要候选人整体评分系统？
   - [ ] 是否需要面试官认可/不认可功能？

3. **通知设置**
   - [ ] 用户是否可以自定义通知偏好？
   - [ ] 是否需要短信通知？

### 低优先级

1. **数据分析**
   - [ ] 第一阶段是否需要基本的数据统计？
   - [ ] 哪些指标最重要？

2. **移动端**
   - [ ] 第一阶段是否需要移动端支持？
   - [ ] 是否需要原生 App？

---

## 🎯 候选人身份澄清（重要）

### 候选人 ≠ 系统用户

**核心概念**：

- **系统用户（Users）**：公司内部员工（HR、面试官），有登录账号
- **候选人（Candidates）**：外部应聘者，**没有登录账号**

### 关键区别

| 特性         | 系统用户（User）   | 候选人（Candidate） |
| ------------ | ------------------ | ------------------- |
| 是否可以登录 | ✅ 需要，可以登录  | ❌ 不可以，没有账号 |
| 用户类型     | HR/Admin / 面试官  | 外部候选人          |
| 信息来源     | HR手动创建         | 简历导入            |
| 登录凭证     | 用户名 + 密码      | ❌ 无               |
| 系统角色     | 有权限（根据角色） | ❌ 无权限           |
| 邮箱用途     | 系统登录、接收通知 | 与HR联系            |

### 候选人管理流程

```
1. HR上传候选人简历（PDF/Word）
   ↓
2. 系统提取/HR输入候选人信息
   - 姓名（必填）
   - 电话（必填）
   - 邮箱（必填）
   ↓
3. HR确认信息正确性 ⚠️ 重要
   ↓
4. 系统检查去重（姓名+电话唯一）
   ↓
5. 关联到职位
   ↓
6. 保存候选人信息 + 简历文件
```

### HR确认责任

在导入候选人时，HR必须确认：

- [ ] 姓名是否正确
- [ ] 电话是否正确
- [ ] 邮箱是否正确（用于联系候选人）
- [ ] 职位是否正确
- [ ] 来源是否正确

系统支持：

- ✅ 修改候选人基本信息（HR权限）
- ✅ 重新上传简历
- ✅ 合并重复候选人

### 与候选人的沟通

**沟通渠道**：通过简历中的邮箱

- 面试通知 → 发送到候选人邮箱
- 系统不会给候选人发送登录信息（因为候选人不需要登录）

**示例**：

```
HR 在系统中安排面试 → 系统发送邮件到 candidate@email.com
→ 候选人收到邮件，了解面试时间和地点/会议链接
→ 候选人无需登录系统
```

---

## ✅ 结论

### 已完全确认

1. **部署方式**: 本地服务部署（公司内网服务器）
2. **用户认证**: 内置账号和密码登录（账号包含用户名）
3. **候选人身份**: **候选人没有系统账号**，信息来自简历导入，HR需确认信息正确性
4. **权限设计**: 简单角色系统（HR/Admin + 面试官），暂不需要细化
5. **文件存储**: 本地存储
6. **核心范围**: 8 大模块，第一阶段 MVP
7. **技术栈**: Next.js + NestJS + PostgreSQL + Prisma

### 📝 记录的扩展需求

1. **飞书集成**: 第二阶段考虑飞书单点登录和 API 集成
2. **权限细化**: 暂时不需要，如需要可在第三阶段实现
3. **文件存储扩展**: 第三阶段可考虑云存储

---

## 🚀 下一步行动

1. **开始项目初始化**
   - 前端：Next.js + shadcn/ui
   - 后端：NestJS + Prisma
   - 数据库：PostgreSQL

2. **详细设计和开发**
   - 数据库 Schema 设计（Prisma Schema）
   - API 接口设计
   - 前端页面设计

3. **开发核心功能模块**
   - 用户认证系统
   - 职位管理
   - 候选人管理
   - 面试安排
   - 面试反馈
   - 邮件通知
   - 飞书日历 ICS 导出

---

**文档版本**: v2.1 (最终版 - 候选人身份澄清)
**最后更新**: 2026-02-12
**状态**: ✅ 需求澄清完成，所有关键事项已确认
