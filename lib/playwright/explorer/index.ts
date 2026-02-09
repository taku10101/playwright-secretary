/**
 * UI Explorer - Main export
 */

export * from './types';
export * from './page-analyzer';
export * from './element-finder';
export * from './selector-generator';
export * from './screenshot';

import type { Page } from 'playwright';
import type { PageStructure, ExplorerOptions } from './types';
import { PageAnalyzer } from './page-analyzer';
import { ElementFinder } from './element-finder';
import { ScreenshotCapture } from './screenshot';

/**
 * Main UI Explorer class
 */
export class UIExplorer {
  private pageAnalyzer: PageAnalyzer;
  private elementFinder: ElementFinder;
  private screenshotCapture: ScreenshotCapture;

  constructor() {
    this.pageAnalyzer = new PageAnalyzer();
    this.elementFinder = new ElementFinder();
    this.screenshotCapture = new ScreenshotCapture();
  }

  /**
   * Explore a page and return its structure
   */
  async explore(page: Page, options: ExplorerOptions = {}): Promise<PageStructure> {
    return await this.pageAnalyzer.analyzePage(page, options);
  }

  /**
   * Quick exploration without detailed analysis
   */
  async quickExplore(page: Page): Promise<PageStructure> {
    return await this.pageAnalyzer.analyzePage(page, {
      includeHidden: false,
      includeDisabled: false,
      maxElements: 50,
      screenshotQuality: 60,
    });
  }

  /**
   * Deep exploration with full analysis
   */
  async deepExplore(page: Page): Promise<PageStructure> {
    return await this.pageAnalyzer.analyzePage(page, {
      includeHidden: true,
      includeDisabled: true,
      maxElements: 200,
      screenshotQuality: 90,
    });
  }

  /**
   * Find elements by criteria
   */
  async findElements(page: Page, criteria: {
    text?: string;
    role?: string;
    type?: string;
  }) {
    if (criteria.text) {
      return await this.elementFinder.findByText(page, criteria.text);
    }
    if (criteria.role) {
      return await this.elementFinder.findByRole(page, criteria.role);
    }
    return await this.elementFinder.findInteractiveElements(page);
  }

  /**
   * Get page analyzer
   */
  getPageAnalyzer(): PageAnalyzer {
    return this.pageAnalyzer;
  }

  /**
   * Get element finder
   */
  getElementFinder(): ElementFinder {
    return this.elementFinder;
  }

  /**
   * Get screenshot capture
   */
  getScreenshotCapture(): ScreenshotCapture {
    return this.screenshotCapture;
  }
}

// Export singleton instance
export const uiExplorer = new UIExplorer();
