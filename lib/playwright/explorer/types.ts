/**
 * UI Explorer Type Definitions
 */

export interface PageStructure {
  url: string;
  title: string;
  elements: InteractiveElement[];
  accessibility?: AccessibilityNode[];
  screenshot?: string; // base64
  metadata: {
    analyzedAt: Date;
    loadTime: number;
    viewportSize: { width: number; height: number };
  };
}

export interface InteractiveElement {
  id: string;
  type: ElementType;
  selector: SelectorInfo;
  text: string;
  attributes: Record<string, string>;
  position: ElementPosition;
  visible: boolean;
  enabled: boolean;
  role?: string;
  label?: string;
  placeholder?: string;
}

export type ElementType =
  | 'button'
  | 'link'
  | 'input'
  | 'select'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'submit'
  | 'custom';

export interface SelectorInfo {
  primary: string;
  alternatives: string[];
  specificity: number; // 0-100
  stable: boolean;
}

export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AccessibilityNode {
  role: string;
  name: string;
  selector: string;
  level: number;
  children?: AccessibilityNode[];
}

export interface ExplorerOptions {
  url?: string;
  includeHidden?: boolean;
  includeDisabled?: boolean;
  maxElements?: number;
  screenshotQuality?: number;
}

export interface SelectorStrategy {
  type: 'testid' | 'aria' | 'id' | 'class' | 'text' | 'xpath' | 'css';
  value: string;
  priority: number;
}
