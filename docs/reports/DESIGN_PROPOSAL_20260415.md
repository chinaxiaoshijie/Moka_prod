# Moka 面试系统 v3.0 设计方案

> **提出时间**: 2026-04-15
> **状态**: 待评审
> **目标**: 品牌升级 + 飞书日历集成 + AI简历智能匹配

---

## 📋 需求总览

| # | 需求 | 复杂度 | 涉及范围 |
|---|------|--------|----------|
| 1 | 品牌更名：Moka → 码隆智能面试系统 | 🟢 中 | 前端UI/邮件模板/Docker配置/文档 |
| 2 | 飞书日历同步 | 🟡 中高 | 后端服务+飞书API集成+前端状态 |
| 3 | AI简历智能匹配 | 🔴 高 | 新增AI服务+数据库扩展+前端页面 |

---

## 一、品牌更名：Moka → 码隆智能面试系统

### 1.1 需要修改的文件清单

#### 前端 UI（8 处）

| 文件 | 行号 | 当前内容 | 修改为 |
|------|------|----------|--------|
| `frontend/src/components/TopBar.tsx` | 40 | `"Moka招聘"` | `"码隆智能面试"` |
| `frontend/src/components/Sidebar.tsx` | 81 | `/* Moka mountain logo */` | `/* 码隆智能 Logo */` |
| `frontend/src/components/Sidebar.tsx` | 82 | `const MokaLogo` | `const MalongLogo` |
| `frontend/src/components/Sidebar.tsx` | 131 | `"Moka招聘"` | `"码隆智能面试"` |
| `frontend/src/app/login/page.tsx` | 7 | `const MokaLogoSVG` | `const MalongLogoSVG` |
| `frontend/src/app/login/page.tsx` | 90 | `"Moka 招聘"` | `"码隆智能面试"` |
| `frontend/src/app/login/page.tsx` | 127 | `"© 2026 Moka"` | `"© 2026 码隆智能科技"` |
| `frontend/src/app/login/page.tsx` | 136-144 | 侧边栏 "Moka 招聘" / "欢迎使用 Moka" | `"码隆智能面试"` / `"欢迎使用码隆智能面试系统"` |
| `frontend/src/app/settings/page.tsx` | 351 | `"Moka 面试管理系统"` | `"码隆智能面试系统"` |
| `frontend/src/app/settings/page.tsx` | 357 | `"© 2026 Moka Interview System"` | `"© 2026 码隆智能科技. All rights reserved."` |
| `frontend/src/app/layout.tsx` | 5 | `"Moka - 智能招聘管理平台"` | `"码隆智能 - 智能招聘管理平台"` |
| `frontend/src/app/globals.css` | 6 | `Design System: Moka AntD Pro 主题` | `Design System: 码隆智能 AntD Pro 主题` |

#### 后端邮件模板（14+ 处）

| 文件 | 行号 | 当前内容 | 修改为 |
|------|------|----------|--------|
| `backend/src/email/email.service.ts` | 99 | `SMTP_FROM` 或 `noreply@moka.com` | **保持现有 `hrgroup@malong.com`** |
| `backend/src/email/email.service.ts` | 174,207,227... | `"Moka 面试系统"`（共14处邮件签名） | `"码隆智能面试系统"` |

#### Docker 配置（**不改**）

| 文件 | 说明 |
|------|------|
| `docker-compose*.yml` | 容器名 `moka-*`、DB名 `moka_db`、网络名 `moka-network` **保持不变** — 这是基础设施标识，改名会影响数据迁移和运维脚本 |

#### 环境变量（**不改**）

| 文件 | 说明 |
|------|------|
| `.env` / `backend/.env` | `POSTGRES_USER=moka` **保持不变** — 数据库用户名 |

#### 项目元数据（**不改**）

| 文件 | 说明 |
|------|------|
| `package.json` | `"name": "moka-opencode"` **保持不变** — 内部项目标识 |

### 1.2 Logo 替换方案

**用户确认：Logo 不更换**
- 保留现有 SVG 山形 Logo 组件
- 无需更新 Logo 文件或颜色

### 1.3 邮件发送者名称

