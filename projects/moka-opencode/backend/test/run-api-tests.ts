/**
 * Moka面试管理系统 - API测试执行脚本
 * 直接调用API端点并生成测试报告
 */

const BASE_URL = "http://localhost:3001";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "SKIP";
  duration: number;
  error?: string;
  response?: any;
}

class APITestRunner {
  private results: TestResult[] = [];
  private hrToken = "";
  private interviewerToken = "";
  private candidateId = "";
  private positionId = "";
  private processId = "";

  async run(): Promise<void> {
    console.log("========================================");
    console.log("Moka面试管理系统 - API测试执行");
    console.log("========================================");
    console.log(`测试服务器: ${BASE_URL}`);
    console.log(`开始时间: ${new Date().toLocaleString()}`);
    console.log("");

    const startTime = Date.now();

    await this.testAuth();
    await this.testCandidates();
    await this.testPositions();
    await this.testInterviewProcesses();
    await this.testInterviews();
    await this.testFeedback();

    const duration = Date.now() - startTime;

    this.generateReport(duration);
  }

  private async request(
    method: string,
    path: string,
    body?: any,
    token?: string,
  ): Promise<{ status: number; body: any }> {
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

  private async runTest(
    name: string,
    testFn: () => Promise<void>,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      await testFn();
      this.results.push({
        name,
        status: "PASS",
        duration: Date.now() - startTime,
      });
      console.log(`  PASS: ${name}`);
    } catch (error) {
      this.results.push({
        name,
        status: "FAIL",
        duration: Date.now() - startTime,
        error: String(error),
      });
      console.log(`  FAIL: ${name}`);
      console.log(`    Error: ${error}`);
    }
  }

