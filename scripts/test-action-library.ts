#!/usr/bin/env tsx
/**
 * アクションライブラリのテストスクリプト
 * freeeアクションパターンが正しく読み込めるか確認
 */

import { ActionLibrary } from '../lib/actions/library';

async function testActionLibrary() {
  console.log('🧪 アクションライブラリのテストを開始...\n');

  try {
    const library = new ActionLibrary();

    // 統計情報を取得
    console.log('📊 ライブラリ統計:');
    const stats = await library.getStats();
    console.log(`   総パターン数: ${stats.totalPatterns}`);
    console.log(`   サービス別:`);
    Object.entries(stats.byService).forEach(([service, count]) => {
      console.log(`     - ${service}: ${count}パターン`);
    });
    console.log(`   カテゴリ別:`);
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`     - ${category}: ${count}パターン`);
    });
    console.log('');

    // freeeログインアクションを取得
    console.log('🔍 freeeログインアクションを検索...');
    const freeeLogin = await library.get('freee-login', 'freee');

    if (!freeeLogin) {
      console.error('❌ freeeログインアクションが見つかりません\n');
      process.exit(1);
    }

    console.log('✅ freeeログインアクションを取得しました\n');

    // アクション詳細を表示
    console.log('📋 アクション詳細:');
    console.log(`   ID: ${freeeLogin.id}`);
    console.log(`   名前: ${freeeLogin.name}`);
    console.log(`   サービス: ${freeeLogin.service}`);
    console.log(`   カテゴリ: ${freeeLogin.category}`);
    console.log(`   説明: ${freeeLogin.description}`);
    console.log('');

    console.log(`📝 パラメータ (${freeeLogin.parameters.length}個):`);
    freeeLogin.parameters.forEach((param, i) => {
      console.log(`   ${i + 1}. ${param.name} (${param.type})`);
      console.log(`      必須: ${param.required ? 'はい' : 'いいえ'}`);
      console.log(`      説明: ${param.description}`);
      if (param.validation) {
        console.log(`      バリデーション: ${JSON.stringify(param.validation)}`);
      }
    });
    console.log('');

    console.log(`🔄 ステップ (${freeeLogin.steps.length}個):`);
    freeeLogin.steps.forEach((step) => {
      console.log(`   ${step.order}. ${step.description}`);
      console.log(`      タイプ: ${step.type}`);
      if (step.selector) {
        console.log(`      セレクター: ${step.selector}`);
      }
      if (step.value) {
        console.log(`      値: ${step.value}`);
      }
      if (step.timeout) {
        console.log(`      タイムアウト: ${step.timeout}ms`);
      }
      if (step.optional) {
        console.log(`      オプショナル: はい`);
      }
    });
    console.log('');

    console.log(`✓ バリデーションルール (${freeeLogin.validation.length}個):`);
    freeeLogin.validation.forEach((rule, i) => {
      console.log(`   ${i + 1}. ${rule.type}: ${rule.condition}`);
      console.log(`      期待値: ${rule.expected}`);
      if (rule.errorMessage) {
        console.log(`      エラーメッセージ: ${rule.errorMessage}`);
      }
    });
    console.log('');

    console.log('📈 メタデータ:');
    console.log(`   バージョン: ${freeeLogin.metadata.version}`);
    console.log(`   タグ: ${freeeLogin.metadata.tags.join(', ')}`);
    console.log(`   使用回数: ${freeeLogin.metadata.usageCount}`);
    console.log(`   成功率: ${(freeeLogin.metadata.successRate * 100).toFixed(1)}%`);
    console.log('');

    // freeeサービスのすべてのアクションを取得
    console.log('🔍 freeeサービスの全アクションを検索...');
    const freeeActions = await library.getByService('freee');
    console.log(`✅ ${freeeActions.length}個のアクションが見つかりました`);
    freeeActions.forEach((action, i) => {
      console.log(`   ${i + 1}. ${action.name} (${action.id})`);
    });
    console.log('');

    // authカテゴリのアクションを取得
    console.log('🔍 認証カテゴリのアクションを検索...');
    const authActions = await library.getByCategory('auth');
    console.log(`✅ ${authActions.length}個のアクションが見つかりました`);
    authActions.forEach((action, i) => {
      console.log(`   ${i + 1}. ${action.name} (${action.service})`);
    });
    console.log('');

    console.log('✅ すべてのテストが成功しました！\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ テストが失敗しました:');
    console.error(error);
    process.exit(1);
  }
}

testActionLibrary();
