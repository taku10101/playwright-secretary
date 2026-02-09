/**
 * Gmail service adapter
 */

import { BrowserContext, Page } from 'playwright';
import { ServiceAdapter, ServiceConfig } from '../../config/services';

export class GmailAdapter implements ServiceAdapter {
  private page: Page | null = null;

  constructor(
    private context: BrowserContext,
    private config: ServiceConfig
  ) {}

  async initialize(): Promise<void> {
    this.page = await this.context.newPage();

    // Navigate to Gmail
    await this.page.goto('https://mail.google.com');
    await this.page.waitForLoadState('networkidle');

    // Check if already logged in
    const isLoggedIn = await this.page.locator('[aria-label="Compose"]').isVisible().catch(() => false);

    if (!isLoggedIn) {
      // Wait for manual login or session restore
      console.log('Waiting for Gmail authentication...');
      await this.page.waitForSelector('[aria-label="Compose"]', { timeout: 60000 });
    }

    console.log('Gmail session initialized');
  }

  async execute(action: string, parameters: Record<string, unknown>): Promise<unknown> {
    if (!this.page) {
      throw new Error('Gmail adapter not initialized');
    }

    switch (action) {
      case 'send_email':
        return await this.sendEmail(parameters);
      case 'read_emails':
        return await this.readEmails(parameters);
      case 'search':
        return await this.search(parameters);
      default:
        throw new Error(`Unknown Gmail action: ${action}`);
    }
  }

  private async sendEmail(params: Record<string, unknown>): Promise<{ success: boolean }> {
    if (!this.page) throw new Error('Page not initialized');

    const { to, subject, body } = params as { to: string; subject: string; body: string };

    // Click compose button
    await this.page.click('[aria-label="Compose"]');
    await this.page.waitForSelector('[aria-label="To"]');

    // Fill in recipient
    await this.page.fill('[aria-label="To"]', to);

    // Fill in subject
    await this.page.fill('[name="subjectbox"]', subject);

    // Fill in body
    await this.page.locator('[aria-label="Message Body"]').fill(body);

    // Send
    await this.page.click('[aria-label="Send"]');

    // Wait for sent confirmation
    await this.page.waitForSelector('text=Message sent', { timeout: 10000 });

    return { success: true };
  }

  private async readEmails(params: Record<string, unknown>): Promise<unknown[]> {
    if (!this.page) throw new Error('Page not initialized');

    const { limit = 10 } = params as { limit?: number };

    // Get email list
    const emails = await this.page.locator('[role="main"] [role="row"]').all();
    const results = [];

    for (let i = 0; i < Math.min(emails.length, limit); i++) {
      const email = emails[i];
      const subject = await email.locator('[role="link"]').textContent();
      results.push({ subject });
    }

    return results;
  }

  private async search(params: Record<string, unknown>): Promise<unknown[]> {
    if (!this.page) throw new Error('Page not initialized');

    const { query } = params as { query: string };

    // Click search box and enter query
    await this.page.fill('[aria-label="Search mail"]', query);
    await this.page.press('[aria-label="Search mail"]', 'Enter');

    // Wait for results
    await this.page.waitForLoadState('networkidle');

    // Extract results
    return await this.readEmails({ limit: 20 });
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
  }
}
