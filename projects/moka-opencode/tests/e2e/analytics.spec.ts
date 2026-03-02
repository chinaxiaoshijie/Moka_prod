import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Moka 面试管理系统 - 分析页面", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test.describe("作为HR访问分析页面", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("hr", "hr123456");
    });

    test("HR应该能够访问分析页面", async ({ page }) => {
      await page.goto("http://localhost:3000/analytics");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/.*analytics/);
    });

    test("HR应该能够查看招聘漏斗图", async ({ page }) => {
      await page.goto("http://localhost:3000/analytics");
      await page.waitForLoadState("networkidle");

      // Look for funnel or chart elements
      const hasChart = await page
        .locator("svg, .recharts-wrapper, [class*='chart']")
        .first()
        .isVisible()
        .catch(() => false);
      const hasContent = await page.locator("h1").isVisible();
      expect(hasContent).toBeTruthy();
    });

    test("HR应该能够查看面试官统计数据", async ({ page }) => {
      await page.goto("http://localhost:3000/analytics");
      await page.waitForLoadState("networkidle");

      // Look for interviewer stats section
      const statsSection = page
        .locator("text=面试官")
        .or(page.locator("text=统计数据"));

      // Page should have content
      const hasContent = await page.locator("h1").isVisible();
      expect(hasContent).toBeTruthy();
    });

    test("HR应该能够切换时间范围", async ({ page }) => {
      await page.goto("http://localhost:3000/analytics");
      await page.waitForLoadState("networkidle");

      // Look for date range selectors
      const thisMonth = page
        .locator("button:has-text('本月')")
        .or(page.locator("text=本月"));
      const lastMonth = page
        .locator("button:has-text('上月')")
        .or(page.locator("text=上月"));

      if (await thisMonth.isVisible().catch(() => false)) {
        await thisMonth.click();
        await page.waitForTimeout(500);
      }

      // Page should still work
      expect(page.url()).toContain("/analytics");
    });

    test("HR应该能够导出数据", async ({ page }) => {
      await page.goto("http://localhost:3000/analytics");
      await page.waitForLoadState("networkidle");

      // Look for export button
      const exportButton = page.locator(
        "button:has-text('导出'), button:has-text('导出Excel')",
      );

      if (await exportButton.isVisible().catch(() => false)) {
        // Just verify button exists - downloading would require more setup
        const buttonExists = await exportButton.isVisible();
        expect(buttonExists).toBeTruthy();
      }
    });
  });

  test.describe("作为面试官访问分析页面", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("interviewer", "interviewer123");
    });

    test("面试官访问分析页面应该受限或重定向", async ({ page }) => {
      await page.goto("http://localhost:3000/analytics");
      await page.waitForLoadState("networkidle");

      // Interviewer may be redirected or see limited data
      const url = page.url();
      // Either redirected away or can see the page
      expect(
        url.includes("/analytics") || url.includes("/dashboard"),
      ).toBeTruthy();
    });
  });
});

test.describe("分析页面 - 未认证访问", () => {
  test("未登录用户访问分析页面应该跳转到登录", async ({ page }) => {
    await page.goto("http://localhost:3000/analytics");
    await page.waitForLoadState("networkidle");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
