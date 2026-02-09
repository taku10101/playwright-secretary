#!/usr/bin/env tsx
/**
 * freee会計ログインスクリプト
 * 環境変数から認証情報を読み込んでログインを実行します
 * ログイン後、ブラウザは開いたまま維持されます
 */

import { config } from 'dotenv';
import { chromium } from 'playwright';
import { ActionExecutor } from '../lib/actions/executor';
import { ActionLibrary } from '../lib/actions/library';
import * as path from 'path';
import * as fs from 'fs';

// 環境変数の読み込み
config();

async function main() {
  let browser;

  try {
    console.log('🚀 freee会計へのログインを開始します...\n');

    // 環境変数から認証情報を取得
    const email = process.env.NEXT_PUBLIC_FREEE_EMAIL;
    const password = process.env.NEXT_PUBLIC_FREEE_PASSWORD;

    if (!email || !password) {
      console.error('❌ エラー: 環境変数が設定されていません');
      console.error('   NEXT_PUBLIC_FREEE_EMAIL と NEXT_PUBLIC_FREEE_PASSWORD を .env ファイルに設定してください\n');
      process.exit(1);
    }

    console.log(`📧 メールアドレス: ${email}`);
    console.log(`🔒 パスワード: ${'*'.repeat(password.length)}\n`);

    // ActionLibraryとExecutorの初期化
    const library = new ActionLibrary();
    const executor = new ActionExecutor();

    // freeeログインアクションを取得
    const loginAction = await library.get('freee-login', 'freee');

    if (!loginAction) {
      console.error('❌ エラー: freeeログインアクションが見つかりません');
      console.error('   .config/actions/freee/freee-login.json が存在することを確認してください\n');
      process.exit(1);
    }

    console.log('✅ アクションパターンを読み込みました');
    console.log(`   名前: ${loginAction.name}`);
    console.log(`   ステップ数: ${loginAction.steps.length}\n`);

    // セッション保存用のディレクトリを作成
    const sessionDir = path.join(process.cwd(), '.config', 'sessions', 'freee');
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // ブラウザの起動（永続化コンテキスト付き）
    console.log('🌐 ブラウザを起動中...');
    browser = await chromium.launchPersistentContext(sessionDir, {
      headless: false, // ブラウザを表示
      channel: 'chrome', // Chrome使用（オプション）
    });
    const page = await browser.newPage();

    console.log('✅ ブラウザを起動しました\n');

    // ログイン実行
    console.log('🔄 ログイン処理を実行中...\n');

    const result = await executor.execute(
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

    // 結果の表示
    console.log('\n' + '='.repeat(60));
    if (result.success) {
      console.log('✅ ログインに成功しました！');
      console.log(`   実行時間: ${(result.duration / 1000).toFixed(2)}秒`);
      console.log(`   完了ステップ: ${result.steps.filter(s => s.status === 'success').length}/${result.steps.length}`);

      if (result.screenshots.length > 0) {
        console.log(`   スクリーンショット: ${result.screenshots.length}枚保存`);
        result.screenshots.forEach((path, i) => {
          console.log(`     ${i + 1}. ${path}`);
        });
      }
    } else {
      console.log('❌ ログインに失敗しました');
      console.log(`   エラー: ${result.error}`);
      console.log(`   実行時間: ${(result.duration / 1000).toFixed(2)}秒`);

      // 失敗したステップの情報を表示
      const failedSteps = result.steps.filter(s => s.status === 'failed');
      if (failedSteps.length > 0) {
        console.log('\n失敗したステップ:');
        failedSteps.forEach(step => {
          console.log(`   - Step ${step.order}: ${step.description}`);
          if (step.error) {
            console.log(`     エラー: ${step.error}`);
          }
        });
      }
    }
    console.log('='.repeat(60) + '\n');

    // ログの表示
    if (result.logs.length > 0) {
      console.log('📝 実行ログ:');
      result.logs.forEach(log => console.log(`   ${log}`));
      console.log('');
    }

    // ログイン成功時はブラウザを開いたまま維持
    if (result.success) {
      console.log('✅ ログインセッションを保持しています');
      console.log('   ブラウザは開いたままです。作業が終わったら手動で閉じてください。');
      console.log('   セッション情報は自動的に保存されます。\n');

      // プロセスは終了せずブラウザを開いたまま維持
      // Ctrl+C で終了できます
    } else {
      // 失敗時のみブラウザを閉じる
      await browser.close();
      console.log('✅ ブラウザを閉じました\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ 予期しないエラーが発生しました:');
    console.error(error);

    // エラー時はブラウザを閉じる
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
