/**
 * Notion service adapter
 */

import { BrowserContext, Page } from 'playwright';
import { ServiceAdapter, ServiceConfig } from '../../config/services';

export class NotionAdapter implements ServiceAdapter {
  private page: Page | null = null;

  constructor(
    private context: BrowserContext,
    private config: ServiceConfig
  ) {}

  async initialize(): Promise<void> {
    this.page = await this.context.newPage();

    // Navigate to Notion
    await this.page.goto('https://www.notion.so');
    await this.page.waitForLoadState('networkidle');

    console.log('Notion session initialized');
  }

  async execute(action: string, parameters: Record<string, unknown>): Promise<unknown> {
    if (!this.page) {
      throw new Error('Notion adapter not initialized');
    }

    switch (action) {
      case 'create_page':
        return await this.createPage(parameters);
      case 'search':
        return await this.search(parameters);
      default:
        throw new Error(`Unknown Notion action: ${action}`);
    }
  }

  private async createPage(params: Record<string, unknown>): Promise<{ success: boolean; url?: string }> {
    if (!this.page) throw new Error('Page not initialized');

    const { title, content } = params as { title: string; content?: string };

    // Click new page button
    await this.page.click('[aria-label="New page"]');
    await this.page.waitForTimeout(1000);

    // Enter title
    await this.page.fill('[placeholder="Untitled"]', title);

    // Enter content if provided
    if (content) {
      await this.page.press('[placeholder="Untitled"]', 'Enter');
      await this.page.keyboard.type(content);
    }

    const url = this.page.url();

    return { success: true, url };
  }

  private async search(params: Record<string, unknown>): Promise<unknown[]> {
    if (!this.page) throw new Error('Page not initialized');

    const { query } = params as { query: string };

    // Open search (Cmd+K or Ctrl+K)
    await this.page.keyboard.press('Meta+K');
    await this.page.waitForSelector('[placeholder="Search"]');

    // Enter search query
    await this.page.fill('[placeholder="Search"]', query);
    await this.page.waitForTimeout(1000);

    // Extract search results
    const results = await this.page.locator('[role="option"]').allTextContents();

    return results.map(text => ({ text }));
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
  }
}
