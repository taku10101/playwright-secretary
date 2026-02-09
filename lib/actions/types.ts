/**
 * Action Library Type Definitions
 */

export interface ActionPattern {
  id: string;
  name: string;
  service: string;
  category: ActionCategory;
  description: string;
  parameters: ActionParameter[];
  steps: ActionStep[];
  validation: ValidationRule[];
  metadata: ActionMetadata;
}

export type ActionCategory =
  | 'communication'
  | 'content'
  | 'navigation'
  | 'data-entry'
  | 'search'
  | 'auth'
  | 'custom';

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  default?: any;
  validation?: ParameterValidation;
}

export interface ParameterValidation {
  pattern?: string; // Regex pattern
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  enum?: any[];
  custom?: (value: any) => boolean;
}

export interface ActionStep {
  order: number;
  type: StepType;
  selector?: string;
  value?: any;
  description: string;
  expected?: string;
  timeout?: number;
  retries?: number;
  optional?: boolean;
}

export type StepType =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'select'
  | 'check'
  | 'uncheck'
  | 'wait'
  | 'waitForSelector'
  | 'waitForNavigation'
  | 'scroll'
  | 'hover'
  | 'press'
  | 'type'
  | 'screenshot'
  | 'verify'
  | 'custom';

export interface ValidationRule {
  type: ValidationType;
  condition: string;
  expected: any;
  timeout?: number;
  errorMessage?: string;
}

export type ValidationType =
  | 'selector'
  | 'text'
  | 'url'
  | 'title'
  | 'attribute'
  | 'count'
  | 'custom';

export interface ActionMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  usageCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageDuration: number;
  tags: string[];
  version: string;
}

export interface ActionExecutionContext {
  parameters: Record<string, any>;
  variables: Record<string, any>;
  config: {
    headless: boolean;
    timeout: number;
    retries: number;
    screenshots: boolean;
  };
}

export interface ActionExecutionResult {
  success: boolean;
  duration: number;
  steps: ExecutedStep[];
  variables: Record<string, any>;
  screenshots: string[];
  error?: string;
  logs: string[];
}

export interface ExecutedStep extends ActionStep {
  executedAt: Date;
  duration: number;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  screenshot?: string;
  actualResult?: any;
}

export interface ActionLibraryFilter {
  service?: string;
  category?: ActionCategory;
  tags?: string[];
  minSuccessRate?: number;
  search?: string;
}

export interface ActionLibraryStats {
  totalPatterns: number;
  byService: Record<string, number>;
  byCategory: Record<string, number>;
  totalUsage: number;
  averageSuccessRate: number;
}
