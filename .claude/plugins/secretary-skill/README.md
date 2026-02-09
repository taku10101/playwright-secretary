# AI秘書スキル (Secretary Skill)

Claude Codeから自然言語でWebサービスを自動操作し、業務報告を生成するAI秘書システム。

## 特徴

- 🗣️ **自然言語指示**: 日本語で直感的に操作を指示
- 🔍 **自動UI探索**: ページ構造を自動解析して操作方法を発見
- 📋 **計画立案**: 実行前に計画を立てて確認可能
- 🤖 **自動実行**: Playwrightで確実にWebサービスを操作
- 📊 **業務報告**: 実行結果を秘書風のビジネスレポートで出力
- 💾 **アクション保存**: 成功したパターンを保存して再利用

## インストール

このスキルは既にプロジェクトに含まれています。

## 使い方

### 基本的な使い方

Claude Code CLIから `/secretary` コマンドで起動します:

```bash
/secretary "Gmailで田中様にプロジェクトの進捗報告メールを送信してください"
```

### 実行モード

#### 自動モード (デフォルト)
探索 → 計画 → 実行 → 報告 を自動で実行

```bash
/secretary "Slackの#generalチャンネルに'会議は15時から'と投稿してください"
```

#### 探索モード
UI構造だけを探索して報告

```bash
/secretary --mode explore "Gmailの画面構造を教えてください"
```

#### 計画モード
実行計画だけを作成

```bash
/secretary --mode plan "Notionに今日のタスクリストページを作成してください"
```

#### 実行モード
計画済みのアクションを実行

```bash
/secretary --mode execute "前回の計画を実行してください"
```

### オプション

- `--mode <explore|plan|execute|auto>`: 実行モードを指定 (デフォルト: auto)
- `--headless`: ヘッドレスモードで実行（ブラウザを表示しない）
- `--no-confirm`: 確認なしで自動実行
- `--no-report`: レポート生成をスキップ

### 例

#### Gmailでメール送信

```bash
/secretary "Gmailで以下のメールを送信:
宛先: tanaka@example.com
件名: プロジェクト進捗報告
本文: 本日の進捗を報告いたします。"
```

#### Slackにメッセージ投稿

```bash
/secretary "Slackの#developmentチャンネルに「デプロイが完了しました」と投稿"
```

#### Notionページ作成

```bash
/secretary "Notionに「2024年1月タスクリスト」というページを作成"
```

#### カスタムWebサイトの操作

```bash
/secretary "https://example.com/login にアクセスして、ユーザー名'test'でログイン"
```

## ワークフロー

### 1. PARSE (指示解釈)

ユーザーの自然言語指示を解析して構造化データに変換:

- サービスの特定 (Gmail, Slack, Notion等)
- アクションの特定 (送信, 作成, 読み取り等)
- パラメータの抽出
- 意図の分類

### 2. EXPLORE (UI探索)

対象Webサイトの構造を自動解析:

- ページ構造の分析
- インタラクティブ要素の発見
- セレクタの生成
- スクリーンショット取得

### 3. PLAN (計画立案)

実行計画を自動生成:

- ステップの順序決定
- 検証ルールの設定
- リスクの評価
- 推定時間の算出

### 4. EXECUTE (実行)

Playwrightで実際に操作を実行:

- 各ステップの順次実行
- スクリーンショット取得
- エラーハンドリング
- 結果の検証

### 5. LEARN (学習)

成功したパターンを保存:

- アクションパターンとしてライブラリに保存
- 次回以降の再利用を可能に

### 6. REPORT (報告)

業務報告書を生成:

- ビジネスレポート形式
- 実行内容の詳細
- スクリーンショット付き
- パフォーマンスメトリクス

## ディレクトリ構造

```
.claude/plugins/secretary-skill/
├── skill.config.json       # スキル設定
├── index.ts               # エントリーポイント
├── types.ts               # 型定義
├── instruction-parser.ts  # 指示解釈エンジン
├── workflow.ts           # ワークフローオーケストレーター
├── prompts/              # AIプロンプト
│   ├── parse.md
│   ├── explore.md
│   └── plan.md
└── README.md             # このファイル
```

## レポート出力

実行後、以下の場所にレポートが生成されます:

```
.reports/
├── 2024-01-01/
│   ├── task-123456.md
│   └── screenshots/
│       ├── task-123456-step1.png
│       ├── task-123456-step2.png
│       └── task-123456-completed.png
└── index.json
```

レポートは秘書風のビジネス文書として整形され、以下の情報を含みます:

- エグゼクティブサマリー
- 実行内容の詳細
- タイムライン
- スクリーンショット
- パフォーマンスメトリクス
- 備考と推奨事項

## アクションライブラリ

成功したアクションは自動的にライブラリに保存され、再利用可能になります:

```
.config/actions/
├── gmail/
│   ├── send-email.json
│   └── read-emails.json
├── slack/
│   ├── send-message.json
│   └── search-messages.json
└── notion/
    ├── create-page.json
    └── search-pages.json
```

## トラブルシューティング

### 指示が理解されない

- より具体的な指示を出してください
- サービス名とアクションを明示してください
- パラメータを明確に指定してください

例:
```bash
# ❌ 曖昧な指示
/secretary "メールを送信"

# ✅ 明確な指示
/secretary "Gmailで田中様(tanaka@example.com)にテストメールを送信"
```

### 要素が見つからない

- `--mode explore` でUI構造を確認してください
- URLを明示的に指定してください
- ログイン状態を確認してください

### 実行が失敗する

- ヘッドレスモードを無効化して画面を確認: `--no-headless`
- タイムアウトを増やす: 設定ファイルで `defaultTimeout` を調整
- レポートのスクリーンショットで失敗箇所を確認

## 設定

スキルの動作は `skill.config.json` で設定できます:

```json
{
  "settings": {
    "defaultTimeout": 30000,
    "maxRetries": 3,
    "screenshotQuality": 80,
    "reportLanguage": "ja"
  }
}
```

## 開発

### 新しいサービスの追加

1. `lib/services/` に新しいサービスを追加
2. アクション定義を作成
3. `instruction-parser.ts` にキーワードを追加

### カスタムテンプレートの追加

1. `prompts/` ディレクトリに新しいテンプレートを追加
2. `workflow.ts` でテンプレートを参照

## ライセンス

MIT
