/**
 * Type definitions for Secretary Skill
 */

export interface SkillContext {
  workingDirectory: string;
  userId: string;
  sessionId?: string;
}

export interface SkillResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  report?: {
    path: string;
    preview: string;
  };
}

export interface ParsedInstruction {
  intent: 'explore' | 'execute' | 'report' | 'query';
  service?: string;
  action?: string;
  parameters: Record<string, any>;
  context: {
    url?: string;
    targetElements?: string[];
    expectedOutcome?: string;
  };
  confidence: number;
  ambiguities?: string[];
}

export interface PageStructure {
  url: string;
  title: string;
  elements: InteractiveElement[];
  accessibility?: AccessibilityNode[];
  screenshot?: string; // base64
  metadata: {
    analyzedAt: Date;
    loadTime: number;
  };
}

export interface InteractiveElement {
  type: 'button' | 'link' | 'input' | 'select' | 'textarea' | 'checkbox' | 'radio';
  selector: string;
  text: string;
  attributes: Record<string, string>;
  position: { x: number; y: number; width: number; height: number };
  visible: boolean;
  enabled: boolean;
  role?: string;
  label?: string;
}

export interface AccessibilityNode {
  role: string;
  name: string;
  selector: string;
  children?: AccessibilityNode[];
}

export interface ActionPlan {
  id: string;
  name: string;
  description: string;
  steps: ActionStep[];
  validation: ValidationRule[];
  estimatedTime: number;
  confidence: number; // 0-1
  prerequisites?: string[];
  risks?: string[];
}

export interface ActionStep {
  order: number;
  type: 'navigate' | 'click' | 'fill' | 'select' | 'wait' | 'verify' | 'screenshot';
  selector?: string;
  value?: any;
  description: string;
  expected?: string;
  timeout?: number;
}

export interface ValidationRule {
  type: 'selector' | 'text' | 'url' | 'custom';
  condition: string;
  expected: any;
  timeout?: number;
}

export interface ExecutionResult {
  id: string;
  planId: string;
  status: 'success' | 'failed' | 'partial';
  startedAt: Date;
  completedAt: Date;
  duration: number;
  steps: ExecutedStep[];
  error?: string;
  screenshots: string[];
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

export interface ActionPattern {
  id: string;
  name: string;
  service: string;
  category: string;
  description: string;
  parameters: ActionParameter[];
  steps: ActionStep[];
  validation: ValidationRule[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
    successRate: number;
  };
}

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  default?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

export interface Report {
  id: string;
  title: string;
  executionId: string;
  generatedAt: Date;
  template: 'business' | 'technical' | 'summary';
  sections: ReportSection[];
  attachments: string[];
}

export interface ReportSection {
  type: 'summary' | 'details' | 'timeline' | 'metrics' | 'recommendations';
  title: string;
  content: string;
  data?: any;
}

export interface WorkflowConfig {
  headless: boolean;
  confirm: boolean;
  report: boolean;
  timeout?: number;
  retries?: number;
}
