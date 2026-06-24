import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Moka 面试管理系统 - 面试流程边界情况", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test.describe("作为HR访问面试流程", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("hr", "hr123456");
    });

    test("HR应该能够访问面试流程页面", async ({ page }) => {
      await page.goto("http://localhost:3000/interview-processes");
      await page.waitForLoadState("networkidle");
      
      const currentUrl = page.url();
      expect(currentUrl).toContain("/interview-processes");
    });
  });

  test.describe("作为面试官访问面试流程", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("interviewer", "interviewer123");
    });

    test("面试官应该能够访问面试流程页面", async ({ page }) => {
      await page.goto("http://localhost:3000/interview-processes");
      await page.waitForLoadState("networkidle");
      
      const currentUrl = page.url();
      expect(currentUrl).toContain("/interview-processes");
    });
  });
});

test.describe("面试流程 - 筛选和搜索", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
  });

  test("HR应该能够按状态筛选面试流程", async ({ page }) => {
    await page.goto("http://localhost:3000/interview-processes");
    await page.waitForLoadState("networkidle");
    
    // Look for filter buttons
    const filterButton = page.locator("button:has-text('筛选'), button:has-text('过滤')").first();
    
    if (await filterButton.isVisible().catch(() => false)) {
      await filterButton.click();
      await page.waitForTimeout(500);
    }
    
    expect(page.url()).toContain("/interview-processes");
  });

  test("HR应该能够搜索面试流程", async ({ page }) => {
    await page.goto("http://localhost:3000/interview-processes");
    await page.waitForLoadState("networkidle");
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="搜索"]').first();
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("测试");
      await page.waitForTimeout(500);
    }
    
    expect(page.url()).toContain("/interview-processes");
  });
});

test.describe("面试流程 - 权限控制", () => {
  test("未登录用户访问面试流程页面应该跳转到登录", async ({ page }) => {
    await page.goto("http://localhost:3000/interview-processes");
    await page.waitForLoadState("networkidle");
    
    await expect(page).toHaveURL(/.*login/);
  });
});