当前：`noreply@moka.com` → 修改为：`noreply@malong.com`
- 需要确认 SMTP 配置是否支持 `@malong.com` 域名
- 邮件 `From` 显示名称改为：`码隆智能面试系统 <noreply@malong.com>`

### 1.4 文档更新

需要更新的 Markdown 文档（约 20 个文件）：
- `README.md`、`DEPLOYMENT.md`、`USER_GUIDE.md` 等
- 所有 `.md` 文件中的 "Moka" 品牌引用

---

## 二、飞书日历同步

### 2.1 技术方案

**现有基础设施**: `lark-cli` 已安装并支持 `calendar +create` 命令
```bash
lark-cli calendar +create \
  --summary "面试 - 候选人姓名" \
  --description "面试详情" \
  --start "2026-04-20T10:00:00+08:00" \
  --end "2026-04-20T11:00:00+08:00" \
  --attendee-ids "ou_interviewer1,ou_hr1" \
  --calendar-id "primary"
```

### 2.2 触发时机

在以下场景自动创建飞书日程：

| 场景 | 触发点 | 参与者 |
|------|--------|--------|
| **新建面试安排** | `interview-process.service.ts` → `createRoundInterview` | 面试官 + HR |
| **修改面试时间** | `interview.service.ts` → `update`（时间变更时） | 面试官 + HR |
| **面试取消** | 面试状态变为 CANCELLED | 取消日程 |

### 2.3 飞书日程内容设计

```
标题: [初试/复试/终试] 面试 - 候选人姓名 - 职位名称
描述:
📋 候选人: {name}
📞 电话: {phone}
📧 邮箱: {email}
💼 应聘职位: {position}
👤 面试官: {interviewer}
📍 面试方式: {format === 'online' ? '线上（腾讯会议）' : '线下'}
📍 面试地点/链接: {location or meetingUrl}
⏰ 面试轮次: 第{roundNumber}轮

备注: 请提前查看候选人简历，准时参加面试。
```

### 2.4 数据结构扩展

#### 方案 A：轻量方案（推荐）
- 在 `Interview` 表中增加 `feishuEventId` 字段
- 创建日程后保存飞书返回的事件 ID
- 修改/取消时通过 ID 更新/删除

```prisma
model Interview {
  // ... 现有字段
  feishuEventId String?  // 飞书日历事件ID，用于同步更新/取消
}
```

#### 方案 B：完整方案
- 新建 `FeishuCalendarSync` 表记录同步状态
- 支持同步失败重试、状态追踪

```prisma
model FeishuCalendarSync {
  id           String   @id @default(uuid())
  interviewId  String   @unique
  feishuEventId String
  calendarId   String   @default("primary")
  status       SyncStatus @default(SUCCESS)
  lastSyncAt   DateTime @default(now())
  errorMessage String?
  
  interview    Interview @relation(fields: [interviewId], references: [id])
}

enum SyncStatus {
  SUCCESS
  FAILED
  PENDING
}
```

**推荐方案 A**，简单可靠，满足当前需求。

### 2.5 实现步骤

1. **Prisma Schema 更新**: 添加 `feishuEventId` 字段
2. **新建 FeishuCalendarService**: 
   - 调用 `lark-cli calendar +create` 创建日程
   - 调用 `lark-cli calendar events delete` 取消日程
   - 封装飞书 API 调用（通过 lark-cli 或直接 HTTP）
3. **集成到现有流程**:
   - `createRoundInterview()` 成功后调用创建日程
   - `interview.service.ts` 的 `update()` 检测到时间变化时更新日程
   - 面试取消时删除日程
4. **User 表扩展**: 需要存储用户的飞书 `ou_id`（用于日程邀请）

### 2.6 前置条件

| 条件 | 状态 |
|------|------|
| lark-cli 可用 | ✅ 已安装 |
| 飞书 API 权限（日历读写） | ⚠️ 需确认 |
| 用户绑定飞书 `ou_id` | 🔴 **需新增**: 用户设置界面支持填写/授权绑定飞书ID |
| 时区处理（+08:00） | ✅ 已有修复 |

### 2.7 风险与注意事项

- **飞书 API 限流**: 需要控制调用频率
- **日程创建失败**: 不能阻塞面试创建流程，应异步+重试
- **权限**: lark-cli 使用 user/bot 身份调用，需确认有日历创建权限

