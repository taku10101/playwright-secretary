/**
 * Notion service actions
 */

import { ServiceAction } from '../types';

export const createPageAction: ServiceAction = {
  id: 'create_page',
  name: 'ページ作成',
  description: '新しいNotionページを作成します',
  parameters: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: 'ページタイトル',
    },
    {
      name: 'content',
      type: 'string',
      required: false,
      description: 'ページ本文',
    },
    {
      name: 'emoji',
      type: 'string',
      required: false,
      description: 'ページアイコン（絵文字）',
    },
  ],
  execute: async (context, params) => {
    const page = await context.newPage();

    try {
      await page.goto('https://www.notion.so');
      await page.waitForLoadState('networkidle');

      // Click new page button
      await page.click('[aria-label="New page"]');
      await page.waitForTimeout(1000);

      // Set emoji if provided
      if (params.emoji) {
        await page.click('[placeholder="Add icon"]');
        await page.fill('[placeholder="Search for an emoji"]', params.emoji);
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
      }

      // Enter title
      await page.fill('[placeholder="Untitled"]', params.title);

      // Enter content if provided
      if (params.content) {
        await page.press('[placeholder="Untitled"]', 'Enter');
        await page.keyboard.type(params.content);
      }

      const url = page.url();

      return {
        success: true,
        message: 'ページを作成しました',
        title: params.title,
        url,
      };
    } finally {
      await page.close();
    }
  },
};

export const searchPagesAction: ServiceAction = {
  id: 'search_pages',
  name: 'ページ検索',
  description: 'Notionページを検索します',
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
      await page.goto('https://www.notion.so');
      await page.waitForLoadState('networkidle');

      // Open search (Cmd+K or Ctrl+K)
      await page.keyboard.press('Meta+K');
      await page.waitForSelector('[placeholder="Search"]');

      // Enter search query
      await page.fill('[placeholder="Search"]', params.query);
      await page.waitForTimeout(1000);

      // Extract search results
      const results = await page.locator('[role="option"]').allTextContents();
      const limitedResults = results.slice(0, limit);

      return {
        success: true,
        query: params.query,
        count: limitedResults.length,
        pages: limitedResults.map(text => ({ title: text })),
      };
    } finally {
      await page.close();
    }
  },
};

export const createDatabaseAction: ServiceAction = {
  id: 'create_database',
  name: 'データベース作成',
  description: '新しいNotionデータベースを作成します',
  parameters: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: 'データベースタイトル',
    },
    {
      name: 'properties',
      type: 'array',
      required: false,
      description: 'プロパティ定義（名前と型の配列）',
    },
  ],
  execute: async (context, params) => {
    const page = await context.newPage();

    try {
      await page.goto('https://www.notion.so');
      await page.waitForLoadState('networkidle');

      // Click new page button
      await page.click('[aria-label="New page"]');
      await page.waitForTimeout(1000);

      // Enter title
      await page.fill('[placeholder="Untitled"]', params.title);

      // Convert to database
      await page.press('[placeholder="Untitled"]', 'Enter');
      await page.keyboard.type('/table');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');

      const url = page.url();

      return {
        success: true,
        message: 'データベースを作成しました',
        title: params.title,
        url,
      };
    } finally {
      await page.close();
    }
  },
};

export const addDatabaseRowAction: ServiceAction = {
  id: 'add_database_row',
  name: 'データベース行追加',
  description: 'データベースに新しい行を追加します',
  parameters: [
    {
      name: 'databaseUrl',
      type: 'string',
      required: true,
      description: 'データベースのURL',
    },
    {
      name: 'data',
      type: 'object',
      required: true,
      description: '行のデータ（プロパティ名と値）',
    },
  ],
  execute: async (context, params) => {
    const page = await context.newPage();

    try {
      await page.goto(params.databaseUrl);
      await page.waitForLoadState('networkidle');

      // Click "New" button to add row
      await page.click('[aria-label="New"]');
      await page.waitForTimeout(500);

      // Fill in data
      // Note: This is simplified - actual implementation would need
      // to handle different property types (text, select, date, etc.)
      for (const [, value] of Object.entries(params.data as Record<string, any>)) {
        await page.keyboard.type(String(value));
        await page.keyboard.press('Tab');
      }

      await page.keyboard.press('Escape');

      return {
        success: true,
        message: 'データベースに行を追加しました',
      };
    } finally {
      await page.close();
    }
  },
};

export const notionActions = [
  createPageAction,
  searchPagesAction,
  createDatabaseAction,
  addDatabaseRowAction,
];
