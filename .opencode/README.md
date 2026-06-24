# Moka OpenCode 项目 - Superpowers 已安装

## 安装信息

- **Superpowers 版本**: v4.2.0
- **安装日期**: 2026-02-12
- **安装位置**: `~/.config/opencode/superpowers`
- **Skills 位置**: `~/.config/opencode/skills/superpowers`

## 可用的 Superpowers Skills

### 核心流程 Skills

1. **brainstorming** - 在任何创造性工作之前使用（创建功能、构建组件、添加功能或修改行为）
   - 探索用户意图、需求和设计
   - 提出 2-3 种不同的方法和权衡
   - 分小部分展示设计，逐步验证

2. **writing-plans** - 当你有规范或需求时，在编写代码之前使用
   - 将工作分解为小任务（每个 2-5 分钟）
   - 每个任务都有确切的文件路径、完整代码、验证步骤

3. **subagent-driven-development** - 当执行包含独立任务的实现计划时使用
   - 每个任务分派新的子代理
   - 两阶段审查（规范符合性，然后代码质量）

4. **using-git-worktrees** - 当开始需要在当前工作空间中隔离的功能工作时使用
   - 创建隔离的 git worktrees
   - 智能目录选择和安全验证

5. **finishing-a-development-branch** - 当实现完成，所有测试通过，需要决定如何集成工作时使用
   - 呈现结构化选项：合并、PR 或清理

### 开发 Skills

6. **test-driven-development** - 实现任何功能或错误修复之前使用
   - 强制 RED-GREEN-REFACTOR 循环
   - 先写失败的测试，观察失败，写最小代码，观察通过，提交

7. **systematic-debugging** - 遇到任何 bug、测试失败或意外行为时使用
   - 4 阶段根因过程
   - 在提出修复之前使用

8. **verification-before-completion** - 在声明工作完成、修复或通过之前，在提交或创建 PR 之前使用
   - 运行验证命令
   - 在做出任何成功声明之前确认输出

### 协作 Skills

9. **requesting-code-review** - 完成任务、实现主要功能或合并之前使用
   - 验证工作是否符合要求
   - 按严重程度报告问题

10. **receiving-code-review** - 收到代码审查反馈时使用，在实施建议之前
    - 需要技术严谨性和验证
    - 不是表演性同意或盲目实施

11. **dispatching-parallel-agents** - 面对 2 个以上可以独立处理且没有共享状态或顺序依赖的任务时使用

12. **executing-plans** - 当你有书面实现计划要在有审查检查点的单独会话中执行时使用

### Meta Skills

13. **using-superpowers** - 开始任何对话时使用
    - 建立如何查找和使用 skills
    - 在任何响应之前（包括澄清问题）需要 Skill 工具调用

14. **writing-skills** - 创建新 skills、编辑现有 skills 或在部署之前验证 skills 工作时使用

15. **verification-before-completion** - 在声称完成、修复或通过之前使用

## 使用方法

### 列出所有可用的 Skills

在 OpenCode 中，使用 `skill` 工具查看所有可用的 skills。

### 加载特定的 Skill

当你需要使用某个 skill 时，OpenCode 会自动检测并调用相关的 skill。你也可以明确地请求某个 skill：

```
Use the brainstorming skill to explore feature requirements
```

## 工作流程示例

### 开始新功能

1. **brainstorming** - 理解需求，探索设计选项
2. **using-git-worktrees** - 创建隔离的工作空间
3. **writing-plans** - 创建详细的实现计划
4. **subagent-driven-development** - 执行计划
5. **verification-before-completion** - 验证工作完成
6. **finishing-a-development-branch** - 决定如何集成

### 调试问题

1. **systematic-debugging** - 系统化的调试过程
2. **test-driven-development** - 写测试来重现问题
3. **verification-before-completion** - 确认问题已解决

## 项目特定 Skills

项目特定的 skills 可以在 `.opencode/skills/` 目录中创建。这些 skills 的优先级高于个人和 superpowers skills。

## 更新

要更新 superpowers：

```bash
cd ~/.config/opencode/superpowers
git pull
```

## 参考资源

- [Superpowers GitHub](https://github.com/obra/superpowers)
- [Superpowers 博客](https://blog.fsck.com/2025/10/09/superpowers/)
- [完整文档](https://github.com/obra/superpowers/blob/main/docs/README.opencode.md)