---

## 三、AI 简历智能匹配

### 3.1 技术方案

#### 整体架构

```
简历PDF上传 → ResumeParserService（现有） → AI分析服务 → 匹配结果
                                              ↓
                                         前端展示
```

#### 流程设计

1. **HR上传简历 PDF**（现有功能，已支持）
2. **HR选择/匹配职位**（现有功能，已支持）
3. **自动触发 AI 分析**（新增）
4. **展示匹配报告**（新增前端页面/组件）

### 3.2 AI 分析服务设计

#### 新建 `AiMatchService`

```typescript
// backend/src/ai/ai-match.service.ts

export interface MatchAnalysis {
  matchScore: number;          // 匹配度 0-100
  matchLevel: 'high' | 'medium' | 'low';  // 匹配等级
  strengths: string[];         // 优势项
  weaknesses: string[];        // 不足项
  suggestions: string[];       // 面试建议
  keySkills: {                 // 技能匹配
    skill: string;
    required: boolean;
    hasIt: boolean;
    evidence: string;          // 简历中的证据
  }[];
  experienceMatch: {           // 经验匹配
    required: string;
    candidateHas: string;
    matchScore: number;
  }[];
  rawAnalysis: string;         // AI原始输出（用于调试）
}
```

#### AI Prompt 设计

```
你是一个专业的招聘顾问。请分析以下候选人简历与职位要求的匹配程度。

## 职位要求
{position.title}
职位描述: {position.description}
任职要求: {position.requirements}

## 候选人简历
{resumeText}

## 输出要求（JSON格式）
{
  "matchScore": 75,
  "matchLevel": "medium",
  "strengths": ["3年Java开发经验", "熟悉微服务架构"],
  "weaknesses": ["缺乏团队管理经验", "无云计算相关经验"],
  "suggestions": [
    "重点询问其微服务项目经验",
    "评估其技术深度",
    "了解其学习能力和意愿"
  ],
  "keySkills": [
    {"skill": "Java", "required": true, "hasIt": true, "evidence": "5年Java开发经验"},
    {"skill": "Docker", "required": true, "hasIt": false, "evidence": "简历中未提及"}
  ],
  "experienceMatch": [
    {"required": "3年以上后端开发", "candidateHas": "5年", "matchScore": 100}
  ]
}
```

### 3.3 技术选型

| 选项 | 方案 | 优势 | 劣势 |
|------|------|------|------|
| **推荐** | 百炼 API (qwen-plus) | 现有基础设施，成本低 | 需要 API Key 配置 |
| 备选 | 本地部署模型 | 数据隐私 | 需要 GPU 资源 |

**推荐方案**: 使用百炼 API (`qwen-plus`)，与现有 AI 学习空间共用 API Key 基础设施。

### 3.4 数据结构扩展

```prisma
// 新增 AI 分析结果表
model ResumeAnalysis {
  id           String   @id @default(uuid())
  candidateId  String
  positionId   String
  resumeFileId String?
  
  matchScore   Int      // 0-100
  matchLevel   String   // high/medium/low
  strengths    String[] // 优势
  weaknesses   String[] // 不足
  suggestions  String[] // 面试建议
  keySkills    Json     // 技能匹配详情
  experienceMatch Json  // 经验匹配详情
  
  analyzedBy   String   @default("qwen-plus")
  analyzedAt   DateTime @default(now())
  
  candidate    Candidate @relation(fields: [candidateId], references: [id])
  position     Position? @relation(fields: [positionId], references: [id])
  resumeFile   ResumeFile? @relation(fields: [resumeFileId], references: [id])
  
  @@unique([candidateId, positionId])  // 同一候选人+职位只分析一次
  @@map("resume_analyses")
}
```

### 3.5 前端展示设计

#### 新增页面/组件

1. **候选人详情页匹配卡片** (`/candidates/[id]/page.tsx`)
   - 在简历下方展示匹配度报告
   - 环形进度图显示匹配分数
   - 展开/折叠查看详细信息
   - **邮件分享按钮**: 将匹配报告发送给指定面试官

