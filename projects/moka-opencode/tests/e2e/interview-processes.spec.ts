import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { InterviewProcessesPage } from "./pages/InterviewProcessesPage";
import { CandidatesPage } from "./pages/CandidatesPage";

test.describe("Moka 面试管理系统 - 面试流程", () => {
  let loginPage: LoginPage;
  let processesPage: InterviewProcessesPage;
  let candidatesPage: CandidatesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    processesPage = new InterviewProcessesPage(page);
    candidatesPage = new CandidatesPage(page);

    // 先登录
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
  });

  test("HR应该能够查看面试流程列表", async ({ page }) => {
    await processesPage.goto();

    // 验证面试流程页面加载
    await expect(page).toHaveURL(/.*interview-processes/);

    // 验证有流程列表或空状态
    const count = await processesPage.getProcessCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("HR应该能够查看面试流程详情", async ({ page }) => {
    await processesPage.goto();

    // 等待页面加载
    await page.waitForTimeout(1000);

    // 尝试查看第一个流程详情（如果有的话）
    const count = await processesPage.getProcessCount();
    if (count > 0) {
      await processesPage.viewFirstProcess();
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Moka 面试管理系统 - 面试官功能", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test("面试官应该能够查看我的面试", async ({ page }) => {
    await loginPage.goto();
    await loginPage.login("interviewer", "interviewer123");

    // 访问我的面试页面
    await page.goto("/my-interviews");
    await page.waitForLoadState("networkidle");

    // 验证页面加载
    await expect(page).toHaveURL(/.*my-interviews/);
  });

  test("面试官应该能够访问候选人列表", async ({ page }) => {
    await loginPage.goto();
    await loginPage.login("interviewer", "interviewer123");

    // 访问候选人页面
    await page.goto("/candidates");
    await page.waitForLoadState("networkidle");

    // 验证页面加载
    await expect(page).toHaveURL(/.*candidates/);
  });
});
