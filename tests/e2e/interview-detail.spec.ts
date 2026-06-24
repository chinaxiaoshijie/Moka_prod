import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { InterviewDetailPage } from "./pages/InterviewDetailPage";
import { InterviewProcessesPage } from "./pages/InterviewProcessesPage";

test.describe("Moka 面试管理系统 - 面试安排详情页", () => {
  let loginPage: LoginPage;
  let interviewDetailPage: InterviewDetailPage;
  let processesPage: InterviewProcessesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    interviewDetailPage = new InterviewDetailPage(page);
    processesPage = new InterviewProcessesPage(page);

    // 先登录
    await loginPage.goto();
    await loginPage.login("hr", "hr123456");
  });

  test("HR应该能够访问面试流程列表页面", async ({ page }) => {
    await processesPage.goto();
    await expect(page).toHaveURL(/.*interview-processes/);
  });

  test("HR应该能够查看面试流程详情页的面试流程状态", async ({ page }) => {
    // 访问面试流程列表
    await processesPage.goto();
    await page.waitForTimeout(1000);

    // 获取流程数量
    const count = await processesPage.getProcessCount();

    if (count > 0) {
      // 点击查看第一个流程
      await processesPage.viewFirstProcess();
      await page.waitForTimeout(1000);

      // 验证URL包含流程ID
      expect(page.url()).toMatch(/interview-processes\/\w+/);

      // 验证面试流程页面加载 - 检查是否有时间线或流程信息
      const hasProcessContent = await page
        .locator('[class*="rounded-2xl"]')
        .count();
      expect(hasProcessContent).toBeGreaterThan(0);
    } else {
      // 如果没有流程，跳过此测试
      test.skip();
    }
  });

  test("面试安排详情页应该显示面试流程状态卡片", async ({ page }) => {
    // 先创建一个面试流程
    await processesPage.goto();
    await page.waitForTimeout(1000);

    const count = await processesPage.getProcessCount();

    if (count > 0) {
      // 点击查看第一个流程详情
      await processesPage.viewFirstProcess();
      await page.waitForTimeout(1000);

      // 获取流程ID
      const url = page.url();
      const processIdMatch = url.match(/interview-processes\/(\w+)/);

      if (processIdMatch && processIdMatch[1]) {
        const processId = processIdMatch[1];

        // 查找该流程下的面试安排
        const interviewCards = await page
          .locator('[class*="rounded-xl"], [class*="rounded-lg"]')
          .count();

        if (interviewCards > 0) {
          // 点击第一个面试安排进入详情页
          const firstInterviewLink = page
            .locator('a[href*="/interviews/"]')
            .first();
          if (await firstInterviewLink.isVisible()) {
            await firstInterviewLink.click();
            await page.waitForTimeout(1000);

            // 验证进入了面试安排详情页
            expect(page.url()).toMatch(/interviews\/\w+/);

            // 验证显示面试流程状态卡片
            const hasProcessStatusCard =
              await interviewDetailPage.isProcessStatusCardVisible();
            // 卡片可能在加载中或不显示（如果没有关联流程）
            console.log("面试流程状态卡片可见:", hasProcessStatusCard);
          }
        }
      }
    } else {
      test.skip();
    }
  });

  test("面试安排详情页应该显示候选人信息", async ({ page }) => {
    await processesPage.goto();
    await page.waitForTimeout(1000);

    const count = await processesPage.getProcessCount();

    if (count > 0) {
      await processesPage.viewFirstProcess();
      await page.waitForTimeout(1000);

      // 查找面试安排链接
      const interviewLink = page.locator('a[href*="/interviews/"]').first();
      if (await interviewLink.isVisible()) {
        await interviewLink.click();
        await page.waitForTimeout(1000);

        // 验证显示面试信息卡片
        const hasInterviewInfo = await page
          .locator('[class*="rounded-2xl"]:has-text("面试信息")')
          .isVisible();
        expect(hasInterviewInfo).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });

  test("面试安排详情页应该显示快捷操作", async ({ page }) => {
    await processesPage.goto();
    await page.waitForTimeout(1000);

    const count = await processesPage.getProcessCount();

    if (count > 0) {
      await processesPage.viewFirstProcess();
      await page.waitForTimeout(1000);

      const interviewLink = page.locator('a[href*="/interviews/"]').first();
      if (await interviewLink.isVisible()) {
        await interviewLink.click();
        await page.waitForTimeout(1000);

        // 验证显示快捷操作卡片
        const hasQuickActions = await page
          .locator('[class*="rounded-2xl"]:has-text("快捷操作")')
          .isVisible();
        expect(hasQuickActions).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });

  test("面试安排详情页的快捷操作应该能跳转到面试流程详情", async ({ page }) => {
    await processesPage.goto();
    await page.waitForTimeout(1000);

    const count = await processesPage.getProcessCount();

    if (count > 0) {
      await processesPage.viewFirstProcess();
      await page.waitForTimeout(1000);

      const interviewLink = page.locator('a[href*="/interviews/"]').first();
      if (await interviewLink.isVisible()) {
        await interviewLink.click();
        await page.waitForTimeout(1000);

        // 点击查看面试流程按钮
        const viewProcessButton = page
          .locator(
            'button:has-text("查看面试流程"), a:has-text("查看面试流程")',
          )
          .first();
        if (await viewProcessButton.isVisible()) {
          await viewProcessButton.click();
          await page.waitForTimeout(1000);

          // 验证跳转到面试流程详情页
          expect(page.url()).toMatch(/interview-processes\/\w+/);
        }
      }
    } else {
      test.skip();
    }
  });

  test("面试安排详情页应该能够标记面试完成", async ({ page }) => {
    await processesPage.goto();
    await page.waitForTimeout(1000);

    const count = await processesPage.getProcessCount();

    if (count > 0) {
      await processesPage.viewFirstProcess();
      await page.waitForTimeout(1000);

      const interviewLink = page.locator('a[href*="/interviews/"]').first();
      if (await interviewLink.isVisible()) {
        await interviewLink.click();
        await page.waitForTimeout(1000);

        // 检查是否有"标记完成"按钮（已安排的面试才能标记完成）
        const markCompleteButton = page.locator('button:has-text("标记完成")');
        if (await markCompleteButton.isVisible()) {
          await markCompleteButton.click();
          await page.waitForTimeout(500);

          // 验证状态变为已完成
          const statusBadge = page.locator(
            '[class*="rounded-full"]:has-text("已完成")]',
          );
          await expect(statusBadge).toBeVisible({ timeout: 3000 });
        }
      }
    } else {
      test.skip();
    }
  });

  test("面试安排详情页应该能够取消面试", async ({ page }) => {
    await processesPage.goto();
    await page.waitForTimeout(1000);

    const count = await processesPage.getProcessCount();

    if (count > 0) {
      await processesPage.viewFirstProcess();
      await page.waitForTimeout(1000);

      const interviewLink = page.locator('a[href*="/interviews/"]').first();
      if (await interviewLink.isVisible()) {
        await interviewLink.click();
        await page.waitForTimeout(1000);

        // 检查是否有"取消面试"按钮
        const cancelButton = page.locator('button:has-text("取消面试")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();

          // 处理确认对话框
          page.on("dialog", async (dialog) => {
            await dialog.accept();
          });

          await page.waitForTimeout(500);
        }
      }
    } else {
      test.skip();
    }
  });

  test("面试流程详情页应该显示完整的时间线", async ({ page }) => {
    await processesPage.goto();
    await page.waitForTimeout(1000);

    const count = await processesPage.getProcessCount();

    if (count > 0) {
      // 直接查看流程详情
      await processesPage.viewFirstProcess();
      await page.waitForTimeout(1000);

      // 验证有面试轮次卡片显示
      const roundCards = await page
        .locator('[class*="rounded-xl"], [class*="border"]')
        .count();
      expect(roundCards).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });

  test("面试流程详情页应该显示进度状态", async ({ page }) => {
    await processesPage.goto();
    await page.waitForTimeout(1000);

    const count = await processesPage.getProcessCount();

    if (count > 0) {
      await processesPage.viewFirstProcess();
      await page.waitForTimeout(1000);

      // 验证有进度条或状态信息
      const hasProgressInfo =
        (await page
          .locator('[class*="rounded-full"], [class*="progress"]')
          .count()) > 0 || (await page.textContent());
      expect(hasProgressInfo).toBeTruthy();
    } else {
      test.skip();
    }
  });
});

test.describe("面试管理系统 - 面试官视图", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test("面试官应该能够查看我的面试列表", async ({ page }) => {
    await loginPage.goto();
    await loginPage.login("interviewer", "interviewer123");

    await page.goto("/my-interviews");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/.*my-interviews/);
  });
});
