/**
 * Notion service definition
 */

import { ServiceDefinition } from '../types';
import { notionActions } from './actions';

export const notionService: ServiceDefinition = {
  id: 'notion',
  name: 'Notion',
  description: 'オールインワンワークスペース',
  icon: '📝',
  actions: notionActions,
  settings: {},
};
