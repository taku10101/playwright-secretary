#!/usr/bin/env tsx
/**
 * freee会計ログイン＆ページ遷移スクリプト
 * ログイン後に指定されたページに遷移します
 */

import { config } from 'dotenv';
import { chromium } from 'playwright';
import { ActionExecutor } from '../lib/actions/executor';
import { ActionLibrary } from '../lib/actions/library';

// 環境変数の読み込み
config();

async function main() {
  let browser;

  try {
    // コマンドライン引数から遷移先URLを取得
    const targetUrl = process.argv[2];

    if (!targetUrl) {
      console.error('❌ エラー: 遷移先URLを指定してください');
      console.error('\n使い方:');
      console.error('  pnpm tsx scripts/freee-login-and-navigate.ts <URL>');
      console.error('\n例:');
      console.error('  pnpm tsx scripts/freee-login-and-navigate.ts https://secure.freee.co.jp/');
      process.exit(1);
    }

    if (!targetUrl.startsWith('https://secure.freee.co.jp/')) {
      console.error('❌ エラー: URLは https://secure.freee.co.jp/ で始まる必要があります');
      process.exit(1);
    }

    console.log('🚀 freee会計へのログインと遷移を開始します...\n');

    // 環境変数から認証情報を取得
    const email = process.env.NEXT_PUBLIC_FREEE_EMAIL;
    const password = process.env.NEXT_PUBLIC_FREEE_PASSWORD;

    if (!email || !password) {
      console.error('❌ エラー: 環境変数が設定されていません');
      console.error('   NEXT_PUBLIC_FREEE_EMAIL と NEXT_PUBLIC_FREEE_PASSWORD を .env ファイルに設定してください\n');
      process.exit(1);
    }

    console.log(`📧 メールアドレス: ${email}`);
    console.log(`🔒 パスワード: ${'*'.repeat(password.length)}`);
    console.log(`🎯 遷移先URL: ${targetUrl}\n`);

    // ActionLibraryとExecutorの初期化
    const library = new ActionLibrary();
    const executor = new ActionExecutor();

    // アクションを取得
    const loginAction = await library.get('freee-login', 'freee');
    const navigateAction = await library.get('freee-navigate-after-login', 'freee');

    if (!loginAction || !navigateAction) {
      console.error('❌ エラー: 必要なアクションパターンが見つかりません');
      console.error('   以下のファイルが存在することを確認してください:');
      console.error('   - .config/actions/freee/freee-login.json');
      console.error('   - .config/actions/freee/freee-navigate-after-login.json\n');
      process.exit(1);
    }

    console.log('✅ アクションパターンを読み込みました');
    console.log(`   1. ${loginAction.name} (${loginAction.steps.length}ステップ)`);
    console.log(`   2. ${navigateAction.name} (${navigateAction.steps.length}ステップ)\n`);

    // ブラウザの起動
    console.log('🌐 ブラウザを起動中...');
    browser = await chromium.launch({
      headless: false, // ブラウザを表示
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('✅ ブラウザを起動しました\n');

    // Step 1: ログイン実行
    console.log('🔄 Step 1: ログイン処理を実行中...\n');

    const loginResult = await executor.execute(
      page,
      loginAction,
      {
        parameters: {
          email,
          password,
        },
        variables: {},
        config: {
          headless: false,
          timeout: 30000,
          retries: 1,
          screenshots: true,
        },
      }
    );

    if (!loginResult.success) {
      console.error('❌ ログインに失敗しました');
      console.error(`   エラー: ${loginResult.error}\n`);
      throw new Error('Login failed');
    }

    console.log('✅ ログインに成功しました\n');

    // Step 2: ページ遷移
    console.log('🔄 Step 2: ページ遷移を実行中...\n');

    const navigateResult = await executor.execute(
      page,
      navigateAction,
      {
        parameters: {
          targetUrl,
        },
        variables: {},
        config: {
          headless: false,
          timeout: 30000,
          retries: 1,
          screenshots: true,
        },
      }
    );

    // 結果の表示
    console.log('\n' + '='.repeat(60));
    if (navigateResult.success) {
      console.log('✅ ページ遷移に成功しました！');
      console.log(`   現在のURL: ${page.url()}`);
      console.log(`   実行時間: ${((loginResult.duration + navigateResult.duration) / 1000).toFixed(2)}秒`);

      const totalScreenshots = loginResult.screenshots.length + navigateResult.screenshots.length;
      if (totalScreenshots > 0) {
        console.log(`   スクリーンショット: ${totalScreenshots}枚保存`);
      }
    } else {
      console.log('❌ ページ遷移に失敗しました');
      console.log(`   エラー: ${navigateResult.error}`);
    }
    console.log('='.repeat(60) + '\n');

    // ブラウザを開いたままにする（操作確認のため）
    console.log('💡 ブラウザは開いたままです。操作を確認してください。');
    console.log('   終了するには Ctrl+C を押してください。\n');

    // プロセスを終了させない
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ 予期しないエラーが発生しました:');
    console.error(error);

    // エラー時もブラウザを閉じる
    if (browser) {
      try {
        await browser.close();
        console.log('✅ ブラウザを閉じました\n');
      } catch (closeError) {
        console.error('ブラウザのクローズに失敗しました:', closeError);
      }
    }

    process.exit(1);
  }

  // シグナルハンドラー: Ctrl+C でブラウザをクリーンに終了
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 終了シグナルを受信しました...');
    if (browser) {
      try {
        await browser.close();
        console.log('✅ ブラウザを閉じました\n');
      } catch (error) {
        console.error('ブラウザのクローズに失敗しました:', error);
      }
    }
    process.exit(0);
  });
}

main();
