import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Moka 面试管理系统 - 通知系统", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // 先登录
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
  });

  test("HR应该能够查看通知列表", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");

    // 验证通知页面加载
    await expect(page).toHaveURL(/.*notifications/);
  });
});

test.describe("Moka 面试管理系统 - 数据分析", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // 先登录
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
  });

  test("HR应该能够查看数据分析仪表盘", async ({ page }) => {
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");

    // 验证分析页面加载
    await expect(page).toHaveURL(/.*analytics/);
  });

  test("HR应该能够查看招聘漏斗", async ({ page }) => {
    await page.goto("/analytics/funnel");
    await page.waitForLoadState("networkidle");

    // 验证漏斗页面加载
    const content = await page.content();
    expect(content).toContain("漏斗") || expect(content).toContain("funnel");
  });
});

test.describe("Moka 面试管理系统 - 面试日历", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // 先登录
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
  });

  test("HR应该能够查看面试日历", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    // 验证日历页面加载
    await expect(page).toHaveURL(/.*calendar/);
  });
});

test.describe("Moka 面试管理系统 - 设置页面", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // 先登录
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
  });

  test("HR应该能够访问设置页面", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // 验证设置页面加载
    await expect(page).toHaveURL(/.*settings/);
  });
});
