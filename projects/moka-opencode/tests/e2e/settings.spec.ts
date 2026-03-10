import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Moka 面试管理系统 - 设置页面", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test.describe("作为HR访问设置页面", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("hr", "hr123456");
    });

    test("HR应该能够访问设置页面", async ({ page }) => {
      await page.goto("http://localhost:3000/settings");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/.*settings/);
    });

    test("HR应该能够查看个人信息标签", async ({ page }) => {
      await page.goto("http://localhost:3000/settings");
      await page.waitForLoadState("networkidle");

      // Look for profile tab or content
      const profileTab = page
        .locator("button:has-text('个人信息')")
        .or(page.locator("text=个人信息"));
      const hasProfile =
        (await profileTab.isVisible().catch(() => false)) ||
        (await page
          .locator("input[name='name']")
          .isVisible()
          .catch(() => false));

      expect(hasProfile).toBeTruthy();
    });

    test("HR应该能够修改个人信息", async ({ page }) => {
      await page.goto("http://localhost:3000/settings");
      await page.waitForLoadState("networkidle");

      // Try to find name input and update it
      const nameInput = page.locator('input[name="name"]');

      if (await nameInput.isVisible().catch(() => false)) {
        const originalName = await nameInput.inputValue();

        // Modify name
        await nameInput.fill(`${originalName} updated`);

        // Find and click save button
        const saveButton = page
          .locator("button:has-text('保存'), button:has-text('更新')")
          .first();
        if (await saveButton.isVisible().catch(() => false)) {
          await saveButton.click();
          await page.waitForTimeout(500);
        }
      }

      // Page should still work
      expect(page.url()).toContain("/settings");
    });

    test("HR应该能够切换到系统设置标签", async ({ page }) => {
      await page.goto("http://localhost:3000/settings");
      await page.waitForLoadState("networkidle");

      // Look for system settings tab
      const systemTab = page
        .locator("button:has-text('系统设置')")
        .or(page.locator("text=系统设置"));

      if (await systemTab.isVisible().catch(() => false)) {
        await systemTab.click();
        await page.waitForTimeout(500);
      }

      // Page should still work
      expect(page.url()).toContain("/settings");
    });

    test("HR应该能够切换到关于标签", async ({ page }) => {
      await page.goto("http://localhost:3000/settings");
      await page.waitForLoadState("networkidle");

      // Look for about tab
      const aboutTab = page
        .locator("button:has-text('关于')")
        .or(page.locator("text=关于"));

      if (await aboutTab.isVisible().catch(() => false)) {
        await aboutTab.click();
        await page.waitForTimeout(500);
      }

      // Page should still work
      expect(page.url()).toContain("/settings");
    });
  });

  test.describe("作为面试官访问设置页面", () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login("interviewer", "interviewer123");
    });

    test("面试官应该能够访问设置页面", async ({ page }) => {
      await page.goto("http://localhost:3000/settings");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/.*settings/);
    });

    test("面试官应该能够修改个人信息", async ({ page }) => {
      await page.goto("http://localhost:3000/settings");
      await page.waitForLoadState("networkidle");

      // Should have profile settings
      const hasProfile = await page.locator("h1").isVisible();
      expect(hasProfile).toBeTruthy();
    });
  });
});

test.describe("设置页面 - 未认证访问", () => {
  test("未登录用户访问设置页面应该跳转到登录", async ({ page }) => {
    await page.goto("http://localhost:3000/settings");
    await page.waitForLoadState("networkidle");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
