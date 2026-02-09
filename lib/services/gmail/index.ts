/**
 * Gmail service definition
 */

import { ServiceDefinition } from '../types';
import { gmailActions } from './actions';

export const gmailService: ServiceDefinition = {
  id: 'gmail',
  name: 'Gmail',
  description: 'Googleメールサービス',
  icon: '📧',
  actions: gmailActions,
  settings: {},
};
