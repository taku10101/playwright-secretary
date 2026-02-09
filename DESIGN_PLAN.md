# AI秘書システム 設計計画書

## 概要

Claude Codeから自然言語で指示を受け、Playwrightで自動的にUI探索・計画立案・実行を行い、業務報告を生成するAI秘書システム。

## アーキテクチャ設計

### 1. システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code CLI                        │
│                   (ユーザーインターフェース)                     │
└────────────────────┬────────────────────────────────────────┘
                     │ 自然言語指示
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Secretary Skill Plugin                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Instruction Parser (指示解釈)                          │ │
│  │  - 自然言語を構造化データに変換                           │ │
│  │  - 意図分類 (探索/実行/報告)                              │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────┴───────────────────────────────────────┐ │
│  │  Workflow Orchestrator (ワークフロー制御)               │ │
│  │  - PLAN → EXECUTE → REPORT フロー管理                  │ │
│  └────────────────┬───────────────────────────────────────┘ │
└───────────────────┼──────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
┌──────────┐ ┌──────────┐ ┌──────────┐
│UI Explorer│ │ Action   │ │ Report   │
│  Module   │ │ Library  │ │Generator │
└─────┬────┘ └────┬─────┘ └────┬─────┘
      │           │            │
      └───────────┴────────────┘
                  │
      ┌───────────┴───────────┐
      ↓                       ↓
┌──────────────┐    ┌─────────────────┐
│  Playwright  │    │  MCP Server     │
│  Executor    │    │  (既存システム)  │
└──────────────┘    └─────────────────┘
```

### 2. コアモジュール設計

#### 2.1 Secretary Skill Plugin

**場所**: `.claude/plugins/secretary-skill/`

**責務**:
- Claude Codeとの統合ポイント
- ユーザー指示の受付と解釈
- ワークフロー全体の制御

**ファイル構成**:
```
.claude/plugins/secretary-skill/
├── skill.config.json       # スキル設定
├── index.ts               # エントリーポイント
├── instruction-parser.ts  # 指示解釈エンジン
├── workflow.ts           # ワークフローオーケストレーター
└── prompts/              # AIプロンプトテンプレート
    ├── parse.md          # 指示解釈用
    ├── explore.md        # UI探索用
    └── plan.md           # 計画立案用
```

#### 2.2 UI Explorer Module

**場所**: `lib/playwright/explorer/`

**責務**:
- Webページの構造解析
- インタラクティブ要素の発見
- セレクタ生成
- スクリーンショット取得

**機能**:
1. **ページ構造分析**
   - DOM構造の解析
   - Accessibility Tree の取得
   - セマンティック要素の識別

2. **要素発見**
   - ボタン、リンク、フォームの検出
   - 可視性判定
   - 操作可能性チェック

3. **セレクタ生成**
   - 安定したセレクタの自動生成
   - 優先度: `data-testid` > `aria-label` > `id` > `class`
   - フォールバック戦略

4. **スクリーンショット**
   - フルページキャプチャ
   - 要素ハイライト
   - 注釈付き画像生成

**ファイル構成**:
```
lib/playwright/explorer/
├── index.ts              # エクスポート
├── page-analyzer.ts     # ページ構造分析
├── element-finder.ts    # 要素発見
├── selector-generator.ts # セレクタ生成
├── screenshot.ts        # スクリーンショット
└── types.ts            # 型定義
```

**型定義**:
```typescript
interface PageStructure {
  url: string;
  title: string;
  elements: InteractiveElement[];
  accessibility: AccessibilityTree;
  screenshot: string; // base64
}

