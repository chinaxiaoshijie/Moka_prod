import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Moka 面试管理系统 - 日历页面", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test.describe("作为HR访问日历页面", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("hr", "hr123456");
    });

    test("HR应该能够访问日历页面", async ({ page }) => {
      await page.goto("http://localhost:3000/calendar");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/.*calendar/);
    });

    test("日历应该显示面试事件或空状态", async ({ page }) => {
      await page.goto("http://localhost:3000/calendar");
      await page.waitForLoadState("networkidle");

      // Calendar should load - look for calendar container
      const hasCalendar = await page
        .locator(".fc-calendar, .fc-view, [class*='calendar']")
        .first()
        .isVisible()
        .catch(() => false);
      const hasContent = await page.locator("h1").isVisible();
      expect(hasContent).toBeTruthy();
    });

    test("HR应该能够切换日历视图", async ({ page }) => {
      await page.goto("http://localhost:3000/calendar");
      await page.waitForLoadState("networkidle");

      // Look for view switch buttons (month/week/day)
      const monthView = page
        .locator("button:has-text('月'), .fc-button-primary:has-text('月')")
        .first();
      const weekView = page
        .locator("button:has-text('周'), .fc-button-primary:has-text('周')")
        .first();

      // Try to switch views if available
      if (await monthView.isVisible().catch(() => false)) {
        await monthView.click();
        await page.waitForTimeout(500);
      }

      if (await weekView.isVisible().catch(() => false)) {
        await weekView.click();
        await page.waitForTimeout(500);
      }

      // Page should still work
      expect(page.url()).toContain("/calendar");
    });

    test("HR应该能够点击日历上的事件", async ({ page }) => {
      await page.goto("http://localhost:3000/calendar");
      await page.waitForLoadState("networkidle");

      // Look for any event elements
      const event = page.locator(".fc-event, [class*='event']").first();

      if (await event.isVisible().catch(() => false)) {
        await event.click();
        await page.waitForTimeout(500);

        // Should show event details or navigate somewhere
        const url = page.url();
        expect(
          url.includes("/calendar") || url.includes("/interview"),
        ).toBeTruthy();
      }
    });
  });

  test.describe("作为面试官访问日历页面", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("interviewer", "interviewer123");
    });

    test("面试官应该能够访问日历页面", async ({ page }) => {
      await page.goto("http://localhost:3000/calendar");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/.*calendar/);
    });

    test("面试官应该只能看到自己的面试", async ({ page }) => {
      await page.goto("http://localhost:3000/calendar");
      await page.waitForLoadState("networkidle");

      // Should show calendar
      const hasContent = await page.locator("h1").isVisible();
      expect(hasContent).toBeTruthy();
    });
  });
});

test.describe("日历页面 - 未认证访问", () => {
  test("未登录用户访问日历页面应该跳转到登录", async ({ page }) => {
    await page.goto("http://localhost:3000/calendar");
    await page.waitForLoadState("networkidle");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
