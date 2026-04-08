# Bug 修复：邮件编辑内容为空白且不可编辑

## 问题描述
在 MOKA 招聘系统测试中，手动发送邮件功能存在以下问题：
1. **邮件内容为空白** - 编辑器区域显示为空
2. **邮件内容不可编辑** - 无法输入或编辑邮件内容

## 根本原因

### 前端问题
1. **未初始化编辑器** - 代码中使用了 `<div id="quill-editor">` 但从未初始化 Quill
2. **缺少编辑器依赖** - package.json 中没有安装 Quill
3. **已有编辑器未使用** - 项目已安装 `@tinymce/tinymce-react` 但未使用

### 后端问题
1. **不支持自定义收件人** - `sendCandidateEmail` 接口只使用候选人记录中的邮箱，不支持前端传入的可编辑邮箱地址

## 修复方案

### 前端修复 (`frontend/src/app/interviews/[id]/page.tsx`)

#### 1. 导入 TinyMCE Editor
```typescript
import { Editor } from "@tinymce/tinymce-react";
```

#### 2. 添加编辑器引用
```typescript
const editorRef = useRef<any>(null);
```

#### 3. 替换空 div 为 TinyMCE 编辑器
```tsx
<Editor
  onInit={(evt, editor) => (editorRef.current = editor)}
  init={{
    height: 400,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | ' +
      'bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | help',
    content_style: 'body { font-family: Arial, sans-serif; font-size: 14px }',
    branding: false,
    language: 'zh_CN'
  }}
  initialValue={emailContent}
  onEditorChange={(content) => setEmailContent(content)}
/>
```

#### 4. 从编辑器获取内容
```typescript
const handleSendEmailToCandidate = async () => {
  // 从 TinyMCE 编辑器获取最新内容
  const content = editorRef.current?.getContent() || emailContent;
  
  // 发送邮件时使用 content 而不是 emailContent
  body: JSON.stringify({
    subject: emailSubject,
    content: content,
    candidateEmail: candidateEmail,
  }),
};
```

### 后端修复

#### 1. Service 层 (`backend/src/interviews/interview.service.ts`)

添加 `candidateEmail` 参数支持：
```typescript
async sendCandidateEmail(
  interviewId: string,
  customSubject?: string,
  customContent?: string,
  sentBy?: string,
  candidateEmail?: string,  // ✅ 新增参数
): Promise<{ message: string }> {
  // ...
  
  // 优先使用传入的 candidateEmail，否则使用候选人记录中的邮箱
  const recipientEmail = candidateEmail || interview.candidate.email;
  
  if (!recipientEmail) {
    throw new Error("候选人没有邮箱，无法发送邮件");
  }
  
  // 使用 recipientEmail 而不是 interview.candidate.email
  await this.emailService.sendCustomEmail({
    to: recipientEmail,  // ✅ 使用可编辑的邮箱
    subject: customSubject || `面试通知 - ${interview.position.title}`,
    content: customContent,
  });
}
```

#### 2. Controller 层 (`backend/src/interviews/interview.controller.ts`)

传递 `candidateEmail` 参数：
```typescript
@Post(":id/send-candidate-email")
async sendCandidateEmail(
  @Param("id") id: string,
  @Body() body: { 
    subject?: string; 
    content?: string; 
    sentBy?: string; 
    candidateEmail?: string;  // ✅ 支持自定义邮箱
  },
): Promise<{ message: string }> {
  return await this.interviewService.sendCandidateEmail(
    id,
    body.subject,
    body.content,
    body.sentBy,
    body.candidateEmail,  // ✅ 传递邮箱参数
  );
}
```

## 修复效果

### 修复前
- ❌ 邮件内容区域为空白 div
- ❌ 无法编辑邮件内容
- ❌ 只能使用候选人记录中的邮箱

### 修复后
- ✅ 显示完整的富文本编辑器（TinyMCE）
- ✅ 支持编辑、格式化邮件内容
- ✅ 支持修改收件人邮箱地址
- ✅ 支持自定义邮件主题和内容

## 测试验证

### 1. 访问面试详情页
```
http://localhost:3000/interviews/{interviewId}
```

### 2. 点击"发送邮件给候选人"
- 应该弹出邮件编辑对话框
- 编辑器应该正常显示并可用
- 邮箱地址应该已预填（可编辑）
- 邮件主题应该已预填（可编辑）
- 邮件内容应该有默认模板（可编辑）

### 3. 编辑并发送邮件
- 可以修改收件人邮箱
- 可以修改邮件主题
- 可以使用富文本编辑器编辑内容
- 点击"发送邮件"后应该成功发送

## 涉及文件

| 文件 | 修改内容 |
|------|---------|
| `frontend/src/app/interviews/[id]/page.tsx` | 添加 TinyMCE 编辑器、引用、内容获取 |
| `backend/src/interviews/interview.service.ts` | 添加 candidateEmail 参数支持 |
| `backend/src/interviews/interview.controller.ts` | 传递 candidateEmail 参数 |

## 编译验证

```bash
# 前端编译
cd /home/malong/projects/Moka_prod/Moka_prod/projects/moka-opencode/frontend
npm run build
# ✅ 编译成功

# 后端编译（如需要）
cd /home/malong/projects/Moka_prod/Moka_prod/projects/moka-opencode/backend
npm run build
```

## 注意事项

1. **TinyMCE 语言** - 已配置为中文 (`language: 'zh_CN'`)
2. **编辑器高度** - 设置为 400px
3. **工具栏配置** - 包含常用格式化工具（加粗、斜体、列表、对齐等）
4. **邮箱验证** - 前端使用 `type="email"` 输入框
5. **频率限制** - 保留了 2 小时内不得重复发送的限制

## 修复时间
2026-04-08 14:17

## 修复人
JARVIS 🦞
