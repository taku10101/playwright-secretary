/**
 * Slack service definition
 */

import { ServiceDefinition } from '../types';
import { slackActions } from './actions';

export const slackService: ServiceDefinition = {
  id: 'slack',
  name: 'Slack',
  description: 'チームコミュニケーションツール',
  icon: '💬',
  actions: slackActions,
  settings: {
    workspace: {
      type: 'string',
      required: true,
      description: 'ワークスペース名（例: my-workspace）',
    },
  },
};
