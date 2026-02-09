# 検証チェックリスト

## Phase 1: 基礎セットアップ検証 ✅

- [x] Playwrightインストール確認
  ```bash
  pnpm exec playwright --version
  # v1.58.2
  ```

- [x] shadcn/uiコンポーネント確認
  - components/ui/ 配下に9個のコンポーネントが生成済み
  - button, card, form, input, label, select, table, tabs, textarea

- [x] TypeScriptビルド確認
  ```bash
  pnpm run build
  # ✓ Compiled successfully
  ```

## Phase 2: Playwright自動化エンジン検証

### セッション管理
- [x] SessionManager クラス実装済み
- [x] セッション永続化ロジック実装済み
- [x] `.config/sessions/` ディレクトリ自動作成機能

### サービスアダプター
- [x] Gmail アダプター実装済み
  - send_email
  - read_emails
  - search
- [x] Slack アダプター実装済み
  - send_message
  - read_messages
- [x] Notion アダプター実装済み
  - create_page
  - search

### タスク実行エンジン
- [x] TaskExecutor クラス実装済み
- [x] キュー管理機能
- [x] エラーハンドリング
- [x] ログ記録機能

## Phase 3: Next.js API Routes検証 ✅

- [x] `/api/tasks/execute` - POST
- [x] `/api/tasks/history` - GET
- [x] `/api/services` - GET
- [x] `/api/services/configure` - POST, DELETE

Next.jsビルドで全ルートが正常に生成:
```
Route (app)
├ ƒ /api/services
├ ƒ /api/services/configure
├ ƒ /api/tasks/execute
└ ƒ /api/tasks/history
```

## Phase 4: フロントエンド実装検証 ✅

- [x] ダッシュボードページ (`/dashboard`)
  - 実行履歴テーブル
  - ステータス表示
  - 設定ページへのリンク

- [x] 設定ページ (`/settings`)
  - サービス追加フォーム
  - サービス一覧
  - サービス削除機能

- [x] ホームページリダイレクト
  - `/` → `/dashboard` 自動リダイレクト

## Phase 5: MCP Server統合検証 ✅

- [x] MCP Server実装
  - `lib/mcp/server.ts`
  - PlaywrightSecretaryServer クラス

- [x] MCPツール定義
  - execute_task
  - get_services
  - configure_service
  - get_task_history

- [x] 起動スクリプト
  - `scripts/mcp-server.ts`
  - `pnpm run mcp` コマンド追加

- [x] MCP Server起動テスト
  ```bash
  pnpm run mcp
  # サーバーが正常に起動
  ```

## 手動テスト手順

### 1. Webアプリケーションテスト

```bash
# 1. 開発サーバー起動
pnpm dev

# 2. ブラウザで以下を確認
# - http://localhost:3000 → ダッシュボードにリダイレクト
# - http://localhost:3000/settings → 設定ページ表示
# - サービス追加フォームが正常に表示される
# - タブ切り替えが動作する
```

### 2. API エンドポイントテスト

```bash
# サービス一覧取得
curl http://localhost:3000/api/services

# サービス設定
curl -X POST http://localhost:3000/api/services/configure \
  -H "Content-Type: application/json" \
  -d '{
    "type": "gmail",
    "name": "テストGmail",
    "enabled": true
  }'

# 実行履歴取得
curl http://localhost:3000/api/tasks/history
```

### 3. MCP Server統合テスト

```bash
# 1. MCP Server起動
pnpm run mcp

# 2. Claude Code CLIから接続テスト
# ~/.claude/claude_desktop_config.json に設定を追加後
# Claude Code CLIを再起動して接続を確認
```

## エンドツーエンドテスト（手動）

1. **サービス設定**
   - [ ] Webから新しいGmailサービスを追加
   - [ ] `.config/services.json` にデータが保存される

2. **Claude Code CLIから実行**
   - [ ] Claude Code CLIから「登録されているサービスを表示して」と依頼
   - [ ] get_services ツールが呼び出される
   - [ ] 設定したサービスが表示される

3. **タスク実行**（要手動認証）
   - [ ] 「Gmailでメールを送信して」と依頼
   - [ ] execute_task ツールが呼び出される
   - [ ] ブラウザが起動して認証を求められる
   - [ ] 認証後、メール送信が実行される
   - [ ] 実行結果が返される

4. **履歴確認**
   - [ ] Webダッシュボードで実行履歴が確認できる
   - [ ] ステータス、ログが正しく表示される

## 既知の制約事項

1. **初回認証が必要**
   - 各サービスの初回実行時は手動でログインが必要
   - セッションは `.config/sessions/` に保存される

2. **ヘッドレスモード制約**
   - 一部のサービスは自動化検出を行うため、ヘッドレスモードで動作しない場合がある
   - その場合は `headless: false` に変更する必要がある

3. **セキュリティ**
   - 現在は認証ミドルウェアなし
   - 本番環境では追加のセキュリティ対策が必要

## 次回の実装項目

- [ ] 認証ミドルウェアの追加
- [ ] APIキーの暗号化
- [ ] エラーリトライロジックの強化
- [ ] 非同期タスク実行のステータス追跡
- [ ] WebSocketによるリアルタイム進捗更新
- [ ] より詳細なログ記録とデバッグ機能
