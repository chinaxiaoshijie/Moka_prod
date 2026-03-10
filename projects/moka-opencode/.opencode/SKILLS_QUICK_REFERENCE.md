# Superpowers Skills 快速参考

## 🎯 何时使用 Skills

**基本原则：如果有 1% 的可能性某个技能适用，你必须调用它。**

## 📋 Skills 一览表

| Skill | 使用时机 | 用途 |
|-------|----------|------|
| **brainstorming** | 开始任何创造性工作之前 | 理解需求、探索设计选项、验证方案 |
| **writing-plans** | 有需求/规范但还未写代码 | 创建详细的实现计划（2-5分钟任务） |
| **using-git-worktrees** | 开始新功能开发前 | 创建隔离的 git worktree 工作空间 |
| **subagent-driven-development** | 执行实现计划 | 分派子代理执行任务，两阶段审查 |
| **executing-plans** | 有书面计划需执行 | 分批执行，人工检查点 |
| **finishing-a-development-branch** | 实现完成，测试通过 | 决定如何集成（合并/PR/清理） |
| **test-driven-development** | 编写任何功能代码前 | TDD: 测试先行，RED-GREEN-REFACTOR |
| **systematic-debugging** | 遇到 bug/测试失败 | 系统化的根因分析，4阶段调试 |
| **verification-before-completion** | 声称完成前 | 运行验证命令，确认输出 |
| **requesting-code-review** | 完成任务/主要功能后 | 验证工作是否符合要求 |
| **receiving-code-review** | 收到代码审查反馈 | 理性分析，不盲目实施 |
| **dispatching-parallel-agents** | 面对多个独立任务 | 并行分发工作 |
| **writing-skills** | 创建/编辑新 skills | 遵循最佳实践 |
| **using-superpowers** | 开始任何对话 | 确立如何查找和使用 skills |

## 🔄 典型工作流程

### 开发新功能
```
brainstorming → using-git-worktrees → writing-plans
→ subagent-driven-development → verification-before-completion
→ finishing-a-development-branch
```

### 调试问题
```
systematic-debugging → test-driven-development
→ verification-before-completion
```

### 简单修改
```
test-driven-development → verification-before-completion
```

## 🚫 常见误区

| 误区 | 真相 |
|------|------|
| "这只是个简单问题" | 问题也是任务，先检查 skills |
| "我需要更多上下文" | skill 检查在获取上下文之前 |
| "让我先探索代码库" | skills 会告诉你如何探索 |
| "我可以快速看看 git/文件" | 文件缺乏对话上下文 |
| "这不需要正式 skill" | 如果存在 skill，就用它 |
| "我记得这个 skill" | skills 会演进，读取当前版本 |

## 📚 资源

- 完整文档：`~/.config/opencode/superpowers/docs/`
- 项目 README：`.opencode/README.md`
- 更新命令：`cd ~/.config/opencode/superpowers && git pull`
