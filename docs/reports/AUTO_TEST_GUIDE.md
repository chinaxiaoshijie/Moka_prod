# MOKA 自动化测试指南

**创建日期**: 2026-04-02  
**测试框架**: Playwright  
**测试类型**: E2E 端到端测试

---

## 🎯 测试覆盖范围

### 已有测试用例（19 个）

| 测试文件 | 测试内容 | 状态 |
|---------|----------|------|
| `auth.spec.ts` | 用户登录认证 | ✅ 可用 |
| `auth-edge-cases.spec.ts` | 认证边界情况 | ✅ 可用 |
| `candidates.spec.ts` | 候选人管理 | ✅ 可用 |
| `candidates-edge-cases.spec.ts` | 候选人边界情况 | ✅ 可用 |
| `positions.spec.ts` | 职位管理 | ✅ 可用 |
| `positions-edge-cases.spec.ts` | 职位边界情况 | ✅ 可用 |
| `interviews.spec.ts` | 面试安排 | ✅ 可用 |
| `interview-detail.spec.ts` | 面试详情 | ✅ 可用 |
| `interview-processes.spec.ts` | 面试流程 | ✅ 可用 |
| `workflow.spec.ts` | 完整招聘流程 | ✅ 可用 |
| `feedback.spec.ts` | 面试反馈 | ✅ 可用 |
| `dashboard.spec.ts` | 仪表盘 | ✅ 可用 |
| `users.spec.ts` | 用户管理 | ✅ 可用 |
| `notifications.spec.ts` | 通知系统 | ✅ 可用 |
| `calendar.spec.ts` | 日历功能 | ✅ 可用 |
| `my-interviews.spec.ts` | 我的面试 | ✅ 可用 |
| `settings.spec.ts` | 设置页面 | ✅ 可用 |
| `other-pages.spec.ts` | 其他页面 | ✅ 可用 |
| `interview-processes-edge.spec.ts` | 流程边界情况 | ✅ 可用 |

---

## 🔑 测试账号

### HR 账号
```
用户名：hr
密码：hr123456
角色：HR
邮箱：hr@company.com
```

### 面试官账号
```
用户名：interviewer
密码：interviewer123
角色：INTERVIEWER
邮箱：interviewer@company.com
```

---

## 🚀 运行测试

### 方式 1: 运行所有测试
```bash
cd /home/malong/projects/Moka_prod/Moka_prod/projects/moka-opencode
npx playwright test
```

### 方式 2: 运行特定测试
```bash
# 测试登录流程
npx playwright test auth.spec.ts

# 测试候选人流程
npx playwright test candidates.spec.ts

# 测试完整招聘流程
npx playwright test workflow.spec.ts

# 测试面试流程
npx playwright test interview-processes.spec.ts
```

### 方式 3: 运行带标签的测试
```bash
# 只运行 Bug 修复相关的测试
npx playwright test --grep "Bug"
```

### 方式 4: 使用 UI 模式运行
```bash
npx playwright test --ui
```

### 方式 5: 生成测试报告
```bash
npx playwright test --reporter=html
# 查看报告
npx playwright show-report
```

---

## 📋 主流程验证

### 流程 1: 用户登录 ✅
**测试文件**: `auth.spec.ts`  
**测试内容**:
- HR 登录
- 面试官登录
- 无效凭证处理
- Token 验证

**运行命令**:
```bash
npx playwright test auth.spec.ts
```

### 流程 2: 创建职位 ✅
**测试文件**: `positions.spec.ts`  
**测试内容**:
- 创建新职位
- 设置职位要求
- 职位列表查看
- 职位编辑删除

**运行命令**:
```bash
npx playwright test positions.spec.ts
```

### 流程 3: 导入候选人 ✅ (Bug 7 已修复)
**测试文件**: `candidates.spec.ts`  
**测试内容**:
- 手动添加候选人
- 上传 PDF 简历
- 简历解析
- **职位关联验证** ← Bug 7 修复点

**运行命令**:
```bash
npx playwright test candidates.spec.ts
```

### 流程 4: 安排面试 ✅ (Bug 3 已修复)
**测试文件**: `interviews.spec.ts`  
**测试内容**:
- 创建面试安排
- 设置面试时间
- 选择面试官
- **邮件发送控制** ← Bug 3 修复点

