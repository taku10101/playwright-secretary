# 請求書生成サービス (Invoice Generator)

freee会計とは別に、PDFで請求書を直接生成するサービスです。

## 概要

このサービスは、PDFKitを使用して日本語の請求書PDFを生成します。環境変数から個人情報・銀行情報を読み込み、コード上で事前定義されたクライアントリストから請求先を選択できます。

## 機能

### 1. 請求書PDF生成 (`generate_invoice`)

指定されたクライアントと請求項目から、請求書PDFを生成します。

**パラメータ**:

| 名前 | 型 | 必須 | 説明 | デフォルト |
|------|------|------|------|------------|
| `clientId` | string | ✅ | クライアントID | - |
| `subject` | string | ❌ | 件名 | "業務委託費について" |
| `items` | array | ✅ | 請求項目の配列 | - |
| `outputDir` | string | ❌ | 出力ディレクトリ | "./invoices" |
| `useLastBusinessDay` | boolean | ❌ | 月末営業日を期限にするか | false |

**請求項目 (items) の構造**:

```typescript
{
  description: string;  // 品目説明
  quantity: number;     // 数量
  unitPrice: number;    // 単価
}
```

**使用例**:

```typescript
{
  clientId: "trey-link",
  subject: "業務委託費について",
  items: [
    {
      description: "Home Logソフトウェア開発業務委託費用",
      quantity: 1,
      unitPrice: 175000
    }
  ],
  outputDir: "./invoices",
  useLastBusinessDay: false
}
```

**出力**:

```json
{
  "success": true,
  "message": "請求書PDFを生成しました",
  "invoiceNumber": "INV-20260201001",
  "outputPath": "invoices/invoice_INV-20260201001.pdf",
  "total": 175000
}
```

### 2. クライアント一覧 (`list_clients`)

利用可能なクライアント一覧を取得します。

**パラメータ**: なし

**出力**:

```json
{
  "success": true,
  "clients": [
    {
      "id": "trey-link",
      "name": "株式会社Trey Link",
      "honorific": "様 御中"
    },
    {
      "id": "sample-corp",
      "name": "株式会社サンプル",
      "honorific": "様 御中"
    },
    {
      "id": "example-inc",
      "name": "株式会社エグザンプル",
      "honorific": "様 御中"
    }
  ]
}
```

## 設定

### 環境変数

`.env` ファイルに以下を設定してください:

```bash
# 個人情報
NEXT_PUBLIC_USERNAME=your_username_here
NEXT_PUBLIC_EMAIL=your_email_here
NEXT_PUBLIC_ADDRESS=your_address_here
NEXT_PUBLIC_PHONE=your_phone_number_here

# 銀行情報
NEXT_PUBLIC_BANK_NAME=your_bank_name_here        # 銀行名
NEXT_PUBLIC_BANK_BRANCH=your_bank_branch_here    # 支店名
NEXT_PUBLIC_BANK_TYPE=your_account_type_here     # 口座種別（普通 or 当座）
NEXT_PUBLIC_BANK_NUMBER=your_account_number_here # 口座番号
```

### クライアントの追加

クライアントを追加する場合は、`lib/services/invoice/types.ts` の `PREDEFINED_CLIENTS` 配列を編集してください:

```typescript
export const PREDEFINED_CLIENTS: ClientInfo[] = [
  {
    id: 'new-client',
    name: '新しいクライアント株式会社',
    honorific: '様 御中',
  },
  // 既存のクライアント...
];
```

## 日付計算ロジック

### 請求日

**実行した日の月の初日（1日）** が請求日になります。

例: 2026年2月10日に実行 → 請求日: 2026-02-01

### 支払期限

2つのモードがあります:

#### 1. デフォルトモード (`useLastBusinessDay: false`)

**その月の25日** を支払期限とします。

- 25日が平日の場合: そのまま25日
- 25日が土日の場合: 前倒しで直近の平日

#### 2. 月末営業日モード (`useLastBusinessDay: true`)

**その月の最終営業日** を支払期限とします。

- 月末が平日の場合: その日
- 月末が土日の場合: 前倒しで直近の平日

### 請求書番号

自動生成されます: `INV-YYYYMMDD###`

例: `INV-20260201001`

- `YYYYMMDD`: 請求日
- `###`: 連番（現在は001固定）

## PDFフォーマット

生成される請求書PDFは以下の構成になります:

1. **タイトル**: 「請求書」
2. **クライアント情報**: 左上に宛先
3. **請求情報**: 右上に請求日・請求書番号・事業所住所
4. **件名**: 「業務委託費について」など
5. **金額サマリーテーブル**: 小計・消費税・請求金額
6. **支払情報テーブル**: 入金期日・振込先
7. **明細テーブル**: 摘要・数量・単価・明細金額

## テスト

テストスクリプトで動作確認できます:

```bash
pnpm run test:invoice
```

このスクリプトは以下のテストを実行します:

1. クライアント一覧の取得
2. Trey Link向け単一項目請求書の生成
3. 複数項目請求書の生成（月末営業日期限）

## ファイル構造

```
lib/services/invoice/
├── index.ts           # サービス定義
├── types.ts           # 型定義とクライアントリスト
├── dateUtils.ts       # 日付計算ユーティリティ
├── pdfGenerator.ts    # PDF生成ロジック
└── actions.ts         # アクション定義
```

## トラブルシューティング

### 日本語フォント設定

✅ **日本語フォント対応済み**

IPA exゴシック（IPAex Gothic）フォントを `assets/fonts/ipaexg.ttf` にバンドルしています。PDF生成時に自動的にこのフォントが使用され、日本語が正しく表示されます。

フォントファイルの場所: `assets/fonts/ipaexg.ttf`

もしフォントファイルが見つからない場合は、以下の手順で再ダウンロードしてください:

```bash
mkdir -p assets/fonts
cd assets/fonts
curl -L -o ipaexg.zip "https://moji.or.jp/wp-content/ipafont/IPAexfont/ipaexg00401.zip"
unzip ipaexg.zip
cp ipaexg00401/ipaexg.ttf ./ipaexg.ttf
rm -rf ipaexg00401 ipaexg.zip
```

### PDFが開けない

生成されたPDFファイルが破損している可能性があります。以下を確認してください:

- 出力ディレクトリに書き込み権限があるか
- ディスク容量が十分にあるか
- テストスクリプトがエラーなく完了しているか

### 環境変数が読み込まれない

`.env` ファイルがプロジェクトルートに配置されているか確認してください。また、`dotenv` パッケージが正しくインストールされているか確認してください。

```bash
pnpm add dotenv
```

## 今後の拡張案

- [ ] 請求書番号の連番管理（現在は001固定）
- [ ] 消費税計算のサポート
- [ ] 日本語フォントの適切な設定
- [ ] カスタムテンプレートのサポート
- [ ] 既存請求書の再生成機能
- [ ] 請求書プレビュー機能
- [ ] PDF以外の出力形式（Excel、HTML等）
