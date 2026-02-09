/**
 * Screenshot utilities with annotations
 */

import type { Page, Locator } from 'playwright';
import type { InteractiveElement } from './types';

export class ScreenshotCapture {
  /**
   * Capture full page screenshot
   */
  async captureFullPage(
    page: Page,
    quality: number = 80
  ): Promise<string> {
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: Math.min(100, Math.max(1, quality)),
      fullPage: true,
    });

    return screenshot.toString('base64');
  }

  /**
   * Capture viewport screenshot
   */
  async captureViewport(
    page: Page,
    quality: number = 80
  ): Promise<string> {
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: Math.min(100, Math.max(1, quality)),
      fullPage: false,
    });

    return screenshot.toString('base64');
  }

  /**
   * Capture element screenshot
   */
  async captureElement(
    locator: Locator,
    quality: number = 80
  ): Promise<string> {
    const screenshot = await locator.screenshot({
      type: 'jpeg',
      quality: Math.min(100, Math.max(1, quality)),
    });

    return screenshot.toString('base64');
  }

  /**
   * Capture screenshot with element highlights
   */
  async captureWithHighlights(
    page: Page,
    elements: InteractiveElement[],
    quality: number = 80
  ): Promise<string> {
    // Inject highlight CSS
    await page.addStyleTag({
      content: `
        .pw-explorer-highlight {
          outline: 3px solid #ff0000 !important;
          outline-offset: 2px !important;
          background-color: rgba(255, 0, 0, 0.1) !important;
        }
      `,
    });

    // Highlight elements
    for (const element of elements) {
      try {
        await page
          .locator(element.selector.primary)
          .first()
          .evaluate((el) => {
            el.classList.add('pw-explorer-highlight');
          });
      } catch {
        // Element might not exist anymore
      }
    }

    // Capture screenshot
    const screenshot = await this.captureFullPage(page, quality);

    // Remove highlights
    await page.evaluate(() => {
      document.querySelectorAll('.pw-explorer-highlight').forEach((el) => {
        el.classList.remove('pw-explorer-highlight');
      });
    });

    return screenshot;
  }

  /**
   * Capture screenshot with annotations
   */
  async captureWithAnnotations(
    page: Page,
    annotations: Array<{
      x: number;
      y: number;
      label: string;
    }>,
    quality: number = 80
  ): Promise<string> {
    // Inject annotation overlay
    await page.addStyleTag({
      content: `
        .pw-annotation {
          position: absolute;
          background-color: rgba(255, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          z-index: 999999;
          pointer-events: none;
        }
      `,
    });

    // Add annotations
    for (const annotation of annotations) {
      await page.evaluate(
        ({ x, y, label }) => {
          const div = document.createElement('div');
          div.className = 'pw-annotation';
          div.textContent = label;
          div.style.left = `${x}px`;
          div.style.top = `${y}px`;
          document.body.appendChild(div);
        },
        annotation
      );
    }

    // Capture screenshot
    const screenshot = await this.captureFullPage(page, quality);

    // Remove annotations
    await page.evaluate(() => {
      document.querySelectorAll('.pw-annotation').forEach((el) => el.remove());
    });

    return screenshot;
  }

  /**
   * Save screenshot to file
   */
  async saveToFile(
    page: Page,
    path: string,
    options?: {
      fullPage?: boolean;
      quality?: number;
    }
  ): Promise<void> {
    await page.screenshot({
      path,
      type: 'jpeg',
      quality: options?.quality || 80,
      fullPage: options?.fullPage ?? true,
    });
  }

  /**
   * Compare two screenshots (returns similarity percentage)
   */
  async compareScreenshots(
    screenshot1: string,
    screenshot2: string
  ): Promise<number> {
    // This is a placeholder - in production, use a library like pixelmatch
    // For now, just return a mock value
    return 95.0;
  }
}
