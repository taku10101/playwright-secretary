#!/usr/bin/env tsx
/**
 * freeeログインページ探索スクリプト
 * 実際のページ構造を確認してセレクターを特定
 */

import { chromium } from 'playwright';

async function exploreFreeeLogin() {
  console.log('🔍 freeeログインページを探索します...\n');

  const browser = await chromium.launch({
    headless: false,
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('📍 freeeログインページに遷移中...');
    await page.goto('https://accounts.secure.freee.co.jp/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    console.log('✅ ページ読み込み完了\n');

    // ページのタイトルを取得
    const title = await page.title();
    console.log(`📄 ページタイトル: ${title}\n`);

    // 現在のURLを取得
    const url = page.url();
    console.log(`🔗 現在のURL: ${url}\n`);

    // ページのHTMLを一部取得
    console.log('🔎 フォーム要素を探索中...\n');

    // メールアドレス入力フィールドを探す
    console.log('📧 メールアドレス入力フィールド:');
    const emailSelectors = [
      'input[type="email"]',
      'input[name*="email"]',
      'input[name*="mail"]',
      'input[id*="email"]',
      'input[id*="mail"]',
      'input[placeholder*="メール"]',
      'input[placeholder*="mail"]',
      'input[placeholder*="email"]',
    ];

    for (const selector of emailSelectors) {
      try {
        const element = await page.locator(selector).first();
        const count = await page.locator(selector).count();
        if (count > 0) {
          const attrs = await element.evaluate((el) => ({
            tagName: el.tagName,
            type: el.getAttribute('type'),
            name: el.getAttribute('name'),
            id: el.getAttribute('id'),
            className: el.getAttribute('class'),
            placeholder: el.getAttribute('placeholder'),
          }));
          console.log(`  ✅ 見つかりました: ${selector} (${count}個)`);
          console.log(`     属性:`, JSON.stringify(attrs, null, 2));
        }
      } catch (e) {
        // セレクターが見つからない場合はスキップ
      }
    }
    console.log('');

    // パスワード入力フィールドを探す
    console.log('🔒 パスワード入力フィールド:');
    const passwordSelectors = [
      'input[type="password"]',
      'input[name*="password"]',
      'input[id*="password"]',
      'input[placeholder*="パスワード"]',
      'input[placeholder*="password"]',
    ];

    for (const selector of passwordSelectors) {
      try {
        const element = await page.locator(selector).first();
        const count = await page.locator(selector).count();
        if (count > 0) {
          const attrs = await element.evaluate((el) => ({
            tagName: el.tagName,
            type: el.getAttribute('type'),
            name: el.getAttribute('name'),
            id: el.getAttribute('id'),
            className: el.getAttribute('class'),
            placeholder: el.getAttribute('placeholder'),
          }));
          console.log(`  ✅ 見つかりました: ${selector} (${count}個)`);
          console.log(`     属性:`, JSON.stringify(attrs, null, 2));
        }
      } catch (e) {
        // セレクターが見つからない場合はスキップ
      }
    }
    console.log('');

    // ログインボタンを探す
    console.log('🔘 ログインボタン:');
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("ログイン")',
      'button:has-text("Login")',
      'button:has-text("サインイン")',
      'a:has-text("ログイン")',
    ];

    for (const selector of buttonSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const element = await page.locator(selector).first();
          const attrs = await element.evaluate((el) => ({
            tagName: el.tagName,
            type: el.getAttribute('type'),
            name: el.getAttribute('name'),
            id: el.getAttribute('id'),
            className: el.getAttribute('class'),
            textContent: el.textContent?.trim(),
          }));
          console.log(`  ✅ 見つかりました: ${selector} (${count}個)`);
          console.log(`     属性:`, JSON.stringify(attrs, null, 2));
        }
      } catch (e) {
        // セレクターが見つからない場合はスキップ
      }
    }
    console.log('');

    // フォーム全体の構造を取得
    console.log('📋 フォーム構造:');
    const forms = await page.locator('form').count();
    console.log(`  フォーム数: ${forms}個\n`);

    for (let i = 0; i < forms; i++) {
      const form = page.locator('form').nth(i);
      const formAttrs = await form.evaluate((el) => ({
        action: el.getAttribute('action'),
        method: el.getAttribute('method'),
        id: el.getAttribute('id'),
        className: el.getAttribute('class'),
      }));
      console.log(`  フォーム ${i + 1}:`, JSON.stringify(formAttrs, null, 2));

      // フォーム内のinput要素を取得
      const inputs = await form.locator('input').count();
      console.log(`    Input要素: ${inputs}個`);

      for (let j = 0; j < inputs; j++) {
        const input = form.locator('input').nth(j);
        const inputAttrs = await input.evaluate((el) => ({
          type: el.getAttribute('type'),
          name: el.getAttribute('name'),
          id: el.getAttribute('id'),
          placeholder: el.getAttribute('placeholder'),
        }));
        console.log(`      Input ${j + 1}:`, JSON.stringify(inputAttrs, null, 2));
      }
      console.log('');
    }

    console.log('\n💡 ブラウザは開いたままです。ページを手動で確認できます。');
    console.log('   終了するには Ctrl+C を押してください。\n');

    // プロセスを終了させない
    await new Promise(() => {});
  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error);
    await browser.close();
    process.exit(1);
  }

  // シグナルハンドラー: Ctrl+C でブラウザをクリーンに終了
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 終了シグナルを受信しました...');
    try {
      await browser.close();
      console.log('✅ ブラウザを閉じました\n');
    } catch (error) {
      console.error('ブラウザのクローズに失敗しました:', error);
    }
    process.exit(0);
  });
}

exploreFreeeLogin();
