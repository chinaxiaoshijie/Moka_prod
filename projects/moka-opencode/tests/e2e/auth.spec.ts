import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

test.describe("Moka 面试管理系统 - 认证流程", () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test("HR用户应该能够成功登录", async ({ page }) => {
    await loginPage.goto();

    // 验证登录页面加载
    await expect(page).toHaveURL(/.*login/);

    // 执行登录
    await loginPage.login("hr", "hr123456");

    // 验证登录成功 - 应该跳转到仪表盘
    await expect(page).toHaveURL(/.*dashboard|.*candidates/);

    // 验证用户已登录
    await dashboardPage.goto();
    await expect(dashboardPage.welcomeText).toBeVisible();
  });

  test("面试官用户应该能够成功登录", async ({ page }) => {
    await loginPage.goto();

    await loginPage.login("interviewer", "interviewer123");

    // 验证登录成功
    await expect(page).toHaveURL(/.*dashboard|.*my-interviews|.*candidates/);
  });

  test("错误密码应该显示错误提示", async ({ page }) => {
    await loginPage.goto();

    await loginPage.login("hr", "wrongpassword");

    // 验证显示错误信息
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain("错误");
  });

  test("未登录用户访问受保护页面应该被重定向到登录页", async ({ page }) => {
    // 直接访问受保护的页面
    await page.goto("/dashboard");

    // 应该被重定向到登录页
    await expect(page).toHaveURL(/.*login/);
  });
});
