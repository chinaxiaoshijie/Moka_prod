import { Page, Locator } from "@playwright/test";

export class PositionsPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly titleInput: Locator;
  readonly departmentInput: Locator;
  readonly saveButton: Locator;
  readonly positionList: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.locator(
      'button:has-text("添加职位"), button:has-text("新建"), [data-testid="add-position"]',
    );
    this.titleInput = page.locator(
      'input[name="title"], input[placeholder*="职位"]',
    );
    this.departmentInput = page.locator(
      'input[name="department"], input[placeholder*="部门"]',
    );
    this.saveButton = page.locator(
      'button:has-text("保存"), button:has-text("提交")',
    );
    this.positionList = page.locator(
      '[class*="position"], [data-testid="position-item"]',
    );
    this.searchInput = page.locator(
      'input[placeholder*="搜索"], input[type="search"]',
    );
  }

  async goto() {
    await this.page.goto("/positions");
    await this.page.waitForLoadState("networkidle");
  }

  async addPosition(title: string, department: string) {
    if (await this.addButton.isVisible()) {
      await this.addButton.click();
    }
    await this.page.waitForTimeout(500);

    await this.titleInput.fill(title);
    await this.departmentInput.fill(department);
    await this.saveButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async getPositionCount(): Promise<number> {
    return await this.positionList.count();
  }
}
