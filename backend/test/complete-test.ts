#!/usr/bin/env bun
/**
 * Moka面试管理系统 - 完整功能测试脚本
 * 测试所有新添加的模块
 */

import { test, expect, describe, beforeAll } from "bun:test";

const BASE_URL = "http://localhost:3001";
let authToken = "";
let userId = "";
let notificationId = "";

// 辅助函数
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

  try {
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
  } catch (error) {
    return {
      status: 0,
      body: { error: String(error) },
    };
  }
}

console.log("========================================");
console.log("Moka面试管理系统 - 完整功能测试");
console.log("========================================");
console.log(`测试服务器: ${BASE_URL}`);
console.log(`开始时间: ${new Date().toLocaleString()}`);
console.log("");

const results: {
  name: string;
  status: "PASS" | "FAIL";
  duration: number;
  error?: string;
}[] = [];

async function runTest(name: string, testFn: () => Promise<void>) {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({ name, status: "PASS", duration: Date.now() - startTime });
    console.log(`  PASS: ${name}`);
  } catch (error) {
    results.push({
      name,
      status: "FAIL",
      duration: Date.now() - startTime,
      error: String(error),
    });
    console.log(`  FAIL: ${name}`);
    console.log(`    Error: ${error}`);
  }
}

async function runAllTests() {
  console.log("【准备阶段】");

  // 登录获取token
  await runTest("HR用户登录获取Token", async () => {
    const response = await request("POST", "/auth/login", {
      username: "hr",
      password: "hr123456",
    });

    if (response.status !== 201) {
      throw new Error(`期望状态码201，实际得到${response.status}`);
    }
    if (!response.body?.access_token) {
      throw new Error("响应中缺少access_token");
    }

    authToken = response.body.access_token;
    userId = response.body.user.id;
  });

  console.log("\n【模块1: 认证模块扩展测试】");

  await runTest("获取用户个人资料", async () => {
    const response = await request(
      "GET",
      "/auth/profile",
      undefined,
      authToken,
    );

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
    if (!response.body?.id) {
      throw new Error("响应中缺少用户ID");
    }
  });

  console.log("\n【模块2: 通知系统测试】");

  await runTest("创建通知", async () => {
    const response = await request(
      "POST",
      "/notifications",
      {
        userId: userId,
        type: "SYSTEM",
        title: "测试通知",
        content: "这是一条测试通知",
        link: "/dashboard",
      },
      authToken,
    );

    if (![200, 201].includes(response.status)) {
      throw new Error(`期望状态码200/201，实际得到${response.status}`);
    }

    notificationId = response.body?.id;
  });

  await runTest("获取通知列表", async () => {
    const response = await request(
      "GET",
      "/notifications",
      undefined,
      authToken,
    );

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
    if (!response.body?.items) {
      throw new Error("响应格式不正确");
    }
  });

  await runTest("获取未读通知列表", async () => {
    const response = await request(
      "GET",
      "/notifications?unreadOnly=true",
      undefined,
      authToken,
    );

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
  });

  if (notificationId) {
    await runTest("标记通知为已读", async () => {
      const response = await request(
        "PUT",
        `/notifications/${notificationId}/read`,
        undefined,
        authToken,
      );

      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际得到${response.status}`);
      }
    });
  }

  await runTest("标记所有通知为已读", async () => {
    const response = await request(
      "PUT",
      "/notifications/read-all",
      undefined,
      authToken,
    );

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
  });

  console.log("\n【模块3: 数据分析模块测试】");

  await runTest("获取招聘漏斗数据", async () => {
    const response = await request(
      "GET",
      "/analytics/funnel",
      undefined,
      authToken,
    );

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
    if (!response.body?.stages) {
      throw new Error("响应中缺少stages");
    }
  });

  await runTest("获取面试官工作量统计", async () => {
    const response = await request(
      "GET",
      "/analytics/interviewers",
      undefined,
      authToken,
    );

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
    if (!Array.isArray(response.body)) {
      throw new Error("响应应该是数组");
    }
  });

  await runTest("获取候选人来源分析", async () => {
    const response = await request(
      "GET",
      "/analytics/sources",
      undefined,
      authToken,
    );

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
    if (!Array.isArray(response.body)) {
      throw new Error("响应应该是数组");
    }
  });

  await runTest("获取招聘时间线(30天)", async () => {
    const response = await request(
      "GET",
      "/analytics/timeline?days=30",
      undefined,
      authToken,
    );

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
    if (!Array.isArray(response.body)) {
      throw new Error("响应应该是数组");
    }
  });

  await runTest("获取平均招聘周期", async () => {
    const response = await request(
      "GET",
      "/analytics/hiring-cycle",
      undefined,
      authToken,
    );

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
  });

  await runTest("获取仪表盘统计数据", async () => {
    const response = await request(
      "GET",
      "/analytics/dashboard",
      undefined,
      authToken,
    );

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
    if (!response.body?.totalCandidates === undefined) {
      throw new Error("响应中缺少统计数据");
    }
  });

  console.log("\n【模块4: 面试流程模块测试】");

  await runTest("获取面试流程列表", async () => {
    const response = await request(
      "GET",
      "/interview-processes",
      undefined,
      authToken,
    );

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
    if (!response.body?.items) {
      throw new Error("响应格式不正确");
    }
  });

  console.log("\n【模块5: 面试模块测试】");

  await runTest("获取面试列表", async () => {
    const response = await request("GET", "/interviews", undefined, authToken);

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
  });

  await runTest("创建面试", async () => {
    // 先获取候选人和职位
    const candidatesRes = await request(
      "GET",
      "/candidates",
      undefined,
      authToken,
    );
    const positionsRes = await request(
      "GET",
      "/positions",
      undefined,
      authToken,
    );
    const usersRes = await request("GET", "/auth/users", undefined, authToken);

    if (
      !candidatesRes.body?.items?.[0] ||
      !positionsRes.body?.items?.[0] ||
      !usersRes.body?.[0]
    ) {
      throw new Error("缺少必要的关联数据");
    }

    const candidateId = candidatesRes.body.items[0].id;
    const positionId = positionsRes.body.items[0].id;
    const interviewerId = usersRes.body[0].id;

    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    const response = await request(
      "POST",
      "/interviews",
      {
        candidateId,
        positionId,
        interviewerId,
        type: "INTERVIEW_1",
        format: "ONLINE",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        meetingUrl: "https://meeting.tencent.com/test",
      },
      authToken,
    );

    if (![200, 201].includes(response.status)) {
      throw new Error(
        `期望状态码200/201，实际得到${response.status}: ${JSON.stringify(response.body)}`,
      );
    }
  });

  console.log("\n【模块6: 反馈模块测试】");

  await runTest("获取反馈列表", async () => {
    const response = await request("GET", "/feedback", undefined, authToken);

    if (response.status !== 200) {
      throw new Error(`期望状态码200，实际得到${response.status}`);
    }
    // API返回的是FeedbackListResponseDto对象，包含items数组和total
    if (!response.body || !Array.isArray(response.body.items)) {
      throw new Error(
        `响应格式不正确，期望包含items数组的对象，实际得到: ${JSON.stringify(response.body).slice(0, 100)}`,
      );
    }
  });

  // 生成报告
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log("\n========================================");
  console.log("完整测试报告");
  console.log("========================================");
  console.log(`总测试数: ${results.length}`);
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  console.log(`跳过: 0`);
  console.log(`通过率: ${((passed / results.length) * 100).toFixed(2)}%`);
  console.log(`总耗时: ${totalDuration}ms`);
  console.log("========================================");

  if (failed > 0) {
    console.log("\n失败的测试:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`  - ${r.name}`);
        console.log(`    Error: ${r.error}`);
      });
  }

  console.log("\n详细结果:");
  results.forEach((r) => {
    const icon = r.status === "PASS" ? "✓" : "✗";
    console.log(`  ${icon} ${r.name} (${r.duration}ms)`);
  });

  console.log("\n========================================");
  console.log(`结束时间: ${new Date().toLocaleString()}`);
  console.log("========================================");

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error("测试执行失败:", error);
  process.exit(1);
});
