# クイックスタートガイド

このガイドでは、Playwright秘書プラットフォームをすぐに使い始める方法を説明します。

## 前提条件

- Node.js 20以上
- pnpm がインストール済み
- Claude Code CLI がインストール済み（MCP統合を使う場合）

## ステップ1: セットアップ（5分）

```bash
# 1. 依存関係をインストール
pnpm install

# 2. Playwrightブラウザをインストール
pnpm exec playwright install chromium

# 3. ビルドして動作確認
pnpm run build
```

## ステップ2: 開発サーバーを起動（1分）

```bash
pnpm dev
```

ブラウザで http://localhost:3000 を開くと、ダッシュボードが表示されます。

## ステップ3: 最初のサービスを設定（3分）

1. **設定ページに移動**
   - http://localhost:3000/settings にアクセス
   - または右上の「設定」ボタンをクリック

2. **サービスを追加**
   - 「サービスを追加」タブを選択
   - サービスタイプを選択（Gmail, Slack, Notion）
   - サービス名を入力（例: "個人用Gmail"）
   - Slackの場合はワークスペース名も入力
   - 「サービスを追加」ボタンをクリック

3. **確認**
   - 「登録済みサービス」タブに切り替え
   - 追加したサービスが表示されることを確認

## ステップ4: Claude Code CLIと統合（5分）

### 4.1 MCP Server設定ファイルを更新

`~/.claude/claude_desktop_config.json` を編集:

```json
{
  "mcpServers": {
    "playwright-secretary": {
      "command": "pnpm",
      "args": [
        "--dir",
        "/Users/hiramatsutakumi/IdeaProjects/work/playwright",
        "run",
        "mcp"
      ]
    }
  }
}
```

**重要**: パスを実際のプロジェクトディレクトリに変更してください。

### 4.2 Claude Code CLIを再起動

```bash
# ターミナルでClaude Code CLIを再起動
# またはDesktopアプリを再起動
```

### 4.3 接続を確認

Claude Code CLIで以下のように尋ねてみます:

```
登録されているサービスを表示して
```

正常に動作していれば、設定したサービスのリストが表示されます。

## 使用例

### 例1: サービス一覧を確認

Claude Code CLIで:

```
どんなサービスが登録されていますか？
```

Claude Codeが `get_services` ツールを使って、登録済みサービスを表示します。

### 例2: Gmailでメール送信

**注意**: 初回実行時は手動でGoogleアカウントにログインする必要があります。

Claude Code CLIで:

```
Gmailでメールを送信してください

宛先: test@example.com
件名: テストメール
本文: これはPlaywright秘書からのテストメールです
```

Claude Codeが:
1. 登録されているGmailサービスを検索
2. `execute_task` ツールを呼び出し
3. Playwrightでブラウザを起動
4. Gmailにアクセスしてメール送信を実行

### 例3: Slackにメッセージ投稿

Claude Code CLIで:

```
Slackの#generalチャンネルに「こんにちは」と投稿して
```

### 例4: Notionにページ作成

Claude Code CLIで:

```
Notionに「プロジェクト計画」というタイトルのページを作成して
内容は「今週のタスク一覧」にしてください
```

### 例5: 実行履歴を確認

Claude Code CLIで:

```
最近実行したタスクを10件表示して
```

または、ブラウザでダッシュボード（http://localhost:3000/dashboard）を確認。

## よくある質問

### Q: 初回実行時にログインを求められる

A: これは正常な動作です。各サービスの初回実行時は、ブラウザが起動して手動でログインする必要があります。ログイン情報は `.config/sessions/` に保存され、次回以降は自動的に使用されます。

### Q: "Service not found" エラーが出る

A: サービスが正しく設定されていません。http://localhost:3000/settings でサービスを追加してください。

### Q: MCP Serverに接続できない

A: 以下を確認してください:
1. `pnpm run mcp` が正常に起動するか
2. `~/.claude/claude_desktop_config.json` のパスが正しいか
3. Claude Code CLIを再起動したか

### Q: Playwrightが起動しない

A: ブラウザが正しくインストールされているか確認:
```bash
pnpm exec playwright install chromium
```

### Q: ヘッドレスモードで動かない

A: 一部のサービスは自動化検出を行います。`lib/playwright/session.ts` の `headless` オプションを `false` に変更してください。

## トラブルシューティング

### 開発サーバーが起動しない

```bash
# node_modulesを削除して再インストール
rm -rf node_modules
pnpm install
```

### ビルドエラーが出る

```bash
# TypeScriptの型エラーを確認
pnpm run build
```

### セッションが保存されない

```bash
# .config/sessions/ ディレクトリを確認
ls -la .config/sessions/

# ディレクトリがない場合は作成
mkdir -p .config/sessions
```

## 次のステップ

- [README.md](./README.md) - 詳細なドキュメント
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - 実装の詳細
- [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) - 検証手順

新しいサービスアダプターを追加したい場合は、README.mdの「開発」セクションを参照してください。

## サポート

問題が発生した場合は、以下を確認してください:

1. ターミナルのエラーメッセージ
2. ブラウザの開発者コンソール
3. `.config/execution-history.json` のログ

それでも解決しない場合は、詳細なエラーメッセージとともに報告してください。
