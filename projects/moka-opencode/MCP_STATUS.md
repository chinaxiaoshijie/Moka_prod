# MCP 安装状态和 Moka 登录方案

**日期**: 2026-02-12
**状态**: 需要用户决策

---

## 📊 当前状况

### 已尝试的方法

| 方法 | 状态 | 结果 |
|------|--------|------|
| Playwright MCP | ❌ 失败 | npx 不可用，无法连接 MCP 服务器 |
| dev-browser skill | ⚠️ 限制 | 需要 Node.js，当前环境无 npm |
| dev-browser 仓库克隆 | ❌ 不完整 | 克隆的仓库似乎不包含完整的服务器代码 |

### 环境检查

```
✓ Bun: 1.3.5 可用
✓ curl/wget: 可用
✓ git: 可用
✓ bash: 可用
✗ Node.js/npm: 未安装
✗ npx: 不可用
```

---

## 🎯 问题分析

### 为什么需要浏览器自动化？

登录 Moka 需要：
1. **动态页面交互** - 填写表单、点击按钮
2. **会话管理** - 登录后保持 cookies 和状态
3. **截图功能** - 记录实际界面用于参考

### 为什么当前方法失败？

1. **Playwright MCP 需要 npx**
   - MCP 配置中指定了 `npx @playwright/mcp@latest`
   - 系统 `npx` 不可用（需要安装 Node.js）

2. **dev-browser 需要 npm**
   - dev-browser 使用 npm 进行依赖管理
   - 需要 Node.js v18+ 环境

---

## 💡 解决方案

### 方案 A：用户手动登录（推荐）

这是最快、最可靠的方法：

**操作步骤**:
1. 打开浏览器访问：https://app.mokahr.com/login
2. 使用以下凭据登录：
   - 用户名：`shaxiao@malong.com`
   - 密码：`KUQWaqOi`
3. 截取以下关键界面的截图：
   - 工作台/Dashboard 首页
   - 候选人列表页
   - 职位列表页
   - 面试安排表单
   - 面试反馈表单
4. 将截图发给我

**优点**:
- ✅ 立即可用
- ✅ 无需安装任何工具
- ✅ 可以看到实际的业务逻辑

**缺点**:
- ❌ 需要人工操作

---

### 方案 B：安装 Node.js + Playwright MCP

如果必须自动化登录，可以安装所需工具：

**操作步骤**:

1. **安装 Node.js**
```bash
# 使用 NodeSource (推荐)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 或使用 nvm (如果已安装)
nvm install --lts
nvm use --lts
```

2. **验证安装**
```bash
node --version  # 应该是 v18 或更高
npm --version
npx --version
```

3. **重启 OpenCode**
   - MCP 会在重启后加载

4. **重新尝试 Playwright MCP**
   - Playwright MCP 将自动可用

**优点**:
- ✅ 全自动化
- ✅ 可重复操作
- ✅ 可以录制完整流程

**缺点**:
- ❌ 需要安装 Node.js
- ❌ 需要重启系统

---

### 方案 C：使用扩展模式（如果用户有 Chrome）

如果用户正在使用 Chrome 浏览器：

**操作步骤**:

1. 下载 Chrome 扩展
   - 访问：https://github.com/SawyerHood/dev-browser/releases/latest
   - 下载 `dev-browser-extension-*.zip`

2. 安装扩展
   - 打开 Chrome
   - 访问 `chrome://extensions`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择解压后的文件夹

3. 激活扩展
   - 点击 Dev Browser 图标
   - 切换到"激活"

4. 告诉我已准备好
   - 我可以连接到您的浏览器

**优点**:
- ✅ 无需安装 Node.js
- ✅ 使用现有 cookies/登录状态
- ✅ 快速

**缺点**:
- ❌ 需要手动安装扩展
- ❌ 依赖 Chrome

---

### 方案 D：基于现有文档继续

如果 Moka 界面确认不是关键优先级：

**操作**:
- 基于已创建的 `REQUIREMENTS.md` 和 `MOKA_UI_DESIGN.md`
- 开始技术选型和项目初始化
- 后续根据需要调整设计

**优点**:
- ✅ 立即可开始
- ✅ 无额外工作

**缺点**:
- ❌ 未经验证实际 Moka 界面
- ❌ 可能有设计偏差

---

## 🤔 我的推荐

### 推荐顺序：

1. **首选：方案 A（手动登录）**
   - 快速获取实际界面截图
   - 我可以根据截图调整设计
   - 确保 UI/UX 准确性

2. **备选：方案 D（继续开发）**
   - 如果界面确认不是关键
   - 已有 Moka 官网和功能文档
   - 设计基于最佳实践

3. **自动化方案**（如果需要）
   - 方案 B（安装 Node.js）
   - 方案 C（Chrome 扩展）

---

## 📋 用户选择

请告诉我您希望采用哪个方案：

**A. 我会手动登录 Moka 并提供截图**
   - 我现在就去登录
   - [预计 5-10 分钟完成]

**B. 安装 Node.js 然后 MCP 自动化登录**
   - 请执行安装步骤
   - 然后我重新尝试

**C. 使用 Chrome 扩展连接我的浏览器**
   - 我会安装扩展并激活
   - 然后连接到你

**D. 跳过 Moka 登录，直接基于现有设计开始开发**
   - 当前的设计已经足够详细
   - 开始技术选型和项目初始化

**E. 其他建议或问题**
   - [请说明]

---

**状态**: 等待用户决策
**下一步**: 根据用户选择执行相应方案
