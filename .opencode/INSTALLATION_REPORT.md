# OpenCode Superpowers 安装验证报告

**生成时间**: 2026-02-12 15:40:00
**Superpowers 版本**: v4.2.0
**OpenCode 版本**: v1.1.60
**OpenCode 插件版本**: v1.1.60

## ✅ 安装状态

### 核心组件

| 组件 | 状态 | 路径 |
|------|------|------|
| Superpowers 仓库 | ✓ 正常 | `~/.config/opencode/superpowers` |
| 插件符号链接 | ✓ 正常 | `~/.config/opencode/plugins/superpowers.js` |
| Skills 符号链接 | ✓ 正常 | `~/.config/opencode/skills/superpowers` |
| Git 仓库 | ✓ 正常 | `~/.config/opencode/superpowers/.git` |

### 插件详情

- **插件文件**: `~/.config/opencode/superpowers/.opencode/plugins/superpowers.js`
- **链接指向**: `/home/malong/.config/opencode/superpowers/.opencode/plugins/superpowers.js`

### Skills 统计

- **总计 Skills**: 14 个
- **分类**:
  - 核心流程: 5 个
  - 开发实践: 3 个
  - 协作: 4 个
  - Meta: 2 个

### 已安装的 Skills

1. brainstorming - 创造性工作前的设计探索
2. writing-plans - 创建实现计划
3. using-git-worktrees - 创建隔离工作空间
4. subagent-driven-development - 子代理驱动开发
5. executing-plans - 执行实现计划
6. finishing-a-development-branch - 完成开发分支
7. test-driven-development - TDD 测试驱动开发
8. systematic-debugging - 系统化调试
9. verification-before-completion - 完成前验证
10. requesting-code-review - 请求代码审查
11. receiving-code-review - 接收代码审查
12. dispatching-parallel-agents - 并行代理调度
13. writing-skills - 编写新 skills
14. using-superpowers - Superpowers 使用指南

## 📁 项目文件结构

```
/home/malong/projects/moka-opencode/.opencode/
├── skills/                    # 项目特定 skills 目录（空，供将来使用）
└── README.md                  # Superpowers 项目说明

~/.config/opencode/
├── plugins/
│   └── superpowers.js  -> superpowers/.opencode/plugins/superpowers.js
└── skills/
    └── superpowers -> superpowers/skills/
        ├── brainstorming/
        ├── dispatching-parallel-agents/
        ├── executing-plans/
        ├── finishing-a-development-branch/
        ├── receiving-code-review/
        ├── requesting-code-review/
        ├── subagent-driven-development/
        ├── systematic-debugging/
        ├── test-driven-development/
        ├── using-git-worktrees/
        ├── using-superpowers/
        ├── verification-before-completion/
        ├── writing-plans/
        └── writing-skills/
```

## 🔄 更新检查

- **当前版本**: v4.2.0 (commit: a98c5df)
- **远程仓库**: https://github.com/obra/superpowers.git
- **状态**: ✅ 已是最新版本

## 🚀 如何使用

### 查看 Skills

OpenCode 会自动检测并加载 superpowers skills。你可以：

1. **被动使用**: 当你的请求符合某个 skill 的触发条件时，OpenCode 会自动调用
2. **主动请求**: 明确要求使用某个 skill：
   ```
   Use the brainstorming skill to help me design this feature
   ```

### 更新 Superpowers

```bash
cd ~/.config/opencode/superpowers
git pull
```

### 创建项目特定 Skills

在 `.opencode/skills/` 目录中创建新的 skill，优先级高于 superpowers skills：

```bash
mkdir -p .opencode/skills/my-skill
cat > .opencode/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: Use when [condition]
---

# My Skill

[Your content here]
EOF
```

## 📚 参考文档

- **快速参考**: `.opencode/SKILLS_QUICK_REFERENCE.md`
- **详细说明**: `.opencode/README.md`
- **Superpowers 官方文档**: https://github.com/obra/superpowers

## ⚙️ 技术细节

- **插件类型**: OpenCode native plugin
- **Skills 发现**: OpenCode native skill tool
- **配置方式**: 符号链接（symbolic links）
- **版本控制**: Git tracked (main branch)
- **最后更新**: 2026-02-12 15:35:00

---

**安装验证**: ✓ 全部通过
**可立即使用**: 是
