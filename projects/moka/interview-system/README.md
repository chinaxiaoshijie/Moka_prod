# 面试管理系统 (Interview Management System)

基于需求分析开发的企业级面试招聘管理系统，支持候选人管理、面试调度、反馈收集等核心功能。

## 🚀 项目概览

### 核心功能
- 👤 **用户管理**：多角色权限控制（管理员、HR、面试官）
- 📋 **候选人管理**：简历上传、信息管理、查重功能
- 📅 **面试调度**：面试安排、日历同步、通知发送
- 📊 **反馈系统**：结构化面试反馈、评价统计
- 🔗 **第三方集成**：飞书日历、邮件通知、腾讯会议

### 技术栈
- **后端**: Node.js + Express.js + MySQL
- **前端**: React + TypeScript + Ant Design
- **数据库**: MySQL 8.0
- **部署**: Docker + Docker Compose
- **开发工具**: AI Native开发（Claude、GPT-4、GitHub Copilot）

## 📁 项目结构

```
interview-system/
├── backend/                 # 后端 Node.js 应用
│   ├── src/                # 源代码
│   ├── tests/              # 单元测试
│   ├── package.json        # 依赖管理
│   └── Dockerfile          # Docker 配置
├── frontend/               # 前端 React 应用
│   ├── src/                # 源代码
│   ├── public/             # 静态资源
│   ├── package.json        # 依赖管理
│   └── Dockerfile          # Docker 配置
├── database/               # 数据库相关
│   ├── migrations/         # 数据迁移脚本
│   ├── seeds/              # 初始数据
│   └── schema.sql          # 数据库结构
├── docs/                   # 项目文档
│   ├── api/                # API 文档
│   ├── deployment/         # 部署文档
│   └── user-guide/         # 用户指南
└── deployment/             # 部署配置
    ├── docker-compose.yml  # Docker Compose 配置
    ├── nginx.conf          # Nginx 配置
    └── .env.example        # 环境变量模板
```

## 🛠️ 开发进度

### Phase 1: 项目初始化 ✅
- [x] 项目结构创建
- [x] 技术选型确认
- [x] 开发环境准备

### Phase 2: 基础架构 🔄
- [ ] 后端基础框架搭建
- [ ] 前端项目初始化
- [ ] 数据库设计实现
- [ ] 用户认证系统

### Phase 3: 核心功能 📋
- [ ] 候选人管理模块
- [ ] 面试调度模块
- [ ] 反馈系统模块

### Phase 4: 集成与优化 🚀
- [ ] 第三方服务集成
- [ ] 性能优化
- [ ] 部署上线

## 🏃‍♂️ 快速开始

### 环境要求
- Node.js >= 16.0
- MySQL >= 8.0
- Docker (可选)

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd interview-system
```

2. **后端服务**
```bash
cd backend
npm install
npm run dev
```

3. **前端服务**
```bash
cd frontend
npm install
npm start
```

4. **数据库设置**
```bash
cd database
mysql -u root -p < schema.sql
```

### Docker 开发
```bash
docker-compose up -d
```

## 📚 文档

- [需求分析文档](../Moka系统分析报告.md)
- [技术详细设计](../详细技术需求分析.md)
- [项目实施计划](../项目实施计划.md)
- [API 接口文档](docs/api/README.md)
- [用户操作指南](docs/user-guide/README.md)

## 🤝 贡献

本项目采用 AI Native 开发方式，大量使用 AI 工具辅助开发：
- 代码生成：Claude、GPT-4
- 代码补全：GitHub Copilot
- 代码审查：AI 代码分析工具

## 📄 许可证

MIT License

---

**开发时间**: 2026-02-12 ~ 2026-03-20
**项目状态**: 🔄 开发中
**完成进度**: 5%