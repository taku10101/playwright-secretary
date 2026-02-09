/**
 * Selector Generator - Generates stable and reliable selectors
 */

import type { Page, Locator } from 'playwright';
import type { SelectorInfo, SelectorStrategy } from './types';

export class SelectorGenerator {
  /**
   * Generate optimal selector for an element
   */
  async generateSelector(
    page: Page,
    element: Locator
  ): Promise<SelectorInfo> {
    const strategies = await this.getAllStrategies(element);
    const primary = this.selectBestStrategy(strategies);
    const alternatives = strategies
      .filter((s) => s.type !== primary.type)
      .sort((a, b) => b.priority - a.priority)
      .map((s) => s.value)
      .slice(0, 3);

    const specificity = await this.calculateSpecificity(page, primary.value);
    const stable = this.isStableSelector(primary);

    return {
      primary: primary.value,
      alternatives,
      specificity,
      stable,
    };
  }

  /**
   * Get all possible selector strategies for an element
   */
  private async getAllStrategies(element: Locator): Promise<SelectorStrategy[]> {
    const strategies: SelectorStrategy[] = [];

    // data-testid (highest priority)
    const testId = await element.getAttribute('data-testid');
    if (testId) {
      strategies.push({
        type: 'testid',
        value: `[data-testid="${testId}"]`,
        priority: 100,
      });
    }

    // ARIA label
    const ariaLabel = await element.getAttribute('aria-label');
    if (ariaLabel) {
      strategies.push({
        type: 'aria',
        value: `[aria-label="${ariaLabel}"]`,
        priority: 90,
      });
    }

    // ID
    const id = await element.getAttribute('id');
    if (id && this.isStableId(id)) {
      strategies.push({
        type: 'id',
        value: `#${id}`,
        priority: 80,
      });
    }

    // name attribute (for inputs)
    const name = await element.getAttribute('name');
    if (name) {
      strategies.push({
        type: 'css',
        value: `[name="${name}"]`,
        priority: 75,
      });
    }

    // role + name
    const role = await element.getAttribute('role');
    if (role && ariaLabel) {
      strategies.push({
        type: 'aria',
        value: `[role="${role}"][aria-label="${ariaLabel}"]`,
        priority: 85,
      });
    }

    // Text content
    const text = await element.textContent();
    if (text && text.trim().length > 0 && text.length < 50) {
      const tagName = await this.getTagName(element);
      strategies.push({
        type: 'text',
        value: `${tagName}:has-text("${text.trim()}")`,
        priority: 60,
      });
    }

    // Class-based (only if stable)
    const className = await element.getAttribute('class');
    if (className) {
      const stableClasses = this.extractStableClasses(className);
      if (stableClasses.length > 0) {
        strategies.push({
          type: 'class',
          value: `.${stableClasses.join('.')}`,
          priority: 50,
        });
      }
    }

    // CSS selector (fallback)
    const tagName = await this.getTagName(element);
    strategies.push({
      type: 'css',
      value: tagName,
      priority: 30,
    });

    return strategies;
  }

  /**
   * Select the best strategy based on priority and stability
   */
  private selectBestStrategy(strategies: SelectorStrategy[]): SelectorStrategy {
    return strategies.sort((a, b) => b.priority - a.priority)[0];
  }

  /**
   * Calculate how specific a selector is (lower is better)
   */
  private async calculateSpecificity(
    page: Page,
    selector: string
  ): Promise<number> {
    try {
      const count = await page.locator(selector).count();
      // Return 100 if unique, decrease as count increases
      return Math.max(0, 100 - count * 10);
    } catch {
      return 0;
    }
  }

  /**
   * Check if a selector is stable (won't change with dynamic content)
   */
  private isStableSelector(strategy: SelectorStrategy): boolean {
    // testid and aria labels are most stable
    if (strategy.type === 'testid' || strategy.type === 'aria') {
      return true;
    }

    // IDs are stable if they don't contain dynamic parts
    if (strategy.type === 'id') {
      return this.isStableId(strategy.value.replace('#', ''));
    }

    // Text selectors can be unstable if content changes
    if (strategy.type === 'text') {
      return false;
    }

    return false;
  }

  /**
   * Check if an ID is stable (doesn't contain timestamps, random numbers, etc.)
   */
  private isStableId(id: string): boolean {
    // Check for common unstable patterns
    const unstablePatterns = [
      /\d{10,}/, // Timestamps
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/, // UUIDs
      /random/i,
      /temp/i,
      /\d{6,}/, // Long numbers
    ];

    return !unstablePatterns.some((pattern) => pattern.test(id));
  }

  /**
   * Extract stable class names (exclude dynamic ones)
   */
  private extractStableClasses(className: string): string[] {
    const classes = className.split(/\s+/).filter(Boolean);

    return classes.filter((cls) => {
      // Exclude common dynamic class patterns
      const dynamicPatterns = [
        /^css-/, // CSS-in-JS
        /^_/, // Module CSS
        /-\d{6,}$/, // Hashed classes
        /^sc-/, // Styled-components
        /^emotion-/, // Emotion
      ];

      return !dynamicPatterns.some((pattern) => pattern.test(cls));
    });
  }

  /**
   * Get tag name of an element
   */
  private async getTagName(element: Locator): Promise<string> {
    try {
      return await element.evaluate((el) => el.tagName.toLowerCase());
    } catch {
      return 'unknown';
    }
  }

  /**
   * Generate XPath as a last resort
   */
  async generateXPath(element: Locator): Promise<string> {
    return await element.evaluate((el) => {
      const getPathTo = (element: Element): string => {
        if (element.id !== '') {
          return `//*[@id="${element.id}"]`;
        }

        if (element === document.body) {
          return '/html/body';
        }

        let ix = 0;
        const siblings = element.parentNode?.children || [];
        for (let i = 0; i < siblings.length; i++) {
          const sibling = siblings[i];
          if (sibling === element) {
            const parent = element.parentNode as Element;
            return (
              getPathTo(parent) +
              '/' +
              element.tagName.toLowerCase() +
              '[' +
              (ix + 1) +
              ']'
            );
          }
          if (sibling.tagName === element.tagName) {
            ix++;
          }
        }
        return '';
      };

      return getPathTo(el);
    });
  }
}
