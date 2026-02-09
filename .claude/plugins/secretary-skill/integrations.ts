/**
 * Integration layer between Secretary Skill and core modules
 */

import type { BrowserContext } from 'playwright';
import type { ParsedInstruction, ActionPlan, ExecutionResult } from './types';
import { uiExplorer } from '../../../lib/playwright/explorer';
import { actionLibrary, patternMatcher, actionExecutor } from '../../../lib/actions';
import { reportGenerator } from '../../../lib/reports';
import { sessionManager } from '../../../lib/playwright/session';

export class SecretaryIntegrations {
  /**
   * Create browser session
   */
  async createSession(options: { headless: boolean; serviceId?: string }): Promise<BrowserContext> {
    return await sessionManager.createSession({
      serviceId: options.serviceId || 'secretary',
      headless: options.headless,
    });
  }

  /**
   * Explore page UI
   */
  async explorePage(context: BrowserContext, url: string) {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    const structure = await uiExplorer.explore(page, {
      includeHidden: false,
      includeDisabled: false,
      maxElements: 100,
      screenshotQuality: 80,
    });

    return { page, structure };
  }

  /**
   * Find matching action pattern
   */
  async findActionPattern(instruction: ParsedInstruction) {
    return await patternMatcher.findBestMatch({
      service: instruction.service,
      action: instruction.action,
      parameters: instruction.parameters,
      description: `${instruction.service} ${instruction.action}`,
    });
  }

  /**
   * Execute action pattern
   */
  async executeAction(
    context: BrowserContext,
    plan: ActionPlan,
    parameters: Record<string, any>
  ): Promise<ExecutionResult> {
    const page = await context.newPage();

    // Convert ActionPlan to ActionPattern format
    const pattern = {
      id: plan.id,
      name: plan.name,
      service: 'custom',
      category: 'custom' as const,
      description: plan.description,
      parameters: Object.keys(parameters).map((key) => ({
        name: key,
        type: 'string' as const,
        required: true,
        description: `Parameter ${key}`,
      })),
      steps: plan.steps,
      validation: plan.validation,
    };

    const executionContext = {
      parameters,
      variables: {},
      config: {
        headless: true,
        timeout: 30000,
        retries: 3,
        screenshots: true,
      },
    };

    const result = await actionExecutor.execute(
      page,
      pattern as any,
      executionContext
    );

    return {
      id: plan.id,
      planId: plan.id,
      status: result.success ? 'success' : 'failed',
      startedAt: new Date(),
      completedAt: new Date(),
      duration: result.duration,
      steps: result.steps,
      screenshots: result.screenshots,
      logs: result.logs,
      error: result.error,
    };
  }

  /**
   * Generate execution report
   */
  async generateReport(execution: ExecutionResult & { name: string }) {
    return await reportGenerator.generate(execution, {
      template: 'business',
      language: 'ja',
      includeScreenshots: true,
      includeLogs: true,
      includeMetrics: true,
      includeRecommendations: true,
    });
  }

  /**
   * Save successful action as pattern
   */
  async saveAsPattern(
    execution: ExecutionResult,
    metadata: {
      name: string;
      service: string;
      category: string;
      description: string;
    }
  ) {
    if (execution.status !== 'success') {
      return null;
    }

    const pattern = await actionLibrary.add({
      id: `pattern-${Date.now()}`,
      name: metadata.name,
      service: metadata.service,
      category: metadata.category as any,
      description: metadata.description,
      parameters: [],
      steps: execution.steps.map((step) => ({
        order: step.order,
        type: step.type,
        selector: step.selector,
        value: step.value,
        description: step.description,
        expected: step.expected,
        timeout: step.timeout,
      })),
      validation: [],
    });

    return pattern;
  }

  /**
   * Close session
   */
  async closeSession(context: BrowserContext) {
    await context.close();
  }
}

export const secretaryIntegrations = new SecretaryIntegrations();
