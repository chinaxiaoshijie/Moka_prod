import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { PositionsPage } from "./pages/PositionsPage";
import { DashboardPage } from "./pages/DashboardPage";

test.describe("Moka 面试管理系统 - 完整招聘流程", () => {
  let loginPage: LoginPage;
  let candidatesPage: CandidatesPage;
  let positionsPage: PositionsPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    candidatesPage = new CandidatesPage(page);
    positionsPage = new PositionsPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test("HR应该能够完成从创建职位到添加候选人的完整流程", async ({ page }) => {
    // 1. Login as HR
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");

    // 2. Create a position
    await positionsPage.goto();
    await page.waitForLoadState("networkidle");

    const timestamp = Date.now();
    const positionName = `测试职位流程${timestamp}`;
    await positionsPage.addPosition(
      positionName,
      "这是一个测试职位",
      "3",
      "北京",
    );
    await page.waitForTimeout(1000);

    // 3. Add a candidate
    await candidatesPage.goto();
    await page.waitForLoadState("networkidle");

    const candidateName = `流程测试候选人${timestamp}`;
    const phone = `139${timestamp.toString().slice(-8)}`;
    await candidatesPage.addCandidate(
      candidateName,
      phone,
      `candidate${timestamp}@example.com`,
    );
    await page.waitForTimeout(1000);

    // 4. Visit dashboard to verify stats
    await dashboardPage.goto();
    await page.waitForLoadState("networkidle");

    // Dashboard should load
    await expect(page).toHaveURL(/.*dashboard/);
    const hasStats = await dashboardPage.statisticsCards.count();
    expect(hasStats).toBeGreaterThan(0);
  });

  test("HR应该能够在不同页面之间导航", async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");

    // Visit dashboard
    await dashboardPage.goto();
    await expect(page).toHaveURL(/.*dashboard/);

    // Visit candidates
    await candidatesPage.goto();
    await expect(page).toHaveURL(/.*candidates/);

    // Visit positions
    await positionsPage.goto();
    await expect(page).toHaveURL(/.*positions/);

    // Visit users (if accessible)
    await page.goto("http://localhost:3000/users");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/.*users/);
  });

  test("登录后应该能够正确登出并重新登录", async ({ page }) => {
    // First login
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
    await page.waitForLoadState("networkidle");

    // Logout - clear localStorage
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);

    // Login again with different user
    await loginPage.login("interviewer", "interviewer123");
    await page.waitForLoadState("networkidle");

    // Should be logged in as interviewer
    const userData = await page.evaluate(() => localStorage.getItem("user"));
    expect(userData).toContain("interviewer");
  });
});

test.describe("面试管理系统 - 页面加载性能", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
  });

  test("候选人页面应该在合理时间内加载", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("http://localhost:3000/candidates");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("职位页面应该在合理时间内加载", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("http://localhost:3000/positions");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe("面试管理系统 - 错误处理", () => {
  test("访问不存在的页面应该显示404或重定向", async ({ page }) => {
    await page.goto("http://localhost:3000/nonexistent-page-xyz");
    await page.waitForLoadState("networkidle");

    // Should either show 404 or redirect
    const url = page.url();
    expect(url).not.toContain("nonexistent-page-xyz") ||
      expect(
        await page
          .locator("text=404")
          .isVisible()
          .catch(() => false),
      ).toBeTruthy();
  });

  test("网络错误应该显示错误信息", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Try to login with wrong credentials - should show error
    await loginPage.login("wronguser", "wrongpassword");
    await page.waitForTimeout(1000);

    // Should show error message
    const hasError = await loginPage.errorMessage
      .isVisible()
      .catch(() => false);
    expect(hasError).toBeTruthy();
  });
});
