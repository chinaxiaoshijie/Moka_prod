import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Moka 面试管理系统 - 我的面试", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test.describe("作为面试官访问我的面试", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("interviewer", "interviewer123");
    });

    test("面试官应该能够访问我的面试页面", async ({ page }) => {
      await page.goto("http://localhost:3000/my-interviews");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/.*my-interviews/);
    });

    test("面试官应该能够看到面试列表或空状态", async ({ page }) => {
      await page.goto("http://localhost:3000/my-interviews");
      await page.waitForLoadState("networkidle");

      // Should have some content - either list or empty state
      const hasContent = await page.locator("h1").isVisible();
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe("作为HR访问我的面试", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("hr", "hr123456");
    });

    test("HR应该能够访问我的面试页面", async ({ page }) => {
      await page.goto("http://localhost:3000/my-interviews");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/.*my-interviews/);
    });
  });
});

test.describe("我的面试 - 导航", () => {
  test("未登录用户访问我的面试页面应该跳转到登录", async ({ page }) => {
    await page.goto("http://localhost:3000/my-interviews");
    await page.waitForLoadState("networkidle");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
