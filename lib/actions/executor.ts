/**
 * Action Executor - Executes action patterns
 */

import type { Page } from 'playwright';
import type {
  ActionPattern,
  ActionExecutionContext,
  ActionExecutionResult,
  ActionStep,
  ExecutedStep,
} from './types';

export class ActionExecutor {
  /**
   * Execute an action pattern
   */
  async execute(
    page: Page,
    pattern: ActionPattern,
    context: ActionExecutionContext
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const executedSteps: ExecutedStep[] = [];
    const screenshots: string[] = [];
    const logs: string[] = [];
    const variables = { ...context.variables };

    this.log(logs, `Starting execution: ${pattern.name}`);

    try {
      // Validate parameters
      this.validateParameters(pattern, context.parameters);
      this.log(logs, 'Parameters validated');

      // Execute each step
      for (const step of pattern.steps) {
        const stepStartTime = Date.now();
        this.log(logs, `Step ${step.order}: ${step.description}`);

        try {
          const result = await this.executeStep(
            page,
            step,
            context,
            variables
          );

          const executedStep: ExecutedStep = {
            ...step,
            executedAt: new Date(),
            duration: (Date.now() - stepStartTime) / 1000,
            status: 'success',
            actualResult: result,
          };

          // Capture screenshot if requested
          if (context.config.screenshots || step.type === 'screenshot') {
            const screenshot = await page.screenshot({ type: 'jpeg' });
            executedStep.screenshot = screenshot.toString('base64');
            screenshots.push(executedStep.screenshot);
          }

          executedSteps.push(executedStep);
          this.log(logs, `Step ${step.order}: Success`);

          // Store result in variables if specified
          if (result !== undefined) {
            variables[`step${step.order}_result`] = result;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          // Handle retries
          if (step.retries && step.retries > 0) {
            this.log(logs, `Step ${step.order}: Retrying (${step.retries} attempts left)`);
            // TODO: Implement retry logic
          }

          // Handle optional steps
          if (step.optional) {
            this.log(logs, `Step ${step.order}: Failed (optional, continuing)`);
            executedSteps.push({
              ...step,
              executedAt: new Date(),
              duration: (Date.now() - stepStartTime) / 1000,
              status: 'skipped',
              error: errorMessage,
            });
            continue;
          }

          // Step failed and not optional
          this.log(logs, `Step ${step.order}: Failed - ${errorMessage}`);
          executedSteps.push({
            ...step,
            executedAt: new Date(),
            duration: (Date.now() - stepStartTime) / 1000,
            status: 'failed',
            error: errorMessage,
          });

          throw error;
        }
      }

      // Validate results
      await this.validateResults(page, pattern, logs);
      this.log(logs, 'Validation passed');

      const duration = (Date.now() - startTime) / 1000;
      this.log(logs, `Execution completed in ${duration}s`);

      return {
        success: true,
        duration,
        steps: executedSteps,
        variables,
        screenshots,
        logs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const duration = (Date.now() - startTime) / 1000;

      this.log(logs, `Execution failed: ${errorMessage}`);

      return {
        success: false,
        duration,
        steps: executedSteps,
        variables,
        screenshots,
        error: errorMessage,
        logs,
      };
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    page: Page,
    step: ActionStep,
    context: ActionExecutionContext,
    variables: Record<string, any>
  ): Promise<any> {
    const timeout = step.timeout || context.config.timeout;
    const value = this.resolveValue(step.value, context.parameters, variables);

    switch (step.type) {
      case 'navigate':
        await page.goto(value, { timeout });
        return page.url();

      case 'click':
        if (!step.selector) throw new Error('Selector required for click');
        await page.locator(step.selector).click({ timeout });
        return true;

      case 'fill':
        if (!step.selector) throw new Error('Selector required for fill');
        await page.locator(step.selector).fill(value, { timeout });
        return value;

      case 'select':
        if (!step.selector) throw new Error('Selector required for select');
        await page.locator(step.selector).selectOption(value, { timeout });
        return value;

      case 'check':
        if (!step.selector) throw new Error('Selector required for check');
        await page.locator(step.selector).check({ timeout });
        return true;

      case 'uncheck':
        if (!step.selector) throw new Error('Selector required for uncheck');
        await page.locator(step.selector).uncheck({ timeout });
        return true;

      case 'wait':
        await page.waitForTimeout(value || 1000);
        return true;

      case 'waitForSelector':
        if (!step.selector) throw new Error('Selector required for waitForSelector');
        await page.waitForSelector(step.selector, { timeout });
        return true;

      case 'waitForNavigation':
        await page.waitForLoadState('networkidle', { timeout });
        return page.url();

      case 'scroll':
        if (step.selector) {
          await page.locator(step.selector).scrollIntoViewIfNeeded();
        } else {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        }
        return true;

      case 'hover':
        if (!step.selector) throw new Error('Selector required for hover');
        await page.locator(step.selector).hover({ timeout });
        return true;

      case 'press':
        await page.keyboard.press(value);
        return true;

      case 'type':
        if (!step.selector) throw new Error('Selector required for type');
        await page.locator(step.selector).pressSequentially(value, { timeout });
        return value;

      case 'screenshot':
        const screenshot = await page.screenshot({ type: 'jpeg' });
        return screenshot.toString('base64');

      case 'verify':
        if (!step.selector) throw new Error('Selector required for verify');
        const element = page.locator(step.selector);
        const visible = await element.isVisible();
        if (!visible) {
          throw new Error(`Verification failed: ${step.selector} not visible`);
        }
        return true;

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Validate parameters
   */
  private validateParameters(
    pattern: ActionPattern,
    parameters: Record<string, any>
  ): void {
    for (const param of pattern.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Required parameter missing: ${param.name}`);
      }

      if (param.name in parameters) {
        const value = parameters[param.name];

        // Type validation
        const actualType = typeof value;
        if (param.type !== actualType && !(param.type === 'array' && Array.isArray(value))) {
          throw new Error(
            `Parameter ${param.name} type mismatch: expected ${param.type}, got ${actualType}`
          );
        }

        // Custom validation
        if (param.validation) {
          this.validateParameterValue(param.name, value, param.validation);
        }
      }
    }
  }

  /**
   * Validate parameter value
   */
  private validateParameterValue(
    name: string,
    value: any,
    validation: any
  ): void {
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new Error(`Parameter ${name} does not match pattern ${validation.pattern}`);
      }
    }

    if (validation.min !== undefined && value < validation.min) {
      throw new Error(`Parameter ${name} is less than minimum ${validation.min}`);
    }

    if (validation.max !== undefined && value > validation.max) {
      throw new Error(`Parameter ${name} is greater than maximum ${validation.max}`);
    }

    if (validation.minLength !== undefined && value.length < validation.minLength) {
      throw new Error(`Parameter ${name} length is less than ${validation.minLength}`);
    }

    if (validation.maxLength !== undefined && value.length > validation.maxLength) {
      throw new Error(`Parameter ${name} length is greater than ${validation.maxLength}`);
    }

    if (validation.enum && !validation.enum.includes(value)) {
      throw new Error(`Parameter ${name} must be one of: ${validation.enum.join(', ')}`);
    }
  }

  /**
   * Validate execution results
   */
  private async validateResults(
    page: Page,
    pattern: ActionPattern,
    logs: string[]
  ): Promise<void> {
    for (const rule of pattern.validation) {
      this.log(logs, `Validating: ${rule.type} - ${rule.condition}`);

      switch (rule.type) {
        case 'selector':
          const element = page.locator(rule.condition);
          const visible = await element.isVisible();
          if (!visible) {
            throw new Error(
              rule.errorMessage || `Validation failed: ${rule.condition} not visible`
            );
          }
          break;

        case 'text':
          const text = await page.textContent('body');
          if (!text?.includes(rule.expected)) {
            throw new Error(
              rule.errorMessage || `Validation failed: expected text "${rule.expected}" not found`
            );
          }
          break;

        case 'url':
          const url = page.url();
          if (rule.condition === 'contains' && !url.includes(rule.expected)) {
            throw new Error(
              rule.errorMessage || `Validation failed: URL does not contain "${rule.expected}"`
            );
          }
          if (rule.condition === 'equals' && url !== rule.expected) {
            throw new Error(
              rule.errorMessage || `Validation failed: URL is not "${rule.expected}"`
            );
          }
          break;

        case 'title':
          const title = await page.title();
          if (rule.condition === 'contains' && !title.includes(rule.expected)) {
            throw new Error(
              rule.errorMessage || `Validation failed: Title does not contain "${rule.expected}"`
            );
          }
          break;
      }
    }
  }

  /**
   * Resolve value with parameter/variable substitution
   */
  private resolveValue(
    value: any,
    parameters: Record<string, any>,
    variables: Record<string, any>
  ): any {
    if (typeof value !== 'string') {
      return value;
    }

    // Replace {{parameter}} with actual values
    let resolved = value;
    const paramRegex = /\{\{(\w+)\}\}/g;

    resolved = resolved.replace(paramRegex, (match, name) => {
      if (name in parameters) {
        return parameters[name];
      }
      if (name in variables) {
        return variables[name];
      }
      return match; // Keep original if not found
    });

    return resolved;
  }

  /**
   * Log message
   */
  private log(logs: string[], message: string): void {
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] ${message}`);
    console.log(message);
  }
}

// Export singleton instance
export const actionExecutor = new ActionExecutor();
