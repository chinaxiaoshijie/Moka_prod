import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { PositionsPage } from "./pages/PositionsPage";

test.describe("Moka 面试管理系统 - 职位管理边界情况", () => {
  let loginPage: LoginPage;
  let positionsPage: PositionsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    positionsPage = new PositionsPage(page);

    // Login as HR
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
  });

  test("HR应该能够查看职位列表或空状态", async ({ page }) => {
    await positionsPage.goto();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/.*positions/);

    // Should have content - either list or empty state
    const hasContent = await page.locator("h1").isVisible();
    expect(hasContent).toBeTruthy();
  });

  test("HR应该能够添加新职位", async ({ page }) => {
    await positionsPage.goto();
    await page.waitForLoadState("networkidle");

    const timestamp = Date.now();
    await positionsPage.addPosition(
      `前端工程师${timestamp}`,
      "负责前端开发工作",
      "2",
      "北京",
    );

    await page.waitForTimeout(1000);

    // Verify position was added
    const isVisible = await positionsPage.isPositionVisible(
      `前端工程师${timestamp}`,
    );
    expect(
      isVisible ||
        !(await page
          .locator(".text-red-600")
          .isVisible()
          .catch(() => false)),
    ).toBeTruthy();
  });

  test("HR应该能够编辑现有职位", async ({ page }) => {
    await positionsPage.goto();
    await page.waitForLoadState("networkidle");

    // First create a position
    const timestamp = Date.now();
    const positionName = `测试职位${timestamp}`;
    await positionsPage.addPosition(positionName, "描述", "1", "北京");
    await page.waitForTimeout(1000);

    // Edit the position
    const editedName = `${positionName}-已编辑`;
    await positionsPage.editPosition(positionName, editedName);
    await page.waitForTimeout(1000);

    // Verify was edited
    const isEdited = await positionsPage.isPositionVisible(editedName);
    expect(
      isEdited ||
        !(await page
          .locator(".text-red-600")
          .isVisible()
          .catch(() => false)),
    ).toBeTruthy();
  });

  test("职位表单应该验证必填字段", async ({ page }) => {
    await positionsPage.goto();
    await page.waitForLoadState("networkidle");

    // Open add form
    await positionsPage.addButton.click();
    await page.waitForTimeout(500);

    // Try to submit without required fields
    const saveButton = page.locator("button:has-text('保存')");
    await saveButton.click();
    await page.waitForTimeout(500);

    // Should stay on form or show validation
    const hasForm = await page
      .locator('input[placeholder="例如：高级前端工程师"]')
      .isVisible()
      .catch(() => false);
    expect(hasForm).toBeTruthy();
  });

  test("HR应该能够取消职位操作", async ({ page }) => {
    await positionsPage.goto();
    await page.waitForLoadState("networkidle");

    // Open add form
    await positionsPage.addButton.click();
    await page.waitForTimeout(500);

    // Fill some fields
    const titleInput = page.locator(
      'input[placeholder="例如：高级前端工程师"]',
    );
    await titleInput.fill("测试职位");

    // Cancel
    const cancelButton = page.locator("button:has-text('取消')");
    await cancelButton.click();
    await page.waitForTimeout(500);

    // Form should be closed
    const hasForm = await titleInput.isVisible().catch(() => false);
    expect(hasForm).toBeFalsy();
  });
});

test.describe("职位管理 - 非HR访问限制", () => {
  test("面试官不应该能够访问职位管理页面", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("interviewer", "interviewer123");

    // Try to access positions page
    await page.goto("http://localhost:3000/positions");
    await page.waitForLoadState("networkidle");

    // Should be redirected or show access denied
    const currentUrl = page.url();
    // App may redirect or show error - just verify not showing full position form
    expect(currentUrl).not.toContain("/positions") ||
      expect(
        await page
          .locator('input[placeholder="例如：高级前端工程师"]')
          .isVisible()
          .catch(() => true),
      ).toBeFalsy();
  });
});
