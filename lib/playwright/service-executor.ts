/**
 * Service-based task executor
 */

import { ExecutionResult, TaskStatus } from '../config/services';
import { ConfigStorage } from '../config/storage';
import { sessionManager } from './session';
import { getService, getServiceAction } from '../services';

export class ServiceExecutor {
  private queue: Map<string, ExecutionResult> = new Map();

  async executeTask(request: {
    serviceId: string;
    actionId: string;
    parameters: Record<string, any>;
  }): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      id: this.generateId(),
      taskId: this.generateId(),
      status: 'pending',
      startedAt: new Date(),
      logs: [],
    };

    this.queue.set(result.id, result);
    this.log(result, `Task queued: ${request.actionId} on ${request.serviceId}`);

    try {
      // Get service configuration
      const serviceConfig = await ConfigStorage.getService(request.serviceId);
      if (!serviceConfig) {
        throw new Error(`Service configuration not found: ${request.serviceId}`);
      }

      if (!serviceConfig.enabled) {
        throw new Error(`Service is disabled: ${request.serviceId}`);
      }

      // Get service definition
      const service = getService(serviceConfig.type);
      if (!service) {
        throw new Error(`Service type not found: ${serviceConfig.type}`);
      }

      // Get action
      const action = getServiceAction(serviceConfig.type, request.actionId);
      if (!action) {
        throw new Error(`Action not found: ${request.actionId} for service ${serviceConfig.type}`);
      }

      this.log(result, `Found action: ${action.name}`);

      // Validate parameters
      this.validateParameters(action.parameters, request.parameters);

      // Update status
      result.status = 'running';
      this.log(result, 'Starting task execution');

      // Create session
      const context = await sessionManager.createSession({
        serviceId: request.serviceId,
        headless: true,
      });

      this.log(result, 'Browser session created');

      // Initialize session (navigate to service)
      await this.initializeServiceSession(context, service, serviceConfig);
      this.log(result, 'Service session initialized');

      // Execute the action
      const actionResult = await action.execute(context, request.parameters);
      this.log(result, 'Action executed successfully');

      // Save session
      await sessionManager.saveSession(request.serviceId);
      this.log(result, 'Session saved');

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

  private validateParameters(
    parameterDefs: Array<{ name: string; required: boolean }>,
    params: Record<string, any>
  ): void {
    for (const def of parameterDefs) {
      if (def.required && !(def.name in params)) {
        throw new Error(`Required parameter missing: ${def.name}`);
      }
    }
  }

  private async initializeServiceSession(
    context: any,
    service: any,
    serviceConfig: any
  ): Promise<void> {
    const page = await context.newPage();

    try {
      switch (service.id) {
        case 'freee':
          await page.goto('https://secure.freee.co.jp/');
          await page.waitForLoadState('networkidle');
          break;
        default:
          throw new Error(`Unsupported service: ${service.id}`);
      }
    } finally {
      await page.close();
    }
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

export const serviceExecutor = new ServiceExecutor();
