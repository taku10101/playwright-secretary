/**
 * Type definitions for Playwright Secretary Platform
 */

export type ServiceType = 'freee' | 'generic';

export interface ServiceConfig {
  id: string;
  type: ServiceType;
  name: string;
  enabled: boolean;
  credentials: Record<string, string>;
  settings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDefinition {
  id: string;
  serviceId: string;
  action: string;
  parameters: Record<string, unknown>;
  createdAt: Date;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ExecutionResult {
  id: string;
  taskId: string;
  status: TaskStatus;
  startedAt: Date;
  completedAt?: Date;
  result?: unknown;
  error?: string;
  logs: string[];
}

export interface TaskExecutionRequest {
  serviceId: string;
  action: string;
  parameters: Record<string, unknown>;
}

export interface ServiceAdapter {
  initialize(): Promise<void>;
  execute(action: string, parameters: Record<string, unknown>): Promise<unknown>;
  cleanup(): Promise<void>;
}