  private async testAuth(): Promise<void> {
    console.log("\n【模块1: 认证模块】");

    await this.runTest("HR用户登录", async () => {
      const response = await this.request("POST", "/auth/login", {
        username: "hr",
        password: "hr123456",
      });

      if (response.status !== 201) {
        throw new Error(`期望状态码201，实际得到${response.status}`);
      }
      if (!response.body?.access_token) {
        throw new Error("响应中缺少access_token");
      }

      this.hrToken = response.body.access_token;
    });

    await this.runTest("获取用户信息", async () => {
      const response = await this.request(
        "GET",
        "/auth/profile",
        undefined,
        this.hrToken,
      );

      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际得到${response.status}`);
      }
      if (!response.body?.id) {
        throw new Error("响应中缺少用户ID");
      }
    });

    await this.runTest("获取用户列表", async () => {
      const response = await this.request(
        "GET",
        "/auth/users",
        undefined,
        this.hrToken,
      );

      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际得到${response.status}`);
      }
      if (!Array.isArray(response.body)) {
        throw new Error("响应应该是数组");
      }
    });

    await this.runTest("无效密码登录", async () => {
      const response = await this.request("POST", "/auth/login", {
        username: "hr",
        password: "wrongpassword",
      });

      if (response.status !== 401) {
        throw new Error(`期望状态码401，实际得到${response.status}`);
      }
    });

    await this.runTest("无令牌访问受保护资源", async () => {
      const response = await this.request("GET", "/auth/profile");

      if (response.status !== 401) {
        throw new Error(`期望状态码401，实际得到${response.status}`);
      }
    });
  }

  private async testCandidates(): Promise<void> {
    console.log("\n【模块2: 候选人模块】");

    await this.runTest("创建候选人", async () => {
      const uniquePhone = `13800${Date.now().toString().slice(-6)}`;
      const response = await this.request(
        "POST",
        "/candidates",
        {
          name: "测试候选人张三",
          phone: uniquePhone,
          email: "zhangsan@test.com",
          source: "BOSS",
        },
        this.hrToken,
      );

      if (response.status !== 201) {
        throw new Error(`期望状态码201，实际得到${response.status}`);
      }
      if (!response.body?.id) {
        throw new Error("响应中缺少候选人ID");
      }

      this.candidateId = response.body.id;
    });

    await this.runTest("获取候选人列表", async () => {
      const response = await this.request(
        "GET",
        "/candidates",
        undefined,
        this.hrToken,
      );

      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际得到${response.status}`);
      }
      if (!response.body?.items || !Array.isArray(response.body.items)) {
        throw new Error("响应格式不正确");
      }
    });

    await this.runTest("按名称搜索候选人", async () => {
      const response = await this.request(
        "GET",
        "/candidates?search=张三",
        undefined,
        this.hrToken,
      );

      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际得到${response.status}`);
      }
    });

    await this.runTest("获取特定候选人", async () => {
      if (!this.candidateId) {
        throw new Error("跳过：没有候选人ID");
      }

      const response = await this.request(
        "GET",
        `/candidates/${this.candidateId}`,
        undefined,
        this.hrToken,
      );

      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际得到${response.status}`);
      }
    });

    await this.runTest("更新候选人信息", async () => {
      if (!this.candidateId) {
        throw new Error("跳过：没有候选人ID");
      }

      const getResponse = await this.request(
        "GET",
        `/candidates/${this.candidateId}`,
        undefined,
        this.hrToken,
      );

      if (getResponse.status !== 200) {
        throw new Error(`获取候选人失败，状态码${getResponse.status}`);
      }

      const currentPhone = getResponse.body.phone;

      const response = await this.request(
        "PUT",
        `/candidates/${this.candidateId}`,
        {
          name: "测试候选人张三（已更新）",
          phone: currentPhone,
          email: "zhangsan_updated@test.com",
        },
        this.hrToken,
      );

      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际得到${response.status}`);
      }
    });
  }

  private async testPositions(): Promise<void> {
    console.log("\n【模块3: 职位模块】");

    await this.runTest("创建职位", async () => {
      const response = await this.request(
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
        this.hrToken,
      );

      if (response.status !== 201) {
        throw new Error(`期望状态码201，实际得到${response.status}`);
      }
      if (!response.body?.id) {
        throw new Error("响应中缺少职位ID");
      }

      this.positionId = response.body.id;
    });

    await this.runTest("获取职位列表", async () => {
      const response = await this.request(
        "GET",
        "/positions",
        undefined,
        this.hrToken,
      );

      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际得到${response.status}`);
      }
    });

    await this.runTest("获取特定职位", async () => {
      if (!this.positionId) {
        throw new Error("跳过：没有职位ID");
      }

      const response = await this.request(
        "GET",
        `/positions/${this.positionId}`,
        undefined,
        this.hrToken,
      );

      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际得到${response.status}`);
      }
    });
  }

  private async testInterviewProcesses(): Promise<void> {
    console.log("\n【模块4: 面试流程模块】");

    await this.runTest("创建面试流程", async () => {
      if (!this.candidateId || !this.positionId) {
        throw new Error("跳过：缺少候选人或职位ID");
      }

      const usersResponse = await this.request(
        "GET",
        "/auth/users",
        undefined,
        this.hrToken,
      );
      const interviewer = usersResponse.body?.find((u: any) => u.role === "HR");

      if (!interviewer) {
        throw new Error("找不到面试官");
      }

      const response = await this.request(
        "POST",
        "/interview-processes",
        {
          candidateId: this.candidateId,
          positionId: this.positionId,
          hasHRRound: true,
          totalRounds: 2,
          rounds: [
            {
              roundNumber: 1,
              interviewerId: interviewer.id,
              isHRRound: true,
              roundType: "HR_SCREENING",
            },
          ],
        },
        this.hrToken,
      );

      if (![200, 201].includes(response.status)) {
        throw new Error(`期望状态码200或201，实际得到${response.status}`);
      }

      this.processId = response.body?.id;
    });

    await this.runTest("获取面试流程列表", async () => {
      const response = await this.request(
        "GET",
        "/interview-processes",
        undefined,
        this.hrToken,
      );

      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际得到${response.status}`);
      }
    });
  }

  private async testInterviews(): Promise<void> {
    console.log("\n【模块5: 面试模块】");

    await this.runTest("获取面试列表", async () => {
      const response = await this.request(
        "GET",
        "/interviews",
        undefined,
        this.hrToken,
      );

      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际得到${response.status}`);
      }
    });
  }

  private async testFeedback(): Promise<void> {
    console.log("\n【模块6: 反馈模块】");

    await this.runTest("获取反馈列表", async () => {
      const response = await this.request(
        "GET",
        "/feedback",
        undefined,
        this.hrToken,
      );

      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际得到${response.status}`);
      }
    });
  }

  private generateReport(totalDuration: number): void {
    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const skipped = this.results.filter((r) => r.status === "SKIP").length;

    console.log("\n========================================");
    console.log("测试报告");
    console.log("========================================");
    console.log(`总测试数: ${this.results.length}`);
    console.log(`通过: ${passed}`);
    console.log(`失败: ${failed}`);
    console.log(`跳过: ${skipped}`);
    console.log(
      `通过率: ${((passed / this.results.length) * 100).toFixed(2)}%`,
    );
    console.log(`总耗时: ${totalDuration}ms`);
    console.log("========================================");

    if (failed > 0) {
      console.log("\n失败的测试:");
      this.results
        .filter((r) => r.status === "FAIL")
        .forEach((r) => {
          console.log(`  - ${r.name}`);
          console.log(`    Error: ${r.error}`);
        });
    }

    console.log("\n详细结果:");
    this.results.forEach((r) => {
      const icon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : "○";
      console.log(`  ${icon} ${r.name} (${r.duration}ms)`);
    });

    console.log("\n========================================");
    console.log(`结束时间: ${new Date().toLocaleString()}`);
    console.log("========================================");
  }
}

const runner = new APITestRunner();
runner.run().catch((error) => {
  console.error("测试执行失败:", error);
  process.exit(1);
});
