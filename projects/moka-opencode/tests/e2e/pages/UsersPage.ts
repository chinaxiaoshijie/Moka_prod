import { type Page, type Locator, expect } from "@playwright/test";

export class UsersPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly userTable: Locator;
  readonly tableRows: Locator;
  readonly loadingText: Locator;
  readonly emptyText: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  // Modal elements
  readonly modal: Locator;
  readonly modalHeading: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("h1:has-text('用户管理')");
    // Use .first() to get the main add button (not the submit button in modal)
    this.addButton = page.locator("button:has-text('添加用户')").first();
    this.userTable = page.locator("table");
    this.tableRows = this.userTable.locator("tbody tr");
    this.loadingText = page.locator("text=加载中...");
    this.emptyText = page.locator("text=暂无用户");
    // Use more specific selector for error message - not matching delete buttons
    this.errorMessage = page.locator("div.text-red-600, p.text-red-600, span.text-red-600");
    this.successMessage = page.locator(".text-green-600:not(button)");

    // Modal
    this.modal = page.locator("h2:has-text('添加用户')").locator("xpath=../..");
    this.modalHeading = page.locator("h2:has-text('添加用户')");
    this.usernameInput = page.locator('input[placeholder="请输入用户名"]');
    this.passwordInput = page.locator('input[placeholder="请输入密码"]');
    this.nameInput = page.locator('input[placeholder="请输入姓名"]');
    this.emailInput = page.locator('input[placeholder="请输入邮箱（选填）"]');
    this.roleSelect = page.locator("select");
    // Use type='submit' selector for modal submit button
    this.submitButton = page.locator("button[type='submit']:has-text('添加用户')");
    this.cancelButton = page.locator("button:has-text('取消')");
  }

  async goto() {
    await this.page.goto("http://localhost:3000/users");
    await this.page.waitForLoadState("networkidle");
  }

  async getUserCount(): Promise<number> {
    if (await this.emptyText.isVisible()) {
      return 0;
    }
    return await this.tableRows.count();
  }

  async isUserVisible(username: string): Promise<boolean> {
    return await this.userTable.locator(`text=${username}`).first().isVisible();
  }

  async openAddModal() {
    await this.addButton.click();
    await this.page.waitForTimeout(500);
  }

  async addUser(
    username: string,
    password: string,
    name: string,
    email?: string,
    role: "HR" | "INTERVIEWER" = "INTERVIEWER",
  ) {
    await this.openAddModal();

    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.nameInput.fill(name);
    if (email) {
      await this.emailInput.fill(email);
    }
    await this.roleSelect.selectOption(role);

    await this.submitButton.click();
    await this.page.waitForTimeout(1000);
  }

  async deleteUser(username: string) {
    // Find the row with the username and click delete
    const row = this.userTable.locator(`tbody tr:has-text('${username}')`);
    const deleteButton = row.locator("button:has-text('删除')");
    await deleteButton.click();

    // Handle confirm dialog
    this.page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await this.page.waitForTimeout(1000);
  }

  async getErrorMessage(): Promise<string | null> {
    // Use first() to avoid strict mode violation with multiple elements
    const errorLocator = this.page.locator("div.text-red-600, p.text-red-600, span.text-red-600").first();
    if (await errorLocator.isVisible()) {
      return await errorLocator.textContent();
    }
    return null;
  }
}
