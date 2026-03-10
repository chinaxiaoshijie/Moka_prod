# 🧪 Moka 面试系统测试套件 - 完整报告

## 参考项目

**[javascript-testing-best-practices](https://github.com/goldbergyoni/javascript-testing-best-practices)**

- ⭐ GitHub Stars: 24.6k
- 📝 作者: Yoni Goldberg
- 🎯 描述: Comprehensive and exhaustive JavaScript & Node.js testing best practices

## 测试套件概览

### 测试统计

| 测试类型          | 文件数 | 测试用例数 | 覆盖功能           |
| ----------------- | ------ | ---------- | ------------------ |
| 认证 API 测试     | 1      | 11         | 登录、Token、权限  |
| 候选人 API 测试   | 1      | 12         | CRUD、搜索、筛选   |
| 面试流程 API 测试 | 1      | 7          | 流程创建、面试安排 |
| E2E 完整工作流    | 1      | 2          | 端到端完整流程     |
| **总计**          | **4**  | **32**     | **全部核心功能**   |

### 文件结构

```
backend/test/
├── README.md                          # 测试文档
├── jest.config.js                     # Jest 配置
├── run-tests.sh                       # 测试运行脚本
├── setup.ts                           # 测试环境设置
├── integration/                       # 集成测试
│   ├── auth.api.test.ts              # 认证 API 测试 (11 tests)
│   ├── candidates.api.test.ts        # 候选人 API 测试 (12 tests)
│   └── interview-process.api.test.ts # 面试流程测试 (7 tests)
└── e2e/                              # 端到端测试
    └── complete-workflow.e2e.test.ts # 完整工作流 (2 tests)
```

## 应用的最佳实践

### ✅ 1. AAA 模式 (Arrange-Act-Assert)

每个测试都遵循三个清晰的阶段：

```typescript
it("When valid HR credentials provided, then should return access token", async () => {
  // Arrange - 准备测试数据
  const loginDto = {
    username: "hr",
    password: "hr123456",
  };

  // Act - 执行被测操作
  const response = await request(server).post("/auth/login").send(loginDto);

  // Assert - 验证结果
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("access_token");
});
```

### ✅ 2. What-When-Expect 命名规范

测试名称清晰描述：

- **What**: 被测对象
- **When**: 测试场景
- **Expect**: 期望结果

示例：

- `When valid HR credentials provided, then should return access token`
- `When HR creates candidate with valid data, then candidate is created successfully`
- `When Interviewer tries to create candidate, then should return 403 Forbidden`

### ✅ 3. 黑盒测试

只测试公共 API 行为，不测试内部实现：

```typescript
// ✅ Good - 测试行为
expect(response.body.status).toBe("PENDING");
expect(response.body).toHaveProperty("id");

// ❌ Bad - 测试内部实现
expect(service.internalMethod).toHaveBeenCalled();
expect(repository.query).toBe("SELECT * FROM...");
```

### ✅ 4. 真实测试数据

使用有意义的测试数据：

```typescript
// ✅ Good
const candidateData = {
  name: "张三",
  phone: "13800138001",
  email: "zhangsan@example.com",
  source: "BOSS",
};

// ❌ Bad
const candidateData = {
  name: "foo",
  phone: "1234567890",
  email: "test@test.com",
};
```

### ✅ 5. 测试隔离

每个测试前清理数据库：

```typescript
beforeEach(async () => {
  await testDB.cleanDatabase();
  await testDB.seedTestData();
});
```

### ✅ 6. 真实集成测试

使用真实的 HTTP 请求和数据库：

```typescript
const response = await request(server).post("/auth/login").send(loginDto);

expect(response.status).toBe(200);
```

## 测试覆盖的功能

### 🔐 认证模块 (11 tests)

- [x] HR 登录成功返回 token
- [x] 面试官登录成功返回 token
- [x] 无效密码返回 401
- [x] 不存在的用户返回 401
- [x] 空凭据返回 400
- [x] 使用有效 token 获取用户资料
- [x] 无 token 访问返回 401
- [x] 无效 token 返回 401
- [x] HR 获取用户列表
- [x] 面试官获取用户列表

### 👥 候选人模块 (12 tests)

- [x] HR 创建候选人成功
- [x] 缺少必填字段返回 400
- [x] 面试官无法创建候选人（403）
- [x] 获取候选人列表
- [x] 按名称搜索候选人
- [x] 按状态筛选候选人
- [x] 获取单个候选人详情
- [x] 获取不存在的候选人返回 404
- [x] HR 更新候选人
- [x] HR 删除候选人

### 🔄 面试流程模块 (7 tests)

- [x] HR 创建面试流程（多轮）
- [x] 面试官无法创建流程（403）
- [x] 获取流程列表
- [x] 获取流程详情（包含轮次）
- [x] 为轮次安排面试
- [x] 完成轮次进入下一轮
- [x] currentRound 正确递增

### 🎯 E2E 完整工作流 (2 tests)

- [x] 完整招聘流程：创建候选人 → 3轮面试 → 录用
- [x] 完整招聘流程：创建候选人 → 2轮面试 → 拒绝

工作流步骤：

1. 创建候选人
2. 创建面试流程（3轮）
3. 安排第一轮面试
4. 提交第一轮反馈
5. 进入第二轮
6. 安排第二轮面试
7. 提交第二轮反馈
8. 进入第三轮
9. 安排并完成第三轮
10. 提交最终反馈
11. 完成流程并录用
12. 验证候选人状态为 HIRED

## 如何运行测试

### 1. 安装依赖

```bash
cd /home/malong/projects/moka-opencode/backend
npm install
```

### 2. 运行所有测试

```bash
npm test
```

### 3. 运行特定测试

```bash
# 只运行集成测试
npm run test:integration

# 只运行 E2E 测试
npm run test:e2e

# 只运行认证测试
npm test auth.api.test
```

### 4. 监视模式（开发时使用）

```bash
npm run test:watch
```

### 5. 生成覆盖率报告

```bash
npm run test:coverage
```

## 扩展测试套件

### 添加新的集成测试

1. 在 `test/integration/` 目录创建新文件
2. 遵循 AAA 模式
3. 使用 What-When-Expect 命名
4. 使用 `testDB.seedTestData()` 准备数据

### 添加新的 E2E 测试

1. 在 `test/e2e/` 目录创建新文件
2. 模拟完整用户工作流
3. 使用清晰的步骤注释（如 STEP 1, STEP 2...）
4. 验证每个步骤的结果

## 测试配置

### Jest 配置 (jest.config.js)

```javascript
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testTimeout: 10000,
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

## 参考资源

- [javascript-testing-best-practices](https://github.com/goldbergyoni/javascript-testing-best-practices) - 24.6k ⭐
- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [SuperTest](https://github.com/visionmedia/supertest)
- [Testing Patterns](https://martinfowler.com/testing/)

## 总结

这个测试套件基于业界最佳实践，为你的 Moka 面试系统提供了全面的测试覆盖。所有测试都遵循 AAA 模式，使用清晰的命名规范，并且测试了系统的实际行为而非内部实现。

**总计**: 32 个测试用例，覆盖 4 个核心模块，确保系统的稳定性和可靠性。
