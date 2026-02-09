# {{title}}

**報告者**: {{author}}
**報告日時**: {{generatedAt}}
**タスクID**: {{taskId}}
**実行時間**: {{duration}}秒

---

## エグゼクティブサマリー

{{summary}}

---

## 実行内容

### 指示内容

{{instruction}}

### 実行したアクション

{{#each steps}}
{{order}}. **{{description}}** ({{duration}}秒)
   {{#if details}}
   - {{details}}
   {{/if}}
   {{#if status}}
   - 状態: {{status}}
   {{/if}}
{{/each}}

---

## 実行結果

{{#if success}}
✅ **成功**
{{else}}
❌ **失敗**
{{/if}}

{{result}}

{{#if screenshots}}
### スクリーンショット

{{#each screenshots}}
![{{caption}}]({{path}})
{{/each}}
{{/if}}

---

## パフォーマンス

| 項目 | 値 |
|------|-----|
| 総実行時間 | {{metrics.totalDuration}}秒 |
| ページ読み込み | {{metrics.pageLoadTime}}秒 |
| ユーザー操作 | {{metrics.actionTime}}秒 |
| 検証時間 | {{metrics.validationTime}}秒 |
| 完了ステップ | {{metrics.stepsCompleted}}/{{metrics.stepsTotal}} |

---

{{#if recommendations}}
## 備考・推奨事項

{{#each recommendations}}
- {{title}}: {{description}}
{{/each}}
{{/if}}

---

**以上、ご報告申し上げます。**

*本報告書はAI秘書システムにより自動生成されました。*
