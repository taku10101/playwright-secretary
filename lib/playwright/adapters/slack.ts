/**
 * Slack service adapter
 */

import { BrowserContext, Page } from 'playwright';
import { ServiceAdapter, ServiceConfig } from '../../config/services';

export class SlackAdapter implements ServiceAdapter {
  private page: Page | null = null;

  constructor(
    private context: BrowserContext,
    private config: ServiceConfig
  ) {}

  async initialize(): Promise<void> {
    this.page = await this.context.newPage();

    const workspace = this.config.settings?.workspace as string || 'your-workspace';

    // Navigate to Slack workspace
    await this.page.goto(`https://${workspace}.slack.com`);
    await this.page.waitForLoadState('networkidle');

    console.log('Slack session initialized');
  }

  async execute(action: string, parameters: Record<string, unknown>): Promise<unknown> {
    if (!this.page) {
      throw new Error('Slack adapter not initialized');
    }

    switch (action) {
      case 'send_message':
        return await this.sendMessage(parameters);
      case 'read_messages':
        return await this.readMessages(parameters);
      default:
        throw new Error(`Unknown Slack action: ${action}`);
    }
  }

  private async sendMessage(params: Record<string, unknown>): Promise<{ success: boolean }> {
    if (!this.page) throw new Error('Page not initialized');

    const { channel, message } = params as { channel: string; message: string };

    // Search for channel
    await this.page.click('[data-qa="channel_search"]');
    await this.page.fill('[data-qa="channel_search"]', channel);
    await this.page.waitForTimeout(500);
    await this.page.press('[data-qa="channel_search"]', 'Enter');

    // Wait for channel to load
    await this.page.waitForSelector('[data-qa="message_input"]');

    // Type message
    await this.page.fill('[data-qa="message_input"]', message);
    await this.page.press('[data-qa="message_input"]', 'Enter');

    return { success: true };
  }

  private async readMessages(params: Record<string, unknown>): Promise<unknown[]> {
    if (!this.page) throw new Error('Page not initialized');

    const { channel, limit = 10 } = params as { channel: string; limit?: number };

    // Navigate to channel if specified
    if (channel) {
      await this.page.click('[data-qa="channel_search"]');
      await this.page.fill('[data-qa="channel_search"]', channel);
      await this.page.waitForTimeout(500);
      await this.page.press('[data-qa="channel_search"]', 'Enter');
    }

    // Wait for messages to load
    await this.page.waitForSelector('[data-qa="virtual-list-item"]');

    // Extract messages
    const messages = await this.page.locator('[data-qa="virtual-list-item"]').all();
    const results = [];

    for (let i = 0; i < Math.min(messages.length, limit); i++) {
      const message = messages[i];
      const text = await message.textContent();
      results.push({ text });
    }

    return results;
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
  }
}
