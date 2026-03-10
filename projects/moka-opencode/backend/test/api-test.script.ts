#!/usr/bin/env bun
/**
 * Moka面试管理系统 - API测试脚本
 * 手动执行所有测试用例并生成报告
 */

import { test, expect, describe, beforeAll, afterAll } from "bun:test";

const BASE_URL = "http://localhost:3001";

// 测试数据存储
let hrToken = "";
let interviewerToken = "";
let candidateId = "";
let positionId = "";
let processId = "";
let interviewId = "";

// 辅助函数：发送HTTP请求
async function request(
  method: string,
  path: string,
  body?: any,
  token?: string,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  return {
    status: response.status,
    body: data,
  };
}

// 测试套件
describe("Moka面试管理系统 API测试", () => {
  describe("1. 认证模块测试", () => {
    test("1.1 HR用户登录 - 应返回访问令牌", async () => {
      const response = await request("POST", "/auth/login", {
        username: "admin",
        password: "admin123",
      });

      console.log("登录响应:", response);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("access_token");
      expect(response.body).toHaveProperty("user");

      hrToken = response.body.access_token;
    });

    test("1.2 获取用户信息 - 使用有效令牌", async () => {
      const response = await request(
        "GET",
        "/auth/profile",
        undefined,
        hrToken,
      );

      console.log("用户信息:", response);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("username");
    });

    test("1.3 获取用户列表", async () => {
      const response = await request("GET", "/auth/users", undefined, hrToken);

      console.log("用户列表:", response);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test("1.4 无效密码登录 - 应返回401", async () => {
      const response = await request("POST", "/auth/login", {
        username: "admin",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
    });

    test("1.5 无令牌访问受保护资源 - 应返回401", async () => {
      const response = await request("GET", "/auth/profile");

      expect(response.status).toBe(401);
    });
  });

  describe("2. 候选人模块测试", () => {
    test("2.1 创建候选人 - 应成功创建", async () => {
      const response = await request(
        "POST",
        "/candidates",
        {
          name: "测试候选人张三",
          phone: "13800138001",
          email: "zhangsan@test.com",
          source: "BOSS",
        },
        hrToken,
      );

      console.log("创建候选人:", response);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("测试候选人张三");

      candidateId = response.body.id;
    });

    test("2.2 获取候选人列表", async () => {
      const response = await request("GET", "/candidates", undefined, hrToken);

      console.log("候选人列表:", response);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    test("2.3 按名称搜索候选人", async () => {
      const response = await request(
        "GET",
        "/candidates?search=张三",
        undefined,
        hrToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    test("2.4 获取特定候选人", async () => {
      const response = await request(
        "GET",
        `/candidates/${candidateId}`,
        undefined,
        hrToken,
      );

      console.log("特定候选人:", response);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(candidateId);
    });

    test("2.5 更新候选人信息", async () => {
      const response = await request(
        "PUT",
        `/candidates/${candidateId}`,
        {
          name: "测试候选人张三（已更新）",
          phone: "13800138001",
          email: "zhangsan_updated@test.com",
        },
        hrToken,
      );

      console.log("更新候选人:", response);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("测试候选人张三（已更新）");
    });

    test("2.6 获取不存在的候选人 - 应返回404", async () => {
      const response = await request(
        "GET",
        "/candidates/non-existent-id",
        undefined,
        hrToken,
      );

      expect(response.status).toBe(404);
    });
  });

  describe("3. 职位模块测试", () => {
    test("3.1 获取职位列表", async () => {
      const response = await request("GET", "/positions", undefined, hrToken);

      console.log("职位列表:", response);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");

      if (response.body.items.length > 0) {
        positionId = response.body.items[0].id;
      }
    });

    test("3.2 创建新职位", async () => {
      const response = await request(
        "POST",
        "/positions",
        {
          title: "高级前端工程师",
          description: "负责核心产品前端开发",
          salaryMin: 25000,
          salaryMax: 40000,
          headcount: 3,
          location: "上海",
          status: "OPEN",
        },
        hrToken,
      );

      console.log("创建职位:", response);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");

      positionId = response.body.id;
    });

    test("3.3 获取特定职位", async () => {
      const response = await request(
        "GET",
        `/positions/${positionId}`,
        undefined,
        hrToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(positionId);
    });
  });

  describe("4. 面试流程模块测试", () => {
    test("4.1 创建面试流程", async () => {
      if (!candidateId || !positionId) {
        console.log("跳过：缺少候选人或职位ID");
        return;
      }

      const response = await request(
        "POST",
        "/interview-processes",
        {
          candidateId: candidateId,
          positionId: positionId,
          hasHRRound: true,
          totalRounds: 3,
          rounds: [
            {
              roundNumber: 1,
              interviewerId: "admin-id", // 需要替换为实际ID
              isHRRound: true,
              roundType: "HR_SCREENING",
            },
          ],
        },
        hrToken,
      );

      console.log("创建面试流程:", response);

      expect([200, 201]).toContain(response.status);

      if (response.body && response.body.id) {
        processId = response.body.id;
      }
    });

    test("4.2 获取面试流程列表", async () => {
      const response = await request(
        "GET",
        "/interview-processes",
        undefined,
        hrToken,
      );

      console.log("面试流程列表:", response);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
    });
  });

  describe("5. 面试模块测试", () => {
    test("5.1 获取面试列表", async () => {
      const response = await request("GET", "/interviews", undefined, hrToken);

      console.log("面试列表:", response);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("6. 反馈模块测试", () => {
    test("6.1 获取反馈列表", async () => {
      const response = await request("GET", "/feedback", undefined, hrToken);

      console.log("反馈列表:", response);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

console.log("========================================");
console.log("Moka面试管理系统 - API测试套件");
console.log("========================================");
console.log("测试环境: http://localhost:3001");
console.log("开始执行测试...");
console.log("");
