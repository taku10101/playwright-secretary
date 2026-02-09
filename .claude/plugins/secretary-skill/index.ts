#!/usr/bin/env node
/**
 * AI Secretary Skill - Main Entry Point
 *
 * This skill enables natural language automation of web services
 * through Playwright, with intelligent UI exploration and business reporting.
 */

import { SecretaryWorkflow } from './workflow';
import { InstructionParser } from './instruction-parser';
import type { SkillContext, SkillResult } from './types';

interface SecretaryArgs {
  instruction: string;
  mode?: 'explore' | 'plan' | 'execute' | 'auto';
  headless?: boolean;
  confirm?: boolean;
  report?: boolean;
}

/**
 * Main skill handler
 */
export async function secretary(
  args: SecretaryArgs,
  context: SkillContext
): Promise<SkillResult> {
  const {
    instruction,
    mode = 'auto',
    headless = false,
    confirm = true,
    report = true,
  } = args;

  console.log('🤖 AI秘書を起動しています...');
  console.log(`📝 指示: ${instruction}`);
  console.log(`🔧 モード: ${mode}`);

  try {
    // Parse user instruction
    console.log('\n📖 指示を解釈中...');
    const parser = new InstructionParser();
    const parsed = await parser.parse(instruction);

    console.log('✅ 指示を理解しました:');
    console.log(`   サービス: ${parsed.service || '未指定'}`);
    console.log(`   アクション: ${parsed.action || '探索が必要'}`);
    console.log(`   意図: ${parsed.intent}`);

    // Initialize workflow
    const workflow = new SecretaryWorkflow({
      headless,
      confirm,
      report,
    });

    // Execute based on mode
    let result: SkillResult;

    switch (mode) {
      case 'explore':
        console.log('\n🔍 UI探索モード');
        result = await workflow.explore(parsed);
        break;

      case 'plan':
        console.log('\n📋 計画立案モード');
        result = await workflow.plan(parsed);
        break;

      case 'execute':
        console.log('\n⚡ 実行モード');
        result = await workflow.execute(parsed);
        break;

      case 'auto':
      default:
        console.log('\n🚀 自動実行モード');
        result = await workflow.auto(parsed);
        break;
    }

    // Display result
    if (result.success) {
      console.log('\n✅ 処理が完了しました');

      if (result.report) {
        console.log(`\n📄 レポート: ${result.report.path}`);
        console.log(`\n--- レポートプレビュー ---`);
        console.log(result.report.preview);
      }

      if (result.message) {
        console.log(`\n💬 ${result.message}`);
      }
    } else {
      console.log('\n❌ 処理に失敗しました');
      console.log(`エラー: ${result.error}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('\n❌ 予期しないエラーが発生しました:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: secretary <instruction> [options]');
    console.log('\nOptions:');
    console.log('  --mode <explore|plan|execute|auto>  実行モード (default: auto)');
    console.log('  --headless                          ヘッドレスモードで実行');
    console.log('  --no-confirm                        確認なしで実行');
    console.log('  --no-report                         レポート生成をスキップ');
    console.log('\nExamples:');
    console.log('  secretary "Freeeにログイン"');
    console.log('  secretary "Freeeの経費を確認" --mode plan');
    console.log('  secretary "Freeeで請求書を作成" --headless');
    process.exit(1);
  }

  const instruction = args[0];
  const secretaryArgs: SecretaryArgs = {
    instruction,
    mode: 'auto',
    headless: args.includes('--headless'),
    confirm: !args.includes('--no-confirm'),
    report: !args.includes('--no-report'),
  };

  const modeIndex = args.indexOf('--mode');
  if (modeIndex !== -1 && args[modeIndex + 1]) {
    secretaryArgs.mode = args[modeIndex + 1] as any;
  }

  secretary(secretaryArgs, {
    workingDirectory: process.cwd(),
    userId: 'cli-user',
  })
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default secretary;
