/**
 * Report Generator Type Definitions
 */

export interface Report {
  id: string;
  title: string;
  executionId: string;
  generatedAt: Date;
  template: ReportTemplate;
  sections: ReportSection[];
  attachments: string[];
  metadata: ReportMetadata;
}

export type ReportTemplate = 'business' | 'technical' | 'summary';

export interface ReportSection {
  type: SectionType;
  title: string;
  content: string;
  data?: any;
  order: number;
}

export type SectionType =
  | 'summary'
  | 'details'
  | 'timeline'
  | 'metrics'
  | 'screenshots'
  | 'recommendations'
  | 'errors'
  | 'logs';

export interface ReportMetadata {
  author: string;
  reportedBy: string;
  language: 'ja' | 'en';
  format: 'markdown' | 'html' | 'pdf';
  tags: string[];
}

export interface ReportGenerationOptions {
  template?: ReportTemplate;
  language?: 'ja' | 'en';
  includeScreenshots?: boolean;
  includeLogs?: boolean;
  includeMetrics?: boolean;
  includeRecommendations?: boolean;
}

export interface ExecutionSummary {
  taskId: string;
  taskName: string;
  status: 'success' | 'failed' | 'partial';
  startedAt: Date;
  completedAt: Date;
  duration: number;
  service: string;
  action: string;
  parameters: Record<string, any>;
}

export interface TimelineEntry {
  timestamp: Date;
  order: number;
  type: 'step' | 'milestone' | 'error';
  title: string;
  description: string;
  duration?: number;
  status?: 'success' | 'failed' | 'skipped';
  screenshot?: string;
}

export interface PerformanceMetrics {
  totalDuration: number;
  pageLoadTime: number;
  actionTime: number;
  validationTime: number;
  screenshotTime: number;
  stepsCompleted: number;
  stepsTotal: number;
  averageStepDuration: number;
}

export interface Recommendation {
  type: 'optimization' | 'maintenance' | 'improvement' | 'warning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
}
