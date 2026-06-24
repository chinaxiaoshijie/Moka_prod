# Bug 10 修复：面试流程卡住

## 问题描述
已安排面试官但"我的面试"显示待安排，无法进入下一轮。

## 根因分析

### 代码流程
1. 面试官提交反馈 → `feedback.service.ts` 的 `create()` 方法
2. 更新面试状态为 `COMPLETED`（第 104-107 行）
3. 调用 `processService.onInterviewCompleted()`（第 113-120 行）
4. `onInterviewCompleted()` 将流程状态更新为 `WAITING_HR`（第 568 行）

### 问题点
- `onInterviewCompleted()` 方法将流程状态设置为 `WAITING_HR`
- 但前端检查逻辑可能只认 `IN_PROGRESS` 状态
- 导致 HR 看不到"进入下一轮"的操作按钮

## 修复方案

### 方案 1：修改 `onInterviewCompleted()` 逻辑
保持流程状态为 `IN_PROGRESS`，而不是 `WAITING_HR`

```typescript
// backend/src/interview-processes/interview-process.service.ts
// 第 568 行

// 修改前
await this.prisma.interviewProcess.update({
  where: { id: processId },
  data: { status: "WAITING_HR" },
});

// 修改后 - 保持 IN_PROGRESS 状态
await this.prisma.interviewProcess.update({
  where: { id: processId },
  data: { 
    status: "IN_PROGRESS",
    // 可以添加一个字段标记需要 HR 确认
    // 或者通过其他方式通知 HR
  },
});
```

### 方案 2：前端适配 `WAITING_HR` 状态
前端在 `WAITING_HR` 状态下也显示操作按钮

```typescript
// frontend/src/app/interview-processes/[id]/page.tsx
// 检查状态判断逻辑

// 修改前
const isWaitingHR = process.status === "WAITING_HR";

// 修改后 - WAITING_HR 状态也允许操作
const canProceed = process.status === "IN_PROGRESS" || process.status === "WAITING_HR";
```

## 推荐修复
采用**方案 2**（前端适配），因为：
1. `WAITING_HR` 状态设计是合理的，明确表示需要 HR 确认
2. 前端应该适配这个状态，显示操作按钮
3. 不改变后端逻辑，降低风险

## 待修复文件
- `frontend/src/app/interview-processes/[id]/page.tsx`
- 检查所有状态判断逻辑，确保 `WAITING_HR` 状态也能正常操作

## 验证步骤
1. 面试官提交反馈
2. HR 查看流程详情，应该能看到"进入下一轮"按钮
3. 点击按钮，流程正常进入下一轮
