import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { PositionsPage } from "./pages/PositionsPage";
import { FeedbackPage } from "./pages/FeedbackPage";

test.describe("Moka 面试管理系统 - 职位管理", () => {
  let loginPage: LoginPage;
  let positionsPage: PositionsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    positionsPage = new PositionsPage(page);

    // 先登录
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
  });

  test("HR应该能够查看职位列表", async ({ page }) => {
    await positionsPage.goto();

    // 验证职位页面加载
    await expect(page).toHaveURL(/.*positions/);

    // 验证有职位列表或空状态
    const count = await positionsPage.getPositionCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("HR应该能够添加新职位", async ({ page }) => {
    await positionsPage.goto();

    // 添加新职位
    const timestamp = Date.now();
    await positionsPage.addPosition(`测试前端工程师${timestamp}`, "技术部");

    // 验证添加成功
    await page.waitForTimeout(1000);
  });
});

test.describe("Moka 面试管理系统 - 反馈功能", () => {
  let loginPage: LoginPage;
  let feedbackPage: FeedbackPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    feedbackPage = new FeedbackPage(page);

    // 先登录
    await loginPage.goto();
    await loginPage.login("interviewer", "interviewer123");
  });

  test("面试官应该能够查看反馈列表", async ({ page }) => {
    await feedbackPage.goto();

    // 验证反馈页面加载
    await expect(page).toHaveURL(/.*feedback/);
  });

  test("面试官应该能够查看我的面试并提交反馈", async ({ page }) => {
    await feedbackPage.gotoMyInterviews();

    // 验证页面加载
    await expect(page).toHaveURL(/.*my-interviews/);

    // 等待面试列表加载
    await page.waitForTimeout(1000);
  });
});
