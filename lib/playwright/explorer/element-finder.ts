/**
 * Element Finder - Discovers interactive elements on a page
 */

import type { Page, Locator } from 'playwright';
import type { InteractiveElement, ElementType, ExplorerOptions } from './types';
import { SelectorGenerator } from './selector-generator';

export class ElementFinder {
  private selectorGenerator: SelectorGenerator;

  constructor() {
    this.selectorGenerator = new SelectorGenerator();
  }

  /**
   * Find all interactive elements on the page
   */
  async findInteractiveElements(
    page: Page,
    options: ExplorerOptions = {}
  ): Promise<InteractiveElement[]> {
    const {
      includeHidden = false,
      includeDisabled = true,
      maxElements = 100,
    } = options;

    const elements: InteractiveElement[] = [];

    // Define interactive element selectors
    const selectors = [
      'button',
      'a[href]',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '[role="link"]',
      '[role="textbox"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[onclick]',
      '[type="submit"]',
    ];

    for (const selector of selectors) {
      const locators = await page.locator(selector).all();

      for (const locator of locators) {
        if (elements.length >= maxElements) {
          break;
        }

        try {
          const element = await this.extractElementInfo(locator, includeHidden, includeDisabled);
          if (element) {
            elements.push(element);
          }
        } catch (error) {
          // Skip elements that can't be analyzed
          console.debug('Failed to extract element info:', error);
        }
      }

      if (elements.length >= maxElements) {
        break;
      }
    }

    return elements;
  }

  /**
   * Extract detailed information about an element
   */
  private async extractElementInfo(
    locator: Locator,
    includeHidden: boolean,
    includeDisabled: boolean
  ): Promise<InteractiveElement | null> {
    // Check visibility
    const visible = await locator.isVisible();
    if (!visible && !includeHidden) {
      return null;
    }

    // Check if enabled
    const enabled = await locator.isEnabled();
    if (!enabled && !includeDisabled) {
      return null;
    }

    // Get element type
    const type = await this.determineElementType(locator);

    // Generate selectors
    const selector = await this.selectorGenerator.generateSelector(
      locator.page(),
      locator
    );

    // Get text content
    const text = (await locator.textContent()) || '';

    // Get attributes
    const attributes = await this.extractAttributes(locator);

    // Get position
    const position = await this.getElementPosition(locator);

    // Get accessibility info
    const role = await locator.getAttribute('role');
    const label =
      (await locator.getAttribute('aria-label')) ||
      (await locator.getAttribute('aria-labelledby')) ||
      (await locator.getAttribute('title'));
    const placeholder = await locator.getAttribute('placeholder');

    return {
      id: this.generateElementId(selector.primary),
      type,
      selector,
      text: text.trim(),
      attributes,
      position,
      visible,
      enabled,
      role: role || undefined,
      label: label || undefined,
      placeholder: placeholder || undefined,
    };
  }

  /**
   * Determine the element type
   */
  private async determineElementType(locator: Locator): Promise<ElementType> {
    const tagName = await locator.evaluate((el) => el.tagName.toLowerCase());
    const type = await locator.getAttribute('type');
    const role = await locator.getAttribute('role');

    // Button
    if (tagName === 'button' || role === 'button') {
      return 'button';
    }

    // Link
    if (tagName === 'a' || role === 'link') {
      return 'link';
    }

    // Input types
    if (tagName === 'input') {
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'submit') return 'submit';
      return 'input';
    }

    // Select
    if (tagName === 'select') {
      return 'select';
    }

    // Textarea
    if (tagName === 'textarea' || role === 'textbox') {
      return 'textarea';
    }

    return 'custom';
  }

  /**
   * Extract relevant attributes from an element
   */
  private async extractAttributes(
    locator: Locator
  ): Promise<Record<string, string>> {
    const attributeNames = [
      'id',
      'name',
      'class',
      'type',
      'role',
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
      'placeholder',
      'title',
      'href',
      'data-testid',
      'disabled',
      'readonly',
      'required',
    ];

    const attributes: Record<string, string> = {};

    for (const name of attributeNames) {
      const value = await locator.getAttribute(name);
      if (value !== null) {
        attributes[name] = value;
      }
    }

    return attributes;
  }

  /**
   * Get element position and size
   */
  private async getElementPosition(locator: Locator) {
    try {
      const box = await locator.boundingBox();
      if (box) {
        return {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
        };
      }
    } catch {
      // Element not in viewport or hidden
    }

    return { x: 0, y: 0, width: 0, height: 0 };
  }

  /**
   * Generate a unique ID for an element
   */
  private generateElementId(selector: string): string {
    // Create a simple hash of the selector
    let hash = 0;
    for (let i = 0; i < selector.length; i++) {
      const char = selector.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `elem-${Math.abs(hash).toString(36)}`;
  }

  /**
   * Find elements by text content
   */
  async findByText(page: Page, text: string): Promise<InteractiveElement[]> {
    const locators = await page.locator(`:has-text("${text}")`).all();
    const elements: InteractiveElement[] = [];

    for (const locator of locators) {
      try {
        const element = await this.extractElementInfo(locator, false, true);
        if (element) {
          elements.push(element);
        }
      } catch {
        // Skip
      }
    }

    return elements;
  }

  /**
   * Find elements by role
   */
  async findByRole(
    page: Page,
    role: string
  ): Promise<InteractiveElement[]> {
    const locators = await page.locator(`[role="${role}"]`).all();
    const elements: InteractiveElement[] = [];

    for (const locator of locators) {
      try {
        const element = await this.extractElementInfo(locator, false, true);
        if (element) {
          elements.push(element);
        }
      } catch {
        // Skip
      }
    }

    return elements;
  }
}
