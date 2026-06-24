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
    this.nameInput = page.locator('input[placeholder="候选人姓名"]');
    this.phoneInput = page.locator('input[placeholder="手机号码"]');
    this.emailInput = page.locator('input[placeholder="邮箱地址（选填）"]');
    this.saveButton = page.locator('button:has-text("添加并启动流程")');
    this.candidateList = page.locator(
      '[class*="candidate"], [data-testid="candidate-item"], table tbody tr',
    );
    this.searchInput = page.locator('input[placeholder="姓名、电话"]');
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

    // Wait for modal to be visible
    await this.nameInput.waitFor({ state: "visible", timeout: 5000 });
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
