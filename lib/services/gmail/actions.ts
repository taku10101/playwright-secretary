/**
 * Gmail service actions
 */

import { ServiceAction } from '../types';

export const sendEmailAction: ServiceAction = {
  id: 'send_email',
  name: 'メール送信',
  description: 'Gmailでメールを送信します',
  parameters: [
    {
      name: 'to',
      type: 'string',
      required: true,
      description: '宛先メールアドレス',
    },
    {
      name: 'subject',
      type: 'string',
      required: true,
      description: '件名',
    },
    {
      name: 'body',
      type: 'string',
      required: true,
      description: '本文',
    },
    {
      name: 'cc',
      type: 'string',
      required: false,
      description: 'CCメールアドレス',
    },
    {
      name: 'bcc',
      type: 'string',
      required: false,
      description: 'BCCメールアドレス',
    },
  ],
  execute: async (context, params) => {
    const page = await context.newPage();

    try {
      await page.goto('https://mail.google.com');
      await page.waitForLoadState('networkidle');

      // Compose button
      await page.click('[aria-label="Compose"]');
      await page.waitForSelector('[aria-label="To"]');

      // To
      await page.fill('[aria-label="To"]', params.to);

      // CC
      if (params.cc) {
        await page.click('[aria-label="Add Cc recipients"]');
        await page.fill('[name="cc"]', params.cc);
      }

      // BCC
      if (params.bcc) {
        await page.click('[aria-label="Add Bcc recipients"]');
        await page.fill('[name="bcc"]', params.bcc);
      }

      // Subject
      await page.fill('[name="subjectbox"]', params.subject);

      // Body
      await page.locator('[aria-label="Message Body"]').fill(params.body);

      // Send
      await page.click('[aria-label="Send"]');
      await page.waitForSelector('text=Message sent', { timeout: 10000 });

      return {
        success: true,
        message: 'メールを送信しました',
        sentTo: params.to,
      };
    } finally {
      await page.close();
    }
  },
};

export const readEmailsAction: ServiceAction = {
  id: 'read_emails',
  name: 'メール一覧取得',
  description: '受信トレイのメール一覧を取得します',
  parameters: [
    {
      name: 'limit',
      type: 'number',
      required: false,
      description: '取得件数',
      default: 10,
    },
    {
      name: 'unreadOnly',
      type: 'boolean',
      required: false,
      description: '未読のみ取得',
      default: false,
    },
  ],
  execute: async (context, params) => {
    const page = await context.newPage();
    const limit = params.limit || 10;

    try {
      await page.goto('https://mail.google.com');
      await page.waitForLoadState('networkidle');

      // Filter unread if requested
      if (params.unreadOnly) {
        await page.goto('https://mail.google.com/mail/u/0/#inbox/unread');
        await page.waitForLoadState('networkidle');
      }

      // Get email list
      const emails = await page.locator('[role="main"] [role="row"]').all();
      const results = [];

      for (let i = 0; i < Math.min(emails.length, limit); i++) {
        const email = emails[i];
        const subject = await email.locator('[role="link"]').textContent();
        const sender = await email.locator('[email]').getAttribute('email').catch(() => 'Unknown');

        results.push({
          subject: subject?.trim() || 'No subject',
          sender,
        });
      }

      return {
        success: true,
        count: results.length,
        emails: results,
      };
    } finally {
      await page.close();
    }
  },
};

export const searchEmailsAction: ServiceAction = {
  id: 'search_emails',
  name: 'メール検索',
  description: 'キーワードでメールを検索します',
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
      await page.goto('https://mail.google.com');
      await page.waitForLoadState('networkidle');

      // Search
      await page.fill('[aria-label="Search mail"]', params.query);
      await page.press('[aria-label="Search mail"]', 'Enter');
      await page.waitForLoadState('networkidle');

      // Get results
      const emails = await page.locator('[role="main"] [role="row"]').all();
      const results = [];

      for (let i = 0; i < Math.min(emails.length, limit); i++) {
        const email = emails[i];
        const subject = await email.locator('[role="link"]').textContent();

        results.push({
          subject: subject?.trim() || 'No subject',
        });
      }

      return {
        success: true,
        query: params.query,
        count: results.length,
        emails: results,
      };
    } finally {
      await page.close();
    }
  },
};

export const gmailActions = [
  sendEmailAction,
  readEmailsAction,
  searchEmailsAction,
];
