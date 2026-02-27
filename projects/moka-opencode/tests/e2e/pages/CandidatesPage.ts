import { Page, Locator } from "@playwright/test";

export class CandidatesPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly nameInput: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly saveButton: Locator;
  readonly candidateList: Locator;
  readonly searchInput: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.locator(
      'button:has-text("添加"), button:has-text("新增"), [data-testid="add-candidate"]',
    );
    this.nameInput = page.locator(
      'input[name="name"], input[placeholder*="姓名"]',
    );
    this.phoneInput = page.locator(
      'input[name="phone"], input[placeholder*="电话"]',
    );
    this.emailInput = page.locator(
      'input[name="email"], input[placeholder*="邮箱"]',
    );
    this.saveButton = page.locator(
      'button:has-text("保存"), button:has-text("提交"), button[type="submit"]',
    );
    this.candidateList = page.locator(
      '[class*="candidate"], [data-testid="candidate-item"], table tbody tr',
    );
    this.searchInput = page.locator(
      'input[placeholder*="搜索"], input[type="search"]',
    );
    this.successMessage = page.locator(
      '[class*="success"], [class*="toast"]:has-text("成功")',
    );
  }

  async goto() {
    await this.page.goto("/candidates");
    await this.page.waitForLoadState("networkidle");
  }

  async addCandidate(name: string, phone: string, email: string) {
    if (await this.addButton.isVisible()) {
      await this.addButton.click();
    }
    await this.page.waitForTimeout(500);

    await this.nameInput.fill(name);
    await this.phoneInput.fill(phone);
    await this.emailInput.fill(email);
    await this.saveButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async searchCandidate(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.page.waitForTimeout(500);
  }

  async getCandidateCount(): Promise<number> {
    return await this.candidateList.count();
  }

  async isCandidateVisible(name: string): Promise<boolean> {
    return await this.page
      .getByText(name, { exact: false })
      .first()
      .isVisible();
  }
}