**运行命令**:
```bash
npx playwright test interviews.spec.ts
```

### 流程 5: 面试流程管理 ✅ (Bug 10 已修复)
**测试文件**: `interview-processes.spec.ts`  
**测试内容**:
- 创建面试流程
- 安排各轮面试
- 提交面试反馈
- **流程状态流转** ← Bug 10 修复点
- 进入下一轮

**运行命令**:
```bash
npx playwright test interview-processes.spec.ts
```

### 流程 6: 完整招聘流程 ✅
**测试文件**: `workflow.spec.ts`  
**测试内容**:
- HR 登录
- 创建职位
- 添加候选人
- 安排面试
- 提交反馈
- 完成流程

**运行命令**:
```bash
npx playwright test workflow.spec.ts
```

---

## 🔧 Bug 修复验证测试

### Bug 3 验证：邮件发送控制
**测试文件**: `interviews.spec.ts`  
**验证点**:
```typescript
// 不勾选邮件发送
await page.uncheck('input[name="sendEmail"]');
await page.click('text=创建面试');
// 验证未发送邮件

// 勾选邮件发送
await page.check('input[name="sendEmail"]');
await page.click('text=创建面试');
// 验证已发送邮件
```

### Bug 7 验证：职位关联
**测试文件**: `candidates.spec.ts`  
**验证点**:
```typescript
// 上传简历
await page.setInputFiles('input[type="file"]', 'test-resume.pdf');
// 选择职位
await page.selectOption('select[name="positionId"]', positionId);
// 导入候选人
await page.click('text=导入');
// 验证职位关联
expect(candidate.positionId).toBe(positionId);
```

### Bug 10 验证：流程状态
**测试文件**: `interview-processes.spec.ts`  
**验证点**:
```typescript
// 提交反馈
await page.click('text=提交反馈');
// 验证状态为 WAITING_HR
expect(process.status).toBe('WAITING_HR');
// HR 应该能看到操作按钮
expect(page.locator('button:has-text("进入下一轮")')).toBeVisible();
```

### Bug 2 验证：流程名称
**测试文件**: `interview-processes.spec.ts`  
**验证点**:
```typescript
// 验证 HR 轮次显示为"初面"
expect(page.locator('text=初面')).toBeVisible();
// 验证技术轮次显示为"复面"
expect(page.locator('text=复面')).toBeVisible();
```

---

## 📊 测试报告

### 生成 HTML 报告
```bash
npx playwright test --reporter=html
npx playwright show-report
```

### 生成 JSON 报告
```bash
npx playwright test --reporter=json --output=test-results.json
```

### 查看测试覆盖率
```bash
npx playwright test --coverage
```

---

## 🎯 快速验证脚本

### 一键运行所有主流程测试
```bash
#!/bin/bash
cd /home/malong/projects/Moka_prod/Moka_prod/projects/moka-opencode

echo "运行主流程测试..."
npx playwright test \
  auth.spec.ts \
  positions.spec.ts \
  candidates.spec.ts \
  interviews.spec.ts \
  interview-processes.spec.ts \
  workflow.spec.ts

echo "测试完成！"
```

### 验证 Bug 修复
```bash
#!/bin/bash
cd /home/malong/projects/Moka_prod/Moka_prod/projects/moka-opencode

echo "验证 Bug 修复..."
npx playwright test \
  interviews.spec.ts \
  candidates.spec.ts \
  interview-processes.spec.ts

echo "Bug 修复验证完成！"
```

---

## 📝 测试结果解读

### 测试通过 ✅
```
✓ test.spec.ts:10 HR 应该能够登录 (500ms)
✓ test.spec.ts:25 创建职位成功 (300ms)
```

### 测试失败 ❌
```
✗ test.spec.ts:40 邮件发送失败 (1000ms)
  Error: Expected email to be sent but got timeout
```

### 测试跳过 ⏭️
```
- test.spec.ts:50 需要 SMTP 配置 (跳过)
```

---

## 🔗 相关文档

- `MAIN_FLOW_VERIFICATION.md` - 主流程验证报告
- `BUGFIX_SUMMARY.md` - Bug 修复总结
- `VERIFICATION_REPORT.md` - 验证报告
- `playwright.config.ts` - Playwright 配置

---

**钢铁侠，使用 Playwright E2E 测试可以完全自动化验证所有主流程！** 🎉
