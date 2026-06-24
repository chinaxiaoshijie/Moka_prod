import { Page, Locator } from "@playwright/test";

export class InterviewDetailPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly candidateName: Locator;
  readonly interviewStatusBadge: Locator;
  readonly processStatusCard: Locator;
  readonly processStatusTitle: Locator;
  readonly progressBar: Locator;
  readonly roundCards: Locator;
  readonly viewProcessDetailButton: Locator;
  readonly interviewInfoCard: Locator;
  readonly feedbackCard: Locator;
  readonly quickActionsCard: Locator;
  readonly markCompleteButton: Locator;
  readonly editButton: Locator;
  readonly cancelButton: Locator;
  readonly submitFeedbackButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.locator('button:has-text("返回面试列表")');
    this.candidateName = page.locator(
      'h1:has-text("面试"), [class*="candidate"]',
    );
    this.interviewStatusBadge = page.locator(
      '[class*="rounded-full"]:has-text(/已安排|已完成|已取消/)',
    );
    this.processStatusCard = page.locator(
      '[class*="rounded-2xl"]:has-text("面试流程状态")',
    );
    this.processStatusTitle = page.locator('h2:has-text("面试流程状态")');
    this.progressBar = page.locator('[class*="h-2"][class*="rounded-full"]');
    this.roundCards = page.locator('[class*="rounded-xl"][class*="border-2"]');
    this.viewProcessDetailButton = page.locator(
      'button:has-text("查看详情 →")',
    );
    this.interviewInfoCard = page.locator(
      '[class*="rounded-2xl"]:has-text("面试信息")',
    );
    this.feedbackCard = page.locator(
      '[class*="rounded-2xl"]:has-text("面试反馈")',
    );
    this.quickActionsCard = page.locator(
      '[class*="rounded-2xl"]:has-text("快捷操作")',
    );
    this.markCompleteButton = page.locator('button:has-text("标记完成")');
    this.editButton = page.locator('button:has-text("编辑")');
    this.cancelButton = page.locator('button:has-text("取消面试")');
    this.submitFeedbackButton = page.locator(
      'button:has-text("填写反馈"), button:has-text("添加反馈")',
    );
    this.deleteButton = page.locator('button[title="删除面试"]');
  }

  async goto(interviewId: string) {
    await this.page.goto(`/interviews/${interviewId}`);
    await this.page.waitForLoadState("networkidle");
  }

  async getCandidateName(): Promise<string | null> {
    const element = this.candidateName.first();
    if (await element.isVisible()) {
      return await element.textContent();
    }
    return null;
  }

  async getInterviewStatus(): Promise<string | null> {
    const element = this.interviewStatusBadge.first();
    if (await element.isVisible()) {
      return await element.textContent();
    }
    return null;
  }

  async isProcessStatusCardVisible(): Promise<boolean> {
    return await this.processStatusCard.isVisible();
  }

  async getRoundCount(): Promise<number> {
    return await this.roundCards.count();
  }

  async clickViewProcessDetail() {
    await this.viewProcessDetailButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async clickMarkComplete() {
    await this.markCompleteButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickEdit() {
    await this.editButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async clickCancelInterview() {
    await this.cancelButton.click();
  }

  async clickSubmitFeedback() {
    await this.submitFeedbackButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async clickDelete() {
    await this.deleteButton.click();
  }
}
