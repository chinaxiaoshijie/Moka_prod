import { Page, Locator } from "@playwright/test";

export class InterviewProcessesPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly processList: Locator;
  readonly viewDetailsButton: Locator;
  readonly scheduleInterviewButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator(
      'button:has-text("创建"), button:has-text("新建流程")',
    );
    this.processList = page.locator(
      '[class*="process"], [data-testid="process-item"]',
    );
    this.viewDetailsButton = page.locator(
      'button:has-text("查看"), a:has-text("详情")',
    );
    this.scheduleInterviewButton = page.locator(
      'button:has-text("安排面试"), button:has-text("预约")',
    );
    this.successMessage = page.locator(
      '[class*="success"], [class*="toast"]:has-text("成功")',
    );
  }

  async goto() {
    await this.page.goto("/interview-processes");
    await this.page.waitForLoadState("networkidle");
  }

  async getProcessCount(): Promise<number> {
    return await this.processList.count();
  }

  async viewFirstProcess() {
    await this.processList.first().click();
    await this.page.waitForLoadState("networkidle");
  }
}
