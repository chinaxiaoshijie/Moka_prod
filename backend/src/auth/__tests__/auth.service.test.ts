import { test, expect, beforeAll, afterAll } from "bun:test";
import { AuthService } from "../auth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

// 模拟依赖
const mockPrismaService = {
  user: {
    findUnique: async ({ where }: any) => {
      if (where.username === "hr") {
        return {
          id: "1",
          username: "hr",
          password: await bcrypt.hash("hr123456", 10),
          name: "张HR",
          email: "hr@company.com",
          role: "HR",
        };
      }
      if (where.username === "interviewer") {
        return {
          id: "2",
          username: "interviewer",
          password: await bcrypt.hash("interviewer123", 10),
          name: "李面试官",
          email: "interviewer@company.com",
          role: "INTERVIEWER",
        };
      }
      return null;
    },
    findMany: async () => [],
  },
};

const mockJwtService = {
  sign: (payload: any) => `mock-jwt-token-${JSON.stringify(payload)}`,
  verify: (token: string) => {
    return { sub: "1", username: "hr", role: "HR" };
  },
};

// 创建 AuthService 实例
const authService = new AuthService(
  mockPrismaService as any,
  mockJwtService as any,
);

test("AuthService: 成功登录 - HR 用户", async () => {
  const loginDto = {
    username: "hr",
    password: "hr123456",
  };

  const result = await authService.login(loginDto);

  expect(result).toBeDefined();
  expect(result.access_token).toBeDefined();
  expect(result.token_type).toBe("Bearer");
  expect(result.expires_in).toBe(604800);
  expect(result.user).toBeDefined();
  expect(result.user.username).toBe("hr");
  expect(result.user.role).toBe("HR");
});

test("AuthService: 成功登录 - 面试官用户", async () => {
  const loginDto = {
    username: "interviewer",
    password: "interviewer123",
  };

  const result = await authService.login(loginDto);

  expect(result).toBeDefined();
  expect(result.user.username).toBe("interviewer");
  expect(result.user.role).toBe("INTERVIEWER");
});

test("AuthService: 登录失败 - 用户不存在", async () => {
  const loginDto = {
    username: "nonexistent",
    password: "password123",
  };

  try {
    await authService.login(loginDto);
    expect(false).toBe(true); // 如果没抛出异常就失败
  } catch (error: any) {
    expect(error.message).toBe("用户名或密码错误");
  }
});

test("AuthService: 登录失败 - 密码错误", async () => {
  const loginDto = {
    username: "hr",
    password: "wrongpassword",
  };

  try {
    await authService.login(loginDto);
    expect(false).toBe(true); // 如果没抛出异常就失败
  } catch (error: any) {
    expect(error.message).toBe("用户名或密码错误");
  }
});

test("AuthService: 验证用户 - 成功", async () => {
  mockPrismaService.user.findUnique = async ({ where }: any) => ({
    id: "1",
    username: "hr",
    name: "张HR",
    email: "hr@company.com",
    role: "HR",
    avatarUrl: null,
  });

  const result = await authService.validateUser("1");

  expect(result).toBeDefined();
  expect(result.id).toBe("1");
  expect(result.username).toBe("hr");
});

test("AuthService: 验证用户 - 失败", async () => {
  mockPrismaService.user.findUnique = async () => null;

  try {
    await authService.validateUser("999");
    expect(false).toBe(true); // 如果没抛出异常就失败
  } catch (error: any) {
    expect(error.message).toBe("用户不存在");
  }
});

test("AuthService: 获取用户列表", async () => {
  mockPrismaService.user.findMany = async () => [
    {
      id: "1",
      username: "hr",
      name: "张HR",
      email: "hr@company.com",
      role: "HR",
      avatarUrl: null,
    },
    {
      id: "2",
      username: "interviewer",
      name: "李面试官",
      email: "interviewer@company.com",
      role: "INTERVIEWER",
      avatarUrl: null,
    },
  ];

  const result = await authService.findUsers();

  expect(result).toHaveLength(2);
  expect(result[0].role).toBe("HR");
});

test("AuthService: 按角色筛选用户", async () => {
  mockPrismaService.user.findMany = async ({ where }: any) => {
    if (where.role === "HR") {
      return [
        {
          id: "1",
          username: "hr",
          name: "张HR",
          email: "hr@company.com",
          role: "HR",
          avatarUrl: null,
        },
      ];
    }
    return [];
  };

  const result = await authService.findUsers("HR");

  expect(result).toHaveLength(1);
  expect(result[0].role).toBe("HR");
});
