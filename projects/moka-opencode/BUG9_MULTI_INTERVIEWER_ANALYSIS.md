# Bug 9: 支持多位面试官 - 技术方案分析

## 📋 需求
每轮面试可添加多位面试官（当前只支持单一面试官）

## 🔍 当前架构限制

### 数据库 Schema
```prisma
model InterviewRound {
  interviewerId   String   // 单一面试官
  interviewer     User @relation(fields: [interviewerId], references: [id])
}

model Interview {
  interviewerId String  // 单一面试官
}

model InterviewFeedback {
  interviewerId String  // 单一面试官
}
```

## 🛠️ 修改范围

### 1. 数据库 Schema（破坏性变更）

**方案 A: 多对多关系（推荐）**
```prisma
model InterviewRound {
  // 移除 interviewerId
  interviewers InterviewRoundInterviewer[]
}

model InterviewRoundInterviewer {
  id            String @id @default(uuid())
  roundId       String
  interviewerId String
  round         InterviewRound @relation(fields: [roundId], references: [id])
  interviewer   User @relation(fields: [interviewerId], references: [id])
  
  @@unique([roundId, interviewerId])
}

model Interview {
  // 移除 interviewerId
  interviewers InterviewInterviewer[]
}

model InterviewInterviewer {
  id            String @id @default(uuid())
  interviewId   String
  interviewerId String
  interview     Interview @relation(fields: [interviewId], references: [id])
  interviewer   User @relation(fields: [interviewerId], references: [id])
  
  @@unique([interviewId, interviewerId])
}

model InterviewFeedback {
  // 移除 interviewerId，添加 interviewerIds 或关联表
  interviewers InterviewFeedbackInterviewer[]
}
```

### 2. 后端服务修改

**影响文件**:
- `backend/src/interview-processes/interview-process.service.ts`
- `backend/src/interviews/interview.service.ts`
- `backend/src/feedback/feedback.service.ts`
- 所有相关的 DTO

**修改点**:
- 创建/更新逻辑：支持多个面试官 ID
- 查询逻辑：返回多个面试官信息
- 权限检查：多个面试官的权限验证
- 邮件通知：发送给所有面试官

### 3. 前端 UI 修改

**影响文件**:
- `frontend/src/app/candidates/page.tsx` - 面试流程配置
- `frontend/src/app/interviews/page.tsx` - 面试安排
- `frontend/src/app/interview-processes/[id]/page.tsx` - 流程详情
- `frontend/src/app/my-interviews/page.tsx` - 我的面试

**修改点**:
- 面试官选择器：支持多选
- 列表展示：显示多个面试官
- 权限逻辑：任一面试官都可操作

### 4. 数据迁移

**风险**: 高
- 现有数据需要迁移到新的多对多关系
- 需要回滚方案
- 生产环境停机时间预估：30-60 分钟

## ⏱️ 工作量评估

| 模块 | 工作量 | 风险 |
|------|--------|------|
| 数据库 Schema | 4 小时 | 高 |
| 数据迁移脚本 | 4 小时 | 高 |
| 后端服务 | 8 小时 | 中 |
| 前端 UI | 8 小时 | 中 |
| 测试验证 | 4 小时 | 中 |
| **总计** | **28 小时** | **高** |

## 🚨 风险评估

### 高风险
1. **数据迁移失败** - 可能导致数据丢失
2. **破坏性变更** - 现有 API 不兼容
3. **回归 Bug** - 影响现有功能

### 中风险
1. **前端兼容性** - 旧浏览器可能不支持多选 UI
2. **性能影响** - 多对多查询可能变慢

## 💡 建议

### 方案 1: 延后处理（推荐）
- **理由**: 当前单面试官满足基本需求
- **时间**: 放入下一版本迭代
- **优势**: 降低当前版本风险

### 方案 2: 渐进式迁移
- **阶段 1**: 添加新表，保持旧字段（双写）
- **阶段 2**: 数据迁移
- **阶段 3**: 移除旧字段
- **优势**: 降低风险，可回滚
- **时间**: 2-3 周

### 方案 3: 快速修复
- 仅修改前端支持多选 UI
- 后端保持单面试官
- **风险**: 数据不一致

## ✅ 结论

**建议**: 延后到下一版本处理

**理由**:
1. 当前版本已有 6/11 Bug 修复完成
2. Bug 9 是低优先级需求
3. 工作量巨大（28 小时）
4. 高风险（数据库破坏性变更）

**替代方案**:
- 如果确实需要多面试官，可以为每轮面试创建多个面试记录
- 每个面试记录对应一个面试官
- 无需修改 Schema，风险低

---

**决策人**: _______  
**决策日期**: _______  
**决策**: □ 立即修复 □ 延后处理 □ 采用替代方案
