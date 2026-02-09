# Playwright秘書プラットフォーム

[![GitHub](https://img.shields.io/badge/GitHub-playwright--secretary-blue?logo=github)](https://github.com/taku10101/playwright-secretary)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.58-green?logo=playwright)](https://playwright.dev/)

Playwrightを使って各種Webサービスを自動操作する秘書プラットフォームです。ユーザーは設定フォームで認証情報やタスク設定を管理し、Claude Code CLIから自然言語で指示を出してサービス操作を実行できます。

🔗 **GitHub Repository**: https://github.com/taku10101/playwright-secretary

## 特徴

- **Webサービス自動化**: freee会計などのWebサービスを自動操作
- **設定管理UI**: ブラウザから簡単にサービスを設定
- **実行履歴追跡**: タスクの実行状況とログを確認
- **Claude Code CLI統合**: MCP Serverを通じて自然言語でタスク実行

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. Playwrightブラウザのインストール

```bash
pnpm exec playwright install chromium
```

### 3. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで http://localhost:3000 を開くと、ダッシュボードが表示されます。

## 使い方

### Web UI

1. **設定ページ**: http://localhost:3000/settings からサービスを追加
2. **サービス設定**: サービスタイプ、名前、必要な設定を入力
3. **ダッシュボード**: 実行履歴を確認

### Claude Code CLI統合

#### MCP Server設定

`~/.claude/claude_desktop_config.json` に以下を追加:

```json
{
  "mcpServers": {
    "playwright-secretary": {
      "command": "pnpm",
      "args": ["--dir", "/Users/hiramatsutakumi/IdeaProjects/work/playwright", "run", "mcp"]
    }
  }
}
```

#### 利用可能なツール

1. **execute_task**: タスクを実行
   ```
   serviceId: サービスID
   action: アクション名 (send_email, send_message, create_page等)
   parameters: アクションのパラメータ
   ```

2. **get_services**: 設定済みサービスの一覧を取得

3. **configure_service**: サービスを設定
   ```
   type: freee
   name: サービス名
   settings: サービス固有の設定
   ```

4. **get_task_history**: 実行履歴を取得

#### 使用例

Claude Code CLIから:

```
freee会計にログインしてください
```

Claude Codeが自動的に:
1. 設定済みのfreeeサービスを検索
2. `execute_task` ツールを呼び出し
3. Playwrightでブラウザを自動操作
4. 結果を報告

## サポートされているサービス

### 請求書生成（Invoice Generator） 📄

freeeとは別に、請求書PDFを直接生成できるサービスです。

#### 機能
- `generate_invoice`: 請求書PDF生成
- `list_clients`: クライアント一覧取得

#### 設定方法

1. `.env` ファイルに個人情報と銀行情報を追加:
   ```bash
   # 個人情報
   NEXT_PUBLIC_USERNAME=your_username_here
   NEXT_PUBLIC_EMAIL=your_email_here
   NEXT_PUBLIC_ADDRESS=your_address_here
   NEXT_PUBLIC_PHONE=your_phone_number_here

   # 銀行情報
   NEXT_PUBLIC_BANK_NAME=your_bank_name_here
   NEXT_PUBLIC_BANK_BRANCH=your_bank_branch_here
   NEXT_PUBLIC_BANK_TYPE=your_account_type_here  # 普通 or 当座
   NEXT_PUBLIC_BANK_NUMBER=your_account_number_here
   ```

2. テストスクリプトで動作確認:
   ```bash
   pnpm run test:invoice
   ```

#### 使用例

```typescript
// クライアント一覧取得
{
  serviceId: "invoice",
  actionId: "list_clients"
}

// 請求書生成
{
  serviceId: "invoice",
  actionId: "generate_invoice",
  parameters: {
    clientId: "trey-link",  // または "sample-corp", "example-inc"
    subject: "業務委託費について",
    items: [
      {
        description: "Home Logソフトウェア開発業務委託費用",
        quantity: 1,
        unitPrice: 175000
      }
    ],
    outputDir: "./invoices",
    useLastBusinessDay: false  // false: 25日期限、true: 月末営業日期限
  }
}
```

#### 仕様
- **請求日**: 実行した月の1日
- **支払期限**:
  - デフォルト: その月の25日（土日の場合は前倒しで平日）
  - `useLastBusinessDay: true` の場合: 月末の営業日
- **クライアント**: コード上で事前定義された3社から選択
- **PDF出力先**: `./invoices/` ディレクトリ
- **日本語対応**: IPA exゴシックフォントを使用し、日本語が正しく表示されます

---

### freee会計
- `login`: ログイン

#### freeeの設定方法

1. `.env` ファイルを作成（`.env.exsample` を参考に）:
   ```bash
   NEXT_PUBLIC_FREEE_EMAIL=your_email@example.com
   NEXT_PUBLIC_FREEE_PASSWORD=your_password
   ```

2. ログインスクリプトを実行:
   ```bash
   pnpm freee:login
   ```

ブラウザが起動し、自動的にfreee会計にログインします。

## アーキテクチャ

```
/app
  /dashboard          # ダッシュボード
  /settings           # 設定ページ
  /api
    /tasks            # タスク実行API
    /services         # サービス設定API

/lib
  /config             # 型定義と設定管理
  /playwright
    /adapters         # サービスアダプター
    executor.ts       # タスク実行エンジン
    session.ts        # セッション管理
  /mcp
    server.ts         # MCP Server実装
    tools.ts          # ツール定義

/scripts
  mcp-server.ts       # MCP Server起動スクリプト

/.config
  services.json       # サービス設定
  execution-history.json  # 実行履歴
  /sessions           # ブラウザセッション
```

## 開発

### 新しいサービスアダプターの追加

1. `/lib/playwright/adapters/` に新しいファイルを作成
2. `ServiceAdapter` インターフェースを実装
3. `/lib/playwright/adapters/index.ts` に登録

例:

```typescript
export class CustomAdapter implements ServiceAdapter {
  async initialize(): Promise<void> {
    // 初期化処理
  }

  async execute(action: string, parameters: Record<string, unknown>): Promise<unknown> {
    // アクション実行
  }

  async cleanup(): Promise<void> {
    // クリーンアップ
  }
}
```

## トラブルシューティング

### Playwrightが起動しない

```bash
pnpm exec playwright install chromium
```

### セッションが保存されない

`.config/sessions` ディレクトリが作成されているか確認してください。

### MCP Serverが接続できない

1. `pnpm run mcp` が正常に起動するか確認
2. Claude設定ファイルのパスが正しいか確認
3. Claude Code CLIを再起動

## ライセンス

MIT
