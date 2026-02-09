/**
 * Slack service actions
 */

import { ServiceAction } from '../types';

export const sendMessageAction: ServiceAction = {
  id: 'send_message',
  name: 'メッセージ送信',
  description: 'Slackチャンネルにメッセージを送信します',
  parameters: [
    {
      name: 'channel',
      type: 'string',
      required: true,
      description: 'チャンネル名（#general など）',
    },
    {
      name: 'message',
      type: 'string',
      required: true,
      description: '送信するメッセージ',
    },
    {
      name: 'thread',
      type: 'boolean',
      required: false,
      description: 'スレッドで返信',
      default: false,
    },
  ],
  execute: async (context, params) => {
    const page = await context.newPage();

    try {
      // Already navigated to workspace in session initialization

      // Search for channel
      await page.click('[data-qa="channel_search"]');
      await page.fill('[data-qa="channel_search"]', params.channel);
      await page.waitForTimeout(500);
      await page.press('[data-qa="channel_search"]', 'Enter');

      // Wait for channel to load
      await page.waitForSelector('[data-qa="message_input"]');

      // Type message
      await page.fill('[data-qa="message_input"]', params.message);
      await page.press('[data-qa="message_input"]', 'Enter');

      return {
        success: true,
        message: 'メッセージを送信しました',
        channel: params.channel,
      };
    } finally {
      await page.close();
    }
  },
};

export const readMessagesAction: ServiceAction = {
  id: 'read_messages',
  name: 'メッセージ取得',
  description: 'チャンネルのメッセージ一覧を取得します',
  parameters: [
    {
      name: 'channel',
      type: 'string',
      required: true,
      description: 'チャンネル名',
    },
    {
      name: 'limit',
      type: 'number',
      required: false,
      description: '取得件数',
      default: 10,
    },
  ],
  execute: async (context, params) => {
    const page = await context.newPage();
    const limit = params.limit || 10;

    try {
      // Navigate to channel
      await page.click('[data-qa="channel_search"]');
      await page.fill('[data-qa="channel_search"]', params.channel);
      await page.waitForTimeout(500);
      await page.press('[data-qa="channel_search"]', 'Enter');

      // Wait for messages
      await page.waitForSelector('[data-qa="virtual-list-item"]');

      // Extract messages
      const messages = await page.locator('[data-qa="virtual-list-item"]').all();
      const results = [];

      for (let i = 0; i < Math.min(messages.length, limit); i++) {
        const message = messages[i];
        const text = await message.textContent();
        results.push({ text: text?.trim() || '' });
      }

      return {
        success: true,
        channel: params.channel,
        count: results.length,
        messages: results,
      };
    } finally {
      await page.close();
    }
  },
};

export const searchWorkspaceAction: ServiceAction = {
  id: 'search_workspace',
  name: 'ワークスペース検索',
  description: 'ワークスペース全体からメッセージを検索します',
  parameters: [
    {
      name: 'query',
      type: 'string',
      required: true,
      description: '検索キーワード',
    },
    {
      name: 'limit',
      type: 'number',
      required: false,
      description: '取得件数',
      default: 20,
    },
  ],
  execute: async (context, params) => {
    const page = await context.newPage();
    const limit = params.limit || 20;

    try {
      // Open search (Cmd+G or Ctrl+G)
      await page.keyboard.press('Meta+G');
      await page.waitForSelector('[data-qa="search_input"]');

      // Enter search query
      await page.fill('[data-qa="search_input"]', params.query);
      await page.waitForTimeout(1000);

      // Extract search results
      const results = await page.locator('[data-qa="search_result"]').allTextContents();
      const limitedResults = results.slice(0, limit);

      return {
        success: true,
        query: params.query,
        count: limitedResults.length,
        results: limitedResults.map(text => ({ text })),
      };
    } finally {
      await page.close();
    }
  },
};

export const slackActions = [
  sendMessageAction,
  readMessagesAction,
  searchWorkspaceAction,
];
