/**
 * Report Generator - Generates business reports from execution results
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  Report,
  ReportSection,
  ReportGenerationOptions,
  ExecutionSummary,
  TimelineEntry,
  PerformanceMetrics,
  Recommendation,
} from './types';
import type { ActionExecutionResult } from '../actions/types';

export class ReportGenerator {
  private reportsDir: string;

  constructor(reportsDir: string = '.reports') {
    this.reportsDir = reportsDir;
  }

  /**
   * Generate report from execution result
   */
  async generate(
    execution: ActionExecutionResult & { id: string; name: string },
    options: ReportGenerationOptions = {}
  ): Promise<Report> {
    const {
      template = 'business',
      language = 'ja',
      includeScreenshots = true,
      includeLogs = true,
      includeMetrics = true,
      includeRecommendations = true,
    } = options;

    const reportId = `report-${Date.now()}`;
    const sections: ReportSection[] = [];

    // Summary section
    sections.push(this.generateSummarySection(execution, language));

    // Details section
    sections.push(this.generateDetailsSection(execution, language));

    // Timeline section
    sections.push(this.generateTimelineSection(execution, language));

    // Metrics section
    if (includeMetrics) {
      sections.push(this.generateMetricsSection(execution, language));
    }

    // Screenshots section
    if (includeScreenshots && execution.screenshots.length > 0) {
      sections.push(
        await this.generateScreenshotsSection(execution, reportId, language)
      );
    }

    // Logs section
    if (includeLogs && execution.logs.length > 0) {
      sections.push(this.generateLogsSection(execution, language));
    }

    // Recommendations section
    if (includeRecommendations) {
      sections.push(this.generateRecommendationsSection(execution, language));
    }

    // Errors section (if failed)
    if (!execution.success) {
      sections.push(this.generateErrorsSection(execution, language));
    }

    const report: Report = {
      id: reportId,
      title:
        language === 'ja'
          ? `業務報告書 - ${execution.name}`
          : `Business Report - ${execution.name}`,
      executionId: execution.id,
      generatedAt: new Date(),
      template,
      sections: sections.sort((a, b) => a.order - b.order),
      attachments: execution.screenshots,
      metadata: {
        author: 'AI秘書システム',
        reportedBy: 'Playwright Secretary',
        language,
        format: 'markdown',
        tags: ['automated', 'execution-report'],
      },
    };

    // Save report
    await this.save(report);

    return report;
  }

  /**
   * Generate summary section
   */
  private generateSummarySection(
    execution: ActionExecutionResult & { id: string; name: string },
    language: 'ja' | 'en'
  ): ReportSection {
    const statusText =
      language === 'ja'
        ? execution.success
          ? '✅ 正常に完了しました'
          : '❌ 失敗しました'
        : execution.success
        ? '✅ Completed successfully'
        : '❌ Failed';

    const content =
      language === 'ja'
        ? `
ご指示いただきました「${execution.name}」の実行を${statusText}。
実行時間は約${execution.duration.toFixed(1)}秒で、全${execution.steps.length}ステップのうち${
            execution.steps.filter((s) => s.status === 'success').length
          }ステップが正常に完了しております。
        `.trim()
        : `
The execution of "${execution.name}" ${statusText}.
Execution time was approximately ${execution.duration.toFixed(1)} seconds, with ${
            execution.steps.filter((s) => s.status === 'success').length
          } out of ${execution.steps.length} steps completed successfully.
        `.trim();

    return {
      type: 'summary',
      title: language === 'ja' ? 'エグゼクティブサマリー' : 'Executive Summary',
      content,
      order: 1,
    };
  }

  /**
   * Generate details section
   */
  private generateDetailsSection(
    execution: ActionExecutionResult & { id: string; name: string },
    language: 'ja' | 'en'
  ): ReportSection {
    const stepsContent = execution.steps
      .map((step, index) => {
        const statusEmoji =
          step.status === 'success'
            ? '✅'
            : step.status === 'failed'
            ? '❌'
            : '⏭️';

        return `${index + 1}. ${statusEmoji} **${step.description}** (${step.duration.toFixed(
          2
        )}秒)
   ${language === 'ja' ? '状態' : 'Status'}: ${step.status}
   ${step.actualResult ? `${language === 'ja' ? '結果' : 'Result'}: ${JSON.stringify(step.actualResult)}` : ''}
   ${step.error ? `${language === 'ja' ? 'エラー' : 'Error'}: ${step.error}` : ''}`;
      })
      .join('\n\n');

    const content = `
### ${language === 'ja' ? '実行したアクション' : 'Executed Actions'}

${stepsContent}
    `.trim();

    return {
      type: 'details',
      title: language === 'ja' ? '実行内容' : 'Execution Details',
      content,
      data: { steps: execution.steps },
      order: 2,
    };
  }

  /**
   * Generate timeline section
   */
  private generateTimelineSection(
    execution: ActionExecutionResult & { id: string; name: string },
    language: 'ja' | 'en'
  ): ReportSection {
    const timeline: TimelineEntry[] = execution.steps.map((step, index) => ({
      timestamp: step.executedAt,
      order: index + 1,
      type: 'step' as const,
      title: step.description,
      description: step.type,
      duration: step.duration,
      status: step.status,
    }));

    const content = timeline
      .map((entry) => {
        const time = entry.timestamp.toLocaleTimeString(
          language === 'ja' ? 'ja-JP' : 'en-US'
        );
        const statusEmoji =
          entry.status === 'success'
            ? '✅'
            : entry.status === 'failed'
            ? '❌'
            : '⏭️';

        return `**${time}** ${statusEmoji} ${entry.title} (${entry.duration?.toFixed(2)}秒)`;
      })
      .join('\n');

    return {
      type: 'timeline',
      title: language === 'ja' ? 'タイムライン' : 'Timeline',
      content,
      data: { timeline },
      order: 3,
    };
  }

  /**
   * Generate metrics section
   */
  private generateMetricsSection(
    execution: ActionExecutionResult & { id: string; name: string },
    language: 'ja' | 'en'
  ): ReportSection {
    const successCount = execution.steps.filter(
      (s) => s.status === 'success'
    ).length;
    const failedCount = execution.steps.filter(
      (s) => s.status === 'failed'
    ).length;
    const skippedCount = execution.steps.filter(
      (s) => s.status === 'skipped'
    ).length;

    const avgDuration =
      execution.steps.reduce((sum, s) => sum + s.duration, 0) /
      execution.steps.length;

    const content = `
| ${language === 'ja' ? '項目' : 'Metric'} | ${language === 'ja' ? '値' : 'Value'} |
|------|------|
| ${language === 'ja' ? '総実行時間' : 'Total Duration'} | ${execution.duration.toFixed(2)}秒 |
| ${language === 'ja' ? '総ステップ数' : 'Total Steps'} | ${execution.steps.length} |
| ${language === 'ja' ? '成功' : 'Successful'} | ${successCount} |
| ${language === 'ja' ? '失敗' : 'Failed'} | ${failedCount} |
| ${language === 'ja' ? 'スキップ' : 'Skipped'} | ${skippedCount} |
| ${language === 'ja' ? '平均ステップ時間' : 'Avg Step Duration'} | ${avgDuration.toFixed(2)}秒 |
| ${language === 'ja' ? 'スクリーンショット数' : 'Screenshots'} | ${execution.screenshots.length} |
    `.trim();

    return {
      type: 'metrics',
      title: language === 'ja' ? 'パフォーマンスメトリクス' : 'Performance Metrics',
      content,
      data: {
        totalDuration: execution.duration,
        stepsTotal: execution.steps.length,
        stepsCompleted: successCount,
        stepsFailed: failedCount,
        stepsSkipped: skippedCount,
        averageStepDuration: avgDuration,
      },
      order: 4,
    };
  }

  /**
   * Generate screenshots section
   */
  private async generateScreenshotsSection(
    execution: ActionExecutionResult & { id: string; name: string },
    reportId: string,
    language: 'ja' | 'en'
  ): ReportSection {
    const screenshotsDir = await this.ensureScreenshotsDir(reportId);
    const screenshots: string[] = [];

    for (let i = 0; i < execution.screenshots.length; i++) {
      const filename = `screenshot-${i + 1}.jpg`;
      const filepath = path.join(screenshotsDir, filename);

      // Save screenshot
      const buffer = Buffer.from(execution.screenshots[i], 'base64');
      await fs.writeFile(filepath, buffer);

      screenshots.push(filename);
    }

    const content = screenshots
      .map(
        (filename, i) =>
          `![${language === 'ja' ? 'スクリーンショット' : 'Screenshot'} ${i + 1}](./screenshots/${filename})`
      )
      .join('\n\n');

    return {
      type: 'screenshots',
      title: language === 'ja' ? 'スクリーンショット' : 'Screenshots',
      content,
      order: 5,
    };
  }

  /**
   * Generate logs section
   */
  private generateLogsSection(
    execution: ActionExecutionResult & { id: string; name: string },
    language: 'ja' | 'en'
  ): ReportSection {
    const content = `
\`\`\`
${execution.logs.join('\n')}
\`\`\`
    `.trim();

    return {
      type: 'logs',
      title: language === 'ja' ? '実行ログ' : 'Execution Logs',
      content,
      order: 6,
    };
  }

  /**
   * Generate recommendations section
   */
  private generateRecommendationsSection(
    execution: ActionExecutionResult & { id: string; name: string },
    language: 'ja' | 'en'
  ): ReportSection {
    const recommendations: Recommendation[] = [];

    // Success rate recommendation
    const successRate =
      execution.steps.filter((s) => s.status === 'success').length /
      execution.steps.length;

    if (successRate === 1.0) {
      recommendations.push({
        type: 'improvement',
        priority: 'low',
        title:
          language === 'ja'
            ? '再利用可能なパターンとして保存'
            : 'Save as reusable pattern',
        description:
          language === 'ja'
            ? '今回の実行は100%成功しました。このアクションパターンをライブラリに保存することで、次回以降も同様の操作を簡単に実行できます。'
            : 'This execution was 100% successful. Save this action pattern to the library for easy reuse in future operations.',
      });
    }

    // Duration recommendation
    if (execution.duration > 30) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title:
          language === 'ja'
            ? '実行時間の最適化を検討'
            : 'Consider optimizing execution time',
        description:
          language === 'ja'
            ? '実行時間が30秒を超えています。不要な待機時間や冗長なステップがないか確認してください。'
            : 'Execution time exceeded 30 seconds. Check for unnecessary wait times or redundant steps.',
      });
    }

    const content = recommendations
      .map((rec) => {
        const priorityEmoji =
          rec.priority === 'high'
            ? '🔴'
            : rec.priority === 'medium'
            ? '🟡'
            : '🟢';
        return `${priorityEmoji} **${rec.title}**\n${rec.description}`;
      })
      .join('\n\n');

    return {
      type: 'recommendations',
      title: language === 'ja' ? '備考・推奨事項' : 'Recommendations',
      content: content || (language === 'ja' ? '特になし' : 'None'),
      data: { recommendations },
      order: 7,
    };
  }

  /**
   * Generate errors section
   */
  private generateErrorsSection(
    execution: ActionExecutionResult & { id: string; name: string },
    language: 'ja' | 'en'
  ): ReportSection {
    const failedSteps = execution.steps.filter((s) => s.status === 'failed');

    const content = failedSteps
      .map((step) => {
        return `### Step ${step.order}: ${step.description}

**${language === 'ja' ? 'エラー' : 'Error'}**: ${step.error || 'Unknown error'}

**${language === 'ja' ? '状況' : 'Context'}**:
- ${language === 'ja' ? 'アクション' : 'Action'}: ${step.type}
- ${language === 'ja' ? 'セレクタ' : 'Selector'}: ${step.selector || 'N/A'}
- ${language === 'ja' ? '実行時間' : 'Duration'}: ${step.duration.toFixed(2)}秒`;
      })
      .join('\n\n');

    return {
      type: 'errors',
      title: language === 'ja' ? 'エラー詳細' : 'Error Details',
      content,
      order: 8,
    };
  }

  /**
   * Save report to file
   */
  private async save(report: Report): Promise<string> {
    const date = report.generatedAt.toISOString().split('T')[0];
    const reportDir = path.join(this.reportsDir, date);
    await fs.mkdir(reportDir, { recursive: true });

    const filename = `${report.id}.md`;
    const filepath = path.join(reportDir, filename);

    const content = this.renderMarkdown(report);
    await fs.writeFile(filepath, content, 'utf-8');

    return filepath;
  }

  /**
   * Render report as markdown
   */
  private renderMarkdown(report: Report): string {
    let markdown = `# ${report.title}\n\n`;
    markdown += `**${report.metadata.language === 'ja' ? '報告者' : 'Author'}**: ${report.metadata.reportedBy}\n`;
    markdown += `**${report.metadata.language === 'ja' ? '報告日時' : 'Generated At'}**: ${report.generatedAt.toLocaleString(report.metadata.language === 'ja' ? 'ja-JP' : 'en-US')}\n`;
    markdown += `**${report.metadata.language === 'ja' ? 'タスクID' : 'Task ID'}**: ${report.executionId}\n\n`;
    markdown += `---\n\n`;

    for (const section of report.sections) {
      markdown += `## ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;
      markdown += `---\n\n`;
    }

    markdown += `**${report.metadata.language === 'ja' ? '以上、ご報告申し上げます。' : 'End of report.'}**\n\n`;
    markdown += `*${report.metadata.language === 'ja' ? '本報告書はAI秘書システムにより自動生成されました。' : 'This report was automatically generated by the AI Secretary System.'}*\n`;

    return markdown;
  }

  /**
   * Ensure screenshots directory exists
   */
  private async ensureScreenshotsDir(reportId: string): Promise<string> {
    const date = new Date().toISOString().split('T')[0];
    const dir = path.join(this.reportsDir, date, 'screenshots');
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  /**
   * Get report by ID
   */
  async load(reportId: string): Promise<Report | null> {
    // Search in date directories
    try {
      const dates = await fs.readdir(this.reportsDir);

      for (const date of dates) {
        const filepath = path.join(this.reportsDir, date, `${reportId}.md`);
        try {
          await fs.access(filepath);
          // Found the file, but we need to reconstruct the Report object
          // For now, return null as we'd need to parse the markdown
          return null;
        } catch {
          continue;
        }
      }
    } catch {
      return null;
    }

    return null;
  }
}

// Export singleton instance
export const reportGenerator = new ReportGenerator();
