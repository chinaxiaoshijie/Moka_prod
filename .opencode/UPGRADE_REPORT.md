# OpenCode 升级报告

**升级时间**: 2026-02-12 15:40:00
**操作者**: System

---

## ✅ 升级状态

| 组件 | 升级前 | 升级后 | 状态 |
|------|--------|--------|------|
| OpenCode 核心 | v1.1.60 | v1.1.60 | ✓ 已是最新 |
| @opencode-ai/plugin | v1.1.49 | v1.1.60 | ✓ 已更新 |

---

## 📋 升级详情

### OpenCode 核心版本
- **当前版本**: v1.1.60
- **发布日期**: 2026-02-12 05:58:37Z
- **状态**: 已经是最新版本，无需升级

### 插件版本更新
**问题**: 插件版本 (1.1.49) 与核心版本 (1.1.60) 不匹配

**解决步骤**:
1. 修改 `~/.config/opencode/package.json`，将插件版本从 `1.1.49` 更新为 `1.1.60`
2. 运行 `bun install` 安装更新后的插件
3. 验证插件版本已更新到 v1.1.60

---

## 🔄 执行的命令

```bash
# 1. 检查当前版本
opencode --version
# 输出: 1.1.60

# 2. 检查插件版本
cat ~/.config/opencode/package.json
# 显示: "@opencode-ai/plugin": "1.1.49"

# 3. 更新 package.json 中的插件版本
cd ~/.config/opencode
sed -i 's/"@opencode-ai\/plugin": "1.1.49"/"@opencode-ai\/plugin": "1.1.60"/g' package.json

# 4. 安装更新后的插件
bun install
# 输出: + @opencode-ai/plugin@1.1.60

# 5. 验证更新结果
cat ~/.config/opencode/node_modules/@opencode-ai/plugin/package.json | grep '"version"'
# 输出: "version": "1.1.60"
```

---

## 📦 当前安装状态

### 核心
- **版本**: v1.1.60
- **二进制位置**: `/home/malong/.opencode/bin/opencode`
- **类型**: ELF 64-bit LSB executable, x86-64

### 插件
- **版本**: v1.1.60
- **位置**: `~/.config/opencode/node_modules/@opencode-ai/plugin/`
- **安装方式**: bun

### 配置文件
- **package.json**: `~/.config/opencode/package.json`
- **配置目录**: `~/.config/opencode/`

---

## 🎯 v1.1.60 版本亮点

### Core
- 支持 Claude agent SDK 风格的结构化输出
- 支持每个模型的自定义 API URL
- 为 Venice 模型添加自动变体生成
- 使用 Promise.all 优化 MCP listTools 调用性能
- 升级 OpenTUI 到 v0.1.79
- 改进压缩检查逻辑
- 将 read 工具偏移量设为 1 索引以匹配行号
- 添加目录读取功能到 read 工具

### TUI
- 使用 FFI 解决 Windows 原始输入和 Ctrl+C 处理问题
- 添加切换隐藏 TUI 会话头部

### Desktop
- 在不安全的浏览器上下文中保护 randomUUID
- 修复工作区重置功能

---

## 🚀 未来更新

### 如何升级 OpenCode

```bash
# 升级到最新版本
opencode upgrade

# 升级到特定版本
opencode upgrade v1.1.60
```

### 手动更新插件

如果 `opencode upgrade` 后插件版本未更新：

```bash
cd ~/.config/opencode

# 使用包管理器更新（根据你的安装方式选择）
bun install          # 如果使用 bun
npm install          # 如果使用 npm
pnpm install         # 如果使用 pnpm
yarn install         # 如果使用 yarn
```

---

## ✅ 验证清单

- [x] OpenCode 核心版本检查
- [x] 插件版本检查
- [x] 插件版本更新
- [x] 插件安装
- [x] 版本验证

---

## 📝 备注

- OpenCode 和插件现在都是 v1.1.60，版本匹配
- 所有更新都已完成，系统处于最新状态
- 下次升级可以直接使用 `opencode upgrade` 命令
