# Moka 面试系统测试套件

基于 [javascript-testing-best-practices](https://github.com/goldbergyoni/javascript-testing-best-practices) ⭐ 24.6k stars

## 测试架构

```
test/
├── setup.ts                    # 测试环境配置和数据库设置
├── jest.config.js              # Jest 配置文件
├── unit/                       # 单元测试（待添加）
├── integration/                # 集成测试
│   ├── auth.api.test.ts        # 认证 API 测试
│   ├── candidates.api.test.ts  # 候选人 API 测试
│   └── interview-process.api.test.ts  # 面试流程 API 测试
├── e2e/                        # 端到端测试
│   └── complete-workflow.e2e.test.ts  # 完整工作流程测试
└── fixtures/                   # 测试数据
```

## 应用的最佳实践

来自 [javascript-testing-best-practices](https://github.com/goldbergyoni/javascript-testing-best-practices)：

### ✅ AAA 模式（Arrange, Act, Assert）

每个测试都有清晰的三个阶段：

- **Arrange**: 准备测试数据和环境
- **Act**: 执行被测操作
- **Assert**: 验证结果

### ✅ 测试命名规范：What-When-Expect

例如：`When valid HR credentials provided, then should return access token`

### ✅ 黑盒测试

只测试公共 API 行为，不测试内部实现细节

### ✅ 真实测试数据

使用有意义的测试数据，而非 foo/bar

### ✅ 测试隔离

每个测试前清理数据库，确保测试之间相互独立

## 运行测试

### 安装依赖

```bash
cd backend
npm install --save-dev jest @nestjs/testing supertest ts-jest
```

### 运行所有测试

```bash
npm test
```

### 运行特定测试文件

```bash
# 只运行认证测试
npm test auth.api.test

# 只运行候选人测试
npm test candidates.api.test

# 只运行 E2E 测试
npm test e2e
```

### 运行带覆盖率报告的测试

```bash
npm test -- --coverage
```

### 监视模式（开发时使用）

```bash
npm test -- --watch
```

## 测试覆盖的功能

### 认证 API (auth.api.test.ts)

- ✅ HR 登录成功返回 token
- ✅ 面试官登录成功返回 token
- ✅ 无效密码返回 401
- ✅ 不存在的用户返回 401
- ✅ 空凭据返回 400
- ✅ 使用有效 token 获取用户资料
- ✅ 无 token 访问受保护路由返回 401
- ✅ 获取用户列表

### 候选人 API (candidates.api.test.ts)

- ✅ HR 创建候选人成功
- ✅ 缺少必填字段返回 400
- ✅ 面试官无法创建候选人（403）
- ✅ 获取候选人列表
- ✅ 按名称搜索候选人
- ✅ 按状态筛选候选人
- ✅ 获取单个候选人详情
- ✅ 更新候选人信息
- ✅ 删除候选人

### 面试流程 API (interview-process.api.test.ts)

- ✅ HR 创建面试流程（多轮）
- ✅ 面试官无法创建流程（403）
- ✅ 获取流程列表
- ✅ 获取流程详情（包含轮次）
- ✅ 为轮次安排面试
- ✅ 完成轮次进入下一轮

### E2E 完整工作流 (complete-workflow.e2e.test.ts)

- ✅ 创建候选人
- ✅ 创建 3 轮面试流程
- ✅ 安排第一轮面试
- ✅ 提交第一轮反馈
- ✅ 进入第二轮
- ✅ 安排第二轮面试
- ✅ 提交第二轮反馈
- ✅ 进入第三轮
- ✅ 安排并完成第三轮
- ✅ 提交最终反馈
- ✅ 完成流程并录用候选人

## 添加新测试

参考现有测试文件的结构：

```typescript
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { testDB } from "../setup";

describe("Feature API", () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await testDB.seedTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /endpoint", () => {
    it("When valid data provided, then should create successfully", async () => {
      // Arrange
      const data = { name: "Test" };

      // Act
      const response = await request(server).post("/endpoint").send(data);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
    });
  });
});
```

## 持续集成

在 CI/CD 管道中运行测试：

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: moka_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Run tests
        run: cd backend && npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/moka_test
```

## 参考资源

- [javascript-testing-best-practices](https://github.com/goldbergyoni/javascript-testing-best-practices) - 24.6k ⭐
- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [SuperTest](https://github.com/visionmedia/supertest)