interface InteractiveElement {
  type: 'button' | 'link' | 'input' | 'select' | 'textarea';
  selector: string;
  text: string;
  attributes: Record<string, string>;
  position: { x: number; y: number };
  visible: boolean;
  enabled: boolean;
}
```

#### 2.3 Action Library

**場所**: `lib/actions/`

**責務**:
- 再利用可能なアクションパターンの管理
- パターンマッチングとアクション組み立て
- アクションの保存と取得

**アクションパターン形式**:
```json
{
  "id": "gmail-send-email",
  "name": "Gmailでメール送信",
  "service": "gmail",
  "category": "communication",
  "description": "Gmailで指定された宛先にメールを送信する",
  "parameters": [
    {
      "name": "to",
      "type": "string",
      "required": true,
      "description": "宛先メールアドレス"
    },
    {
      "name": "subject",
      "type": "string",
      "required": true,
      "description": "件名"
    },
    {
      "name": "body",
      "type": "string",
      "required": true,
      "description": "本文"
    }
  ],
  "steps": [
    {
      "action": "navigate",
      "url": "https://mail.google.com"
    },
    {
      "action": "click",
      "selector": "[aria-label='作成']"
    },
    {
      "action": "fill",
      "selector": "input[name='to']",
      "value": "{{to}}"
    },
    {
      "action": "fill",
      "selector": "input[name='subject']",
      "value": "{{subject}}"
    },
    {
      "action": "fill",
      "selector": "div[aria-label='メッセージ本文']",
      "value": "{{body}}"
    },
    {
      "action": "click",
      "selector": "[aria-label='送信']"
    }
  ],
  "validation": {
    "successSelector": "span:has-text('メールを送信しました')",
    "timeout": 5000
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "usageCount": 10
}
```

**ファイル構成**:
```
lib/actions/
├── index.ts              # エクスポート
├── library.ts            # ライブラリ管理
├── pattern-matcher.ts    # パターンマッチング
├── executor.ts           # アクション実行
├── storage.ts            # 保存/取得
└── types.ts             # 型定義
```

**ストレージ**:
```
.config/actions/
├── gmail/
│   ├── send-email.json
│   └── read-emails.json
├── slack/
│   ├── send-message.json
│   └── search-messages.json
└── generic/
    ├── fill-form.json
    └── click-button.json
```

#### 2.4 Report Generator

**場所**: `lib/reports/`

**責番**:
- 実行結果を秘書風のビジネスレポートに整形
- スクリーンショットの埋め込み
- タイムライン生成
- パフォーマンスメトリクス

**レポート形式**:
```markdown
# 業務報告書

**報告者**: AI秘書システム
**報告日時**: 2024-01-01 10:00:00
**タスクID**: task-123456

---

## エグゼクティブサマリー

ご指示いただきました「田中様へのメール送信」を無事完了いたしました。
実行時間は約5秒で、正常に送信が完了したことを確認しております。

---

## 実行内容

### 指示内容
> 田中様にプロジェクトの進捗報告メールを送信してください

### 実行したアクション
1. **Gmail起動** (0.5秒)
   - URL: https://mail.google.com
   - 認証状態: ログイン済み

2. **メール作成画面を開く** (1.2秒)
   - クリック: 「作成」ボタン

3. **メール内容入力** (2.1秒)
   - 宛先: tanaka@example.com
   - 件名: プロジェクト進捗報告
   - 本文: [内容省略]

4. **送信実行** (1.2秒)
   - クリック: 「送信」ボタン
   - 確認: 送信完了メッセージ表示

---

## 実行結果

✅ **成功**

- 送信完了時刻: 2024-01-01 10:00:05
- 送信先確認: tanaka@example.com
- メールID: msg-abc123

### スクリーンショット

![送信完了画面](./screenshots/task-123456-completed.png)

---

## パフォーマンス

| 項目 | 値 |
|------|-----|
| 総実行時間 | 5.0秒 |
| ページ読み込み | 1.5秒 |
| ユーザー操作 | 3.0秒 |
| 検証時間 | 0.5秒 |

---

## 備考・推奨事項

- 次回以降も同様のメール送信を行う場合、このアクションパターンを再利用できます
- 定期的な進捗報告の場合、スケジュール機能の利用をご検討ください

---

**以上、ご報告申し上げます。**
```

**ファイル構成**:
```
lib/reports/
├── index.ts              # エクスポート
├── generator.ts          # レポート生成
├── templates/            # テンプレート
│   ├── business.md       # ビジネスレポート
│   ├── technical.md      # 技術レポート
│   └── summary.md        # サマリー
├── formatter.ts          # フォーマッター
└── types.ts             # 型定義
```

**出力先**:
```
.reports/
├── 2024-01-01/
│   ├── task-123456.md
│   └── screenshots/
│       ├── task-123456-step1.png
│       ├── task-123456-step2.png
│       └── task-123456-completed.png
└── index.json           # レポートインデックス
```

### 3. ワークフロー設計

#### Phase 1: PARSE (指示解釈)

**入力**: ユーザーの自然言語指示
**出力**: 構造化された指示データ

```typescript
interface ParsedInstruction {
  intent: 'explore' | 'execute' | 'report';
  service?: string;
  action?: string;
  parameters: Record<string, any>;
  context: {
    url?: string;
    targetElements?: string[];
    expectedOutcome?: string;
  };
}
```

**処理**:
1. 自然言語をAI（Claude）で解析
2. サービスタイプの特定
3. アクションの特定
4. パラメータの抽出

#### Phase 2: EXPLORE (UI探索)

**入力**: ParsedInstruction
**出力**: PageStructure + ActionPlan

```typescript
interface ActionPlan {
  steps: ActionStep[];
  validation: ValidationRule[];
  estimatedTime: number;
  confidence: number; // 0-1
}

interface ActionStep {
  order: number;
  type: 'navigate' | 'click' | 'fill' | 'select' | 'wait';
  selector: string;
  value?: any;
  description: string;
  screenshot?: string;
}
```

**処理**:
1. 対象ページをPlaywrightで開く
2. ページ構造を解析
3. 必要な要素を特定
4. アクション計画を生成
5. ユーザーに確認を求める（オプション）

#### Phase 3: EXECUTE (実行)

**入力**: ActionPlan
**出力**: ExecutionResult

**処理**:
1. 各ステップを順次実行
2. 各ステップでスクリーンショット取得
3. エラーハンドリング
4. 結果の検証

#### Phase 4: LEARN (学習)

**処理**:
1. 成功したアクションをパターンとして保存
2. 使用頻度の更新
3. 類似パターンの統合

#### Phase 5: REPORT (報告)

**入力**: ExecutionResult
**出力**: Markdown レポート

**処理**:
1. 実行結果の整形
2. スクリーンショットの埋め込み
3. レポート生成
4. ファイル保存
5. Claude Codeへの返答

### 4. データフロー

```
ユーザー指示
    ↓
[PARSE] 指示解釈
    ↓
ParsedInstruction
    ↓
[EXPLORE] UI探索
    ↓
PageStructure + ActionPlan
    ↓
[ユーザー確認] (オプション)
    ↓
[EXECUTE] 実行
    ↓
ExecutionResult
    ↓
[LEARN] 学習
    ↓
ActionPattern (保存)
    ↓
[REPORT] 報告生成
    ↓
Markdown Report
    ↓
ユーザーへ表示
```

### 5. エラーハンドリング戦略

#### 5.1 エラータイプ

1. **解釈エラー**: 指示が不明瞭
   - 対応: ユーザーに追加情報を質問

2. **探索エラー**: 要素が見つからない
   - 対応: 代替セレクタを試行、ユーザーに報告

3. **実行エラー**: アクション失敗
   - 対応: リトライ(最大3回)、ロールバック

4. **検証エラー**: 期待した結果が得られない
   - 対応: 状態を確認、ユーザーに報告

#### 5.2 リトライ戦略

```typescript
interface RetryConfig {
  maxAttempts: 3;
  backoff: 'linear' | 'exponential';
  initialDelay: 1000; // ms
}
```

### 6. セキュリティ考慮事項

1. **認証情報**: セッションストレージで管理、平文保存しない
2. **スクリーンショット**: 機密情報のマスキング
3. **ログ**: パスワード等の自動マスク
4. **実行制限**: レート制限、タイムアウト設定

### 7. パフォーマンス最適化

1. **セッション再利用**: ブラウザセッションのキャッシュ
2. **並列実行**: 独立したアクションの並列化
3. **遅延読み込み**: アダプターの遅延ロード
4. **画像最適化**: スクリーンショットの圧縮

### 8. 拡張性設計

#### 8.1 新しいサービスの追加

```typescript
// lib/services/custom/index.ts
export const customService: ServiceDefinition = {
  id: 'custom',
  name: 'Custom Service',
  description: 'カスタムサービス',
  actions: [/* ... */],
};
```

#### 8.2 カスタムアクションの追加

```json
// .config/actions/custom/my-action.json
{
  "id": "custom-action",
  "steps": [/* ... */]
}
```

### 9. テスト戦略

1. **ユニットテスト**: 各モジュールの単体テスト
2. **統合テスト**: ワークフロー全体のテスト
3. **E2Eテスト**: 実際のWebサービスでのテスト
4. **モックテスト**: オフライン環境でのテスト

### 10. 実装優先順位

#### Phase 1: 基盤構築 (Week 1)
- [ ] Secretary Skill Plugin基本構造
- [ ] Instruction Parser
- [ ] Workflow Orchestrator

#### Phase 2: UI探索 (Week 2)
- [ ] Page Analyzer
- [ ] Element Finder
- [ ] Selector Generator
- [ ] Screenshot機能

#### Phase 3: アクション実行 (Week 3)
- [ ] Action Library基本構造
- [ ] Pattern Storage
- [ ] Action Executor
- [ ] エラーハンドリング

#### Phase 4: レポート生成 (Week 4)
- [ ] Report Generator
- [ ] Template Engine
- [ ] Screenshot埋め込み
- [ ] レポート出力

#### Phase 5: 統合とテスト (Week 5)
- [ ] 全体統合
- [ ] E2Eテスト
- [ ] ドキュメント作成
- [ ] サンプル作成

---

## 次のステップ

1. ✅ 設計計画書の作成 (完了)
2. Secretary Skill Pluginの実装開始
3. UI Explorer Moduleの実装
4. 段階的な統合テスト
