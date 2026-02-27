import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator(
      'input[type="text"], input[name="username"], input[name="email"]',
    );
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator(
      'button[type="submit"], button:has-text("登录"), button:has-text("登录")',
    );
    this.errorMessage = page.locator(
      '[class*="error"], [class*="alert"], [role="alert"]',
    );
  }

  async goto() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }
}
