---
name: git-workflow
description: .ai-guide/workflow.mdで定義されたプロジェクトのワークフロールールに従ってgit操作を実行します。ブランチ作成、コミット、PR作成を規約に沿って行います。
---

# Git Workflow Skill

`.ai-guide/workflow.md`で定義されたプロジェクトのワークフロールールに従ってgit操作を実行します。

## ブランチ戦略

- **main**: 本番環境用ブランチ。常にデプロイ可能な状態を保つ。
- **develop**: 開発統合ブランチ。次のリリース候補が集約される。
- **feature/***: 新機能や改修用ブランチ。`develop`から分岐し、完了後に`develop`にマージ。
- **hotfix/***: 本番環境の緊急修正用ブランチ。`main`から分岐し、修正後は`main`と`develop`の両方にマージ。

## コミットメッセージ規約

以下のプレフィックスを使用:

- `feat: ` - 機能追加
- `fix: ` - バグ修正
- `docs: ` - ドキュメント修正
- `refactor: ` - リファクタリング
- `test: ` - テスト追加や修正
- `chore: ` - ビルド設定や依存関係更新

## ワークフローコマンド

### 1. 現在の状態を確認

作業を始める前に必ず現在の状態を確認:

```bash
git status
git log --oneline -5
git branch -a
```

### 2. featureブランチを作成

新機能の場合は`develop`から分岐:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/機能名
```

### 3. hotfixブランチを作成

緊急修正の場合は`main`から分岐:

```bash
git checkout main
git pull origin main
git checkout -b hotfix/修正名
```

### 4. 変更をコミット

適切なメッセージフォーマットでステージング&コミット:

```bash
git add <ファイル>
git commit -m "feat: ユーザー認証機能を追加

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5. ブランチをプッシュ

```bash
git push -u origin <ブランチ名>
```

### 6. プルリクエストを作成

GitHub CLIを使用して適切なテンプレートでPRを作成:

```bash
gh pr create --title "feat: 説明的なタイトル" --body "$(cat <<'EOF'
## 概要
- 変更内容の箇条書き
- 背景とコンテキスト
- テスト結果

## テスト計画
- [ ] ユニットテスト通過
- [ ] 統合テスト通過
- [ ] 手動テスト完了

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" --base develop
```

hotfixのPRの場合は`--base main`を使用。

## 開発フロー

1. **Issue作成** - タスクやバグの内容を記載し、優先度を設定
2. **ブランチ作成** - `develop`または`main`(hotfixの場合)から新しいブランチを切る
3. **実装** - `./ai-guide/coding-rules.md`に従ってコードを書く
4. **テスト** - `./ai-guide/testing.md`の基準を満たすこと
5. **PR作成** - 変更内容、背景、テスト結果を記載
6. **レビュー** - 自動テストが全て通ることを確認
7. **マージ** - コードレビューを経て承認後にマージ
8. **デプロイ** - CI/CDパイプラインで自動デプロイ(必要に応じて手動承認)

## ベストプラクティス

- 実装や修正時は必ず`./ai-guide/index.md`を参照
- AI出力は直接コミットせず、人間がレビューしてから反映
- ブランチ命名やコミットメッセージはプロジェクト規約に従う
- PR作成前に全ての自動テストが通ることを確認
- コミットはアトミックで焦点を絞ったものにする
- 明確で説明的なコミットメッセージを書く

## リリース手順

1. `develop`を`main`にマージ
2. バージョンタグを作成(例: `v1.2.0`)
3. 本番環境にデプロイ
4. リリースノートを作成し共有

## AIのためのガイドライン

- 変更を行う前に必ずgit statusを確認
- コミットメッセージ規約に正確に従う
- PRの適切なベースブランチを確認(featureはdevelop、hotfixはmain)
- PRボディに必要なセクションを全て含める
- PR作成前にテストが通ることを検証
- 実装中は関連するai-guideドキュメントを参照
