/**
 * Service action definitions and types
 */

import { BrowserContext } from 'playwright';

export interface ServiceAction {
  id: string;
  name: string;
  description: string;
  parameters: ActionParameter[];
  execute: (context: BrowserContext, params: Record<string, any>) => Promise<any>;
}

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  default?: any;
}

export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  actions: ServiceAction[];
  settings?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean';
      required: boolean;
      description: string;
      default?: any;
    };
  };
}
