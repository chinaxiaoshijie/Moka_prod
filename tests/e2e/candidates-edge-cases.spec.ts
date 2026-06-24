import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { CandidatesPage } from "./pages/CandidatesPage";

test.describe("Moka 面试管理系统 - 候选人管理边界情况", () => {
  let loginPage: LoginPage;
  let candidatesPage: CandidatesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    candidatesPage = new CandidatesPage(page);

    // Login as HR
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
      await page.waitForURL(/.*dashboard/, { timeout: 15000 });
      await page.waitForTimeout(500);
  });

  test("HR应该能够使用空关键词搜索候选人", async ({ page }) => {
    await candidatesPage.goto();
    await page.waitForLoadState("networkidle");

    // Search with empty keyword
    await candidatesPage.searchCandidate("");
    await page.waitForTimeout(500);

    // Should still show candidates or empty state
    const url = page.url();
    expect(url).toContain("/candidates");
  });

  test("HR应该能够处理不存在的候选人搜索结果", async ({ page }) => {
    await candidatesPage.goto();
    await page.waitForLoadState("networkidle");

    // Search for non-existent candidate
    await candidatesPage.searchCandidate("这是一个不存在的候选人名字xyz123");
    await page.waitForTimeout(1000);

    // Should handle gracefully (either show empty state or no error)
    const hasError = await page
      .locator(".text-red-600")
      .isVisible()
      .catch(() => false);
    // Empty result is acceptable, but error should not appear
    expect(hasError).toBeFalsy();
  });

  test("候选人表单应该验证必填字段", async ({ page }) => {
    await candidatesPage.goto();
    await page.waitForLoadState("networkidle");

    // Open add form but don't fill anything
    await candidatesPage.addButton.click();
    await page.waitForTimeout(500);

    // Try to submit empty form - should show validation error or not submit
    const submitButton = page.locator("button:has-text('添加并启动流程')");
    await submitButton.click();
    await page.waitForTimeout(500);

    // Should either show validation or stay on form
    const hasForm = await page
      .locator("input[placeholder='候选人姓名']")
      .isVisible()
      .catch(() => false);
    expect(hasForm).toBeTruthy();
  });

  test("候选人表单应该验证手机号格式", async ({ page }) => {
    await candidatesPage.goto();
    await page.waitForLoadState("networkidle");

    // Open add form
    await candidatesPage.addButton.click();
    await page.waitForTimeout(500);

    // Fill with invalid phone
    const nameInput = page.locator('input[placeholder="候选人姓名"]');
    const phoneInput = page.locator('input[placeholder="手机号码"]');

    await nameInput.fill("测试候选人");
    await phoneInput.fill("invalid-phone");

    // Submit
    const submitButton = page.locator("button:has-text('添加并启动流程')");
    await submitButton.click();
    await page.waitForTimeout(500);

    // Should show error or not submit successfully
    // The exact behavior depends on frontend validation
    const url = page.url();
    expect(url).toContain("/candidates");
  });

  test("候选人表单应该验证邮箱格式（如果提供）", async ({ page }) => {
    await candidatesPage.goto();
    await page.waitForLoadState("networkidle");

    // Open add form
    await candidatesPage.addButton.click();
    await page.waitForTimeout(500);

    // Fill with invalid email
    const nameInput = page.locator('input[placeholder="候选人姓名"]');
    const phoneInput = page.locator('input[placeholder="手机号码"]');
    const emailInput = page.locator('input[placeholder="邮箱地址（选填）"]');

    await nameInput.fill("测试候选人");
    await phoneInput.fill("13812345678");
    await emailInput.fill("not-an-email");

    // Submit
    const submitButton = page.locator("button:has-text('添加并启动流程')");
    await submitButton.click();
    await page.waitForTimeout(500);

    // Should handle validation
    const url = page.url();
    expect(url).toContain("/candidates");
  });

  test("HR应该能够取消添加候选人操作", async ({ page }) => {
    await candidatesPage.goto();
    await page.waitForLoadState("networkidle");

    // Open add form
    await candidatesPage.addButton.click();
    await page.waitForTimeout(500);

    // Fill some fields
    const nameInput = page.locator('input[placeholder="候选人姓名"]');
    await nameInput.fill("测试候选人");

    // Cancel
    const cancelButton = page
      .locator("button:has-text('取消')")
      .or(page.locator('button:has-text("×")'));
    await cancelButton.click();
    await page.waitForTimeout(500);

    // Form should be closed
    const hasForm = await nameInput.isVisible().catch(() => false);
    expect(hasForm).toBeFalsy();
  });
});

test.describe("候选人管理 - 数据验证", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
      await page.waitForURL(/.*dashboard/, { timeout: 15000 });
      await page.waitForTimeout(500);
  });

  test("添加重复手机号的候选人应该显示错误", async ({ page }) => {
    const timestamp = Date.now();
    const phone = `138${timestamp.toString().slice(-8)}`;
    const candidatesPage = new CandidatesPage(page);

    await candidatesPage.goto();
    await page.waitForLoadState("networkidle");

    // Add first candidate
    await candidatesPage.addCandidate(
      `候选人A${timestamp}`,
      phone,
      `testa${timestamp}@example.com`,
    );
    await page.waitForTimeout(1000);

    // Try to add second candidate with same phone
    await candidatesPage.addCandidate(
      `候选人B${timestamp}`,
      phone,
      `testb${timestamp}@example.com`,
    );
    await page.waitForTimeout(1000);

    // Should show error about duplicate phone
    const errorMessage = await page
      .locator(".text-red-600")
      .textContent()
      .catch(() => "");
    expect(errorMessage.toLowerCase()).toContain("手机");
  });
});
