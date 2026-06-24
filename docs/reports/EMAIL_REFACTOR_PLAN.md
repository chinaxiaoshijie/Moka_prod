# 候选人邮件发送功能重构方案

**创建时间**: 2026-04-07  
**负责人**: 钢铁侠  
**状态**: 📝 规划中

---

## 🎯 重构原则

### 原则 1: 邮件由 HR 手动控制
- ❌ **禁止自动发送**: 任何情况下都不能自动发送邮件给候选人
- ✅ **HR 主动触发**: 只在 HR 安排面试、修改面试安排、通知面试结果时，由 HR 选择是否发送
- ✅ **明确勾选**: 必须有明确的"发送邮件"勾选项

### 原则 2: 邮件内容需 HR 编辑确认
- ❌ **禁止模板直发**: 不能使用系统模板直接发送
- ✅ **必须编辑**: 每封邮件都需要 HR 手工编辑内容
- ✅ **预览确认**: 发送前必须让 HR 预览邮件内容
- ✅ **自定义主题**: HR 可以自定义邮件主题

---

## 📋 需要修改的内容

### 1. 后端修改

#### 1.1 interview.service.ts
**修改位置**: `create()` 方法

**当前行为**:
```typescript
// ❌ 自动发送邮件
if (createDto.sendEmail && interview.interviewer.email) {
  await this.emailService.sendInterviewNotificationToInterviewer({...})
}
```

**修改后**:
```typescript
// ✅ 移除自动发送，只创建面试记录
// 邮件由 HR 在面试详情页手动发送
```

#### 1.2 interview.controller.ts
**新增接口**: `POST /interviews/:id/send-email-to-candidate`

**请求参数**:
```json
{
  "subject": "自定义邮件主题",
  "content": "自定义邮件内容（HTML）",
  "sendToInterviewer": false  // 可选，是否同时发送给面试官
}
```

**响应**:
```json
{
  "success": true,
  "message": "邮件已发送"
}
```

---

### 2. 前端修改

#### 2.1 面试安排页面 (/interviews)
**修改内容**: 移除"发送邮件"复选框

**当前**:
```tsx
<label>
  <input type="checkbox" checked={sendEmail} onChange={...} />
  发送邮件通知面试官
</label>
```

**修改后**: 完全移除该选项

#### 2.2 面试详情页 (/interviews/:id)
**新增功能**: 邮件编辑和发送弹窗

**UI 设计**:
```
┌────────────────────────────────────┐
│  发送邮件给候选人                  │
├────────────────────────────────────┤
│  收件人：candidate@example.com     │
│  主题：[可编辑文本框]              │
│                                    │
│  内容：                            │
│  ┌──────────────────────────────┐ │
│  │ [HTML 编辑器/文本域]          │ │
│  │                              │ │
│  │ 尊敬的 XXX 您好：             │ │
│  │                              │ │
│  │ 邀请您参加面试...            │ │
│  │                              │ │
│  └──────────────────────────────┘ │
│                                    │
│  [预览]  [取消]  [发送]            │
└────────────────────────────────────┘
```

**功能**:
1. 默认加载系统模板作为草稿
2. HR 可以编辑主题和内容
3. 支持 HTML 格式
4. 发送前可以预览
5. 确认后发送

---

### 3. 邮件模板管理（可选扩展）

#### 3.1 模板库
创建可复用的邮件模板：
- 面试邀请模板
- 面试改期模板
- 面试结果通知模板
- 感谢信模板

#### 3.2 模板变量
支持变量替换：
- `{{candidateName}}` - 候选人姓名
- `{{positionTitle}}` - 职位名称
- `{{interviewTime}}` - 面试时间
- `{{interviewerName}}` - 面试官姓名
- `{{location}}` - 面试地点

---

## 🚀 实施步骤

### 阶段 1: 移除自动发送（1 小时）
1. ✅ 修改 `interview.service.ts` - 移除自动发送逻辑
2. ⏳ 修改前端面试安排页面 - 移除"发送邮件"选项
3. ⏳ 测试：安排面试时不再自动发送邮件

### 阶段 2: 实现手动发送（3 小时）
1. ⏳ 新增后端 API - `POST /interviews/:id/send-email-to-candidate`
2. ⏳ 前端实现邮件编辑弹窗
3. ⏳ 实现邮件预览功能
4. ⏳ 测试：手动编辑并发送邮件

### 阶段 3: 优化体验（2 小时）
1. ⏳ 添加邮件模板功能
2. ⏳ 支持 HTML 编辑器
3. ⏳ 添加发送历史记录
4. ⏳ 测试完整流程

---

## 📝 测试清单

### 测试场景 1: 安排面试
- [ ] 创建面试安排
- [ ] 确认没有自动发送邮件
- [ ] 进入面试详情页

### 测试场景 2: 手动发送邮件
- [ ] 点击"发送邮件给候选人"
- [ ] 编辑邮件主题
- [ ] 编辑邮件内容
- [ ] 预览邮件
- [ ] 确认发送
- [ ] 候选人收到邮件

### 测试场景 3: 修改面试安排
- [ ] 修改面试时间
- [ ] 选择发送邮件
- [ ] 编辑邮件内容（包含改期说明）
- [ ] 发送
- [ ] 候选人收到改期通知

### 测试场景 4: 通知面试结果
- [ ] 面试完成后
- [ ] 选择发送邮件
- [ ] 编辑结果通知内容
- [ ] 发送
- [ ] 候选人收到结果通知

---

## 🔧 技术细节

### 后端 API 设计

```typescript
// Controller
@Post(':id/send-email-to-candidate')
async sendCandidateEmail(
  @Param('id') interviewId: string,
  @Body() dto: SendEmailDto,
) {
  return this.interviewService.sendCandidateEmail(
    interviewId,
    dto.subject,
    dto.content,
  );
}

// DTO
export class SendEmailDto {
  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  sendToInterviewer?: boolean;
}
```

### 前端组件

```tsx
// EmailEditorModal.tsx
interface EmailEditorModalProps {
  interviewId: string;
  candidateEmail: string;
  defaultSubject: string;
  defaultContent: string;
  onClose: () => void;
  onSend: (subject: string, content: string) => Promise<void>;
}
```

---

## 📊 预期效果

### 改进前
- ❌ 自动发送邮件，HR 无法控制
- ❌ 模板固定，无法个性化
- ❌ 候选人收到冷冰冰的系统邮件

### 改进后
- ✅ HR 完全控制发送时机
- ✅ 每封邮件都可个性化编辑
- ✅ 候选人收到温暖的个性化邮件
- ✅ 提升候选人体验和公司形象

---

## 🎉 完成标准

- [ ] 后端移除所有自动发送逻辑
- [ ] 前端实现邮件编辑功能
- [ ] HR 可以自定义主题和内容
- [ ] 支持邮件预览
- [ ] 所有测试场景通过
- [ ] 文档更新完成

---

**下一步**: 开始实施阶段 1
