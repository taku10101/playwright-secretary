# Playwright秘書プラットフォーム

Playwrightを使って各種Webサービスを自動操作する秘書プラットフォームです。ユーザーは設定フォームで認証情報やタスク設定を管理し、Claude Code CLIから自然言語で指示を出してサービス操作を実行できます。

## 特徴

- **Webサービス自動化**: Gmail、Slack、Notionなどを自動操作
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
   type: gmail | slack | notion
   name: サービス名
   settings: サービス固有の設定
   ```

4. **get_task_history**: 実行履歴を取得

#### 使用例

Claude Code CLIから:

```
Gmailでメールを送信してください
宛先: example@example.com
件名: テストメール
本文: これはテストメールです
```

Claude Codeが自動的に:
1. 設定済みのGmailサービスを検索
2. `execute_task` ツールを呼び出し
3. Playwrightでブラウザを自動操作
4. 結果を報告

## サポートされているサービス

### Gmail
- `send_email`: メール送信
- `read_emails`: メール一覧取得
- `search`: メール検索

### Slack
- `send_message`: メッセージ送信
- `read_messages`: メッセージ取得

### Notion
- `create_page`: ページ作成
- `search`: 検索

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