2. **新增匹配报告弹窗** (`ResumeMatchModal.tsx`)
   - 完整展示 AI 分析结果
   - 支持重新分析按钮
   - **邮件分享功能**: 选择面试官并发送匹配报告邮件

#### 邮件分享设计

**触发**: HR在匹配报告页面点击"分享给面试官"
**收件人**: 可选择已绑定的面试官（系统内用户）
**邮件内容**:
```
主题: 【AI匹配报告】候选人{姓名} - {职位名称} 匹配分析

您好，{面试官姓名}：

候选人 {姓名} 应聘 {职位名称}，AI 匹配分析结果如下：

📊 匹配度: {score}% ({level})

✅ 优势:
{strengths列表}

⚠️ 不足:
{weaknesses列表}

💡 面试建议:
{suggestions列表}

请提前查看候选人简历，准时参加面试。

---
码隆智能面试系统
```

#### UI 布局示意

```
┌─────────────────────────────────────┐
│ 候选人: 张三                        │
│ 应聘职位: Java高级工程师             │
│                                     │
│ ╔═══════════════════════════════╗   │
│ ║ 🤖 AI 匹配分析报告            ║   │
│ ║                               ║   │
│ ║    ┌─────┐                    ║   │
│ ║    │ 75% │ 匹配度: 中等        ║   │
│ ║    └─────┘                    ║   │
│ ║                               ║   │
│ ║ ✅ 优势 (3)                   ║   │
│ ║ • 5年Java开发经验              ║   │
│ ║ • 熟悉Spring生态               ║   │
│ ║                               ║   │
│ ║ ⚠️ 不足 (2)                    ║   │
│ ║ • 缺乏团队管理经验             ║   │
│ ║ • 无云计算经验                 ║   │
│ ║                               ║   │
│ ║ 💡 面试建议                   ║   │
│ ║ • 重点询问微服务项目经验       ║   │
│ ║ • 评估技术深度                 ║   │
│ ║                               ║   │
│ ║ [查看完整报告] [重新分析]      ║   │
│ ╚═══════════════════════════════╝   │
└─────────────────────────────────────┘
```

### 3.6 触发机制

| 时机 | 触发方式 | 说明 |
|------|----------|------|
| HR匹配职位后 | 自动 | 调用 AI 分析并保存结果 |
| 候选人详情页 | 手动 | 点击"重新分析"按钮 |
| 职位要求变更 | 手动/自动 | 可选重新分析 |

### 3.7 成本控制

- 每次分析约消耗 2000-4000 token
- 百炼 API qwen-plus 价格约 ¥0.004/千token
- 单次分析成本约 ¥0.008-0.016
- 缓存分析结果，避免重复调用

### 3.8 实现步骤

1. **Prisma Schema 更新**: 添加 `ResumeAnalysis` 表
2. **新建 AiMatchService**: 封装百炼 API 调用
3. **集成到 CandidateService**: 匹配职位时自动触发
4. **新建 API 端点**: `POST /candidates/:id/analyze-match`
5. **前端组件**: 创建 `ResumeMatchCard.tsx` 和 `ResumeMatchModal.tsx`
6. **前端集成**: 在候选人详情页和职位匹配流程中展示

---

## 四、实施计划

### Phase 1: 品牌更名（预计 2-3 小时）

| 步骤 | 文件 | 状态 |
|------|------|------|
| 1. 前端 UI 文本替换 | 8 个 TSX 文件 | ⬜ |
| 2. 邮件模板更新 | `email.service.ts` | ⬜ |
| 3. Logo 组件更新 | `Sidebar.tsx`, `login/page.tsx` | ⬜ |
| 4. 文档更新 | 约 20 个 .md 文件 | ⬜ |
| 5. 本地测试 | 构建+启动验证 | ⬜ |

### Phase 2: 飞书日历同步（预计 6-8 小时）

| 步骤 | 状态 | 说明 |
|------|------|------|
| 1. Prisma Schema 更新 | ⬜ | 添加 `feishuEventId` + `User.feishuOuId` |
| 2. 用户设置界面 | ⬜ | 新增飞书ID绑定/授权页面 |
| 3. 新建 FeishuCalendarService | ⬜ | 封装 lark-cli 调用 |
| 4. 集成到面试创建流程 | ⬜ | 自动创建日程 |
| 5. 集成到面试修改流程 | ⬜ | 更新/取消日程 |
| 6. 前端状态展示 | ⬜ | 显示同步状态 |
| 7. 测试验证 | ⬜ | 完整流程测试 |

