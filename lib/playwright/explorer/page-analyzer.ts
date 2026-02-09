/**
 * Page Analyzer - Analyzes page structure and accessibility
 */

import type { Page } from 'playwright';
import type { PageStructure, AccessibilityNode, ExplorerOptions } from './types';
import { ElementFinder } from './element-finder';

export class PageAnalyzer {
  private elementFinder: ElementFinder;

  constructor() {
    this.elementFinder = new ElementFinder();
  }

  /**
   * Analyze complete page structure
   */
  async analyzePage(
    page: Page,
    options: ExplorerOptions = {}
  ): Promise<PageStructure> {
    const startTime = Date.now();

    // Get basic page info
    const url = page.url();
    const title = await page.title();

    // Find interactive elements
    const elements = await this.elementFinder.findInteractiveElements(
      page,
      options
    );

    // Get accessibility tree
    const accessibility = await this.getAccessibilityTree(page);

    // Get viewport size
    const viewportSize = page.viewportSize() || { width: 1920, height: 1080 };

    // Capture screenshot if requested
    let screenshot: string | undefined;
    if (options.screenshotQuality !== undefined && options.screenshotQuality > 0) {
      screenshot = await this.captureScreenshot(page, options.screenshotQuality);
    }

    const loadTime = (Date.now() - startTime) / 1000;

    return {
      url,
      title,
      elements,
      accessibility,
      screenshot,
      metadata: {
        analyzedAt: new Date(),
        loadTime,
        viewportSize,
      },
    };
  }

  /**
   * Get accessibility tree
   */
  private async getAccessibilityTree(
    page: Page
  ): Promise<AccessibilityNode[]> {
    try {
      const snapshot = await page.accessibility.snapshot();
      if (!snapshot) {
        return [];
      }

      return this.convertAccessibilitySnapshot(snapshot);
    } catch (error) {
      console.debug('Failed to get accessibility tree:', error);
      return [];
    }
  }

  /**
   * Convert Playwright accessibility snapshot to our format
   */
  private convertAccessibilitySnapshot(
    node: any,
    level: number = 0
  ): AccessibilityNode[] {
    if (!node) return [];

    const result: AccessibilityNode[] = [];

    const current: AccessibilityNode = {
      role: node.role || 'unknown',
      name: node.name || '',
      selector: this.generateSelectorFromA11y(node),
      level,
      children: [],
    };

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const childNodes = this.convertAccessibilitySnapshot(child, level + 1);
        current.children!.push(...childNodes);
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Generate selector from accessibility node
   */
  private generateSelectorFromA11y(node: any): string {
    if (node.name) {
      return `[role="${node.role}"][aria-label="${node.name}"]`;
    }
    return `[role="${node.role}"]`;
  }

  /**
   * Capture page screenshot
   */
  private async captureScreenshot(
    page: Page,
    quality: number
  ): Promise<string> {
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: Math.min(100, Math.max(1, quality)),
      fullPage: true,
    });

    return screenshot.toString('base64');
  }

  /**
   * Analyze page metadata
   */
  async getPageMetadata(page: Page): Promise<Record<string, any>> {
    return await page.evaluate(() => {
      const meta: Record<string, any> = {};

      // Get meta tags
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach((tag) => {
        const name = tag.getAttribute('name') || tag.getAttribute('property');
        const content = tag.getAttribute('content');
        if (name && content) {
          meta[name] = content;
        }
      });

      // Get Open Graph data
      const ogTags = document.querySelectorAll('meta[property^="og:"]');
      const og: Record<string, string> = {};
      ogTags.forEach((tag) => {
        const property = tag.getAttribute('property')?.replace('og:', '');
        const content = tag.getAttribute('content');
        if (property && content) {
          og[property] = content;
        }
      });
      if (Object.keys(og).length > 0) {
        meta.openGraph = og;
      }

      // Get structured data
      const structuredData: any[] = [];
      const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
      jsonLd.forEach((script) => {
        try {
          const data = JSON.parse(script.textContent || '');
          structuredData.push(data);
        } catch {
          // Invalid JSON
        }
      });
      if (structuredData.length > 0) {
        meta.structuredData = structuredData;
      }

      return meta;
    });
  }

  /**
   * Get page performance metrics
   */
  async getPerformanceMetrics(page: Page): Promise<Record<string, number>> {
    return await page.evaluate(() => {
      const metrics: Record<string, number> = {};

      if (window.performance) {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;

        if (navigation) {
          metrics.domContentLoaded = navigation.domContentLoadedEventEnd;
          metrics.loadComplete = navigation.loadEventEnd;
          metrics.domInteractive = navigation.domInteractive;
          metrics.responseTime = navigation.responseEnd - navigation.requestStart;
        }

        // Paint metrics
        const paint = performance.getEntriesByType('paint');
        paint.forEach((entry) => {
          metrics[entry.name] = entry.startTime;
        });
      }

      return metrics;
    });
  }

  /**
   * Check if page is interactive
   */
  async isPageInteractive(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      return document.readyState === 'complete' || document.readyState === 'interactive';
    });
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(page: Page, timeout: number = 30000): Promise<void> {
    await page.waitForLoadState('domcontentloaded', { timeout });
    await page.waitForLoadState('networkidle', { timeout }).catch(() => {
      // Network might not idle, that's okay
    });
  }

  /**
   * Get page text content
   */
  async getPageText(page: Page): Promise<string> {
    return await page.evaluate(() => {
      return document.body.innerText;
    });
  }

  /**
   * Find form elements
   */
  async findForms(page: Page): Promise<any[]> {
    return await page.evaluate(() => {
      const forms: any[] = [];
      const formElements = document.querySelectorAll('form');

      formElements.forEach((form) => {
        const inputs: any[] = [];
        const formInputs = form.querySelectorAll(
          'input, select, textarea'
        );

        formInputs.forEach((input) => {
          inputs.push({
            type: input.getAttribute('type') || input.tagName.toLowerCase(),
            name: input.getAttribute('name'),
            id: input.getAttribute('id'),
            required: input.hasAttribute('required'),
            placeholder: input.getAttribute('placeholder'),
          });
        });

        forms.push({
          action: form.getAttribute('action'),
          method: form.getAttribute('method'),
          id: form.getAttribute('id'),
          name: form.getAttribute('name'),
          inputs,
        });
      });

      return forms;
    });
  }
}
