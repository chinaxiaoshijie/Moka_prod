import { Page, Locator } from "@playwright/test";

export class PositionsPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly headcountInput: Locator;
  readonly locationInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly positionTable: Locator;
  readonly positionRows: Locator;
  readonly searchInput: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.locator(
      'button:has-text("添加职位"), button:has-text("新建"), [data-testid="add-position"]',
    );
    this.titleInput = page.locator('input[placeholder="例如：高级前端工程师"]');
    this.descriptionInput = page.locator('textarea, input[name="description"]');
    this.headcountInput = page.locator('input[type="number"][min="1"]');
    this.locationInput = page.locator(
      'input[placeholder*="地点"], input[name="location"]',
    );
    this.saveButton = page.locator(
      'button:has-text("创建职位"), button:has-text("保存"), button:has-text("保存修改")',
    );
    this.cancelButton = page.locator('button:has-text("取消")');
    this.positionTable = page.locator("table");
    this.positionRows = this.positionTable.locator("tbody tr");
    this.searchInput = page.locator(
      'input[placeholder*="搜索"], input[type="search"]',
    );
    this.errorMessage = page.locator(".text-red-600, .text-red-500");
  }

  async goto() {
    await this.page.goto("/positions");
    await this.page.waitForLoadState("networkidle");
  }

  async addPosition(
    title: string,
    description?: string,
    headcount?: string,
    location?: string,
  ) {
    // Click add button if visible
    if (await this.addButton.isVisible().catch(() => false)) {
      await this.addButton.click();
    }
    await this.page.waitForTimeout(500);

    // Fill form
    if (title) {
      await this.titleInput.fill(title);
    }
    if (description) {
      const descInput = this.page
        .locator('textarea[name="description"], textarea')
        .first();
      if (await descInput.isVisible().catch(() => false)) {
        await descInput.fill(description);
      }
    }
    if (headcount) {
      const hcInput = this.page
        .locator('input[name="headcount"], input[type="number"]')
        .first();
      if (await hcInput.isVisible().catch(() => false)) {
        await hcInput.fill(headcount);
      }
    }
    if (location) {
      const locInput = this.page
        .locator('input[placeholder*="地点"], input[name="location"]')
        .first();
      if (await locInput.isVisible().catch(() => false)) {
        await locInput.fill(location);
      }
    }

    // Submit
    await this.saveButton.click();
    await this.page.waitForTimeout(1000);
  }

  async editPosition(oldTitle: string, newTitle: string) {
    // Find the row with the position
    const row = this.positionTable.locator(`tbody tr:has-text("${oldTitle}")`);

    // Click edit button
    const editButton = row.locator(
      "button:has-text('编辑'), button:has-text('修改')",
    );
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await this.page.waitForTimeout(500);

      // Edit the title
      await this.titleInput.fill(newTitle);
      await this.saveButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async deletePosition(title: string) {
    // Find the row with the position
    const row = this.positionTable.locator(`tbody tr:has-text("${title}")`);

    // Click delete button
    const deleteButton = row.locator(
      "button:has-text('删除'), button:has-text('删除职位')",
    );
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();

      // Handle confirm dialog
      this.page.on("dialog", async (dialog) => {
        await dialog.accept();
      });

      await this.page.waitForTimeout(1000);
    }
  }

  async isPositionVisible(title: string): Promise<boolean> {
    return await this.positionTable
      .locator(`text=${title}`)
      .first()
      .isVisible()
      .catch(() => false);
  }

  async getPositionCount(): Promise<number> {
    if (await this.positionTable.isVisible().catch(() => false)) {
      return await this.positionRows.count();
    }
    return 0;
  }

  async searchPosition(keyword: string) {
    if (await this.searchInput.isVisible().catch(() => false)) {
      await this.searchInput.fill(keyword);
      await this.page.waitForTimeout(500);
    }
  }

  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible().catch(() => false)) {
      return await this.errorMessage.textContent();
    }
    return null;
  }
}
