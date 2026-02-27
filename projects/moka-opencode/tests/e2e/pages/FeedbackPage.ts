import { Page, Locator } from "@playwright/test";

export class FeedbackPage {
  readonly page: Page;
  readonly feedbackList: Locator;
  readonly submitButton: Locator;
  readonly ratingInput: Locator;
  readonly commentInput: Locator;
  readonly submitSuccessButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.feedbackList = page.locator(
      '[class*="feedback"], [data-testid="feedback-item"]',
    );
    this.submitButton = page.locator(
      'button:has-text("提交反馈"), button:has-text("评价")',
    );
    this.ratingInput = page.locator(
      '[class*="rating"], [class*="star"], input[type="radio"]',
    );
    this.commentInput = page.locator(
      'textarea, input[name="comment"], input[name="notes"]',
    );
    this.submitSuccessButton = page.locator(
      'button:has-text("确认提交"), button:has-text("提交")',
    );
  }

  async goto() {
    await this.page.goto("/feedback");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoMyInterviews() {
    await this.page.goto("/my-interviews");
    await this.page.waitForLoadState("networkidle");
  }

  async getFeedbackCount(): Promise<number> {
    return await this.feedbackList.count();
  }
}
