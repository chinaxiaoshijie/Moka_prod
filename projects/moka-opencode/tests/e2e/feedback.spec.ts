import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { FeedbackPage } from "./pages/FeedbackPage";

test.describe("Moka 面试管理系统 - 面试反馈", () => {
  let loginPage: LoginPage;
  let feedbackPage: FeedbackPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    feedbackPage = new FeedbackPage(page);
  });

  test.describe("作为面试官访问反馈页面", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("interviewer", "interviewer123");
    });

    test("面试官应该能够访问反馈页面", async ({ page }) => {
      await feedbackPage.goto();
      await page.waitForLoadState("networkidle");
      
      // Page should load (either with interviewId or without)
      const currentUrl = page.url();
      expect(currentUrl).toContain("/feedback");
    });

    test("面试官访问反馈页面时没有面试ID应该显示引导信息", async ({ page }) => {
      await feedbackPage.goto();
      await page.waitForLoadState("networkidle");
      
      // Should show the prompt to select an interview
      const hasPrompt = await page.locator("text=请选择要查看反馈的面试").isVisible().catch(() => false);
      const hasButton = await page.locator("text=查看面试列表").isVisible().catch(() => false);
      
      // Either shows prompt or button
      expect(hasPrompt || hasButton).toBeTruthy();
    });
  });

  test.describe("作为HR访问反馈页面", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("hr", "hr123456");
    });

    test("HR应该能够访问反馈页面", async ({ page }) => {
      await feedbackPage.goto();
      await page.waitForLoadState("networkidle");
      
      const currentUrl = page.url();
      expect(currentUrl).toContain("/feedback");
    });
  });
});

test.describe("面试反馈 - 未认证访问", () => {
  test("未登录用户访问反馈页面应该跳转到登录", async ({ page }) => {
    await page.goto("http://localhost:3000/feedback");
    await page.waitForLoadState("networkidle");
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
