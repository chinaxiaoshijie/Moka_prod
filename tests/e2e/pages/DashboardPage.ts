import { Page, Locator } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly welcomeText: Locator;
  readonly statisticsCards: Locator;
  readonly candidateCount: Locator;
  readonly interviewCount: Locator;
  readonly positionCount: Locator;
  readonly recentCandidates: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeText = page.locator('h1:has-text("欢迎回来"), h2:has-text("欢迎回来")').first();
    this.statisticsCards = page.locator('[class*="card"], [class*="statistic"]');
    this.candidateCount = page.locator('[class*="card"]:has-text("候选人")');
    this.interviewCount = page.locator('[class*="card"]:has-text("面试")');
    this.positionCount = page.locator('[class*="card"]:has-text("职位")');
    this.recentCandidates = page.locator('[class*="recent"], [data-testid="recent-candidates"]');
  }

  async goto() {
    await this.page.goto("/dashboard");
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(500);
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.welcomeText.isVisible();
  }

  async getStatisticCount(selector: Locator): Promise<string> {
    const text = await selector.textContent();
    const match = text?.match(/\d+/);
    return match ? match[0] : "0";
  }
}
