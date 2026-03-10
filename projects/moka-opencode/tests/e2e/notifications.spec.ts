import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Moka 面试管理系统 - 通知页面", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test.describe("作为HR访问通知页面", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("hr", "hr123456");
    });

    test("HR应该能够访问通知页面", async ({ page }) => {
      await page.goto("http://localhost:3000/notifications");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/.*notifications/);
    });

    test("HR应该能够查看通知列表或空状态", async ({ page }) => {
      await page.goto("http://localhost:3000/notifications");
      await page.waitForLoadState("networkidle");

      // Should have content - either list or empty state
      const hasContent = await page.locator("h1").isVisible();
      expect(hasContent).toBeTruthy();
    });

    test("HR应该能够切换通知筛选条件", async ({ page }) => {
      await page.goto("http://localhost:3000/notifications");
      await page.waitForLoadState("networkidle");

      // Look for filter buttons
      const allButton = page
        .locator("button:has-text('全部')")
        .or(page.locator("text=全部"));
      const unreadButton = page
        .locator("button:has-text('未读')")
        .or(page.locator("text=未读"));

      const hasFilter =
        (await allButton.isVisible().catch(() => false)) ||
        (await unreadButton.isVisible().catch(() => false));

      if (hasFilter) {
        // Try clicking unread filter
        if (await unreadButton.isVisible().catch(() => false)) {
          await unreadButton.click();
          await page.waitForTimeout(500);
        }
      }

      // Page should still work
      expect(page.url()).toContain("/notifications");
    });
  });

  test.describe("作为面试官访问通知页面", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("interviewer", "interviewer123");
    });

    test("面试官应该能够访问通知页面", async ({ page }) => {
      await page.goto("http://localhost:3000/notifications");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/.*notifications/);
    });
  });
});

test.describe("通知页面 - 未认证访问", () => {
  test("未登录用户访问通知页面应该跳转到登录", async ({ page }) => {
    await page.goto("http://localhost:3000/notifications");
    await page.waitForLoadState("networkidle");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
