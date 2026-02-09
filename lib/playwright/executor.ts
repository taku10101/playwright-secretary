/**
 * Task execution engine with queue management
 */

import { ExecutionResult, TaskStatus, TaskExecutionRequest } from '../config/services';
import { ConfigStorage } from '../config/storage';
import { sessionManager } from './session';
import { getAdapter } from './adapters';

export class TaskExecutor {
  private queue: Map<string, ExecutionResult> = new Map();
  private running = false;

  async executeTask(request: TaskExecutionRequest): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      id: this.generateId(),
      taskId: this.generateId(),
      status: 'pending',
      startedAt: new Date(),
      logs: [],
    };

    this.queue.set(result.id, result);
    this.log(result, `Task queued: ${request.action} on ${request.serviceId}`);

    try {
      // Get service configuration
      const service = await ConfigStorage.getService(request.serviceId);
      if (!service) {
        throw new Error(`Service not found: ${request.serviceId}`);
      }

      if (!service.enabled) {
        throw new Error(`Service is disabled: ${request.serviceId}`);
      }

      // Update status
      result.status = 'running';
      this.log(result, 'Starting task execution');

      // Create session
      const context = await sessionManager.createSession({
        serviceId: request.serviceId,
        headless: true,
      });

      this.log(result, 'Browser session created');

      // Get appropriate adapter
      const adapter = getAdapter(service.type, context, service);

      // Initialize adapter
      await adapter.initialize();
      this.log(result, 'Service adapter initialized');

      // Execute the action
      const actionResult = await adapter.execute(request.action, request.parameters);
      this.log(result, 'Action executed successfully');

      // Save session
      await sessionManager.saveSession(request.serviceId);
      this.log(result, 'Session saved');

      // Cleanup
      await adapter.cleanup();

      // Update result
      result.status = 'completed';
      result.completedAt = new Date();
      result.result = actionResult;

      this.log(result, 'Task completed successfully');
    } catch (error) {
      result.status = 'failed';
      result.completedAt = new Date();
      result.error = error instanceof Error ? error.message : String(error);
      this.log(result, `Task failed: ${result.error}`);
    }

    // Save to history
    await ConfigStorage.saveExecutionResult(result);

    return result;
  }

  private log(result: ExecutionResult, message: string): void {
    const timestamp = new Date().toISOString();
    result.logs.push(`[${timestamp}] ${message}`);
    console.log(`[Task ${result.id}] ${message}`);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  getTaskStatus(taskId: string): ExecutionResult | null {
    return this.queue.get(taskId) || null;
  }
}

export const taskExecutor = new TaskExecutor();