### Phase 3: AI 简历智能匹配 → AI诊断（预计 7-10 小时）

| 步骤 | 状态 | 说明 |
|------|------|------|
| 1. Prisma Schema 更新 | ⬜ | 添加 `AIDiagnosis` 表 |
| 2. 新建 AIDiagnosisService | ⬜ | 封装百炼 API |
| 3. API 端点开发 | ⬜ | 诊断触发/获取/分享接口 |
| 4. AIDiagnosisCard 组件 | ⬜ | 诊断卡片展示 |
| 5. 邮件分享功能 | ⬜ | 新增诊断报告邮件模板+发送接口 |
| 6. 集成到匹配流程 | ⬜ | 在每轮反馈前插入诊断卡片 |
| 7. 测试验证 | ⬜ | AI 输出质量验证 |

> **设计文档**: `/home/malong/projects/Moka_prod/Moka_prod/AI_DIAGNOSIS_DESIGN.md`

### 总预计时间: 16-21 小时

---

## 五、风险与注意事项

### 5.1 品牌更名
- ⚠️ Logo 不更换，仅更新文本

### 5.2 飞书日历
- ⚠️ 需要确认飞书 API 日历读写权限
- ⚠️ **需新增用户设置界面**: 用户需手动填写或授权绑定飞书 `ou_id`
- ⚠️ 日程创建失败不应阻塞面试流程

### 5.3 AI 匹配
- ⚠️ 需要配置百炼 API Key
- ⚠️ AI 输出质量需要人工验证和调整 Prompt
- ⚠️ 分析结果缓存策略
- ⚠️ 邮件分享功能需要确保不泄露敏感信息

---

## 六、数据库迁移脚本

```bash
# Phase 1 & 2 & 3 的 Prisma 迁移
cd backend
npx prisma migrate dev --name add_feishu_sync_and_ai_match
npx prisma generate
```

---

## 七、API 端点新增

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/candidates/:id/analyze-match` | 触发 AI 简历匹配分析 |
| `GET` | `/candidates/:id/match-analysis` | 获取匹配分析结果 |
| `POST` | `/interviews/:id/sync-calendar` | 手动触发日历同步 |
| `DELETE` | `/interviews/:id/feishu-event` | 取消飞书日程 |

---

## 八、配置文件更新

```bash
# 新增环境变量
# AI 匹配服务
AI_MATCH_PROVIDER=alibaba
AI_MATCH_MODEL=qwen-plus
AI_MATCH_API_KEY=sk-4ac26721ba2e4c54ba6e8a777e42e257
AI_MATCH_ENDPOINT=dashscope.aliyuncs.com/compatible-mode/v1

# 飞书日历（使用现有 lark-cli，无需额外配置）
```

---

## 评审检查清单

- [x] 品牌更名范围是否完整？有无遗漏？ → ✅ 发件人邮箱保持 `hrgroup@malong.com`，仅更新签名文本
- [x] 飞书日历同步的触发时机是否合理？ → ✅ 创建/修改/取消时同步
- [x] AI 匹配分析的 Prompt 是否需要调整？ → ✅ 已设计完整 JSON 输出格式
- [ ] 数据库 Schema 扩展是否合理？ → 待确认
- [x] 前端 UI 设计方案是否符合预期？ → ✅ 增加邮件分享功能
- [ ] 实施计划优先级是否需要调整？ → 待确认
- [x] 是否有其他需要考虑的风险点？ → ✅ 增加邮件分享安全考虑

### 用户确认项（2026-04-15）

- [x] 发件人邮箱保持现有 `hrgroup@malong.com`
- [x] Logo 不更换，保留现有 SVG
- [x] 用户未绑定飞书ID，需新增设置界面让用户填写或授权
- [x] AI分析结果支持邮件分享给面试官

---

*方案版本: v1.0 | 创建时间: 2026-04-15 | 待评审*
